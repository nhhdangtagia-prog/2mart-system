import os
import re

base_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART'

files_to_fix = [
    r'apps\admin\src\utils\branchStock.ts',
    r'packages\ui\src\Presenters\CatalogPresenter.ts',
    r'packages\ui\src\Presenters\DashboardPresenter.ts',
    r'packages\domain\src\usecases\index.ts',
]

for rel_path in files_to_fix:
    full_path = os.path.join(base_path, rel_path)
    if not os.path.exists(full_path):
        print(f"NOT FOUND: {full_path}")
        continue

    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace http://localhost:4000/api with /api
    new_content = re.sub(r"'http://localhost:4000/api", "'/api", content)
    new_content = re.sub(r'"http://localhost:4000/api', '"/api', new_content)
    new_content = re.sub(r'`http://localhost:4000/api', '`/api', new_content)

    if new_content != content:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed: {rel_path}")
    else:
        print(f"No change: {rel_path}")

print("Done!")
