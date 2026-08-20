const fs = require('fs');
let code = fs.readFileSync('src/pages/PayrollPage.tsx', 'utf8');

const injection = `  // Tự động cập nhật lại các bảng lương cũ theo công thức mới khi load trang
  useEffect(() => {
    if (sheets.length === 0) return;
    let migrated = false;
    const migratedSheets = sheets.map(sheet => {
      if (!sheet.items) return sheet;
      
      // Tính lại lương thực nhận cho từng nhân viên
      const migratedItems = sheet.items.map(item => ({
        ...item,
        netSalary: Math.max(0, (item.totalIncome || 0) - (item.deductions || 0) - (item.advanceAmount || 0))
      }));
      
      const totalIncome = migratedItems.reduce((sum, i) => sum + (i.totalIncome || 0), 0);
      const deductions = migratedItems.reduce((sum, i) => sum + (i.deductions || 0), 0);
      const advances = migratedItems.reduce((sum, i) => sum + (i.advanceAmount || 0), 0);
      const paidAmounts = migratedItems.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
      const netSalary = migratedItems.reduce((sum, i) => sum + (i.netSalary || 0), 0);
      
      const correctTotalSalary = Math.max(0, totalIncome - deductions);
      const correctTotalPaid = advances + paidAmounts;
      const correctTotalRemaining = Math.max(0, netSalary - paidAmounts);
      
      if (sheet.totalSalary !== correctTotalSalary || 
          sheet.totalPaid !== correctTotalPaid || 
          sheet.totalRemaining !== correctTotalRemaining) {
        migrated = true;
        return {
          ...sheet,
          items: migratedItems,
          totalSalary: correctTotalSalary,
          totalPaid: correctTotalPaid,
          totalRemaining: correctTotalRemaining
        };
      }
      return sheet;
    });

    if (migrated) {
      savePayrollSheets(migratedSheets);
      setSheets(migratedSheets);
      console.log("Migrated sheets to new logic");
    }
  }, []); // Run once on mount (sheets is deliberately omitted so it only migrates once)`;

const target = '  const [statusFilters, setStatusFilters] = useState<string[]>(["Đang tạo", "Tạm tính", "Đã chốt lương"]);';

if (code.includes(target) && !code.includes('Tự động cập nhật lại các bảng lương cũ')) {
  code = code.replace(target, target + '\n\n' + injection);
  fs.writeFileSync('src/pages/PayrollPage.tsx', code);
  console.log('Injected successfully');
} else {
  console.log('Failed to inject');
}
