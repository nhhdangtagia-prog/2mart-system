import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import { catalogRouter } from './src/routes/catalog.js';
import { orderRouter } from './src/routes/orders.js';
import { purchaseRouter } from './src/routes/purchases.js';
import { analyticsRouter } from './src/routes/analytics.js';
import { inventoryCheckRouter } from './src/routes/inventoryChecks.js';
import { salaryAdvanceRouter } from './src/routes/salaryAdvances.js';
import { backupRouter } from './src/routes/backup.js';
import { initTelegramBot } from './src/telegramBot.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Phục vụ các file tĩnh của Frontend (Vite build)
const frontendDistPath = path.join(__dirname, '../admin/dist');
app.use(express.static(frontendDistPath, {
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Kiểm tra kết nối
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// APIs cho Nhân viên
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.post('/api/employees/sync', async (req, res) => {
  try {
    const employees = req.body;
    await prisma.$transaction(async (tx) => {
      await tx.employee.deleteMany({});
      
      for (const emp of employees) {
        const { id, ...data } = emp; // remove id to avoid uniqueness conflict if uuid is different
        await tx.employee.create({
          data: {
            ...data,
            id: typeof id === 'string' && id.length > 5 ? id : undefined // keep id if valid uuid
          }
        });
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing employees:', error);
    res.status(500).json({ error: 'Failed to sync employees' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      await prisma.employee.createMany({ data: req.body, skipDuplicates: true });
      res.status(201).json(req.body);
    } else {
      const employee = await prisma.employee.create({
        data: req.body,
      });
      res.status(201).json(employee);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await prisma.employee.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// SCHEDULES
app.get('/api/schedules', async (req, res) => {
  try {
    const schedules = await prisma.scheduleAssignment.findMany();
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

app.post('/api/schedules', async (req, res) => {
  try {
    const items = req.body;
    // expect an array or single item
    if (Array.isArray(items)) {
      await prisma.scheduleAssignment.createMany({ data: items, skipDuplicates: true });
      res.status(201).json(items);
    } else {
      const schedule = await prisma.scheduleAssignment.create({ data: items });
      res.status(201).json(schedule);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create schedules' });
  }
});

app.delete('/api/schedules/:id', async (req, res) => {
  try {
    await prisma.scheduleAssignment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

// TIMESHEETS
app.get('/api/timesheets', async (req, res) => {
  try {
    const timesheets = await prisma.attendanceRecord.findMany();
    res.json(timesheets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timesheets' });
  }
});

app.post('/api/timesheets', async (req, res) => {
  try {
    const items = req.body;
    if (Array.isArray(items)) {
      await prisma.attendanceRecord.createMany({ data: items, skipDuplicates: true });
      res.status(201).json(items);
    } else {
      const ts = await prisma.attendanceRecord.create({ data: items });
      res.status(201).json(ts);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create timesheets' });
  }
});

app.put('/api/timesheets/:id', async (req, res) => {
  try {
    const ts = await prisma.attendanceRecord.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(ts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update timesheet' });
  }
});

// Bảng lương
app.get('/api/payrolls', async (req, res) => {
  try {
    const payrolls = await prisma.payrollSheet.findMany({
      include: { items: true, payments: true }
    });
    // Trả về theo định dạng JSON như trước
    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payrolls' });
  }
});

// Helper: send Telegram notification
async function sendTelegramNotificationRaw(message: string) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

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

app.post('/api/payrolls/:id/notify', async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;
    
    const sheet = await prisma.payrollSheet.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!sheet) {
      return res.status(404).json({ error: "Bảng lương không tồn tại" });
    }
    
    const item = sheet.items.find((i: any) => i.employeeId === employeeId);
    if (!item) {
      return res.status(404).json({ error: "Không tìm thấy phiếu lương của nhân viên này" });
    }
    
    const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
    const msg = `🧾 *PHIẾU LƯƠNG NHÂN VIÊN*\n` +
      `Kỳ lương: ${sheet.periodRange}\n` +
      `Nhân viên: *${item.employeeName}*\n` +
      `Mã NV: ${item.employeeCode}\n` +
      `---------------------------------\n` +
      `Lương cơ bản: ${formatter.format(item.basicSalary)}\n` +
      `Lương tăng ca: ${formatter.format(item.overtimeSalary)}\n` +
      `Phụ cấp ca đêm: ${formatter.format(item.nightShiftAllowance || 0)}\n` +
      `Phụ cấp khác: ${formatter.format(item.allowances)}\n` +
      `Thưởng: ${formatter.format(item.bonuses)}\n` +
      `Tổng thu nhập: ${formatter.format(item.totalIncome)}\n` +
      `---------------------------------\n` +
      `Khấu trừ: ${formatter.format(item.deductions)}\n` +
      `Tạm ứng: ${formatter.format(item.advanceAmount || 0)}\n` +
      `*THỰC LÃNH: ${formatter.format(item.netSalary)}*\n` +
      `Đã thanh toán: ${formatter.format(item.paidAmount)}\n` +
      `Còn lại: ${formatter.format(item.netSalary - item.paidAmount)}\n`;

    await sendTelegramNotificationRaw(msg);
    res.json({ success: true });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

app.post('/api/schedules/sync', async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.scheduleAssignment.deleteMany({}),
      prisma.scheduleAssignment.createMany({ data: req.body })
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync schedules' });
  }
});

app.post('/api/timesheets/sync', async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.attendanceRecord.deleteMany({}),
      prisma.attendanceRecord.createMany({ data: req.body })
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync timesheets' });
  }
});

app.post('/api/payrolls/sync', async (req, res) => {
  try {
    const sheets = req.body;
    if (!Array.isArray(sheets)) throw new Error("Invalid payload: expected an array of sheets");

    // Fetch existing sheets to prevent code collision with DB
    const existingSheets = await prisma.payrollSheet.findMany({ select: { id: true, code: true } });
    const dbCodeToId = new Map(existingSheets.map(s => [s.code, s.id]));

    // Tự động sửa lỗi trùng lặp mã bảng lương (Unique constraint failed on `code`)
    const seenCodes = new Set<string>();
    for (const sheet of sheets) {
      if (!sheet.code) continue;
      let originalCode = sheet.code;
      while (
        seenCodes.has(sheet.code) || 
        (dbCodeToId.has(sheet.code) && dbCodeToId.get(sheet.code) !== sheet.id)
      ) {
        sheet.code = originalCode + "-" + Math.floor(Math.random() * 10000);
      }
      seenCodes.add(sheet.code);
    }

    await prisma.$transaction(async (tx) => {
      // Delete missing sheets
      const incomingIds = sheets.map((s: any) => s.id).filter(Boolean);
      await tx.payrollSheet.deleteMany({
        where: { id: { notIn: incomingIds } }
      });

      for (const sheet of sheets) {
        if (!sheet.id) continue;
        const { items, payments, createdAt, updatedAt, ...sheetData } = sheet;
        
        // Payload validation and fallback for items & payments
        const validItems = Array.isArray(items) ? items : [];
        const validPayments = Array.isArray(payments) ? payments : [];
        
        // Delete items to avoid P2002
        await tx.payrollSheetItem.deleteMany({ where: { sheetId: sheet.id } });
        await tx.payrollPayment.deleteMany({ where: { sheetId: sheet.id } });

        await tx.payrollSheet.upsert({
          where: { id: sheet.id },
          update: {
            ...sheetData,
            items: {
              create: validItems.map((i: any) => {
                const { id, sheetId, advanceAmount, ...rest } = i;
                // Đảm bảo advanceAmount không bị null/undefined (nguyên nhân gây mất dữ liệu ứng lương)
                return { ...rest, advanceAmount: typeof advanceAmount === 'number' ? advanceAmount : 0 };
              })
            },
            payments: {
              create: validPayments.map((p: any) => {
                const { id, sheetId, method, paymentMethod, ...rest } = p;
                return { ...rest, paymentMethod: method || paymentMethod || "Tiền mặt" };
              })
            }
          },
          create: {
            ...sheetData,
            items: {
              create: validItems.map((i: any) => {
                const { id, sheetId, advanceAmount, ...rest } = i;
                return { ...rest, advanceAmount: typeof advanceAmount === 'number' ? advanceAmount : 0 };
              })
            },
            payments: {
              create: validPayments.map((p: any) => {
                const { id, sheetId, method, paymentMethod, ...rest } = p;
                return { ...rest, paymentMethod: method || paymentMethod || "Tiền mặt" };
              })
            }
          }
        });
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Prisma Error during payroll sync:", error);
    try {
      const fs = await import('fs');
      const backupPath = path.join(__dirname, `emergency_payload_error_${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(req.body, null, 2));
      console.log(`Emergency payload saved to: ${backupPath}`);
    } catch (e) {
      console.error("Could not write emergency payload log", e);
    }
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// APIs cho Mảng bán hàng và tồn kho
app.use('/api/products', catalogRouter);
app.use('/api/orders', orderRouter);
app.use('/api/purchases', purchaseRouter);
app.use('/api/inventory-checks', inventoryCheckRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/salary-advances', salaryAdvanceRouter);
app.use('/api/backup', backupRouter);

import karaboxRouter from './routes/karabox';
app.use('/api/karabox', karaboxRouter);

import cashbookRouter from './routes/cashbook';
app.use('/api/cashbook', cashbookRouter);

app.get('/api/config', async (req, res) => {
  try {
    const configs = await prisma.systemConfig.findMany();
    const configObj = configs.reduce((acc, curr) => {
      try {
        acc[curr.key] = JSON.parse(curr.value);
      } catch {
        acc[curr.key] = curr.value;
      }
      return acc;
    }, {} as Record<string, any>);
    res.json(configObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const configObj = req.body;
    await prisma.$transaction(
      Object.entries(configObj).map(([key, value]) =>
        prisma.systemConfig.upsert({
          where: { key },
          update: { value: typeof value === 'object' ? JSON.stringify(value) : String(value) },
          create: { key, value: typeof value === 'object' ? JSON.stringify(value) : String(value) }
        })
      )
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing config:', error);
    res.status(500).json({ error: 'Failed to sync config' });
  }
});

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server ready at: http://localhost:${PORT}`);
  
  // Khởi tạo bot telegram (chạy polling ngầm)
  try {
    initTelegramBot();
  } catch (error) {
    console.error('Failed to init Telegram Bot:', error);
  }
});
