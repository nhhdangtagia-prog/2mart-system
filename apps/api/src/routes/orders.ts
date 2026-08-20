import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();


// Helper: send Telegram notification
async function sendTelegramNotification(order: any) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

    const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
    


    const message = `${order.employeeName || 'Nhân viên'} vừa bán ${formatter.format(order.totalAmount)} tại ${order.branch || 'Không xác định'} - ${order.paymentMethod}`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error('Telegram notification error:', error);
  }
}

// Helper: convert BigInt to Number for JSON serialization
function serializeOrder(order: any) {
  return {
    ...order,
    createdAtMs: order.createdAtMs !== null && order.createdAtMs !== undefined
      ? Number(order.createdAtMs)
      : null,
  };
}

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders.map(serializeOrder));
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Sync orders (used for migration from localStorage)
router.post('/sync', async (req, res) => {
  try {
    const orders = req.body;
    await prisma.$transaction(async (tx) => {
      // Clear existing orders to prevent duplicates (only safe if this is a one-time migration or full replace)
      // For orders, it's safer to use upsert or just skip duplicates if they exist
      // Since it's a migration, let's use createMany if possible, but we have nested items.
      // Easiest is to delete all and insert like payrolls, assuming the frontend holds the master copy during migration.
      await tx.order.deleteMany({});
      
      for (const order of orders) {
        const { items, ...rawData } = order;
        
        const orderData: any = {
          code:           rawData.code,
          customerName:   rawData.customerName || 'Khách lẻ tại quầy',
          employeeName:   rawData.employeeName || '',
          employeeCode:   rawData.employeeCode || null,
          totalAmount:    Number(rawData.totalAmount) || 0,
          paymentMethod:  rawData.paymentMethod || 'CASH',
          cashAmount:     rawData.cashAmount !== undefined ? Number(rawData.cashAmount) : null,
          transferAmount: rawData.transferAmount !== undefined ? Number(rawData.transferAmount) : null,
          cardAmount:     rawData.cardAmount !== undefined ? Number(rawData.cardAmount) : null,
          branch:         rawData.branch || null,
          status:         rawData.status || 'COMPLETED',
          itemsCount:     rawData.itemsCount || (items ? items.reduce((s: number, i: any) => s + (i.quantity || 1), 0) : 0),
          createdAtMs:    rawData.createdAtMs ? BigInt(rawData.createdAtMs) : BigInt(Date.now()),
        };

        await tx.order.create({
          data: {
            ...orderData,
            items: {
              create: (items || []).map((item: any) => ({
                sku:      String(item.sku),
                name:     String(item.name),
                quantity: Number(item.quantity) || 1,
                price:    Number(item.price) || 0,
              }))
            }
          }
        });
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing orders:', error);
    res.status(500).json({ error: 'Failed to sync orders' });
  }
});

// Create a new order
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const { items, ...rawData } = data;

    // Auto-generate order code if missing
    if (!rawData.code) {
      const ts = Date.now().toString().slice(-6);
      const rnd = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      rawData.code = `DH${ts}${rnd}`;
    }

    // Only whitelist fields that exist in the Order schema (avoid Prisma "Unknown argument" error)
    const orderData: any = {
      code:           rawData.code,
      customerName:   rawData.customerName || 'Khách lẻ tại quầy',
      employeeName:   rawData.employeeName || '',
      employeeCode:   rawData.employeeCode || null,
      totalAmount:    Number(rawData.totalAmount) || 0,
      paymentMethod:  rawData.paymentMethod || 'CASH',
      cashAmount:     rawData.cashAmount !== undefined ? Number(rawData.cashAmount) : null,
      transferAmount: rawData.transferAmount !== undefined ? Number(rawData.transferAmount) : null,
      cardAmount:     rawData.cardAmount !== undefined ? Number(rawData.cardAmount) : null,
      branch:         rawData.branch || null,
      status:         rawData.status || 'COMPLETED',
      itemsCount:     rawData.itemsCount || (items ? items.reduce((s: number, i: any) => s + (i.quantity || 1), 0) : 0),
      createdAtMs:    rawData.createdAtMs ? BigInt(rawData.createdAtMs) : BigInt(Date.now()),
    };

    const created = await prisma.order.create({
      data: {
        ...orderData,
        items: {
          create: (items || []).map((item: any) => ({
            sku:      String(item.sku),
            name:     String(item.name),
            quantity: Number(item.quantity) || 1,
            price:    Number(item.price) || 0,
          }))
        }
      },
      include: { items: true }
    });

    // Cập nhật lastSoldAt cho các sản phẩm trong đơn hàng
    if (items && items.length > 0) {
      const skusToUpdate = items.filter((i: any) => i.sku && i.sku !== 'POS-ITEM').map((i: any) => String(i.sku));
      if (skusToUpdate.length > 0) {
        await prisma.product.updateMany({
          where: { sku: { in: skusToUpdate } },
          data: { lastSoldAt: new Date(Number(created.createdAtMs)) }
        });
      }
    }

    // Send Telegram Notification asynchronously
    sendTelegramNotification(created).catch(console.error);

    res.json({ ok: true, data: serializeOrder(created) });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});


// Delete an order
router.delete('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Fetch order with items to restore stock
    const order = await prisma.order.findFirst({
      where: { OR: [{ code }, { id: code }] },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn này để xóa' });
    }

    // Restore stock if needed
    if (order.branch && order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.sku !== 'POS-ITEM') {
          const stockRecord = await prisma.branchStock.findUnique({
            where: { productSku_branch: { productSku: item.sku, branch: order.branch } }
          });
          const current = stockRecord?.stock || 0;
          const newStock = current + item.quantity;
          
          await prisma.branchStock.upsert({
            where: { productSku_branch: { productSku: item.sku, branch: order.branch } },
            update: { stock: newStock },
            create: { productSku: item.sku, branch: order.branch, stock: newStock }
          });
        }
      }
    }

    await prisma.order.delete({
      where: { id: order.id }
    });

    res.json({ ok: true, data: serializeOrder(order) });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export const orderRouter = router;
