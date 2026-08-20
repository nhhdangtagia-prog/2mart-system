import os

file_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src\pages\EmployeeListPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import hashPassword
if 'hashPassword' not in content:
    content = content.replace(
        'import { Button } from "@2mart/ui";',
        'import { Button } from "@2mart/ui";\nimport { hashPassword } from "../utils/passwordHash";'
    )

# 2. Add reload
old_use_employees = 'const { employees, isLoading, addEmployee, updateEmployee, deleteEmployee, deleteEmployees } = useEmployees();'
new_use_employees = 'const { employees, isLoading, addEmployee, updateEmployee, deleteEmployee, deleteEmployees, reload } = useEmployees();'
content = content.replace(old_use_employees, new_use_employees)

# 3. Add handleFileUpload
upload_logic = """
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) return;
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        
        const validEmployees = [];
        for (let i = 0; i < json.length; i++) {
          const p = json[i];
          const name = p["TÊN NHÂN VIÊN"] || p["Tên nhân viên"] || p["Tên NV"] || p["Tên"] || p["name"];
          if (!name) continue;
          
          const code = String(p["MÃ NV"] || p["Mã NV"] || p["Mã nhân viên"] || p["code"] || `NV${Date.now() + i}`);
          const rawUser = String(name);
          const cleanUser = removeVietnameseTones(rawUser).replace(/\s+/g, '');
          
          const passwordHash = await hashPassword(`${cleanUser}123`);
          
          validEmployees.push({
            code,
            name: rawUser,
            username: cleanUser,
            passwordHash,
            role: String(p["VAI TRÒ / VỊ TRÍ"] || p["Vai trò"] || p["Vị trí"] || "Nhân viên"),
            accessLevel: "staff",
            department: String(p["CHI NHÁNH & BỘ PHẬN"] || p["Chi nhánh"] || p["Bộ phận"] || currentBranch),
            branch: String(p["CHI NHÁNH & BỘ PHẬN"] || p["Chi nhánh"] || currentBranch),
            status: String(p["TRẠNG THÁI"] || p["Trạng thái"] || "Đang làm việc"),
            email: "",
            phone: String(p["LIÊN HỆ"] || p["Liên hệ"] || p["SĐT"] || p["Số điện thoại"] || ""),
            joinDate: new Date().toISOString(),
          });
        }
        
        if (validEmployees.length === 0) {
            alert("Không tìm thấy nhân viên nào hợp lệ trong file!");
            return;
        }

        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validEmployees)
        });
        
        if (res.ok) {
           alert(`Đã import thành công ${validEmployees.length} nhân viên! Mật khẩu mặc định là: (tên không dấu)123`);
           reload(); 
        } else {
           alert("Có lỗi xảy ra khi lưu nhân viên!");
        }
      } catch (err) {
        alert("Lỗi khi đọc file Excel!");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleDeleteSingle = (emp: Employee, e: React.MouseEvent) => {"""

content = content.replace("  const handleDeleteSingle = (emp: Employee, e: React.MouseEvent) => {", upload_logic)

# 4. Replace the Import button
old_button = """            <Button variant="outline" className="gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border-slate-200">
              <Upload className="w-4 h-4" /> Import
            </Button>"""

new_button = """            <label className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border border-slate-200 rounded-md px-4 h-10 font-medium text-sm cursor-pointer transition-colors">
              <Upload className="w-4 h-4" /> Import
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
            </label>"""

content = content.replace(old_button, new_button)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("EmployeeListPage updated.")
