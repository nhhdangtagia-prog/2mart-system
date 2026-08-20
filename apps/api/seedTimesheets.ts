import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  const empCodes = ["NV379", "NV100", "NV102", "NV275", "NV685", "NV922"]; // Mỹ Hà, Lệ Quyên, vv.
  const records = [];
  
  for (const empCode of empCodes) {
    for (let i = 1; i <= 25; i++) {
      const dateStr = String(i).padStart(2, '0');
      const dateKey = `202607${dateStr}`;
      
      records.push({
        id: `ca-sang-3-${dateKey}-${empCode}`,
        shiftId: 'ca-sang-3',
        date: i,
        dateKey: dateKey,
        employeeCode: empCode,
        employeeName: "Mock Name",
        branch: "379b Tôn Đức Thắng",
        status: "dung_gio",
        checkIn: "07:00",
        checkOut: "12:00",
        lateMinutes: 0,
        earlyMinutes: 0,
        otMinutes: 0,
        leaveType: "none",
        isApproved: true,
        auditLogs: []
      });
      
      if (i % 3 === 0) {
        records.push({
          id: `ca-dem-3-${dateKey}-${empCode}`,
          shiftId: 'ca-dem-3',
          date: i,
          dateKey: dateKey,
          employeeCode: empCode,
          employeeName: "Mock Name",
          branch: "379b Tôn Đức Thắng",
          status: "dung_gio",
          checkIn: "22:00",
          checkOut: "06:00",
          lateMinutes: 0,
          earlyMinutes: 0,
          otMinutes: 0,
          leaveType: "none",
          isApproved: true,
          auditLogs: []
        });
      }
    }
  }

  // Also seed for 285 Nguyen Luong Bang just in case
  const empCodes285 = ["NV001", "NV002", "NV003", "NV004"];
  for (const empCode of empCodes285) {
    for (let i = 1; i <= 25; i++) {
      const dateStr = String(i).padStart(2, '0');
      const dateKey = `202607${dateStr}`;
      
      records.push({
        id: `ca-sang-3-${dateKey}-${empCode}`,
        shiftId: 'ca-sang-3',
        date: i,
        dateKey: dateKey,
        employeeCode: empCode,
        employeeName: "Mock Name",
        branch: "285 Nguyễn Lương Bằng",
        status: "dung_gio",
        checkIn: "07:00",
        checkOut: "12:00",
        lateMinutes: 0,
        earlyMinutes: 0,
        otMinutes: 0,
        leaveType: "none",
        isApproved: true,
        auditLogs: []
      });
    }
  }

  await prisma.attendanceRecord.createMany({
    data: records,
    skipDuplicates: true
  });
  console.log("Mock timesheets seeded!");
}

seed().catch(console.error).finally(() => prisma.$disconnect());
