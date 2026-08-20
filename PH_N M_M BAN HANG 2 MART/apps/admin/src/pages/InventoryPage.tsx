import { useState, Fragment, useEffect } from "react";
import { Search, Plus, Download, Upload, Filter, ChevronDown, ChevronUp, Building2, RefreshCw, ArrowRight, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, useCatalogPresenter } from "@2mart/ui";
import { ProductDetailPanel } from "../components/ProductDetailPanel";
import { ProductEditModal } from "../components/ProductEditModal";
import { useCurrentBranch } from "../hooks/useCurrentBranch";
import { useSession } from "../hooks/useSession";
import { getProductStockAtBranch, setProductStockAtBranch, renameProductSkuInBranchStock, transferStockBetweenBranches, getTransferOrders, type TransferOrder } from "../utils/branchStock";
import { getStockAlerts, approveStockAlert, type StockAlert } from "../utils/stockAlerts";
import { AlertTriangle } from "lucide-react";

export function InventoryPage() {
  const { currentBranch, isCS2 } = useCurrentBranch();
  const { session } = useSession();
  const isStaff = session?.accessLevel === "staff";
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const itemsPerPage = 20;

  // Tab & Modal state for Transfers
  const [activeTab, setActiveTab] = useState<"stock" | "transfers">("stock");
  const [transferOrders, setTransferOrders] = useState<TransferOrder[]>(getTransferOrders());
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromBranch, setTransferFromBranch] = useState(currentBranch);
  const [transferTo, setTransferTo] = useState(isCS2 ? "285 Nguyễn Lương Bằng" : "379b Tôn Đức Thắng");
  const [transferCart, setTransferCart] = useState<{ sku: string; name: string; quantity: number }[]>([]);
  const [transferNote, setTransferNote] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Sync transferFromBranch when currentBranch changes
  useEffect(() => {
    setTransferFromBranch(currentBranch);
    setTransferTo(currentBranch.includes("285") ? "379b Tôn Đức Thắng" : "285 Nguyễn Lương Bằng");
  }, [currentBranch]);

  const { items: catalogProducts, updateProduct } = useCatalogPresenter(searchTerm);

  // Cảnh báo bán vượt tồn kho — báo cho Admin biết để đi KIỂM KÊ THỰC TẾ và đặt lại đúng số tồn.
  // Đây là chức năng "Duyệt điều chỉnh tồn kho" (khác với "Nhập hàng" theo phiếu/hóa đơn):
  // xử lý các trường hợp thất thoát, bán nhầm mã hàng... phát sinh trong vận hành thực tế —
  // admin phải tự đếm rồi NHẬP ĐÚNG số thực có, hệ thống chỉ ĐẶT LẠI (set), không tự cộng dồn.
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>(getStockAlerts());
  const [correctionInputs, setCorrectionInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = () => setStockAlerts(getStockAlerts());
    load();
    window.addEventListener("kiot_stock_alerts_change", load);
    return () => window.removeEventListener("kiot_stock_alerts_change", load);
  }, []);

  const pendingAlertsForBranch = stockAlerts.filter(a => a.status === "pending" && a.branch === currentBranch);

  const handleApproveAlert = (alert: StockAlert) => {
    const inputVal = correctionInputs[alert.id];
    const currentStock = getProductStockAtBranch(alert.sku, 0, alert.branch);
    const corrected = inputVal !== undefined && inputVal !== "" ? Number(inputVal) || 0 : currentStock;
    approveStockAlert(alert.id, corrected, session?.name || "Admin");
    setProductStockAtBranch(alert.sku, corrected, alert.branch);
  };

  const categories = ["all", "Đồ uống", "Bánh kẹo", "Đồ ăn vặt", "Gia vị & Thực phẩm", "Hóa mỹ phẩm", "Khác"];

  const filteredProducts = catalogProducts.filter(p => {
    if (selectedCategory === "all") return true;
    return p.category === selectedCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const toggleRow = (sku: string) => {
    setExpandedRow(prev => prev === sku ? null : sku);
  };

  const handleAddTransferItem = (p: any) => {
    setTransferCart(prev => {
      const existing = prev.find(i => i.sku === p.sku);
      if (existing) {
        return prev.map(i => i.sku === p.sku ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { sku: p.sku, name: p.name, quantity: 1 }];
    });
    setProductSearch("");
  };

  const updateTransferQty = (sku: string, qty: number) => {
    setTransferCart(prev => prev.map(item => {
      if (item.sku !== sku) return item;
      return { ...item, quantity: Math.max(1, qty) };
    }));
  };

  const removeTransferItem = (sku: string) => {
    setTransferCart(prev => prev.filter(i => i.sku !== sku));
  };

  const handleCreateTransfer = () => {
    if (transferCart.length === 0) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm để luân chuyển!");
      return;
    }
    for (const item of transferCart) {
      const p = catalogProducts.find(x => x.sku === item.sku);
      const avail = getProductStockAtBranch(item.sku, p?.stock, transferFromBranch);
      if (item.quantity > avail) {
        alert(`Sản phẩm ${item.name} vượt quá tồn kho khả dụng (${avail}) tại kho xuất!`);
        return;
      }
    }

    const newOrder = transferStockBetweenBranches(
      transferFromBranch,
      transferTo,
      transferCart,
      "Quản lý chi nhánh",
      transferNote,
      catalogProducts.map(p => ({ sku: p.sku, stock: p.stock }))
    );

    setTransferOrders(getTransferOrders());
    setIsTransferModalOpen(false);
    setTransferCart([]);
    setTransferNote("");
    alert(`🎉 Đã luân chuyển kho thành công phiếu ${newOrder.code}! Tồn kho 2 chi nhánh đã được tự động cập nhật.`);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 flex flex-col h-full relative animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Hàng hóa & Tồn kho</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              <Building2 className="w-3.5 h-3.5" />
              Kho chi nhánh: {currentBranch}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Quản lý định mức, tồn kho và xuất nhập tách biệt theo cơ sở</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border-slate-200">
            <Upload className="w-4 h-4" /> Import
          </Button>
          <Button variant="outline" className="gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border-slate-200">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Link to="/purchase/import">
            <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent font-bold">
              <Truck className="w-4 h-4" /> + Nhập hàng
            </Button>
          </Link>
          {/* Luân chuyển hàng giữa 2 cơ sở tác động tồn kho toàn hệ thống — chỉ Admin mới thao tác */}
          {!isStaff && (
            <Button onClick={() => setIsTransferModalOpen(true)} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border-transparent font-bold">
              <RefreshCw className="w-4 h-4" /> Chuyển hàng giữa cơ sở
            </Button>
          )}
          <Button className="gap-2 bg-slate-800 text-white hover:bg-slate-900 shadow-sm border-transparent font-bold">
            <Plus className="w-4 h-4" /> Thêm mới
          </Button>
        </div>
      </div>

      {/* Cảnh báo bán vượt tồn kho — chỉ Admin mới thấy. Đây là chức năng "Duyệt điều chỉnh tồn kho"
          (khác với Nhập hàng theo phiếu): admin tự kiểm kê thực tế rồi đặt lại đúng số thực có,
          xử lý các trường hợp thất thoát, bán nhầm mã hàng... phát sinh trong vận hành. */}
      {!isStaff && pendingAlertsForBranch.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            {pendingAlertsForBranch.length} giao dịch bán vượt tồn kho tại {currentBranch} — cần kiểm kê thực tế & điều chỉnh lại tồn kho
          </div>
          <div className="space-y-2">
            {pendingAlertsForBranch.map(alert => {
              const currentStock = getProductStockAtBranch(alert.sku, 0, alert.branch);
              return (
                <div key={alert.id} className="bg-white rounded-xl border border-amber-200 p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm">
                    <div className="font-bold text-slate-800">{alert.productName} <span className="text-xs text-slate-400 font-mono">({alert.sku})</span></div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Đơn <strong className="text-blue-600">{alert.orderCode}</strong> • Bán {alert.requestedQty} trong khi tồn chỉ còn {alert.availableStockAtSale}
                      (thiếu {alert.deficit}) • {alert.employeeName} • {alert.timestamp}
                    </div>
                    <div className="text-xs mt-1">
                      Tồn kho hệ thống hiện tại: <strong className={currentStock < 0 ? "text-red-600" : "text-slate-700"}>{currentStock}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-xs font-semibold text-slate-600">Tồn kho sau kiểm kê:</label>
                    <input
                      type="number"
                      placeholder={String(currentStock)}
                      value={correctionInputs[alert.id] ?? ""}
                      onChange={(e) => setCorrectionInputs(prev => ({ ...prev, [alert.id]: e.target.value }))}
                      className="w-20 px-2 py-1.5 border border-slate-300 rounded-md text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <Button onClick={() => handleApproveAlert(alert)} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 h-9">
                      Duyệt & Điều chỉnh
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      {!isStaff && (
        <div className="flex gap-2 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab("stock")}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === "stock" ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <span>📦</span> Tồn kho chi nhánh ({isCS2 ? "CS2" : "CS1"})
          </button>
          <button
            onClick={() => { setActiveTab("transfers"); setTransferOrders(getTransferOrders()); }}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === "transfers" ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <span>🔄</span> Phiếu chuyển hàng (Luân chuyển kho)
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-black">{transferOrders.length}</span>
          </button>
        </div>
      )}

      {!isStaff && activeTab === "transfers" ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-black text-lg text-slate-800">Lịch Sử & Phiếu Chuyển Hàng Giữa 2 Cơ Sở</h3>
              <p className="text-xs text-slate-500 mt-0.5">Luân chuyển hàng hóa giữa CS1 (285 Nguyễn Lương Bằng) và CS2 (379b Tôn Đức Thắng) bảo đảm minh bạch kho</p>
            </div>
            <Button onClick={() => setIsTransferModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 px-5 h-10 shadow-sm">
              <Plus className="w-4 h-4" /> Tạo Phiếu Chuyển Hàng
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {transferOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400">Chưa có phiếu chuyển hàng nào</div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                    <th className="px-4 py-3">Mã Phiếu</th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Kho Xuất</th>
                    <th className="px-4 py-3">Kho Nhập</th>
                    <th className="px-4 py-3">Hàng hóa luân chuyển</th>
                    <th className="px-4 py-3 text-center">Tổng SL</th>
                    <th className="px-4 py-3">Người tạo</th>
                    <th className="px-4 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {transferOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-blue-600 font-mono">{order.code}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">{order.timestamp}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                          <Building2 className="w-3.5 h-3.5" /> {order.fromBranch.includes("285") ? "CS1" : "CS2"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                          <Building2 className="w-3.5 h-3.5" /> {order.toBranch.includes("285") ? "CS1" : "CS2"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {order.items.map((it, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {it.name} <strong className="text-blue-600 font-mono">x{it.quantity}</strong>
                            </span>
                          ))}
                        </div>
                        {order.note && <div className="text-xs text-slate-400 italic mt-1">📝 {order.note}</div>}
                      </td>
                      <td className="px-4 py-3.5 text-center font-black text-base text-blue-700">{order.totalQuantity}</td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs">{order.creator}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✔ Đã nhập kho
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex flex-1 gap-2">
            <div className="relative w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo mã, tên hàng..." 
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
            <Button variant="outline" className="gap-2 bg-white text-slate-700 border-slate-200 hover:bg-slate-50">
              <Filter className="w-4 h-4" /> Lọc
            </Button>
          </div>
        </div>

        {/* DataGrid */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 sticky top-0 z-10">
                <th className="px-4 py-3 w-12"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></th>
                <th className="px-4 py-3 w-12"></th>
                <th className="px-4 py-3">Mã Hàng</th>
                <th className="px-4 py-3">Tên Hàng</th>
                <th className="px-4 py-3">Nhóm Hàng</th>
                <th className="px-4 py-3 text-right">Giá Bán</th>
                <th className="px-4 py-3 text-right">Giá Vốn</th>
                <th className="px-4 py-3 text-right font-bold text-blue-700">Tồn Kho ({isCS2 ? "CS2" : "CS1"})</th>
                <th className="px-4 py-3">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {currentProducts.map((product, idx) => (
                <Fragment key={idx}>
                  <tr 
                    onClick={() => toggleRow(product.sku)}
                    className={`transition-colors cursor-pointer group ${expandedRow === product.sku ? 'bg-blue-50/60 shadow-sm z-10 relative' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {expandedRow === product.sku ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 group-hover:text-blue-600" />}
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-600">{product.sku}</td>
                    <td className="px-4 py-3 font-semibold">{product.name}</td>
                    <td className="px-4 py-3 text-slate-500">{product.category}</td>
                    <td className="px-4 py-3 text-right font-medium">{product.price?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{product.cost?.toLocaleString()}</td>
                    {(() => {
                      // Trạng thái phải tính theo tồn kho CHI NHÁNH đang xem, không phải tồn kho toàn cục
                      const branchStock = getProductStockAtBranch(product.sku, product.stock, currentBranch);
                      const branchStatus = branchStock <= 0 ? "Hết hàng" : branchStock < 10 ? "Sắp hết" : "Đang bán";
                      return (
                        <>
                          <td className="px-4 py-3 text-right font-bold text-blue-700">{branchStock}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              branchStatus === 'Đang bán' ? 'bg-emerald-100 text-emerald-800' :
                              branchStatus === 'Sắp hết' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {branchStatus}
                            </span>
                          </td>
                        </>
                      );
                    })()}
                  </tr>
                  {expandedRow === product.sku && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={9} className="p-0 border-b-2 border-blue-100 shadow-inner">
                        <ProductDetailPanel
                          product={{ ...product, stock: getProductStockAtBranch(product.sku, product.stock, currentBranch) }}
                          onEdit={() => setEditingProduct({ ...product, stock: getProductStockAtBranch(product.sku, product.stock, currentBranch) })}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {currentProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    Không tìm thấy hàng hóa nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-slate-50">
          <div>Hiển thị {Math.min(startIndex + 1, filteredProducts.length)}-{Math.min(startIndex + itemsPerPage, filteredProducts.length)} trên tổng số {filteredProducts.length} hàng hóa</div>
          <div className="flex gap-1">
            <Button 
              variant="outline" size="sm" 
              className="bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Trước
            </Button>
            
            <Button 
              variant="outline" size="sm" 
              className="bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>
      )}
      
      {/* Product Edit Modal */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          isOpen={true}
          onClose={() => setEditingProduct(null)}
          onSave={async (currentSku, updates) => {
            // Tồn kho hiển thị trên bảng là tồn kho THEO CHI NHÁNH (kiot_rm_branch_stock_v2),
            // không phải tồn kho toàn cục — phải sửa đúng chỗ này để khớp với số trên bảng.
            if (updates.stock !== editingProduct.stock) {
              setProductStockAtBranch(currentSku, updates.stock, currentBranch);
            }
            const result = await updateProduct(currentSku, updates);
            if (result && result.ok !== false && updates.sku !== currentSku) {
              renameProductSkuInBranchStock(currentSku, updates.sku);
            }
            return result;
          }}
        />
      )}

      {/* MODAL TẠO PHIẾU CHUYỂN HÀNG */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-blue-600 text-white">
              <div>
                <h3 className="text-lg font-black">Tạo Phiếu Chuyển Hàng Giữa Các Cơ Sở</h3>
                <p className="text-xs text-blue-100">Đảm bảo tính minh bạch khi luân chuyển tồn kho giữa CS1 và CS2</p>
              </div>
              <button onClick={() => setIsTransferModalOpen(false)} className="w-8 h-8 rounded-full bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center font-bold">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Branch Selection */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kho Xuất Hàng (Từ)</label>
                  <select 
                    value={transferFromBranch}
                    onChange={(e) => setTransferFromBranch(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                  >
                    <option value="285 Nguyễn Lương Bằng">CS1: 285 Nguyễn Lương Bằng</option>
                    <option value="379b Tôn Đức Thắng">CS2: 379b Tôn Đức Thắng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kho Nhập Hàng (Đến)</label>
                  <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-sm font-black text-emerald-800 flex items-center gap-1.5 shadow-2xs">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    {transferFromBranch === "285 Nguyễn Lương Bằng" ? "CS2: 379b Tôn Đức Thắng" : "CS1: 285 Nguyễn Lương Bằng"}
                  </div>
                </div>
              </div>

              {/* Product Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Chọn hàng hóa cần luân chuyển</label>
                <div className="flex gap-2">
                  <select
                    id="transfer-product-select"
                    className="flex-1 bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const prod = filteredProducts.find(p => p.sku === e.target.value);
                      if (prod) {
                        setTransferCart(prev => {
                          const ex = prev.find(i => i.sku === prod.sku);
                          if (ex) return prev.map(i => i.sku === prod.sku ? { ...i, quantity: i.quantity + 1 } : i);
                          return [...prev, { sku: prod.sku, name: prod.name, quantity: 1 }];
                        });
                      }
                      e.target.value = "";
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>-- Chọn sản phẩm để thêm vào phiếu chuyển --</option>
                    {filteredProducts.map(p => {
                      const stock = getProductStockAtBranch(p.sku, p.stock, transferFromBranch);
                      return (
                        <option key={p.sku} value={p.sku} disabled={stock <= 0}>
                          {p.name} ({p.sku}) — Tồn kho kho xuất: {stock}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Selected Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3">Hàng hóa</th>
                      <th className="p-3 text-center w-36">Số lượng chuyển</th>
                      <th className="p-3 text-center w-28">Tồn kho xuất</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transferCart.length === 0 ? (
                      <tr><td colSpan={4} className="p-6 text-center text-slate-400 italic">Chưa chọn hàng hóa nào</td></tr>
                    ) : (
                      transferCart.map((item) => {
                        const maxStock = getProductStockAtBranch(item.sku, 50, transferFromBranch);
                        return (
                          <tr key={item.sku} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-slate-800">{item.name} <span className="text-xs text-slate-400 font-mono">({item.sku})</span></td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => setTransferCart(prev => prev.map(i => i.sku === item.sku ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))} className="w-6 h-6 rounded border border-slate-300 text-slate-600 font-bold">-</button>
                                <span className="font-bold w-6 text-center">{item.quantity}</span>
                                <button onClick={() => setTransferCart(prev => prev.map(i => i.sku === item.sku ? { ...i, quantity: Math.min(maxStock, i.quantity + 1) } : i))} className="w-6 h-6 rounded border border-slate-300 text-slate-600 font-bold">+</button>
                              </div>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-600">{maxStock}</td>
                            <td className="p-3 text-center">
                              <button onClick={() => setTransferCart(prev => prev.filter(i => i.sku !== item.sku))} className="text-slate-400 hover:text-red-500 font-bold">✕</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú điều chuyển</label>
                <input
                  type="text"
                  placeholder="VD: Điều chuyển hàng cuối tuần, cân đối tồn kho..."
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 shadow-inner"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setIsTransferModalOpen(false)} className="bg-white border-slate-200 text-slate-700 font-bold px-5 h-10">
                Hủy bỏ
              </Button>
              <Button 
                disabled={transferCart.length === 0}
                onClick={() => {
                  const toBranch = transferFromBranch === "285 Nguyễn Lương Bằng" ? "379b Tôn Đức Thắng" : "285 Nguyễn Lương Bằng";
                  const newOrder = transferStockBetweenBranches(
                    transferFromBranch,
                    toBranch,
                    transferCart,
                    transferNote,
                    filteredProducts.map(p => ({ sku: p.sku, stock: p.stock }))
                  );
                  setTransferOrders(getTransferOrders());
                  setIsTransferModalOpen(false);
                  setTransferCart([]);
                  setTransferNote("");
                  alert(`Đã chuyển thành công ${newOrder.totalQuantity} sản phẩm từ ${transferFromBranch} sang ${toBranch}! Tồn kho hai chi nhánh đã được cập nhật chính xác.`);
                }} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 h-10 shadow-sm gap-2"
              >
                🚀 Xác nhận Chuyển Hàng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
