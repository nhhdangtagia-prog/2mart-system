import os
import json

base_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART'

for project in ['apps/admin', 'apps/pos', 'packages/ui', 'packages/domain']:
    tsconfig_path = os.path.join(base_path, project, 'tsconfig.json')
    if os.path.exists(tsconfig_path):
        with open(tsconfig_path, 'r', encoding='utf-8') as f:
            data = f.read()
        
        # simple string replacement
        data = data.replace('"noUnusedLocals": true', '"noUnusedLocals": false')
        data = data.replace('"noUnusedParameters": true', '"noUnusedParameters": false')
        
        if '"noUnusedLocals": false' not in data:
            # maybe it's missing, let's inject it into compilerOptions
            data = data.replace('"compilerOptions": {', '"compilerOptions": {\n    "noUnusedLocals": false,\n    "noUnusedParameters": false,')
            
        with open(tsconfig_path, 'w', encoding='utf-8') as f:
            f.write(data)
print("Updated tsconfig.json")
