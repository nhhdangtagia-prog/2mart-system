import os

file_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src\components\ProductDetailPanel.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if 'getPurchaseOrders' not in content:
    content = content.replace(
        'import { Button } from "@2mart/ui";',
        'import { Button } from "@2mart/ui";\nimport { getPurchaseOrders } from "../utils/branchStock";'
    )

# 2. Remove "Liên kết kênh bán" tab button
tab_code = """        <button 
          onClick={() => setActiveTab("channels")}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors ${activeTab === 'channels' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Liên kết kênh bán
        </button>"""
content = content.replace(tab_code, "")

# 3. Add History tab logic (Thẻ kho)
# Right before {activeTab !== 'info' && (
# We will replace that whole fallback

fallback_code = """        {activeTab !== 'info' && (
          <div className="py-8 text-center text-slate-500">
            Nội dung tab {activeTab} đang được xây dựng...
          </div>
        )}"""

new_history_code = """        {activeTab === 'history' && (() => {
          const orders = getPurchaseOrders().filter(o => o.items.some((i: any) => i.sku === product.sku));
          return (
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-slate-800">Lịch sử nhập hàng</h3>
              {orders.length === 0 ? (
                <div className="py-8 text-center text-slate-500">Chưa có phiếu nhập hàng nào chứa sản phẩm này.</div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2">Mã phiếu</th>
                        <th className="px-4 py-2">Thời gian</th>
                        <th className="px-4 py-2">Chi nhánh</th>
                        <th className="px-4 py-2 text-right">SL nhập</th>
                        <th className="px-4 py-2 text-right">Đơn giá</th>
                        <th className="px-4 py-2">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map(o => {
                        const item = o.items.find((i: any) => i.sku === product.sku);
                        return (
                          <tr key={o.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-medium text-blue-600">{o.code}</td>
                            <td className="px-4 py-2 text-slate-500">{o.timestamp}</td>
                            <td className="px-4 py-2">{o.branch}</td>
                            <td className="px-4 py-2 text-right font-bold text-slate-700">{item?.quantity}</td>
                            <td className="px-4 py-2 text-right">{item?.price?.toLocaleString()}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${o.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {o.status === 'completed' ? 'Đã nhập kho' : 'Lưu tạm'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}
        {activeTab !== 'info' && activeTab !== 'history' && (
          <div className="py-8 text-center text-slate-500">
            Nội dung tab {activeTab} đang được xây dựng...
          </div>
        )}"""

content = content.replace(fallback_code, new_history_code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("ProductDetailPanel updated.")
