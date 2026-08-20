import os

path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src\utils\branchStock.ts'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_save_purchase_order = False

for line in lines:
    if 'export async function savePurchaseOrder' in line:
        in_save_purchase_order = True
    elif line.startswith('}') and in_save_purchase_order:
        in_save_purchase_order = False
    
    if 'return order;' in line and not in_save_purchase_order:
        continue # skip
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Fixed branchStock returns")
