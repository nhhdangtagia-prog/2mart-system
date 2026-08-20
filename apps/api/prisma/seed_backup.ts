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
                await prisma.order.upsert({
                    where: { id: row.id },
                    update: {},
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
                        createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
                        updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date()
                    }
                });
                created++;
            } catch (e) {}
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
            } catch (e) {}
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
                        status: row.status || 'ACTIVE'
                    }
                });
            } catch (e) {}
        }
        console.log(`Seeded Karabox Sessions`);
    }

    console.log('Finished backup seed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
