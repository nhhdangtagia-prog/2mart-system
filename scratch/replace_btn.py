import re

file_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src\pages\EmployeeListPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace <Button ...> <Upload ... /> Import </Button>
new_btn = '<label className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border border-slate-200 rounded-md px-4 h-10 font-medium text-sm cursor-pointer transition-colors"><Upload className="w-4 h-4" /> Import<input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} /></label>'

content = re.sub(r'<Button[^>]*>\s*<Upload[^>]*/>\s*Import\s*</Button>', new_btn, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced!")
