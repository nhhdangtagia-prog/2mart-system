import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all inventory checks
router.get('/', async (req, res) => {
  try {
    const checks = await prisma.inventoryCheck.findMany({
      include: { items: true },
      orderBy: { timestamp: 'desc' }
    });
    res.json(checks);
  } catch (error) {
    console.error('Error fetching inventory checks:', error);
    res.status(500).json({ error: 'Failed to fetch inventory checks' });
  }
});

// Create a new inventory check (PENDING)
router.post('/', async (req, res) => {
  try {
    const { items, ...checkData } = req.body;
    
    const created = await prisma.inventoryCheck.create({
      data: {
        ...checkData,
        status: "PENDING", // Enforce pending status on creation
        items: items ? { create: items } : undefined
      },
      include: { items: true }
    });
    res.json({ ok: true, data: created });
  } catch (error) {
    console.error('Error creating inventory check:', error);
    res.status(500).json({ error: 'Failed to create inventory check' });
  }
});

// Approve an inventory check and update BranchStock
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approver } = req.body;

    const existing = await prisma.inventoryCheck.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inventory check not found' });
    }

    if (existing.status !== 'PENDING') {
      return res.status(400).json({ error: 'Can only approve PENDING checks' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update check status
      const check = await tx.inventoryCheck.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          approver,
          approvedAt: new Date().toLocaleString("vi-VN")
        },
        include: { items: true }
      });

      // Update BranchStock for each item
      for (const item of check.items) {
        await tx.branchStock.upsert({
          where: {
            productSku_branch: {
              productSku: item.sku,
              branch: check.branch
            }
          },
          update: {
            stock: item.actualStock
          },
          create: {
            productSku: item.sku,
            branch: check.branch,
            stock: item.actualStock
          }
        });
      }

      return check;
    });

    res.json({ ok: true, data: updated });
  } catch (error) {
    console.error('Error approving inventory check:', error);
    res.status(500).json({ error: 'Failed to approve inventory check' });
  }
});

export const inventoryCheckRouter = router;
