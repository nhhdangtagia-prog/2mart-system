/**
 * Băm mật khẩu bằng SHA-256 (Web Crypto API) trước khi lưu vào localStorage.
 * Đây KHÔNG phải bảo mật tuyệt đối (không có salt, không có backend thật đứng giữa),
 * chỉ nhằm tránh lộ mật khẩu dạng chữ thường khi mở DevTools (F12) xem localStorage.
 */
export async function hashPassword(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
