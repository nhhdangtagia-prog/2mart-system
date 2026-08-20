import fs from 'fs';

const rawData = JSON.parse(fs.readFileSync('src/data/raw_products.json', 'utf8'));

const products = rawData.map(row => {
  const stock = Number(row['Tồn kho']) || 0;
  const isSelling = row['Đang kinh doanh'] === 1;
  let status = "Đang bán";
  if (!isSelling) status = "Ngừng bán";
  else if (stock <= 0) status = "Hết hàng";
  else if (stock <= 5) status = "Sắp hết";

  return {
    sku: String(row['Mã hàng'] || ""),
    barcode: String(row['Mã vạch'] || ""),
    name: String(row['Tên hàng'] || ""),
    category: String(row['Nhóm hàng(3 Cấp)'] || "Khác"),
    price: Number(row['Giá bán']) || 0,
    cost: Number(row['Giá vốn']) || 0,
    stock: stock,
    status: status,
    imageUrl: String(row['Hình ảnh (url1,url2...)'] || "").split(',')[0] || "",
    taxRate: String(row['Tỷ lệ tính thuế(%)'] || "0%"),
    brand: String(row['Thương hiệu'] || "Chưa có"),
    location: String(row['Vị trí'] || "Chưa có"),
    weight: String(row['Trọng lượng'] || "0 g"),
    points: Number(row['Điểm thưởng']) || 0,
    minStock: String(row['Tồn nhỏ nhất'] || "0"),
    maxStock: String(row['Tồn lớn nhất'] || "999,999,999")
  };
});

fs.writeFileSync('src/data/products.json', JSON.stringify(products, null, 2));
console.log(`Transformed ${products.length} products.`);
