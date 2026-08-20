import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { branchStocks: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create a product
router.post('/', async (req, res) => {
  try {
    const { sku, name, brandName, categoryName, retailPrice, costPrice, imageUrl, unit } = req.body;

    if (!sku || !name) {
      return res.status(400).json({ error: 'Mã hàng và tên hàng là bắt buộc.' });
    }

    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return res.status(400).json({ error: `Mã hàng "${sku}" đã tồn tại.` });
    }

    const created = await prisma.product.create({
      data: {
        sku,
        name,
        brandName: brandName || "",
        unit: unit || null,
        categoryName: categoryName || "Khác",
        retailPrice: Number(retailPrice) || 0,
        costPrice: Number(costPrice) || 0,
        imageUrl: imageUrl || null,
        branchStocks: {
          create: [
            { branch: "379b Tôn Đức Thắng", stock: 0 },
            { branch: "285 Nguyễn Lương Bằng", stock: 0 }
          ]
        }
      }
    });

    res.json({ ok: true, data: created });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update a product
router.put('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const { newSku, name, brandName, categoryName, retailPrice, costPrice, status, imageUrl, unit } = req.body;

    if (newSku && newSku !== sku) {
      // Trying to change the SKU
      const existing = await prisma.product.findUnique({ where: { sku: newSku } });
      if (existing) {
        return res.status(400).json({ error: `Mã hàng "${newSku}" đã tồn tại.` });
      }
    }

    const updated = await prisma.product.update({
      where: { sku },
      data: {
        sku: newSku || sku,
        name,
        brandName,
        unit,
        categoryName,
        retailPrice,
        costPrice,
        status,
        imageUrl
      }
    });

    res.json({ ok: true, data: updated });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Adjust stock (absolute value or delta)
router.post('/stock', async (req, res) => {
  try {
    const { sku, branch, quantityDelta, newValue, reason } = req.body;

    const stockRecord = await prisma.branchStock.findUnique({
      where: { productSku_branch: { productSku: sku, branch } }
    });

    if (newValue !== undefined) {
      // Admin manual override
      await prisma.branchStock.upsert({
        where: { productSku_branch: { productSku: sku, branch } },
        update: { stock: Math.max(0, newValue) },
        create: { productSku: sku, branch, stock: Math.max(0, newValue) }
      });
    } else if (quantityDelta !== undefined) {
      // Relative adjust (like from POS or Receiving goods)
      const current = stockRecord?.stock || 0;
      // We allow stock to go below zero for sales (CQRS logic says "KHÔNG chặn bán và KHÔNG ghim về 0")
      // Wait, let's keep negative stock if Delta is negative
      const newStock = current + quantityDelta;
      await prisma.branchStock.upsert({
        where: { productSku_branch: { productSku: sku, branch } },
        update: { stock: newStock },
        create: { productSku: sku, branch, stock: newStock }
      });
    }

    // TODO: Ideally we should log the `reason` in an InventoryTransaction table.
    // For now we just update the stock.
    res.json({ ok: true });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

// Import products (upsert)
router.post('/import', async (req, res) => {
  try {
    const { branch, products } = req.body;
    
    // products is an array of { sku, name, brandName, categoryName, retailPrice, costPrice, stock, status, imageUrl }
    for (const p of products) {
      // Upsert product
      await prisma.product.upsert({
        where: { sku: p.sku },
        update: {
          name: p.name,
          brandName: p.brandName,
          categoryName: p.categoryName,
          retailPrice: p.retailPrice,
          costPrice: p.costPrice,
          status: p.status,
          imageUrl: p.imageUrl
        },
        create: {
          sku: p.sku,
          name: p.name,
          brandName: p.brandName,
          categoryName: p.categoryName,
          retailPrice: p.retailPrice,
          costPrice: p.costPrice,
          status: p.status,
          imageUrl: p.imageUrl
        }
      });

      // Upsert branch stock
      await prisma.branchStock.upsert({
        where: { productSku_branch: { productSku: p.sku, branch } },
        update: { stock: p.stock },
        create: { productSku: p.sku, branch, stock: p.stock }
      });
    }

    res.json({ ok: true, importedCount: products.length });
  } catch (error) {
    console.error('Error importing products:', error);
    res.status(500).json({ error: 'Failed to import products' });
  }
});

export const catalogRouter = router;
