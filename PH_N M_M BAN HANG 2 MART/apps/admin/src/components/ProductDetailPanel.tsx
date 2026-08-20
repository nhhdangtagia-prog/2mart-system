import { useState } from "react";
import { Edit2, Printer, MoreHorizontal, Trash2, Copy, Image as ImageIcon } from "lucide-react";
import { Button } from "@2mart/ui";

export function ProductDetailPanel({ product, onEdit }: { product: any, onEdit?: () => void }) {
  const [activeTab, setActiveTab] = useState("info");

  return (
    <div className="flex flex-col w-full bg-white text-slate-800 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-6 pt-2">
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
        <button 
          onClick={() => setActiveTab("channels")}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors ${activeTab === 'channels' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Liên kết kênh bán
        </button>
      </div>

      <div className="p-6 pb-2">
        {activeTab === 'info' && (
          <div className="flex flex-col gap-6">
            {/* Header Info */}
            <div className="flex gap-6">
              <div className="w-32 h-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">{product.name}</h2>
                <div className="mt-2 text-slate-600 flex items-center gap-1">Nhóm hàng: <span className="font-medium text-slate-800">{product.category}</span></div>
                <div className="mt-3 flex gap-2">
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
            <div className="grid grid-cols-3 gap-y-6 gap-x-8 pb-4">
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
                <span className="text-slate-500 text-xs">Định mức tồn</span>
                <span className="font-medium">{product.minStock} - {product.maxStock}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-xs">Giá vốn</span>
                <span className="font-medium">{product.cost?.toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-xs">Giá bán</span>
                <span className="font-medium">{product.price?.toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-xs">Tỷ lệ tính thuế ⓘ</span>
                <span className="font-medium">{product.taxRate}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-xs">Thương hiệu</span>
                <span className="font-medium">{product.brand}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-xs">Vị trí</span>
                <span className="font-medium">{product.location}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-xs">Trọng lượng</span>
                <span className="font-medium">{product.weight}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-xs">Điểm</span>
                <span className="font-medium">{product.points}</span>
              </div>
            </div>
            
            <div>
              <a href="#" className="text-blue-600 hover:underline font-medium text-sm">Thêm thuộc tính</a>
            </div>
          </div>
        )}
        {activeTab !== 'info' && (
          <div className="py-8 text-center text-slate-500">
            Nội dung tab {activeTab} đang được xây dựng...
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between p-4 border-t border-slate-200 mt-2">
        <div className="flex gap-4">
          <button className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 transition-colors font-medium">
            <Trash2 className="w-4 h-4" /> Xóa
          </button>
          <button className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 transition-colors font-medium">
            <Copy className="w-4 h-4" /> Sao chép
          </button>
        </div>
        <div className="flex gap-2">
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
