/**
 * Cache chứa Permission Map của User để tránh việc Query DB liên tục.
 * Cơ chế hoạt động:
 * 1. Khi JWT được verify thành công, Middleware/Guard lấy userId.
 * 2. Lấy permissions từ PermissionCache (Memory / Redis).
 * 3. Nếu Cache Miss, Query DB và ghi vào Cache.
 * 4. Đính kèm vào UserContext.
 */
export interface IPermissionCache {
  /**
   * Trả về danh sách permission (string array) của một user tại một branch
   */
  getPermissions(userId: string, branchId: string): Promise<string[] | null>;

  /**
   * Cập nhật cache khi quyền thay đổi
   */
  setPermissions(userId: string, branchId: string, permissions: string[], ttlSeconds?: number): Promise<void>;

  /**
   * Xóa cache (Ví dụ khi admin thu hồi quyền)
   */
  invalidateUser(userId: string): Promise<void>;
}
