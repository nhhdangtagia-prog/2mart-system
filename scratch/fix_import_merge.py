import os

file_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src\pages\InventoryPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """        // Ghi đè toàn bộ danh mục hàng hóa
        localStorage.setItem("kiot_rm_catalog", JSON.stringify(validProducts));
        
        // Khởi tạo lại Tồn kho theo chi nhánh (Reset toàn bộ)
        const branchStockMap: Record<string, any> = {};
        for (const p of validProducts) {
          // File khách hàng tải lên thường xuất từ một chi nhánh cụ thể.
          // Ta sẽ gán số tồn đó vào chi nhánh đang được chọn (currentBranch).
          branchStockMap[p.sku] = { 
            cs1: currentBranch.includes("285") ? p.stock : 0, 
            cs2: currentBranch.includes("379b") ? p.stock : 0 
          };
        }
        localStorage.setItem("kiot_rm_branch_stock_v2", JSON.stringify(branchStockMap));"""

new_logic = """        // Lấy dữ liệu catalog hiện tại để HỢP NHẤT, tránh mất hàng hóa khi import
        const existingCatalogStr = localStorage.getItem("kiot_rm_catalog");
        let existingCatalog: any[] = [];
        try { if (existingCatalogStr) existingCatalog = JSON.parse(existingCatalogStr); } catch(e){}
        
        const catalogMap = new Map(existingCatalog.map(x => [x.sku, x]));
        for (const p of validProducts) {
            catalogMap.set(p.sku, p);
        }
        const mergedCatalog = Array.from(catalogMap.values());
        localStorage.setItem("kiot_rm_catalog", JSON.stringify(mergedCatalog));
        
        // Lấy dữ liệu tồn kho hiện tại để HỢP NHẤT, tránh mất tồn kho chi nhánh khác
        const existingStockStr = localStorage.getItem("kiot_rm_branch_stock_v2");
        const branchStockMap: Record<string, any> = existingStockStr ? JSON.parse(existingStockStr) : {};
        
        for (const p of validProducts) {
          if (!branchStockMap[p.sku]) branchStockMap[p.sku] = { cs1: 0, cs2: 0 };
          if (currentBranch.includes("285")) {
             branchStockMap[p.sku].cs1 = p.stock;
          } else {
             branchStockMap[p.sku].cs2 = p.stock;
          }
        }
        localStorage.setItem("kiot_rm_branch_stock_v2", JSON.stringify(branchStockMap));"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed import merge bug!")
else:
    print("Could not find old logic to replace.")
