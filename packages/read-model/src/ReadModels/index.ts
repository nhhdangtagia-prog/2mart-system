export interface CatalogReadModelDTO {
  id: string;
  sku: string;
  name: string;
  brandName: string;
  unit?: string;
  categoryName: string;
  retailPrice: number;
  costPrice?: number;
  stock: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'COMING_SOON';
  imageUrl: string | null;
}

export interface AnalyticsReadModelDTO {
  todayRevenue: number;
  todayOrdersCount: number;
  monthRevenue: number;
  topProducts: {
    rank: number;
    name: string;
    sku: string;
    revenue: number;
    quantity: number;
    change: string;
  }[];
}

/** MIXED = khách trả kết hợp nhiều hình thức (VD một phần tiền mặt, phần còn lại chuyển khoản) */
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'MIXED';

/** Chi tiết từng mặt hàng trong đơn — cần để hoàn lại đúng tồn kho khi Admin xóa hóa đơn */
export interface OrderLineItemDTO {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  costPrice?: number;
}

export interface OrderReadModelDTO {
  id: string;
  code: string;
  createdAt: string;
  /** Mốc thời gian dạng số (epoch ms) — dùng để lọc/sắp xếp chính xác tới từng phút khi kết ca */
  createdAtMs?: number;
  customerName: string;
  employeeName: string;
  employeeCode?: string;
  totalAmount: number;
  totalCost?: number;
  paymentMethod: PaymentMethod;
  /** Số tiền thực nhận theo từng hình thức — tách riêng để kết ca ra đúng số thực tế */
  cashAmount?: number;
  transferAmount?: number;
  cardAmount?: number;
  /** Chi nhánh phát sinh đơn hàng — mỗi đơn chỉ thuộc đúng 1 cơ sở (tồn kho trừ đúng cơ sở đó) */
  branch?: string;
  /** Chi tiết mặt hàng đã bán — dùng để hoàn lại tồn kho khi Admin xóa hóa đơn */
  items?: OrderLineItemDTO[];
  status: 'COMPLETED' | 'CANCELLED' | 'PENDING';
  itemsCount: number;
}
