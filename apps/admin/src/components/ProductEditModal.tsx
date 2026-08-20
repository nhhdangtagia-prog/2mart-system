import { useState, useEffect } from "react";
import { X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@2mart/ui";
import { useSession } from "../hooks/useSession";

export interface ProductEditSaveInput {
  sku: string;
  stock: number;
  name: string;
  categoryName: string;
  brandName: string;
  unit?: string;
  retailPrice: number;
  costPrice: number;
  imageUrl: string | null;
}

export function ProductEditModal({ product, categories = [], isOpen, onClose, onSave }: {
  product: any;
    categories?: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (currentSku: string, updates: ProductEditSaveInput) => Promise<{ ok: true } | { ok: false; error: string }> | void;
}) {
  const { session } = useSession();
  const isAdmin = session?.accessLevel === "admin";

  const [sku, setSku] = useState(product.sku || "");
  const [stock, setStock] = useState(String(product.stock ?? 0));
  const [name, setName] = useState(product.name || "");
  const [unit, setUnit] = useState(product.unit || "");
  const [categoryName, setCategoryName] = useState(product.category || product.categoryName || "");
  const [brandName, setBrandName] = useState(product.brandName || "");
  const [price, setPrice] = useState(String(product.price ?? 0));
  const [cost, setCost] = useState(String(product.cost ?? 0));
  const [imageUrl, setImageUrl] = useState(product.imageUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Nạp lại form mỗi khi mở modal cho 1 sản phẩm khác
  useEffect(() => {
    setSku(product.sku || "");
    setStock(String(product.stock ?? 0));
    setName(product.name || "");
    setCategoryName(product.category || product.categoryName || "");
    setBrandName(product.brandName || "");
    setPrice(String(product.price ?? 0));
    setCost(String(product.cost ?? 0));
    setImageUrl(product.imageUrl || "");
    setError("");
  }, [product]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError("");
    if (!name.trim()) {
      alert("Vui lòng nhập tên hàng hóa!");
      return;
    }
    if (!sku.trim()) {
      alert("Mã hàng không được để trống!");
      return;
    }
    setIsSaving(true);
    const result = await onSave(product.sku, {
      sku: (!product.sku || isAdmin) ? sku.trim() : product.sku,
      stock: isAdmin ? Math.max(0, Number(stock) || 0) : product.stock,
      name: name.trim(),
      unit: unit.trim(),
      categoryName: categoryName.trim() || "Khác",
      brandName: brandName.trim(),
      retailPrice: Number(price) || 0,
      costPrice: Number(cost) || 0,
      imageUrl: imageUrl.trim() || null
    });
    setIsSaving(false);
    if (result && result.ok === false) {
      setError(result.error);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">{!product.sku ? "Thêm hàng hóa mới" : "Sửa hàng hóa"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="flex gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Mã hàng <span className="text-red-500">*</span> 
                  </label>
                  <input
                    type="text"
                    value={sku}
                    
                    onChange={(e) => setSku(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm font-medium ${(!product.sku || isAdmin) ? "border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" : "border-slate-200 bg-slate-100 text-slate-500"}`}
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Tồn kho {!product.sku ? <span className="text-slate-400 font-normal">(Mặc định là 0 khi thêm mới)</span> : (!isAdmin && <span className="text-slate-400 font-normal">(chỉ Admin được sửa)</span>)}
                  </label>
                  <input
                    type={isAdmin ? "number" : "text"}
                    value={stock}
                    disabled={!product.sku || !isAdmin}
                    onChange={(e) => setStock(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm text-right ${isAdmin ? "border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" : "border-slate-200 bg-slate-100 text-slate-500"}`}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Tên hàng <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Nhóm hàng</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    list="category-list"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <datalist id="category-list">
                    {categories.map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                  </datalist>
                </div>
                
              <div className="flex gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Đơn vị tính</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="VD: Cái, Hộp, Chiếc..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
<div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Thương hiệu</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Image Preview */}
            <div className="w-32 flex flex-col gap-2 shrink-0">
              <div className="w-32 h-32 border border-slate-300 rounded-md flex items-center justify-center bg-white overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="URL ảnh"
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">Giá vốn, giá bán</h3>
            </div>
            <div className="px-4 py-4 border-t border-slate-100 flex gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Giá vốn</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-right"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Giá bán</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-right"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center gap-3 p-4 border-t border-slate-200 bg-white shrink-0">
          <Button variant="outline" onClick={onClose} className="px-6 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-medium">Bỏ qua</Button>
          <Button onClick={handleSave} disabled={isSaving} className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
            {isSaving ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>

      </div>
    </div>
  );
}
