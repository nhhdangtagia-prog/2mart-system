import os

file_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src\utils\seeder.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the array with an empty one or just remove it
old_top_products = """      const topProducts: CatalogReadModelDTO[] = [
        { id: "HEI-24", sku: "HEI-24", name: "Bia Heineken Sleek Thùng 24 Lon", brandName: "Heineken", categoryName: "Đồ uống có cồn", retailPrice: 480000, stock: 120, status: "ACTIVE", imageUrl: null },
        { id: "VNM-180", sku: "VNM-180", name: "Sữa Tươi Tiệt Trùng Vinamilk 180ml (Thùng 48 hộp)", brandName: "Vinamilk", categoryName: "Sữa & Sản phẩm từ sữa", retailPrice: 310000, stock: 450, status: "ACTIVE", imageUrl: null },
        { id: "SIM-5L", sku: "SIM-5L", name: "Dầu Ăn Simply Nành 5 Lít", brandName: "Simply", categoryName: "Gia vị & Dầu ăn", retailPrice: 245000, stock: 85, status: "ACTIVE", imageUrl: null },
        { id: "HAO-24", sku: "HAO-24", name: "Thùng Mì Hảo Hảo Tôm Chua Cay (30 gói)", brandName: "Acecook", categoryName: "Thực phẩm khô", retailPrice: 115000, stock: 320, status: "ACTIVE", imageUrl: null },
        { id: "OMO-36", sku: "OMO-36", name: "Nước Giặt OMO Matic Túi 3.6Kg", brandName: "Unilever", categoryName: "Hóa phẩm & Tẩy rửa", retailPrice: 210000, stock: 64, status: "ACTIVE", imageUrl: null }
      ];"""

content = content.replace(old_top_products, "const topProducts: CatalogReadModelDTO[] = [];")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
