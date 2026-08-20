const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.attendanceRecord.count().then(count => {
  console.log("Total AttendanceRecords:", count);
  prisma.$disconnect();
}).catch(e => console.error(e));
