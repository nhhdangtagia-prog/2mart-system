export enum CashMovementReason {
  POS_PAYMENT = 'POS_PAYMENT',
  CUSTOMER_REFUND = 'CUSTOMER_REFUND',
  SUPPLIER_PAYMENT = 'SUPPLIER_PAYMENT',
  PETTY_CASH = 'PETTY_CASH',
  EXPENSE = 'EXPENSE',
  SALARY = 'SALARY',
  SHIFT_OPEN = 'SHIFT_OPEN',
  SHIFT_CLOSE = 'SHIFT_CLOSE',
  BANK_DEPOSIT = 'BANK_DEPOSIT',
  BANK_WITHDRAW = 'BANK_WITHDRAW',
  TRANSFER = 'TRANSFER'
}

export interface CashPostingPayload {
  accountId: string;
  type: 'IN' | 'OUT';
  amount: number;
  reason: CashMovementReason;
  referenceId: string; // ID của Payment hoặc Expense
}

export interface PayablePostingPayload {
  supplierId: string;
  sourceDocumentId: string;
  amount: number; // Positive means we owe them, Negative means payment
}

export interface ReceivablePostingPayload {
  customerId: string;
  sourceDocumentId: string;
  amount: number; // Positive means they owe us, Negative means payment
}

/**
 * Cổng kết nối giữa Operational Finance (Sổ quỹ, Công nợ) và General Ledger (Kế toán tổng hợp).
 * Hiện tại sẽ post vào Sổ quỹ (Cash Ledger) và AR/AP. Tương lai sẽ post thêm Nợ/Có.
 */
export interface IFinancialPostingService {
  
  /**
   * Ghi nhận dòng tiền vào/ra sổ quỹ
   */
  postCashMovement(payload: CashPostingPayload): Promise<void>;
  
  /**
   * Ghi nhận công nợ Phải thu khách hàng (AR)
   */
  postAccountsReceivable(payload: ReceivablePostingPayload): Promise<void>;
  
  /**
   * Ghi nhận công nợ Phải trả nhà cung cấp (AP)
   */
  postAccountsPayable(payload: PayablePostingPayload): Promise<void>;
  
  /**
   * Cấn trừ công nợ khi có Thanh toán (Allocation)
   * Tách biệt khỏi Cash Movement vì có thể thanh toán bằng cấn trừ nợ, không liên quan tiền mặt
   */
  allocatePaymentToReceivable(paymentId: string, arId: string, amount: number): Promise<void>;
  allocatePaymentToPayable(paymentId: string, apId: string, amount: number): Promise<void>;
}
