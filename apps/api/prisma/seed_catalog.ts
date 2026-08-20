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
    const sku = p["MĂ£ hĂ ng"];
    if (!sku) continue;

    const baseStock = Number(p["Tá»“n kho"]) || 50;
    const seed = sku.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const cs2Stock = Math.max(5, Math.floor(baseStock * 0.65) + (seed % 20) - 10);

    const price = Number(p["GiĂ¡ bĂ¡n"]) || 0;
    const cost = Number(p["GiĂ¡ vá»‘n"]) || Math.round(price * 0.7);

    const data = {
      sku,
      name: p["TĂªn hĂ ng"] || 'Unnamed Product',
      brandName: p["ThÆ°Æ¡ng hiá»‡u"] || 'No Brand',
      categoryName: p["NhĂ³m hĂ ng(3 Cáº¥p)"] || 'General',
      retailPrice: price,
      costPrice: cost,
      status: p["Äang kinh doanh"] === 1 ? 'ACTIVE' : 'INACTIVE',
      imageUrl: p["HĂ¬nh áº£nh (url1,url2...)"]?.split(',')[0] || null,
      branchStocks: {
        create: [
          { branch: "379b TĂ´n Äá»©c Tháº¯ng", stock: baseStock },
          { branch: "285 Nguyá»…n LÆ°Æ¡ng Báº±ng", stock: cs2Stock }
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

