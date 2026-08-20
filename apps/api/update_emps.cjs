
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  const emps = JSON.parse(fs.readFileSync('../admin/src/data/employees.json', 'utf8'));
  
  await prisma.employee.deleteMany({});
  
  for (const e of emps) {
    try {
      await prisma.employee.create({
        data: {
          id: e.id,
          code: e.code,
          name: e.name,
          username: e.username,
          passwordHash: e.passwordHash || e.password,
          role: e.role,
          accessLevel: e.accessLevel || 'staff',
          department: e.department,
          branch: e.branch,
          status: e.status,
          email: e.email,
          phone: e.phone,
          joinDate: e.joinDate
        }
      });
      console.log('Created', e.code);
    } catch (err) {
      console.log('Error creating', e.code, err.message);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
