import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const productsPath = path.resolve('../admin/src/data/raw_products.json');
  console.log('Reading products from', productsPath);
  
  const rawData = fs.readFileSync(productsPath, 'utf8');
  const products = JSON.parse(rawData);
  
  console.log(`Loaded ${products.length} products. Seeding...`);

  let count = 0;
  for (const p of products) {
    const sku = p["Mã hàng"];
    if (!sku) continue;

    const baseStock = Number(p["Tồn kho"]) || 50;
    const seed = sku.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const cs2Stock = Math.max(5, Math.floor(baseStock * 0.65) + (seed % 20) - 10);

    const price = Number(p["Giá bán"]) || 0;
    const cost = Number(p["Giá vốn"]) || Math.round(price * 0.7);

    const data = {
      sku,
      name: p["Tên hàng"] || 'Unnamed Product',
      brandName: p["Thương hiệu"] || 'No Brand',
      categoryName: p["Nhóm hàng(3 Cấp)"] || 'General',
      retailPrice: price,
      costPrice: cost,
      status: p["Đang kinh doanh"] === 1 ? 'ACTIVE' : 'INACTIVE',
      imageUrl: p["Hình ảnh (url1,url2...)"]?.split(',')[0] || null,
      branchStocks: {
        create: [
          { branch: "379b Tôn Đức Thắng", stock: baseStock },
          { branch: "285 Nguyễn Lương Bằng", stock: cs2Stock }
        ]
      }
    };

    await prisma.product.upsert({
      where: { sku },
      update: {},
      create: data
    });
    count++;
    if (count % 100 === 0) {
      console.log(`Seeded ${count} products...`);
    }
  }

  console.log(`Finished seeding ${count} products.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
