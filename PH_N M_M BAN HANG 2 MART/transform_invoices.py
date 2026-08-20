import pandas as pd
import json

file_path = 'C:\\Users\\This PC\\Downloads\\DanhSachChiTietHoaDon_KV25072026-070157-980.xlsx'
df = pd.read_excel(file_path)

# Drop completely empty columns
df = df.dropna(how='all', axis=1)

# 1. Dashboard Metrics
unique_invoices = df.drop_duplicates(subset=['Mã hóa đơn'])
total_revenue = pd.to_numeric(unique_invoices['Khách cần trả'], errors='coerce').sum()
total_orders = len(unique_invoices)

# 2. Top 10 products by revenue
df['Thành tiền'] = pd.to_numeric(df['Thành tiền'], errors='coerce')
top_products = df.groupby('Tên hàng')['Thành tiền'].sum().reset_index()
top_products = top_products.sort_values(by='Thành tiền', ascending=False).head(10)
top_products_list = []
max_val = top_products['Thành tiền'].max() if len(top_products) > 0 else 1
for _, row in top_products.iterrows():
    val = row['Thành tiền']
    top_products_list.append({
        "name": str(row['Tên hàng']),
        "value": f"{val:,.0f} đ",
        "percent": int((val / max_val) * 100) if max_val > 0 else 0
    })

dashboard_data = {
    "totalRevenue": f"{total_revenue:,.0f}",
    "totalOrders": str(total_orders),
    "topProducts": top_products_list
}

with open('apps/admin/src/data/dashboard_data.json', 'w', encoding='utf-8') as f:
    json.dump(dashboard_data, f, ensure_ascii=False, indent=2)

# 3. Extract unique products for products.json
products_df = df[['Mã hàng', 'Tên hàng', 'Đơn giá', 'ĐVT', 'Thương hiệu']].drop_duplicates(subset=['Mã hàng'])
products_list = []
for _, row in products_df.iterrows():
    if pd.isna(row['Mã hàng']): continue
    price = pd.to_numeric(row['Đơn giá'], errors='coerce')
    price_val = float(price) if not pd.isna(price) else 0
    products_list.append({
        "sku": str(row['Mã hàng']),
        "name": str(row['Tên hàng']),
        "price": price_val,
        "cost": price_val * 0.7, # Add missing cost
        "unit": str(row['ĐVT']) if not pd.isna(row['ĐVT']) else "Cái",
        "stock": 100, 
        "category": "Khác",
        "brand": str(row['Thương hiệu']) if not pd.isna(row['Thương hiệu']) else "",
        "status": "Đang bán" # Add missing status
    })

with open('apps/admin/src/data/products.json', 'w', encoding='utf-8') as f:
    json.dump(products_list, f, ensure_ascii=False, indent=2)

# 4. Extract unique employees for employees.json
employees_df = df[['Người bán']].drop_duplicates()
employees_list = []
for idx, row in employees_df.iterrows():
    if pd.isna(row['Người bán']): continue
    name = str(row['Người bán'])
    emp_id = f"NV{str(idx+1).zfill(3)}"
    employees_list.append({
        "id": emp_id,
        "code": emp_id, # Add missing code
        "name": name,
        "username": name.lower().replace(' ', ''), # Add missing username
        "role": "Nhân viên bán hàng",
        "department": "Chi nhánh 1",
        "branch": "285 Nguyễn Lương Bằng", # Add missing branch
        "status": "Đang làm việc",
        "email": f"{name.lower().replace(' ', '')}@2mart.vn",
        "phone": "09" + "".join([str((idx*i)%10) for i in range(8)]),
        "joinDate": "2025-01-01"
    })

with open('apps/admin/src/data/employees.json', 'w', encoding='utf-8') as f:
    json.dump(employees_list, f, ensure_ascii=False, indent=2)

print("Successfully regenerated data files with missing fields.")
