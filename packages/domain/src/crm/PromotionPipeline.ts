export interface PromotionRule {
  type: string;     // e.g., 'MIN_SPEND', 'HAS_PRODUCT'
  value: any;       // e.g., 500000, 'PRD-123'
}

export interface PromotionAction {
  type: string;     // e.g., 'DISCOUNT_PERCENT', 'FREE_ITEM'
  value: any;       // e.g., 10 (%), 'PRD-456'
}

export interface PromotionDSL {
  id: string;
  name: string;
  priority: number;
  stackable: boolean;
  conditions: PromotionRule[];
  actions: PromotionAction[];
}

export interface CartContext {
  subTotal: number;
  items: any[];
  customerTier?: string;
}

export class PromotionPipeline {
  
  /**
   * Phase 1: Eligibility
   * Kiểm tra xem giỏ hàng hiện tại có đạt điều kiện của Khuyến mãi không.
   */
  static isEligible(promo: PromotionDSL, cart: CartContext): boolean {
    for (const condition of promo.conditions) {
      if (condition.type === 'MIN_SPEND') {
        if (cart.subTotal < condition.value) return false;
      }
      // Add more evaluators here...
    }
    return true;
  }

  /**
   * Phase 2, 3, 4: Sắp xếp Priority, Resolve Xung đột, và Áp dụng (Apply)
   */
  static applyPromotions(promotions: PromotionDSL[], cart: CartContext): { finalCart: CartContext, appliedPromos: string[] } {
    // 1. Lọc các Promotion đủ điều kiện
    const eligiblePromos = promotions.filter(p => this.isEligible(p, cart));
    
    // 2. Sắp xếp theo Priority (Số lớn ưu tiên chạy trước)
    eligiblePromos.sort((a, b) => b.priority - a.priority);
    
    let appliedPromos: string[] = [];
    let hasNonStackable = false;
    let currentCart = { ...cart }; // Clone cart
    
    // 3. Conflict Resolution & Apply
    for (const promo of eligiblePromos) {
      if (hasNonStackable && !promo.stackable) {
        continue; // Bỏ qua vì đã có 1 KM không cho phép stack
      }
      
      // Giả lập Apply (Ở thực tế sẽ chạy Engine Action)
      appliedPromos.push(promo.name);
      
      if (!promo.stackable) {
        hasNonStackable = true; // Khóa các KM không stackable khác
      }
    }
    
    return { finalCart: currentCart, appliedPromos };
  }
}
