export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL'
}

export interface InsightDTO {
  title: string;
  reason: string;
  recommendation: string;
  severity: AlertSeverity;
  source: string; // The rule code or module that generated this insight
  confidence: number; // e.g., 0.95
}

/**
 * Lớp API cho Insight Engine. 
 * Đặc biệt thiết kế cho AI Agent ở Sprint 19 đọc trực tiếp thay vì tự query DB.
 */
export interface IInsightEngine {
  /**
   * Lấy danh sách các Insight / Alert đang active trong hệ thống
   */
  getActiveInsights(): Promise<InsightDTO[]>;
}

/**
 * Giao diện mẫu cho các Stateless Analytics Services (Phase 18B).
 * Nhận DTO và trả DTO, tuyệt đối không giữ state nội bộ.
 */
export interface IABCAnalysisService {
  analyze(branchId: string, startDate: string, endDate: string): Promise<any>;
}

export interface IRFMAnalysisService {
  analyze(customerIds: string[]): Promise<any>;
}
