import json

with open('E:\\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\\PHẦN MỀM BÁN HÀNG 2 MART\\apps\\admin\\src\\data\\suppliers_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

out = []
for row in data:
    out.append({
        'code': row.get('Mã nhà cung cấp', ''),
        'name': row.get('Tên nhà cung cấp', ''),
        'phone': row.get('Điện thoại', ''),
        'debt': row.get('Nợ cần trả hiện tại', '0'),
        'totalBought': row.get('Tổng mua', '0'),
        'status': row.get('Trạng thái', '1')
    })

with open('E:\\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\\PHẦN MỀM BÁN HÀNG 2 MART\\apps\\admin\\src\\data\\suppliers.json', 'w', encoding='utf-8') as fw:
    json.dump(out, fw, ensure_ascii=False, indent=2)
