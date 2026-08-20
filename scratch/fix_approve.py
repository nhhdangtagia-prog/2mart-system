import os
import re

base_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART'

pip_path = os.path.join(base_path, 'apps', 'admin', 'src', 'pages', 'PurchaseImportPage.tsx')
with open(pip_path, 'r', encoding='utf-8') as f:
    pip = f.read()

# Fix approvePurchaseOrder
pip = re.sub(r'approvePurchaseOrder\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)', r'approvePurchaseOrder(\1, \2)', pip)

# Check if there is another approvePurchaseOrder with 3 arguments?
pip = re.sub(r'approvePurchaseOrder\(([^,]+),\s*([^,]+),\s*([^)]+)\)', r'approvePurchaseOrder(\1, \2)', pip)

with open(pip_path, 'w', encoding='utf-8') as f:
    f.write(pip)
