export interface ProductLookupDTO {
  id: string;
  sku: string;
  name: string;
  brandName: string;
  categoryName: string;
  retailPrice: number; // Lấy từ ProductPrices JOIN PriceLists (RETAIL)
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'COMING_SOON';
  imageUrl: string | null;
}

export interface ProductSearchCriteria {
  query?: string; // Tên, SKU hoặc Barcode
  categoryId?: string;
  brandId?: string;
  status?: string;
  limit: number;
  offset: number;
}

/**
 * CatalogQueryService: Read Model cho POS và Admin UI
 * Tối ưu hóa việc đọc dữ liệu thay vì dùng Repository trả về Entity
 * Service này trực tiếp JOIN các bảng và trả về DTO gọn nhẹ.
 */
export interface ICatalogQueryService {
  /**
   * Tìm kiếm sản phẩm phục vụ cho màn hình Grid (Admin)
   */
  searchProducts(criteria: ProductSearchCriteria): Promise<{ items: ProductLookupDTO[], total: number }>;

  /**
   * Quét mã vạch tại POS. Phải trả về kết quả cực nhanh (< 50ms)
   */
  findByBarcode(barcode: string, branchId: string): Promise<ProductLookupDTO | null>;
  
  /**
   * Lấy chi tiết sản phẩm kèm tất cả ảnh, mã vạch, và giá
   */
  getProductDetail(productId: string): Promise<any>;
}
