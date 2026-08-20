import { ProductLookupDTO } from '../catalog/services/CatalogQueryService';
import { InventoryPolicyEngine, NegativeStockPolicy } from '../inventory/InventoryPolicyEngine';

export interface CartLine {
  id: string; // uuid của line
  product: ProductLookupDTO;
  quantity: number;
  originalPrice: number;
  lineDiscount: number;
  finalPrice: number;
  isGift: boolean;
}

export interface CartState {
  lines: CartLine[];
  subTotal: number;
  cartDiscount: number;
  taxTotal: number;
  grandTotal: number;
}

export class PromotionEngine {
  /**
   * Tính toán toàn bộ khuyến mãi cho giỏ hàng
   * Trả về state mới với các giá trị lineDiscount, cartDiscount và isGift đã được tính.
   */
  static applyPromotions(currentState: CartState, customerContext?: any): CartState {
    // Tương lai: Logic Buy X Get Y, Combo, Member Discount, Voucher
    // Hiện tại: Bypass
    return { ...currentState };
  }
}

export class CartEngine {
  
  /**
   * Thêm sản phẩm vào giỏ hàng
   */
  static addProduct(
    currentState: CartState, 
    product: ProductLookupDTO, 
    qty: number, 
    localAvailableStock: number,
    policy: NegativeStockPolicy
  ): { newState: CartState, error?: string } {
    
    // 1. Validate Stock Policy (Offline)
    const existingLine = currentState.lines.find(l => l.product.id === product.id);
    const newQty = (existingLine ? existingLine.quantity : 0) + qty;
    
    const stockValidation = InventoryPolicyEngine.validateStockReduction(
      localAvailableStock, 
      newQty, 
      policy
    );
    
    if (!stockValidation.isValid) {
      return { newState: currentState, error: stockValidation.reason };
    }

    // 2. Clone state and update lines
    let newLines = [...currentState.lines];
    if (existingLine) {
      existingLine.quantity = newQty;
      existingLine.finalPrice = existingLine.quantity * existingLine.originalPrice;
    } else {
      newLines.push({
        id: crypto.randomUUID(),
        product,
        quantity: qty,
        originalPrice: product.retailPrice,
        lineDiscount: 0,
        finalPrice: qty * product.retailPrice,
        isGift: false
      });
    }
    
    let newState = { ...currentState, lines: newLines };

    // 3. Chạy qua Promotion Engine
    newState = PromotionEngine.applyPromotions(newState);
    
    // 4. Tính lại tổng
    newState = this.recalculateTotals(newState);
    
    return { newState };
  }

  private static recalculateTotals(state: CartState): CartState {
    const subTotal = state.lines.reduce((sum, line) => sum + (line.quantity * line.originalPrice), 0);
    const totalLineDiscounts = state.lines.reduce((sum, line) => sum + line.lineDiscount, 0);
    
    // Tax có thể phức tạp nếu từng sản phẩm có VAT khác nhau. Tạm thời coi như giá đã gồm VAT.
    const grandTotal = subTotal - totalLineDiscounts - state.cartDiscount;
    
    return {
      ...state,
      subTotal,
      grandTotal
    };
  }
}
