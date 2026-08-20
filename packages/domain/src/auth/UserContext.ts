/**
 * UserContext đại diện cho request đang thực thi.
 * Tầng Application tuyệt đối không nhận Request, Response hay JWT từ NestJS/Express.
 * Tầng Application chỉ nhận UserContext.
 */
export interface UserContext {
  userId: string;
  organizationId: string;
  
  /**
   * Branch ID hiện tại đang được chọn ở Client (truyền qua Header X-Branch-Id).
   * Rất quan trọng để truy vấn dữ liệu chi nhánh.
   */
  branchId: string;

  /**
   * Danh sách permission áp dụng cho Branch hiện tại.
   * Array các string, ví dụ: ['product.create', 'product.read', 'order.checkout']
   */
  permissions: string[];

  /**
   * Sinh tự động cho mỗi request để tracking log (Audit Log).
   */
  correlationId: string;

  /**
   * Kiểm tra quyền trong code (Thay thế cho if role === 'admin')
   */
  hasPermission(permissionId: string): boolean;
}
