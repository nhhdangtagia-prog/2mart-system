import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function removeMock() {
  const result = await prisma.attendanceRecord.deleteMany({
    where: {
      employeeName: "Mock Name",
    },
  });
  console.log("Deleted mock records:", result.count);
}

removeMock()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
