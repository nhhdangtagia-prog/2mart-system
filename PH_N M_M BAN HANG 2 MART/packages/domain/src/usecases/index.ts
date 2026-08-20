import { eventBus, type IDomainEvent } from "@2mart/core";
import { catalogProjectionRepo, orderProjectionRepo, type OrderReadModelDTO } from "@2mart/read-model";
import { CreateOrderCommand, AdjustInventoryCommand, ReceiveGoodsCommand } from "../commands";

/**
 * Sinh mã hóa đơn TĂNG DẦN liên tục (HD000001, HD000002, ...) thay vì số ngẫu nhiên,
 * để dễ đối chiếu và biết được thứ tự phát sinh đơn hàng.
 * Lấy số lớn nhất đang có trong sổ hóa đơn rồi cộng 1.
 */
async function nextOrderCode(): Promise<string> {
  const existing = await orderProjectionRepo.getAll();
  let max = 0;
  existing.forEach(o => {
    const m = String(o.code || "").match(/^HD(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  });
  return `HD${String(max + 1).padStart(6, "0")}`;
}

export class CreateOrderUseCase {
  async execute(command: CreateOrderCommand): Promise<{ orderId: string; code: string }> {
    const {
      items, customerName, employeeName, employeeCode, paymentMethod, discount,
      cashAmount, transferAmount, cardAmount, branch
    } = command.payload;

    // 1. Calculate totals
    const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalAmount = Math.max(0, subTotal - discount);
    const orderId = crypto.randomUUID();
    const code = await nextOrderCode();

    // Tách số tiền theo từng hình thức thanh toán. Nếu chỗ gọi không truyền số tách (thanh toán
    // đơn thuần 1 hình thức) thì dồn toàn bộ tiền đơn vào đúng ô tương ứng.
    const hasExplicitSplit = cashAmount !== undefined || transferAmount !== undefined || cardAmount !== undefined;
    const splitAmounts = hasExplicitSplit
      ? { cash: cashAmount || 0, transfer: transferAmount || 0, card: cardAmount || 0 }
      : {
          cash: paymentMethod === "CASH" ? totalAmount : 0,
          transfer: paymentMethod === "TRANSFER" ? totalAmount : 0,
          card: paymentMethod === "CARD" ? totalAmount : 0
        };
    const now = new Date();

    const orderDTO: OrderReadModelDTO = {
      id: orderId,
      code,
      createdAt: now.toLocaleString("vi-VN"),
      createdAtMs: now.getTime(),
      customerName: customerName || "Khách lẻ",
      employeeName: employeeName || "Thu ngân mặc định",
      employeeCode,
      totalAmount,
      paymentMethod,
      cashAmount: splitAmounts.cash,
      transferAmount: splitAmounts.transfer,
      cardAmount: splitAmounts.card,
      branch,
      // Lưu chi tiết mặt hàng để khi Admin xóa hóa đơn có thể hoàn lại đúng tồn kho đã trừ
      items: items.map(i => ({ sku: i.sku, name: i.name, quantity: i.quantity, price: i.price })),
      status: 'COMPLETED',
      itemsCount: items.reduce((sum, i) => sum + i.quantity, 0)
    };

    // 2. Compute stock updates (Domain logic: inventory deduction calculation)
    const updatedStocks: { sku: string; newStock: number; status: string }[] = [];
    for (const item of items) {
      const catalogItem = await catalogProjectionRepo.getBySku(item.sku);
      if (catalogItem) {
        const newStock = Math.max(0, catalogItem.stock - item.quantity);
        const status = newStock === 0 ? "Hết hàng" : newStock < 10 ? "Sắp hết" : "Đang bán";
        updatedStocks.push({ sku: item.sku, newStock, status });
      }
    }

    // 3. Publish OrderCompletedEvent (NEVER mutate projection directly!)
    const orderEvent: IDomainEvent = {
      eventId: crypto.randomUUID(),
      eventType: "OrderCompletedEvent",
      timestamp: Date.now(),
      payload: {
        orderDTO,
        totalAmount,
        items: items.map(i => ({ sku: i.sku, name: i.name, quantity: i.quantity, amount: i.price * i.quantity }))
      }
    };
    eventBus.publish(orderEvent);

    // 4. Publish InventoryUpdatedEvents for each sold item
    for (const stockUpdate of updatedStocks) {
      const invEvent: IDomainEvent = {
        eventId: crypto.randomUUID(),
        eventType: "InventoryUpdatedEvent",
        timestamp: Date.now(),
        payload: stockUpdate
      };
      eventBus.publish(invEvent);
    }

    return { orderId, code };
  }
}

export class AdjustInventoryUseCase {
  async execute(command: AdjustInventoryCommand): Promise<void> {
    const { sku, quantityDelta } = command.payload;
    const catalogItem = await catalogProjectionRepo.getBySku(sku);
    if (catalogItem) {
      const newStock = Math.max(0, catalogItem.stock + quantityDelta);
      const status = newStock === 0 ? "Hết hàng" : newStock < 10 ? "Sắp hết" : "Đang bán";
      
      const invEvent: IDomainEvent = {
        eventId: crypto.randomUUID(),
        eventType: "InventoryUpdatedEvent",
        timestamp: Date.now(),
        payload: { sku, newStock, status }
      };
      eventBus.publish(invEvent);
    }
  }
}

export class ReceiveGoodsUseCase {
  async execute(command: ReceiveGoodsCommand): Promise<void> {
    for (const item of command.payload.items) {
      const catalogItem = await catalogProjectionRepo.getBySku(item.sku);
      if (catalogItem) {
        const newStock = catalogItem.stock + item.quantity;
        const status = "Đang bán";
        const invEvent: IDomainEvent = {
          eventId: crypto.randomUUID(),
          eventType: "InventoryUpdatedEvent",
          timestamp: Date.now(),
          payload: { sku: item.sku, newStock, status }
        };
        eventBus.publish(invEvent);
      }
    }
  }
}
