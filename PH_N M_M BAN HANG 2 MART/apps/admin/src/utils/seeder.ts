import { catalogProjectionRepo, orderProjectionRepo, analyticsProjectionRepo, type CatalogReadModelDTO, type OrderReadModelDTO } from "@2mart/read-model";
import productsData from "../data/products.json";
import invoicesData from "../data/invoices.json";
import { parseOrderDateMs } from "./orderMigration";

/**
 * Khởi tạo và đồng bộ liên kết dữ liệu thực tế giữa 3 module: Hàng hóa (Catalog), Bán hàng (POS), và Báo cáo (Dashboard/Invoices).
 * @param force Nếu true, sẽ ghi đè và làm mới lại dữ liệu chuẩn từ Excel KiotViet vào LocalStorage Read Model.
 */
export async function initAndSyncRealData(force: boolean = false): Promise<void> {
  try {
    // 1. Đồng bộ Hàng hóa (Catalog Read Model)
    const existingCatalog = localStorage.getItem("kiot_rm_catalog");
    if (force || !existingCatalog || JSON.parse(existingCatalog).length < 5) {
      // Top 5 sản phẩm bán chạy nhất từ Dashboard để đảm bảo khớp 100% số liệu
      const topProducts: CatalogReadModelDTO[] = [
        { id: "HEI-24", sku: "HEI-24", name: "Bia Heineken Sleek Thùng 24 Lon", brandName: "Heineken", categoryName: "Đồ uống có cồn", retailPrice: 480000, stock: 120, status: "ACTIVE", imageUrl: null },
        { id: "VNM-180", sku: "VNM-180", name: "Sữa Tươi Tiệt Trùng Vinamilk 180ml (Thùng 48 hộp)", brandName: "Vinamilk", categoryName: "Sữa & Sản phẩm từ sữa", retailPrice: 310000, stock: 450, status: "ACTIVE", imageUrl: null },
        { id: "SIM-5L", sku: "SIM-5L", name: "Dầu Ăn Simply Nành 5 Lít", brandName: "Simply", categoryName: "Gia vị & Dầu ăn", retailPrice: 245000, stock: 85, status: "ACTIVE", imageUrl: null },
        { id: "HAO-24", sku: "HAO-24", name: "Thùng Mì Hảo Hảo Tôm Chua Cay (30 gói)", brandName: "Acecook", categoryName: "Thực phẩm khô", retailPrice: 115000, stock: 320, status: "ACTIVE", imageUrl: null },
        { id: "OMO-36", sku: "OMO-36", name: "Nước Giặt OMO Matic Túi 3.6Kg", brandName: "Unilever", categoryName: "Hóa phẩm & Tẩy rửa", retailPrice: 210000, stock: 64, status: "ACTIVE", imageUrl: null }
      ];

      // Dữ liệu hàng hóa thực tế từ file Excel KiotViet của khách hàng
      const excelProducts: CatalogReadModelDTO[] = (productsData as any[]).slice(0, 200).map((p, idx) => ({
        id: p.sku || `prod-${idx}`,
        sku: p.sku || `SKU-${idx}`,
        name: p.name || "Sản phẩm KiotViet",
        brandName: p.brand || "2Mart",
        categoryName: p.category || "Khác",
        retailPrice: Number(p.price) || 0,
        stock: Number(p.stock) || 100,
        status: Number(p.stock) > 0 ? "ACTIVE" : "INACTIVE",
        imageUrl: p.imageUrl || null
      }));

      // Hợp nhất dữ liệu, loại bỏ mã trùng
      const seenSkus = new Set<string>();
      const combined: CatalogReadModelDTO[] = [];
      for (const item of [...topProducts, ...excelProducts]) {
        if (!seenSkus.has(item.sku)) {
          seenSkus.add(item.sku);
          combined.push(item);
        }
      }

      await catalogProjectionRepo.saveAll(combined);
      console.log(`[Seeder] Đã đồng bộ liên kết ${combined.length} sản phẩm giữa Hàng hóa, POS và Báo cáo.`);
    }

    // 2. Đồng bộ Hóa đơn (Order Read Model)
    const existingOrders = localStorage.getItem("kiot_rm_orders");
    if (force || !existingOrders || JSON.parse(existingOrders).length < 5) {
      // Dữ liệu mẫu đã có sẵn số tiền tách theo từng hình thức (cash/card/transfer) — giữ nguyên
      // thay vì dồn hết vào 1 hình thức, để chức năng Kết ca ra đúng số thực tế.
      const realOrders: OrderReadModelDTO[] = (invoicesData as any[]).slice(0, 100).map((inv, idx) => {
        const totalAmount = Number(inv.finalAmount) || Number(inv.total) || 0;
        let cashAmount = Number(inv.cash) || 0;
        const cardAmount = Number(inv.card) || 0;
        const transferAmount = Number(inv.transfer) || 0;
        // Dữ liệu lịch sử có đơn ghi thiếu/sai phần tách hình thức thanh toán (tổng 3 loại không
        // khớp số tiền khách trả). Lấy tiền mặt làm số bù: những gì không phải thẻ/chuyển khoản
        // thì là tiền mặt — nếu không, phần Kết ca sẽ hụt so với "Tổng tiền bán".
        if (cashAmount + cardAmount + transferAmount !== totalAmount) {
          cashAmount = Math.max(0, totalAmount - cardAmount - transferAmount);
        }
        const usedMethods = [cashAmount, cardAmount, transferAmount].filter(v => v > 0).length;
        const paymentMethod =
          usedMethods > 1 ? "MIXED" :
          transferAmount > 0 ? "TRANSFER" :
          cardAmount > 0 ? "CARD" : "CASH";

        return {
          id: inv.id || `inv-${idx}`,
          code: inv.id || `HD${10000 + idx}`,
          createdAt: inv.date || new Date().toLocaleString("vi-VN"),
          createdAtMs: parseOrderDateMs(inv.date),
          customerName: inv.customer || "Khách lẻ tại quầy",
          employeeName: inv.employee || "Thu ngân ca 1",
          employeeCode: inv.employeeCode || undefined,
          totalAmount,
          paymentMethod: paymentMethod as any,
          cashAmount,
          cardAmount,
          transferAmount,
          // Dữ liệu lịch sử được xuất từ cơ sở CS1 — mỗi đơn chỉ thuộc đúng 1 cơ sở
          branch: inv.branch || "285 Nguyễn Lương Bằng",
          items: Array.isArray(inv.items)
            ? inv.items.map((it: any) => ({
                sku: String(it.sku || ""),
                name: it.name || String(it.sku || ""),
                quantity: Number(it.quantity) || 0,
                price: Number(it.price) || 0
              }))
            : [],
          status: "COMPLETED",
          itemsCount: Array.isArray(inv.items)
            ? inv.items.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0)
            : Math.max(1, Math.floor((Number(inv.total) || 50000) / 50000))
        };
      });

      await orderProjectionRepo.saveAll(realOrders);
      console.log(`[Seeder] Đã đồng bộ ${realOrders.length} hóa đơn thực tế vào Read Model.`);
    }

    // 3. Đồng bộ Báo cáo (Analytics Read Model) — Top hàng bán chạy tính từ chính các dòng hàng
    // trong hóa đơn thật, không dùng danh sách viết sẵn nữa.
    // Chỉ tính lại 1 lần (đánh dấu bằng cờ) — sau đó để các đơn bán mới tự cộng dồn vào,
    // tránh ghi đè mất số liệu bán hàng thực tế mỗi lần mở app.
    const metrics = await analyticsProjectionRepo.getMetrics();
    const topProductsSeeded = localStorage.getItem("kiot_top_products_v2");
    if (!topProductsSeeded) {
      const tally = new Map<string, { name: string; sku: string; revenue: number; quantity: number }>();
      (invoicesData as any[]).forEach(inv => {
        (inv.items || []).forEach((it: any) => {
          const sku = String(it.sku || it.name);
          const cur = tally.get(sku) || { name: it.name || sku, sku, revenue: 0, quantity: 0 };
          cur.revenue += Number(it.total) || 0;
          cur.quantity += Number(it.quantity) || 0;
          tally.set(sku, cur);
        });
      });

      metrics.topProducts = Array.from(tally.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map((p, i) => ({ rank: i + 1, name: p.name, sku: p.sku, revenue: p.revenue, quantity: p.quantity, change: "" }));

      await analyticsProjectionRepo.saveMetrics(metrics);
      localStorage.setItem("kiot_top_products_v2", "true");
      console.log(`[Seeder] Đã tính Top ${metrics.topProducts.length} hàng bán chạy từ hóa đơn thực tế.`);
    }
  } catch (err) {
    console.error("[Seeder] Error syncing real data:", err);
  }
}
