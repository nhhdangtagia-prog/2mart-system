import pandas as pd
import json

df = pd.read_excel('C:\\Users\\This PC\\Downloads\\DanhSachNhanVien_KV25072026-062951-212.xlsx', skiprows=0)
df = df.fillna('')
df = df.astype(str)
records = df.to_dict('records')

with open('E:\\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\\PHẦN MỀM BÁN HÀNG 2 MART\\apps\\admin\\src\\data\\employees_raw.json', 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, indent=2)
