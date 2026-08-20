
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const mapping = {
  "NV174": { code: "NV000021", name: "Khánh Hoàng" },
  "NV376": { code: "NV000047", name: "Mỹ Hà" },
  "NV115": { code: "NV000049", name: "Trọng Khánh" },
  "NV375": { code: "NV000037", name: "Lan Nhi" },
  "NV1605": { code: "NV000038", name: "Tuyết Vân" },
  "NV514": { code: "NV000023", name: "Nguyễn Hữu Quốc Anh" },
  "NV1669": { code: "NV000029", name: "Thanh Ngân" },
  "NV2256": { code: "NV000046", name: "Trung Thành" },
  "NV180": { code: "NV000036", name: "Lệ Quyên" },
  "NV192": { code: "NV000041", name: "Minh Trúc" },
  "NV322": { code: "NV000051", name: "Nguyễn Uyên" },
  "NV006": { code: "NV000039", name: "Diễm Quỳnh" }
};

async function main() {
  for (const [oldCode, newEmp] of Object.entries(mapping)) {
    const updatedSchedules = await prisma.scheduleAssignment.updateMany({
      where: { employeeCode: oldCode },
      data: { employeeCode: newEmp.code, employeeName: newEmp.name }
    });
    console.log("Updated schedules from " + oldCode + " to " + newEmp.code + ": " + updatedSchedules.count);

    const updatedTimesheets = await prisma.attendanceRecord.updateMany({
      where: { employeeCode: oldCode },
      data: { employeeCode: newEmp.code, employeeName: newEmp.name }
    });
    console.log("Updated timesheets from " + oldCode + " to " + newEmp.code + ": " + updatedTimesheets.count);
  }

  const allEmployees = [
    { code: "NV000021", name: "Khánh Hoàng" },
    { code: "NV000047", name: "Mỹ Hà" },
    { code: "NV000049", name: "Trọng Khánh" },
    { code: "NV000037", name: "Lan Nhi" },
    { code: "NV000038", name: "Tuyết Vân" },
    { code: "NV000023", name: "Nguyễn Hữu Quốc Anh" },
    { code: "NV000029", name: "Thanh Ngân" },
    { code: "NV000046", name: "Trung Thành" },
    { code: "NV000036", name: "Lệ Quyên" },
    { code: "NV000041", name: "Minh Trúc" },
    { code: "NV000051", name: "Nguyễn Uyên" },
    { code: "NV000039", name: "Diễm Quỳnh" }
  ];

  for (const emp of allEmployees) {
    await prisma.scheduleAssignment.updateMany({
      where: { employeeCode: emp.code },
      data: { employeeName: emp.name }
    });
    await prisma.attendanceRecord.updateMany({
      where: { employeeCode: emp.code },
      data: { employeeName: emp.name }
    });
  }
  
  console.log("All employee names synced with codes.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
