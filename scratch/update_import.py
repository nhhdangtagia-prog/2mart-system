import os

file_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src\pages\InventoryPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject handleFileUpload
handle_upload_code = """
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) return;
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        
        const validProducts = json.map((p: any, idx: number) => ({
          id: String(p["Mã hàng"] || `prod-${idx}`),
          sku: String(p["Mã hàng"] || `SKU-${idx}`),
          name: String(p["Tên hàng"] || "Sản phẩm"),
          brandName: String(p["Thương hiệu"] || "2Mart"),
          categoryName: String(p["Nhóm hàng(3 Cấp)"] || "Khác"),
          retailPrice: Number(p["Giá bán"]) || 0,
          costPrice: Number(p["Giá vốn"]) || 0,
          stock: Number(p["Tồn kho"]) || 0,
          status: (Number(p["Tồn kho"]) || 0) > 0 ? "ACTIVE" : "INACTIVE",
          imageUrl: String(p["Hình ảnh (url1,url2...)"] || "").split(',')[0] || null
        })).filter((p: any) => p.sku && p.sku.toLowerCase() !== 'nan');

        // Ghi đè toàn bộ danh mục hàng hóa
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
        localStorage.setItem("kiot_rm_branch_stock_v2", JSON.stringify(branchStockMap));
        
        alert(`Đã import thành công ${validProducts.length} mặt hàng vào chi nhánh ${currentBranch}!`);
        window.location.reload();
      } catch (err) {
        alert("Lỗi khi đọc file Excel!");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleApproveAlert = (alert: StockAlert) => {"""

content = content.replace("  const handleApproveAlert = (alert: StockAlert) => {", handle_upload_code)

# 2. Replace Import button
old_button = """          <Button variant="outline" className="gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border-slate-200">
            <Upload className="w-4 h-4" /> Import
          </Button>"""

new_button = """          <label className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border border-slate-200 rounded-md px-4 h-10 font-medium text-sm cursor-pointer transition-colors">
            <Upload className="w-4 h-4" /> Import
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
          </label>"""

content = content.replace(old_button, new_button)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("InventoryPage updated.")
