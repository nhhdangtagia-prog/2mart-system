/**
 * Engine kiểm duyệt các chính sách tài chính của từng cửa hàng.
 */
export interface FinancePolicy {
  allowNegativeCash: boolean;       // Cho phép két tiền bị âm không?
  maxCashDifference: number;        // Mức chênh lệch tối đa cho phép khi đối soát (Vd: 50.000đ)
  requireManagerApproval: boolean;  // Có cần Manager duyệt khi chênh lệch vượt mức?
  cashLimitWarning: number;         // Cảnh báo khi quỹ tiền mặt quá lớn (Vd: > 100tr)
}

export class FinancialPolicyEngine {
  
  /**
   * Đánh giá xem giao dịch chi tiền có hợp lệ không (chống âm quỹ)
   */
  static validateCashOut(
    currentBalance: number,
    amountToWithdraw: number,
    policy: FinancePolicy
  ): { isValid: boolean; reason?: string } {
    const expectedNewBalance = currentBalance - amountToWithdraw;
    
    if (expectedNewBalance < 0 && !policy.allowNegativeCash) {
      return { 
        isValid: false, 
        reason: `Insufficient funds. Current balance: ${currentBalance}, Requested: ${amountToWithdraw}` 
      };
    }
    
    return { isValid: true };
  }

  /**
   * Đánh giá trạng thái của Ca làm việc (Shift) khi kết thúc
   */
  static evaluateShiftClosing(
    expectedCash: number,
    countedCash: number,
    policy: FinancePolicy
  ): { status: 'MATCHED' | 'PENDING_APPROVAL' | 'REJECTED'; difference: number } {
    const difference = countedCash - expectedCash;
    const absDiff = Math.abs(difference);

    if (absDiff === 0) {
      return { status: 'MATCHED', difference };
    }

    if (absDiff <= policy.maxCashDifference) {
      // Trong ngưỡng sai số cho phép, có thể tự động Approve hoặc tùy chính sách
      return { status: policy.requireManagerApproval ? 'PENDING_APPROVAL' : 'MATCHED', difference };
    }

    // Vượt ngưỡng, bắt buộc Manager duyệt
    return { status: 'PENDING_APPROVAL', difference };
  }
}
