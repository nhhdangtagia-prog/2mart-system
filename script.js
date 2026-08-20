const fs = require('fs');

const files = [
  'apps/admin/src/pages/InventoryPage.tsx',
  'apps/admin/src/pages/PurchaseImportPage.tsx',
  'apps/admin/src/pages/PayrollPage.tsx',
  'apps/admin/src/pages/CommissionPage.tsx',
  'apps/admin/src/pages/EmployeeSettingsPage.tsx',
  'apps/admin/src/pages/SchedulePage.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.split('isCS2 ? "379b Tôn Đức Thắng" : "285 Nguyễn Lương Bằng"').join('isCS1 ? "379b Tôn Đức Thắng" : "285 Nguyễn Lương Bằng"');
    content = content.split("isCS2 ? '379b Tôn Đức Thắng' : '285 Nguyễn Lương Bằng'").join("isCS1 ? '379b Tôn Đức Thắng' : '285 Nguyễn Lương Bằng'");
    fs.writeFileSync(file, content, 'utf8');
  }
}
