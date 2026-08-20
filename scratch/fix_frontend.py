import os

file_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src\pages\EmployeeListPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'XLSX.utils.sheet_to_json<any>(worksheet);',
    'XLSX.utils.sheet_to_json<any>(worksheet, { range: 1, defval: "" });'
)

if 'const existingUsername = ' not in c:
    c = c.replace(
        'const name = p["TÊN NHÂN VIÊN"]',
        'const existingUsername = p["Tài khoản đăng nhập"] || p["TÀI KHOẢN ĐĂNG NHẬP"] || "";\n          const name = p["TÊN NHÂN VIÊN"]'
    )
    c = c.replace(
        'const cleanUser = removeVietnameseTones(rawUser).replace(/\\s+/g, \'\');',
        'const cleanUser = existingUsername || removeVietnameseTones(rawUser).replace(/\\s+/g, \'\');'
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated frontend import script.")
