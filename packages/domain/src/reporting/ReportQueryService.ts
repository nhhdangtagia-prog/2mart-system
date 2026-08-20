export interface SalesTrendDTO {
  date: string;
  netSales: number;
  grossProfit: number;
  orderCount: number;
}

export interface InventoryTurnoverDTO {
  productId: string;
  productName: string;
  turnoverRatio: number;
  averageDaysToSell: number;
}

export interface KPIWidgetDefinition {
  widgetId: string;
  reportId: string;    // Maps to a specific method in ReportQueryService
  title: string;
  chartType: 'LINE' | 'BAR' | 'PIE' | 'NUMBER';
  cacheTTLSeconds: number;
  refreshInterval: number;
}

export interface ExportJobRequest {
  reportId: string;
  filters: any;
  format: 'PDF' | 'EXCEL' | 'CSV';
  requestedBy: string;
}

export interface ExportJobResponse {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  estimatedCompletionTime?: string;
}

/**
 * ReportQueryService (v1)
 * Trách nhiệm: Chỉ đọc dữ liệu từ Analytics Store (Materialized Read Models).
 * Tuyệt đối không JOIN trực tiếp vào Operational DB.
 * Trả về DTOs thuần túy cho Dashboard vẽ.
 */
export interface IReportQueryService_v1 {
  
  /** Lấy xu hướng doanh thu theo ngày */
  getDailySalesTrend(startDate: string, endDate: string): Promise<SalesTrendDTO[]>;
  
  /** Lấy chỉ số vòng quay hàng tồn kho */
  getInventoryTurnover(branchId: string, limit: number): Promise<InventoryTurnoverDTO[]>;
  
  /** Kích hoạt Async Export Job */
  requestReportExport(request: ExportJobRequest): Promise<ExportJobResponse>;
  
  /** Đọc định nghĩa các KPI Widgets được cấu hình cho user/role này */
  getDashboardWidgets(userId: string): Promise<KPIWidgetDefinition[]>;
}
