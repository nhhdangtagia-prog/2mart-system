import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const SECURE_TOKEN = "2MART_BACKUP_SECURE_KEY";

router.get('/', async (req, res) => {
  try {
    const { token } = req.query;

    if (token !== SECURE_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Lấy dữ liệu từ các bảng quan trọng
    const [orders, products, purchases, cashbook, attendance, payrolls, karaboxSessions, karaboxRooms] = await Promise.all([
      prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 }), // Giới hạn 1000 đơn gần nhất để tránh quá tải
      prisma.product.findMany(),
      prisma.purchaseOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 }),
      prisma.cashbookEntry.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 }),
      prisma.attendanceRecord.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 }),
      prisma.payrollSheet.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' }, take: 50 }), // Lấy 50 bảng lương gần nhất kèm chi tiết
      prisma.karaboxSession.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 }),
      prisma.karaboxRoom.findMany()
    ]);

    const payload = {
      success: true,
      data: {
        orders,
        products,
        purchases,
        cashbook,
        attendance,
        payrolls,
        karaboxSessions,
        karaboxRooms
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(payload, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Failed to generate backup data' });
  }
});

export const backupRouter = router;
