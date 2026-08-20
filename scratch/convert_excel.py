import pandas as pd
import json
import math

df = pd.read_excel(r'C:\Users\This PC\Downloads\Products_KV30072026-065426-751.xlsx')

products = []
for idx, row in df.iterrows():
    sku = str(row.get('Mã hàng', ''))
    if not sku or sku.lower() == 'nan':
        continue
        
    name = str(row.get('Tên hàng', ''))
    
    brand = str(row.get('Thương hiệu', ''))
    if brand.lower() == 'nan':
        brand = ''
        
    category = str(row.get('Nhóm hàng(3 Cấp)', ''))
    if category.lower() == 'nan':
        category = 'Khác'
        
    try:
        price = float(row.get('Giá bán', 0))
    except:
        price = 0
        
    try:
        stock = float(row.get('Tồn kho', 0))
    except:
        stock = 0
        
    image_url = str(row.get('Hình ảnh (url1,url2...)', ''))
    if image_url.lower() == 'nan' or not image_url:
        image_url = None
    else:
        image_url = image_url.split(',')[0].strip()
        
    try:
        cost = float(row.get('Giá vốn', 0))
    except:
        cost = 0

    products.append({
        'sku': sku,
        'name': name,
        'brand': brand,
        'category': category,
        'price': price,
        'stock': stock,
        'imageUrl': image_url,
        'cost': cost
    })

out_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src\data\products.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"Successfully wrote {len(products)} products to products.json")
