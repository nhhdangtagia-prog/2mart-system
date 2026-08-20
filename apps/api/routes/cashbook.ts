import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all aggregated cashbook entries
router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'Missing from/to dates' });

    const startDate = new Date(from as string);
    const endDate = new Date(to as string);

    // 1. Get manual cashbook entries
    const manualEntries = await prisma.cashbookEntry.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // 2. Get Sales Orders (Receipts)
    const salesOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // 3. Get Purchase Orders (Payments)
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        status: { in: ['COMPLETED', 'completed'] },
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        paidAmount: {
          gt: 0
        }
      }
    });

    // 4. Get Karabox Sessions (Receipts)
    const karaboxSessions = await prisma.karaboxSession.findMany({
      where: {
        status: 'COMPLETED',
        endTime: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Aggregate all entries into a unified format
    const aggregatedEntries = [
      ...manualEntries.map(e => ({
        id: e.id,
        type: e.type,
        date: e.createdAt.toISOString(),
        amount: e.amount,
        description: e.description,
        category: e.category,
        paymentMethod: e.paymentMethod,
        actorName: e.actorName,
        timestampMs: Number(e.timestampMs),
        isManual: true
      })),
      ...salesOrders.map(o => ({
        id: o.id,
        type: 'receipt',
        date: o.createdAt.toISOString(),
        amount: o.totalAmount, // Assuming totalAmount is paid for COMPLETED orders.
        description: `Thu tiền bán hàng hóa đơn ${o.code}`,
        category: 'Tiền hàng',
        paymentMethod: o.paymentMethod,
        actorName: o.employeeName,
        timestampMs: o.createdAtMs ? Number(o.createdAtMs) : o.createdAt.getTime(),
        isManual: false,
        referenceUrl: `/orders`
      })),
      ...purchaseOrders.map(p => ({
        id: p.id,
        type: 'payment',
        date: p.createdAt.toISOString(),
        amount: p.paidAmount || 0,
        description: `Thanh toán phiếu nhập ${p.code} cho ${p.supplierName}`,
        category: 'Thanh toán cho NCC',
        paymentMethod: 'Tiền mặt/Chuyển khoản', // Default placeholder
        actorName: p.creator,
        timestampMs: p.createdAt.getTime(),
        isManual: false,
        referenceUrl: `/purchases`
      })),
      ...karaboxSessions.map(k => ({
        id: k.id,
        type: 'receipt',
        date: k.endTime?.toISOString() || k.updatedAt.toISOString(),
        amount: k.totalAmount || 0,
        description: `Thu tiền phòng Karabox`,
        category: 'Dịch vụ Karabox',
        paymentMethod: k.paymentMethod || 'Tiền mặt',
        actorName: k.checkoutEmployee || 'admin',
        timestampMs: k.endTime?.getTime() || k.updatedAt.getTime(),
        isManual: false,
        referenceUrl: `/karabox`
      }))
    ];

    // Sort by time descending
    aggregatedEntries.sort((a, b) => b.timestampMs - a.timestampMs);

    res.json(aggregatedEntries);
  } catch (error) {
    console.error("Error fetching cashbook:", error);
    res.status(500).json({ error: 'Failed to fetch cashbook entries' });
  }
});

// Create manual entry
router.post('/', async (req, res) => {
  try {
    const { type, amount, description, category, paymentMethod, actorName } = req.body;
    const entry = await prisma.cashbookEntry.create({
      data: {
        type,
        amount,
        description,
        category,
        paymentMethod: paymentMethod || 'Tiền mặt',
        actorName,
        timestampMs: Date.now()
      }
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create cashbook entry' });
  }
});

// Update manual entry
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const entry = await prisma.cashbookEntry.update({
      where: { id },
      data
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cashbook entry' });
  }
});

// Delete manual entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.cashbookEntry.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete cashbook entry' });
  }
});

// Sync from local storage
router.post('/sync', async (req, res) => {
  try {
    const entries = req.body.entries;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.json({ success: true, inserted: 0 });
    }

    // Filter out entries that look like they were automatically generated before (e.g. "Thanh toán phiếu nhập hàng")
    // Because those are now covered by the backend API query directly!
    const manualEntriesToSync = entries.filter(e => e.category !== "Thanh toán cho NCC");

    if (manualEntriesToSync.length === 0) {
        return res.json({ success: true, inserted: 0 });
    }

    // Prepare data
    const dataToInsert = manualEntriesToSync.map((e: any) => ({
      type: e.type,
      amount: e.amount,
      description: e.description,
      category: e.category,
      paymentMethod: e.paymentMethod || 'Tiền mặt',
      actorName: e.approvedBy || e.employeeCode || 'admin',
      timestampMs: e.timestampMs || Date.now()
    }));

    const result = await prisma.cashbookEntry.createMany({
      data: dataToInsert,
      skipDuplicates: true
    });

    res.json({ success: true, inserted: result.count });
  } catch (error) {
    console.error("Error syncing cashbook:", error);
    res.status(500).json({ error: 'Failed to sync cashbook entries' });
  }
});

export default router;
