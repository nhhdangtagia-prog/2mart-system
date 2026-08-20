import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendPurchaseImportNotification } from '../telegramBot.js';

const router = Router();
const prisma = new PrismaClient();

// Get all purchase orders
router.get('/', async (req, res) => {
  try {
    const purchases = await prisma.purchaseOrder.findMany({
      include: { items: true, logs: true },
      orderBy: { timestamp: 'desc' }
    });
    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

// Create a new purchase order
router.post('/', async (req, res) => {
  try {
    const { items, logs, ...purchaseData } = req.body;
    
    const created = await prisma.purchaseOrder.create({
      data: {
        ...purchaseData,
        items: items ? { create: items } : undefined,
        logs: logs ? { create: logs } : undefined
      },
      include: { items: true, logs: true }
    });
    
    // Gửi thông báo qua Telegram
    sendPurchaseImportNotification(created).catch(console.error);
    
    res.json({ ok: true, data: created });
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ error: 'Failed to create purchase' });
  }
});

// Update a purchase order (e.g. approve)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { items, logs, ...updateData } = req.body;

    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    // Usually we append logs, let's just create them if provided
    if (logs && Array.isArray(logs)) {
      await prisma.purchaseOrderLog.createMany({
        data: logs.map(l => ({ ...l, purchaseOrderId: id }))
      });
    }

    // Update main record
    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: { items: true, logs: true }
    });

    res.json({ ok: true, data: updated });
  } catch (error) {
    console.error('Error updating purchase:', error);
    res.status(500).json({ error: 'Failed to update purchase' });
  }
});

// Delete a purchase order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.purchaseOrder.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({ error: 'Failed to delete purchase' });
  }
});

// --- TRANSFERS ---

router.get('/transfers', async (req, res) => {
  try {
    const transfers = await prisma.transferOrder.findMany({
      include: { items: true },
      orderBy: { timestamp: 'desc' }
    });
    res.json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

router.post('/transfers/sync', async (req, res) => {
  try {
    const transfers = req.body;
    await prisma.$transaction(async (tx) => {
      await tx.transferOrder.deleteMany({});
      for (const t of transfers) {
        const { items, ...data } = t;
        await tx.transferOrder.create({
          data: {
            ...data,
            items: {
              create: (items || []).map((i: any) => ({
                sku: i.sku,
                name: i.name,
                quantity: i.quantity
              }))
            }
          }
        });
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing transfers:', error);
    res.status(500).json({ error: 'Failed to sync transfers' });
  }
});

router.post('/transfers', async (req, res) => {
  try {
    const { items, ...transferData } = req.body;
    
    const created = await prisma.transferOrder.create({
      data: {
        ...transferData,
        items: items ? { create: items } : undefined
      },
      include: { items: true }
    });
    res.json({ ok: true, data: created });
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
});

export const purchaseRouter = router;
