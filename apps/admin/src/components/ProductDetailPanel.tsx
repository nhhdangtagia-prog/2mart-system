import { useState, useEffect } from "react";
import { Edit2, Printer, MoreHorizontal, Trash2, Copy, Image as ImageIcon } from "lucide-react";
import { Button } from "@2mart/ui";
import { getPurchaseOrders } from "../utils/branchStock";
import { useSession } from "../hooks/useSession";

export function ProductDetailPanel({ product, onEdit }: { product: any, onEdit?: () => void }) {
  const [activeTab, setActiveTab] = useState("info");
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  useEffect(() => {
    if (activeTab === "history") {
      getPurchaseOrders().then(orders => {
        setPurchaseHistory(orders.filter(o => o.items.some((i: any) => i.sku === product.sku)));
      });
    }
  }, [activeTab, product.sku]);

  return (
    <div className="flex flex-col w-full bg-white text-slate-800 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-4 sm:px-6 pt-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <button 
          onClick={() => setActiveTab("info")}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Thông tin
        </button>
        <button 
          onClick={() => setActiveTab("desc")}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors ${activeTab === 'desc' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Mô tả, ghi chú
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Thẻ kho
        </button>
        <button 
          onClick={() => setActiveTab("stock")}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors ${activeTab === 'stock' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Tồn kho
        </button>

      </div>

      <div className="p-6 pb-2">
        {activeTab === 'info' && (
          <div className="flex flex-col gap-6">
            {/* Header Info */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight text-center sm:text-left">{product.name}</h2>
                <div className="mt-2 text-slate-600 flex flex-wrap items-center justify-center sm:justify-start gap-1">Nhóm hàng: <span className="font-medium text-slate-800">{product.category}</span></div>
                <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">Hàng hóa thường</span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">Bán trực tiếp</span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">Tích điểm</span>
                </div>
                <div className="mt-3">
                  <a href="#" className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                    Xem phân tích
                  </a>
                </div>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 sm:gap-y-6 gap-x-4 sm:gap-x-8 pb-4">
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-xs">Mã hàng</span>
                <span className="font-medium">{product.sku}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-xs">Mã vạch</span>
                <span className="font-medium">{product.barcode || product.sku}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-xs">Tồn kho</span>
                <span className="font-medium">{product.stock}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-xs">Giá vốn</span>
                <span className="font-medium">{product.cost?.toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-xs">Giá bán</span>
                <span className="font-medium">{product.price?.toLocaleString()}</span>
              </div>
            </div>
            
            <div>
              <a href="#" className="text-blue-600 hover:underline font-medium text-sm">Thêm thuộc tính</a>
            </div>
          </div>
        )}
        {activeTab === 'history' && (() => {
          const orders = purchaseHistory;
          return (
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-slate-800">Lịch sử nhập hàng</h3>
              {orders.length === 0 ? (
                <div className="py-8 text-center text-slate-500">Chưa có phiếu nhập hàng nào chứa sản phẩm này.</div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[600px]">
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
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200 mt-2">
        <div className="flex gap-4 w-full sm:w-auto justify-center sm:justify-start">
          <button className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 transition-colors font-medium">
            <Trash2 className="w-4 h-4" /> Xóa
          </button>
          <button className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 transition-colors font-medium">
            <Copy className="w-4 h-4" /> Sao chép
          </button>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9 px-4">
            <Edit2 className="w-4 h-4" /> Chỉnh sửa
          </Button>
          <Button variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 gap-2 h-9 px-4">
            <Printer className="w-4 h-4" /> In tem mã
          </Button>
          <Button variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 h-9 w-10 p-0 flex items-center justify-center">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
