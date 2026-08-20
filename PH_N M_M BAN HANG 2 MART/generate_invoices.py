import pandas as pd
import json

file_path = 'C:\\Users\\This PC\\Downloads\\DanhSachChiTietHoaDon_KV25072026-070157-980.xlsx'
df = pd.read_excel(file_path)

# Drop empty columns
df = df.dropna(how='all', axis=1)

invoices_dict = {}

for _, row in df.iterrows():
    inv_id = str(row['Mã hóa đơn'])
    if pd.isna(row['Mã hóa đơn']): continue
    
    if inv_id not in invoices_dict:
        invoices_dict[inv_id] = {
            "id": inv_id,
            "date": str(row['Thời gian']) if not pd.isna(row['Thời gian']) else "",
            "customer": str(row['Tên khách hàng']) if not pd.isna(row['Tên khách hàng']) else "Khách lẻ",
            "total": float(pd.to_numeric(row['Tổng tiền hàng'], errors='coerce')) if not pd.isna(row['Tổng tiền hàng']) else 0,
            "discount": float(pd.to_numeric(row['Giảm giá hóa đơn'], errors='coerce')) if not pd.isna(row['Giảm giá hóa đơn']) else 0,
            "finalAmount": float(pd.to_numeric(row['Khách cần trả'], errors='coerce')) if not pd.isna(row['Khách cần trả']) else 0,
            "paid": float(pd.to_numeric(row['Khách đã trả'], errors='coerce')) if not pd.isna(row['Khách đã trả']) else 0,
            "cash": float(pd.to_numeric(row['Tiền mặt'], errors='coerce')) if not pd.isna(row['Tiền mặt']) else 0,
            "card": float(pd.to_numeric(row['Thẻ'], errors='coerce')) if not pd.isna(row['Thẻ']) else 0,
            "transfer": float(pd.to_numeric(row['Chuyển khoản'], errors='coerce')) if not pd.isna(row['Chuyển khoản']) else 0,
            "employee": str(row['Người bán']) if not pd.isna(row['Người bán']) else "",
            "status": str(row['Trạng thái']) if not pd.isna(row['Trạng thái']) else "Hoàn thành",
            "items": []
        }
    
    item = {
        "sku": str(row['Mã hàng']) if not pd.isna(row['Mã hàng']) else "",
        "name": str(row['Tên hàng']) if not pd.isna(row['Tên hàng']) else "",
        "quantity": float(pd.to_numeric(row['Số lượng'], errors='coerce')) if not pd.isna(row['Số lượng']) else 0,
        "price": float(pd.to_numeric(row['Đơn giá'], errors='coerce')) if not pd.isna(row['Đơn giá']) else 0,
        "total": float(pd.to_numeric(row['Thành tiền'], errors='coerce')) if not pd.isna(row['Thành tiền']) else 0
    }
    invoices_dict[inv_id]["items"].append(item)

invoices_list = list(invoices_dict.values())
# Sort by date descending
invoices_list.sort(key=lambda x: x['date'], reverse=True)

with open('apps/admin/src/data/invoices.json', 'w', encoding='utf-8') as f:
    json.dump(invoices_list, f, ensure_ascii=False, indent=2)

print("Generated invoices.json with", len(invoices_list), "records.")
