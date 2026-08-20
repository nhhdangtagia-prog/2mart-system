/**
 * Đây là môi trường (Sandbox) mà AI phải đi qua mỗi khi muốn thực thi Tool.
 * AI không được phép tương tác trực tiếp với Database hay Service.
 */
export interface ToolExecutionRequest {
  agentRole: string;
  toolCode: string;
  payload: any;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTimeMs: number;
}

/**
 * Lớp điều phối trung tâm bảo vệ hệ thống khỏi AI.
 */
export interface IToolExecutionSandbox {
  /**
   * AI gọi hàm này. Sandbox sẽ kiểm tra:
   * 1. Agent có được phép dùng Tool này không? (Capability Manifest)
   * 2. Có vượt quá Rate Limit không?
   * 3. Thực thi Tool qua Circuit Breaker (Timeout, Retry).
   * 4. Ghi Audit Log.
   */
  execute(request: ToolExecutionRequest): Promise<ToolExecutionResult>;
}

/**
 * SDK cung cấp cho LLM (LLM được hướng dẫn gọi các function này).
 */
export interface IAIAgentSDK {
  // Query Tools (Read-only)
  searchProduct(query: string): Promise<any>;
  stockLookup(productId: string, branchId?: string): Promise<any>;
  getSupplierLeadTime(supplierId: string): Promise<number>;
  
  // Action Tools (Sẽ sinh ra Proposal, KHÔNG thực thi ngay)
  createPurchaseProposal(payload: any): Promise<{ proposalId: string; status: string }>;
  createDiscountProposal(payload: any): Promise<{ proposalId: string; status: string }>;
}

export interface AIGovernancePolicy {
  isKillSwitchActive: boolean;
  dailyBudgetUsd: number;
  allowedModels: string[];
}
