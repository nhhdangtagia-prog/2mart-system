import os

file_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\api\index.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_post = """app.post('/api/employees', async (req, res) => {
  try {
    const employee = await prisma.employee.create({
      data: req.body,
    });
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
});"""

new_post = """app.post('/api/employees', async (req, res) => {
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
});"""

if old_post in content:
    content = content.replace(old_post, new_post)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed api.")
else:
    print("Not found.")
