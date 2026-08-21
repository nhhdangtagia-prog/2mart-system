import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseCSV(content: string) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Parse headers correctly, handling quotes if necessary (simple split for now)
    const headers = lines[0].trim().split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].trim();
        if (!row) continue;
        
        let parts = [];
        let inQuote = false;
        let current = '';
        for (let char of row) {
            if (char === '"') inQuote = !inQuote;
            else if (char === ',' && !inQuote) {
                parts.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current);
        
        const obj: any = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = parts[j] ? parts[j].replace(/^"|"$/g, '') : '';
        }
        data.push(obj);
    }
    return data;
}

async function main() {
    console.log('Starting seed from backup CSVs...');
    const backupDir = path.resolve(process.cwd(), 'prisma/backup_data');
    
    // 1. Invoices (Orders)
    const invoicesPath = path.join(backupDir, 'invoices.csv');
    if (fs.existsSync(invoicesPath)) {
        const data = parseCSV(fs.readFileSync(invoicesPath, 'utf8'));
        console.log(`Found ${data.length} invoices`);
        let created = 0;
        for (const row of data) {
            if (!row.id) continue;
            try {
                const createdAtDate = row.createdAt ? new Date(row.createdAt) : new Date();
                const createdAtMsVal = row.createdAtMs ? BigInt(row.createdAtMs) : BigInt(createdAtDate.getTime());

                await prisma.order.upsert({
                    where: { id: row.id },
                    update: {
                        createdAtMs: createdAtMsVal
                    },
                    create: {
                        id: row.id,
                        code: row.code || `DH${Date.now()}`,
                        customerName: row.customerName || 'Khách lẻ',
                        employeeName: row.employeeName || 'Nhân viên',
                        employeeCode: row.employeeCode || 'NV',
                        totalAmount: parseFloat(row.totalAmount) || 0,
                        paymentMethod: row.paymentMethod || 'CASH',
                        cashAmount: parseFloat(row.cashAmount) || 0,
                        transferAmount: parseFloat(row.transferAmount) || 0,
                        cardAmount: parseFloat(row.cardAmount) || 0,
                        branch: row.branch || '379b Tôn Đức Thắng',
                        status: row.status || 'COMPLETED',
                        itemsCount: parseInt(row.itemsCount) || 1,
                        createdAt: createdAtDate,
                        createdAtMs: createdAtMsVal,
                        updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date()
                    }
                });
                created++;
            } catch (e) {
                console.error(`Error saving order ${row.id}:`, e);
            }
        }
        console.log(`Seeded ${created} invoices.`);
    }

    // 2. Karabox Rooms
    const roomsPath = path.join(backupDir, 'karabox_rooms.csv');
    if (fs.existsSync(roomsPath)) {
        const data = parseCSV(fs.readFileSync(roomsPath, 'utf8'));
        for (const row of data) {
            if (!row.id) continue;
            try {
                await prisma.karaboxRoom.upsert({
                    where: { id: row.id },
                    update: {},
                    create: {
                        id: row.id,
                        name: row.name,
                        status: row.status || 'AVAILABLE'
                    }
                });
            } catch (e) {
                console.error(`Error saving room ${row.id}:`, e);
            }
        }
        console.log(`Seeded Karabox Rooms`);
    }

    // 3. Karabox Sessions
    const sessionsPath = path.join(backupDir, 'karabox_sessions.csv');
    if (fs.existsSync(sessionsPath)) {
        const data = parseCSV(fs.readFileSync(sessionsPath, 'utf8'));
        for (const row of data) {
            if (!row.id) continue;
            try {
                await prisma.karaboxSession.upsert({
                    where: { id: row.id },
                    update: {},
                    create: {
                        id: row.id,
                        roomId: row.roomId,
                        startTime: new Date(row.startTime),
                        endTime: row.endTime ? new Date(row.endTime) : null,
                        durationMinutes: parseInt(row.durationMinutes) || 0,
                        totalAmount: parseFloat(row.totalAmount) || 0,
                        paymentMethod: row.paymentMethod || null,
                        status: row.status || 'ACTIVE',
                        pricePerHour: 69000 // FIX MISSING REQUIRED ARGUMENT
                    }
                });
            } catch (e) {
                console.error(`Error saving session ${row.id}:`, e);
            }
        }
        console.log(`Seeded Karabox Sessions`);
    }

        // 4. Payrolls
    const payrollsPath = path.join(backupDir, 'payrolls.csv');
    if (fs.existsSync(payrollsPath)) {
        const data = parseCSV(fs.readFileSync(payrollsPath, 'utf8'));
        for (const row of data) {
            if (!row.id) continue;
            try {
                let itemsParsed = [];
                if (row.items && row.items.startsWith('[')) {
                    try { itemsParsed = JSON.parse(row.items.replace(/""/g, '"')); } catch(e){}
                }
                await prisma.payrollSheet.upsert({
                    where: { id: row.id },
                    update: {},
                    create: {
                        id: row.id,
                        code: row.code,
                        name: row.name,
                        periodType: row.periodType,
                        periodRange: row.periodRange,
                        branch: row.branch,
                        creator: row.creator,
                        approver: row.approver || null,
                        status: row.status,
                        totalEmployees: parseInt(row.totalEmployees) || 0,
                        totalSalary: parseFloat(row.totalSalary) || 0,
                        totalPaid: parseFloat(row.totalPaid) || 0,
                        totalRemaining: parseFloat(row.totalRemaining) || 0,
                        note: row.note || null,
                        formulaVersion: parseInt(row.formulaVersion) || null,
                        createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
                        updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date()
                    }
                });
            } catch (e) {
                console.error(`Error saving payroll ${row.id}:`, e);
            }
        }
        console.log(`Seeded Payrolls`);
    }

    // 5. Purchases
    const purchasesPath = path.join(backupDir, 'purchases.csv');
    if (fs.existsSync(purchasesPath)) {
        const data = parseCSV(fs.readFileSync(purchasesPath, 'utf8'));
        for (const row of data) {
            if (!row.id) continue;
            try {
                await prisma.purchaseOrder.upsert({
                    where: { id: row.id },
                    update: {},
                    create: {
                        id: row.id,
                        code: row.code,
                        timestamp: row.timestamp || new Date().toISOString(),
                        importDate: row.importDate || new Date().toISOString(),
                        branch: row.branch,
                        supplierName: row.supplierName,
                        supplierCode: row.supplierCode,
                        totalQuantity: parseInt(row.totalQuantity) || 0,
                        grossAmount: parseFloat(row.grossAmount) || 0,
                        itemsDiscountTotal: parseFloat(row.itemsDiscountTotal) || 0,
                        totalAmount: parseFloat(row.totalAmount) || 0,
                        discount: parseFloat(row.discount) || 0,
                        discountValue: parseFloat(row.discountValue) || 0,
                        discountType: row.discountType || null,
                        vatAmount: parseFloat(row.vatAmount) || 0,
                        paidAmount: parseFloat(row.paidAmount) || 0,
                        netPayable: parseFloat(row.netPayable) || 0,
                        status: row.status || 'COMPLETED',
                        note: row.note || null,
                        expectedDate: row.expectedDate || null,
                        creator: row.creator || 'Auto'

                    }
                });
            } catch (e) {
                console.error(`Error saving purchase ${row.id}:`, e);
            }
        }
        console.log(`Seeded Purchases`);
    }

    // 6. Timesheets
    const timesheetsPath = path.join(backupDir, 'timesheets.csv');
    if (fs.existsSync(timesheetsPath)) {
        const data = parseCSV(fs.readFileSync(timesheetsPath, 'utf8'));
        for (const row of data) {
            if (!row.id) continue;
            try {
                await prisma.attendanceRecord.upsert({
                    where: { id: row.id },
                    update: {},
                    create: {
                        id: row.id,
                        shiftId: row.shiftId,
                        date: parseInt(row.date) || 1,
                        dateKey: row.dateKey,
                        employeeCode: row.employeeCode,
                        employeeName: row.employeeName,
                        branch: row.branch,
                        status: row.status,
                        checkIn: row.checkIn || null,
                        checkOut: row.checkOut || null,
                        lateMinutes: parseInt(row.lateMinutes) || 0,
                        earlyMinutes: parseInt(row.earlyMinutes) || 0,
                        otMinutes: parseInt(row.otMinutes) || 0,
                        leaveType: row.leaveType || null,
                        note: row.note || null,
                        isApproved: row.isApproved === 'true' || row.isApproved === '1' || row.isApproved === 'TRUE',
                        createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
                        updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date()
                    }
                });
            } catch (e) {
                console.error(`Error saving timesheet ${row.id}:`, e);
            }
        }
        console.log(`Seeded Timesheets`);
    }

    console.log('Finished backup seed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());


