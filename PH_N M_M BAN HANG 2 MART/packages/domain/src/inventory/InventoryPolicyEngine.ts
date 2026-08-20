export enum NegativeStockPolicy {
  STRICT = 'STRICT',           // Tuyệt đối không cho phép âm kho
  ALLOW_NEGATIVE = 'ALLOW_NEGATIVE', // Cho phép bán âm kho tự do
  WARNING_ONLY = 'WARNING_ONLY'      // Cảnh báo nhưng vẫn cho bán
}

export interface InventoryContext {
  branchId: string;
  warehouseId: string;
}

export class InventoryPolicyEngine {
  
  /**
   * Đánh giá xem giao dịch làm giảm tồn kho có hợp lệ không
   */
  static validateStockReduction(
    currentAvailable: number,
    reductionQty: number,
    policy: NegativeStockPolicy
  ): { isValid: boolean; reason?: string } {
    
    const newAvailable = currentAvailable - reductionQty;
    
    if (newAvailable < 0) {
      if (policy === NegativeStockPolicy.STRICT) {
        return { isValid: false, reason: `Insufficient stock. Requested: ${reductionQty}, Available: ${currentAvailable}` };
      }
      if (policy === NegativeStockPolicy.WARNING_ONLY) {
        // Trong thực tế sẽ log cảnh báo hoặc raise warning event
        console.warn(`Stock will go negative. New Available: ${newAvailable}`);
      }
    }
    
    return { isValid: true };
  }
  
  /**
   * Tính toán giá vốn bình quân di động (Moving Average Cost)
   */
  static calculateMovingAverageCost(
    currentQty: number,
    currentCost: number,
    incomingQty: number,
    incomingUnitCost: number
  ): number {
    if (currentQty + incomingQty === 0) return 0;
    
    const totalCurrentValue = currentQty * currentCost;
    const incomingValue = incomingQty * incomingUnitCost;
    
    return (totalCurrentValue + incomingValue) / (currentQty + incomingQty);
  }
}
