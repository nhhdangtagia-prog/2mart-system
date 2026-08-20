import { InventoryPolicyEngine, NegativeStockPolicy } from '@2mart/domain/src/inventory/InventoryPolicyEngine';

export enum TransactionType {
  PURCHASE_RECEIPT = 'PURCHASE_RECEIPT',
  PURCHASE_RETURN = 'PURCHASE_RETURN',
  SALE = 'SALE',
  SALE_RETURN = 'SALE_RETURN',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  OPENING_BALANCE = 'OPENING_BALANCE'
}

export interface TransactionPayload {
  productId: string;
  warehouseId: string;
  binId?: string;
  type: TransactionType;
  quantityChange: number; // Có thể âm hoặc dương
  unitCost: number;
  sourceDocument: string;
  referenceId?: string;
  userId: string;
}

export interface IInventoryRepository {
  getBalance(productId: string, warehouseId: string): Promise<any>;
  updateBalance(productId: string, warehouseId: string, updates: any, expectedVersion: number): Promise<void>;
  insertLedgerEntry(entry: any): Promise<void>;
  insertCostHistory(history: any): Promise<void>;
}

export interface IEventPublisher {
  publish(aggregateType: string, aggregateId: string, eventType: string, payload: any): Promise<void>;
}

/**
 * CỔNG DUY NHẤT thay đổi Tồn Kho hệ thống.
 * Cấm mọi lệnh UPDATE trực tiếp vào inventory_balances từ các service khác.
 */
export class InventoryTransactionService {
  constructor(
    private readonly repo: IInventoryRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async executeTransaction(payload: TransactionPayload): Promise<void> {
    // 1. Lấy Balance hiện tại (Read cho Optimistic Lock)
    const currentBalance = await this.repo.getBalance(payload.productId, payload.warehouseId);
    
    if (!currentBalance) {
      throw new Error(`Balance record not found for product ${payload.productId} in warehouse ${payload.warehouseId}`);
    }

    // 2. Validate Policy (Negative Stock)
    if (payload.quantityChange < 0) {
      // TODO: Fetch config policy for this branch/warehouse, default STRICT for now
      const validation = InventoryPolicyEngine.validateStockReduction(
        currentBalance.available, 
        Math.abs(payload.quantityChange), 
        NegativeStockPolicy.STRICT
      );
      if (!validation.isValid) throw new Error(validation.reason);
    }

    // 3. Tính toán lại Costing nếu là nhập hàng (PURCHASE_RECEIPT)
    let newAverageCost = currentBalance.average_cost;
    if (payload.type === TransactionType.PURCHASE_RECEIPT && payload.quantityChange > 0) {
      newAverageCost = InventoryPolicyEngine.calculateMovingAverageCost(
        currentBalance.on_hand,
        currentBalance.average_cost,
        payload.quantityChange,
        payload.unitCost
      );
      
      // Ghi vết Cost History
      await this.repo.insertCostHistory({
        productId: payload.productId,
        oldCost: currentBalance.average_cost,
        newCost: newAverageCost,
        sourceDocument: payload.sourceDocument
      });
    }

    // 4. Tính toán Balance mới
    const newOnHand = currentBalance.on_hand + payload.quantityChange;
    const newAvailable = newOnHand - currentBalance.reserved;

    // 5. Atomic Update (Ledger + Balance Snapshot) dùng ACID Transaction + Optimistic Lock
    // Pseudo-code transaction:
    // await db.transaction(async (tx) => {
    //   await repo.insertLedgerEntry({...});
    //   await repo.updateBalance(..., currentBalance.version); // fails if version changed
    // });
    await this.repo.insertLedgerEntry({ ...payload, unitCost: payload.unitCost });
    await this.repo.updateBalance(payload.productId, payload.warehouseId, {
      on_hand: newOnHand,
      available: newAvailable,
      average_cost: newAverageCost,
      version: currentBalance.version + 1
    }, currentBalance.version);

    // 6. Phát Event (Outbox)
    await this.eventPublisher.publish('Inventory', payload.productId, 'InventoryAdjusted', {
      warehouseId: payload.warehouseId,
      oldOnHand: currentBalance.on_hand,
      newOnHand,
      transactionType: payload.type
    });

    if (newOnHand <= currentBalance.reorder_level) {
      await this.eventPublisher.publish('Inventory', payload.productId, 'LowStockDetected', {
        warehouseId: payload.warehouseId,
        onHand: newOnHand,
        reorderLevel: currentBalance.reorder_level
      });
    }
  }
}
