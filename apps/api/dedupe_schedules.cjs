
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Dedupe ScheduleAssignments
  const assignments = await prisma.scheduleAssignment.findMany();
  const seenAssigns = new Set();
  const dupAssignIds = [];

  for (const a of assignments) {
    const key = `${a.shiftId}_${a.dateKey}_${a.employeeCode}`;
    if (seenAssigns.has(key)) {
      dupAssignIds.push(a.id);
    } else {
      seenAssigns.add(key);
    }
  }

  if (dupAssignIds.length > 0) {
    const deleted = await prisma.scheduleAssignment.deleteMany({
      where: { id: { in: dupAssignIds } }
    });
    console.log("Deleted duplicate ScheduleAssignments:", deleted.count);
  } else {
    console.log("No duplicate ScheduleAssignments found.");
  }

  // Dedupe AttendanceRecords
  const records = await prisma.attendanceRecord.findMany();
  const seenRecords = new Set();
  const dupRecordIds = [];

  for (const r of records) {
    const key = `${r.shiftId}_${r.dateKey}_${r.employeeCode}`;
    if (seenRecords.has(key)) {
      dupRecordIds.push(r.id);
    } else {
      seenRecords.add(key);
    }
  }

  if (dupRecordIds.length > 0) {
    const deletedRecords = await prisma.attendanceRecord.deleteMany({
      where: { id: { in: dupRecordIds } }
    });
    console.log("Deleted duplicate AttendanceRecords:", deletedRecords.count);
  } else {
    console.log("No duplicate AttendanceRecords found.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
