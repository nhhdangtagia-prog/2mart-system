import { useState, useMemo, useEffect, Fragment } from "react";
import { Search, Plus, Download, Upload, Filter, Building2, Truck, CheckCircle2, Clock, Trash2, DollarSign, ChevronDown, ChevronUp, Eye, FileText, User, ShieldCheck, Lock, Calendar, History, Edit2 } from "lucide-react";
import { Button, useCatalogPresenter } from "@2mart/ui";
import { useCurrentBranch } from "../hooks/useCurrentBranch";
import { useSession } from "../hooks/useSession";
import { useEmployees } from "../hooks/useEmployees";
import { addStockAfterImport, approvePurchaseOrder, updatePurchaseOrder, deletePurchaseOrders, getPurchaseOrders, getProductStockAtBranch, resolveDiscountAmount, calcLineAmount, type PurchaseOrder, type PurchaseOrderItem, type DiscountType } from "../utils/branchStock";
import suppliersData from "../data/suppliers.json";

export function PurchaseImportPage() {
  const { currentBranch, isCS2 } = useCurrentBranch();
  const { session } = useSession();
  const { employees } = useEmployees();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const data = await getPurchaseOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "draft">("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Danh tính người đang thao tác lấy từ tài khoản đăng nhập thật (không còn dropdown giả lập)
  const currentEmployee = useMemo(() => {
    if (!session) return { name: "", username: "", role: "" };
    if (session.accessLevel === "admin") {
      return { name: session.name, username: session.username, role: "Quản lý hệ thống" };
    }
    const emp = employees.find(e => e.code === session.code);
    return { name: session.name, username: session.username, role: emp?.role || "Nhân viên bán hàng" };
  }, [session, employees]);

  // Chỉ Admin (tài khoản riêng) mới có quyền Duyệt phiếu nhập kho — nhân viên chỉ được lập Phiếu Tạm
  const isManager = session?.accessLevel === "admin";

  // Modal Create State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [importBranch, setImportBranch] = useState(currentBranch);
  const [selectedSupplierCode, setSelectedSupplierCode] = useState("");
  const [importerUsername, setImporterUsername] = useState<string>(session?.username || "");
  const [importDateStr, setImportDateStr] = useState<string>(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [cartItems, setCartItems] = useState<PurchaseOrderItem[]>([]);
  // Chiết khấu toàn phiếu: nhập giá trị + chọn kiểu (VNĐ hoặc %)
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<DiscountType>("vnd");
  const [vatAmount, setVatAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [note, setNote] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const { items: catalogProducts } = useCatalogPresenter(productSearch);

  // Sync importBranch when currentBranch changes
  useEffect(() => {
    setImportBranch(currentBranch);
  }, [currentBranch]);

  // Sync default importer to current employee when modal opens or user switches
  useEffect(() => {
    setImporterUsername(currentEmployee.username || "quocanh");
  }, [currentEmployee.username]);

  // Selected supplier & importer objects
  const currentSupplier = useMemo(() => {
    return suppliersData.find(s => s.code === selectedSupplierCode) || null;
  }, [selectedSupplierCode]);

  const selectedImporter = useMemo(() => {
    return employees.find(e => e.username.toLowerCase() === importerUsername.toLowerCase()) || {
      name: session?.name || "", username: session?.username || ""
    };
  }, [importerUsername, employees, session]);

  // Financial calculations — chiết khấu áp theo 2 tầng:
  // (1) chiết khấu riêng từng mặt hàng đã trừ ngay trong item.amount
  // (2) chiết khấu chung cho toàn phiếu trừ tiếp trên tổng sau bước (1)
  const grossAmount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity * item.costPrice, 0);
  }, [cartItems]);

  const itemsDiscountTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.discountAmount || 0), 0);
  }, [cartItems]);

  const totalAmount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.amount, 0);
  }, [cartItems]);

  const discount = useMemo(() => {
    return resolveDiscountAmount(totalAmount, discountValue, discountType);
  }, [totalAmount, discountValue, discountType]);

  const netPayable = useMemo(() => {
    return Math.max(0, totalAmount - discount + vatAmount);
  }, [totalAmount, discount, vatAmount]);

  useEffect(() => {
    setPaidAmount(netPayable);
  }, [netPayable]);

  // Filtered orders for table
  const filteredOrders = useMemo(() => {
    const result = orders.filter(o => {
      const matchSearch = !searchTerm || 
        o.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.importer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchBranch = currentBranch === "Tất cả chi nhánh" || o.branch === currentBranch;
      return matchSearch && matchStatus && matchBranch;
    });

    result.sort((a, b) => {
      const timeA = new Date(a.importDate || a.timestamp).getTime();
      const timeB = new Date(b.importDate || b.timestamp).getTime();
      return timeB - timeA;
    });

    return result;
  }, [orders, searchTerm, statusFilter, currentBranch]);

  const formatCurrency = (num: number) => {
    return Math.round(num).toLocaleString("vi-VN") + " đ";
  };

  /** Tính lại chiết khấu & thành tiền cho 1 dòng hàng sau mỗi thay đổi */
  const recalcLine = (item: PurchaseOrderItem): PurchaseOrderItem => {
    const { discountAmount, amount } = calcLineAmount(item);
    return { ...item, discountAmount, amount };
  };

  const handleAddToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.sku === product.sku);
      if (existing) {
        return prev.map(i => i.sku === product.sku ? recalcLine({ ...i, quantity: i.quantity + 10 }) : i);
      }
      const defaultCost = product.cost || Math.floor(product.price * 0.7) || 20000;
      return [...prev, recalcLine({
        sku: product.sku,
        name: product.name,
        quantity: 10,
        costPrice: defaultCost,
        discountValue: 0,
        discountType: "vnd",
        discountAmount: 0,
        amount: 0
      })];
    });
    setProductSearch("");
  };

  const updateCartItem = (sku: string, field: "quantity" | "costPrice" | "discountValue" | "sellingPrice", val: number) => {
    setCartItems(prev => prev.map(item =>
      item.sku === sku ? recalcLine({ ...item, [field]: Math.max(0, val) }) : item
    ));
  };

  /** Đổi kiểu chiết khấu (VNĐ ⇄ %) cho 1 dòng hàng */
  const updateCartItemDiscountType = (sku: string, type: DiscountType) => {
    setCartItems(prev => prev.map(item =>
      item.sku === sku ? recalcLine({ ...item, discountType: type }) : item
    ));
  };

  const removeCartItem = (sku: string) => {
    setCartItems(prev => prev.filter(i => i.sku !== sku));
  };

  // Submit Order Creation
  const handleCreateOrder = async (isDraft: boolean) => {
    if (cartItems.length === 0) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm để nhập hàng!");
      return;
    }
    
    if (!currentSupplier) {
      alert("Vui lòng chọn Nhà cung cấp!");
      return;
    }

    // NẾU LÀ NHÂN VIÊN MÀ BẤM HOÀN THÀNH => CHẶN VÀ TỰ ĐỘNG CHUYỂN SANG PHIẾU TẠM
    let actualIsDraft = isDraft;
    if (!isManager && !isDraft) {
      alert("⚠️ QUY ĐỊNH BẢO MẬT: Bạn đang thao tác dưới vai trò [Nhân viên]. Phiếu nhập của bạn bắt buộc phải lưu ở chế độ PHIẾU TẠM (Chờ duyệt). Quản lý cửa hàng sẽ kiểm kho và duyệt phiếu khi đó hàng mới chính thức vào kho!");
      actualIsDraft = true;
    }

    const formattedDate = importDateStr ? importDateStr.replace("T", " ") : new Date().toLocaleString("vi-VN");

    let newOrder;
    if (editingOrderId) {
      newOrder = await updatePurchaseOrder(editingOrderId, {
        branch: importBranch,
        supplierName: currentSupplier.name,
        supplierCode: currentSupplier.code,
        items: cartItems,
        discount,
        discountValue,
        discountType,
        vatAmount,
        paidAmount,
        note,
        timestamp: formattedDate,
        importerName: selectedImporter.name || selectedImporter.username,
        netPayable: Math.max(0, cartItems.reduce((acc, item) => acc + item.quantity * item.costPrice, 0) - discount)
      }, actualIsDraft);
      if (!newOrder) return;
    } else {
      newOrder = await addStockAfterImport(
        importBranch,
        currentSupplier.name,
        currentSupplier.code,
        cartItems,
        discount,
        paidAmount,
        note,
        actualIsDraft,
        currentEmployee.name || currentEmployee.username,
        currentEmployee.role || "Nhân viên",
        selectedImporter.name || selectedImporter.username,
        formattedDate,
        catalogProducts.map(p => ({ sku: p.sku, stock: p.stock })),
        discountValue,
        discountType,
        vatAmount
      );
    }

    await fetchOrders();
    setIsCreateModalOpen(false);
    setCartItems([]);
    setDiscountValue(0);
    setDiscountType("vnd");
    setVatAmount(0);
    setNote("");
    setEditingOrderId(null);
    setSelectedOrderIds([]);

    if (actualIsDraft) {
      alert(`🎉 Đã lưu phiếu tạm [${newOrder.code}] thành công!\n• Người lập: ${currentEmployee.name} (${currentEmployee.role})\n• Người nhập kho: ${selectedImporter.name}\n• Trạng thái: 🟡 CHỜ QUẢN LÝ DUYỆT (Hàng chưa cộng vào kho).`);
    } else {
      alert(`🎉 Đã nhập kho thành công phiếu [${newOrder.code}] (${formatCurrency(newOrder.netPayable)}) vào [${importBranch}]!\n• Người lập & duyệt: ${currentEmployee.name} (${currentEmployee.role})\n• Tồn kho chi nhánh và công nợ đã tự động cập nhật.`);
    }
  };

  // Manager Approve Order
  
  const handleEditSelected = () => {
    const orderToEdit = orders.find(o => o.id === selectedOrderIds[0]);
    if (!orderToEdit) return;
    
    setEditingOrderId(orderToEdit.id);
    setImportBranch(orderToEdit.branch);
    setSelectedSupplierCode(orderToEdit.supplierCode);
    setCartItems(orderToEdit.items);
    setDiscountValue(orderToEdit.discountValue || 0);
    setDiscountType(orderToEdit.discountType || "vnd");
    setVatAmount(orderToEdit.vatAmount || 0);
    setPaidAmount(orderToEdit.paidAmount);
    setNote(orderToEdit.note || "");
    
    // Tìm nhân viên nhập kho
    const imp = employees.find(e => e.name === orderToEdit.importerName || e.username === orderToEdit.importerName);
    if (imp) setImporterUsername(imp.username);
    
    setIsCreateModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingOrderId(null);
    setImportBranch(currentBranch);
    setSelectedSupplierCode("");
    setCartItems([]);
    setDiscountValue(0);
    setDiscountType("vnd");
    setVatAmount(0);
    setPaidAmount(0);
    setNote("");
    
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    setImportDateStr(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16));
    
    if (session?.username) setImporterUsername(session.username);
    setIsCreateModalOpen(true);
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedOrderIds.length} phiếu nhập này không?\nHành động này sẽ TRỪ LẠI số lượng tồn kho (nếu phiếu đã duyệt).`)) {
      await deletePurchaseOrders(selectedOrderIds);
      await fetchOrders();
      setSelectedOrderIds([]);
    }
  };

  const handleApproveOrder = async (orderId: string, orderCode: string) => {
    if (!isManager) {
      alert("⚠️ Bạn cần chuyển sang vai trò [Trưởng cửa hàng / Quản lý] ở thanh điều hướng trên để có quyền Duyệt phiếu nhập kho!");
      return;
    }
    const confirmed = window.confirm(`Xác nhận kiểm kho và DUYỆT phiếu nhập [${orderCode}]?\nSau khi duyệt, số lượng hàng hóa sẽ chính thức được cộng vào tồn kho chi nhánh!`);
    if (!confirmed) return;

    const updated = await approvePurchaseOrder(
      orderId,
      currentEmployee.name || currentEmployee.username,
      currentEmployee.role || "Trưởng cửa hàng",
      catalogProducts.map(p => ({ sku: p.sku, stock: p.stock }))
    );

    if (updated) {
      await fetchOrders();
      alert(`🎉 ĐÃ DUYỆT PHIẾU [${orderCode}] THÀNH CÔNG!\nQuản lý [${currentEmployee.name}] đã xác nhận nhập kho. Số liệu tồn kho đã được cộng dồn chính xác.`);
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col h-full relative animate-in fade-in duration-200 space-y-6">
      
      {/* Top Banner: Security Notice — lấy vai trò từ tài khoản đăng nhập thật, không còn dropdown giả lập */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4 border border-blue-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center font-bold text-xl shrink-0 border border-blue-400/30">
            👤
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">{currentEmployee.name} — vai trò:</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                isManager ? "bg-emerald-400 text-emerald-950 shadow-sm" : "bg-amber-400 text-amber-950 shadow-sm"
              }`}>
                {isManager ? <ShieldCheck className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {currentEmployee.role}
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              {isManager
                ? "✓ Bạn có toàn quyền lập phiếu hoàn thành ngay hoặc Duyệt các phiếu tạm do nhân viên lập."
                : "⚠️ Quy định: Nhân viên chỉ được lập Phiếu Tạm (ghi nhận người nhập & lưu log). Quản lý sẽ kiểm tra và duyệt nhập kho."}
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              <Truck className="w-7 h-7 text-blue-600" />
              Phiếu Nhập Hàng Từ Nhà Cung Cấp
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              <Building2 className="w-3.5 h-3.5" />
              Kho nhập: {currentBranch}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Ghi nhận chính xác người lập, người nhập hàng và lưu vết nhật ký duyệt kho</p>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <Button variant="outline" className="gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border-slate-200 font-semibold">
            <Upload className="w-4 h-4" /> Import Excel
          </Button>
          <Button variant="outline" className="gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border-slate-200 font-semibold">
            <Download className="w-4 h-4" /> Xuất Báo Cáo
          </Button>
          <Button onClick={handleOpenCreateModal} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md px-5 h-10 border-transparent">
            <Plus className="w-5 h-5 stroke-[3]" /> Tạo Phiếu Nhập Hàng
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-1 items-center gap-3 min-w-[320px]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm mã phiếu, người lập, người nhập, NCC..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
              />
            </div>

            {selectedOrderIds.length > 0 && (
              <div className="flex gap-2">
                {selectedOrderIds.length === 1 && (
                  <button onClick={handleEditSelected} className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                    Sửa
                  </button>
                )}
                <button onClick={handleDeleteSelected} className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                  Xóa
                </button>
              </div>
            )}
            {/* Status Filter */}
            <div className="flex bg-slate-200/70 p-1 rounded-xl gap-1">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                Tất cả ({orders.length})
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${statusFilter === "completed" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã nhập kho
              </button>
              <button
                onClick={() => setStatusFilter("draft")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${statusFilter === "draft" ? "bg-white text-amber-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                <Clock className="w-3.5 h-3.5" /> Phiếu tạm (Chờ duyệt)
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-bold border-b border-slate-200 sticky top-0 z-10">
                <th className="px-4 py-3.5 w-12">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0} onChange={e => setSelectedOrderIds(e.target.checked ? filteredOrders.map(o => o.id) : [])} />
                </th>
                <th className="px-4 py-3.5 whitespace-nowrap">Mã Phiếu</th>
                <th className="px-4 py-3.5 hidden sm:table-cell">Thời gian</th>
                <th className="px-4 py-3.5 hidden lg:table-cell">Nhà Cung Cấp</th>
                <th className="px-4 py-3.5 hidden lg:table-cell">Người Lập / Người Nhập</th>
                <th className="px-4 py-3.5 hidden xl:table-cell">Chi nhánh nhập</th>
                <th className="px-4 py-3.5 hidden md:table-cell">Hàng hóa nhập</th>
                <th className="px-4 py-3.5 text-right hidden sm:table-cell">Tổng tiền</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Trạng Thái</th>
                {isManager && <th className="px-4 py-3.5 text-center w-24">Hành Động</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 10 : 9} className="px-4 py-16 text-center text-slate-400 italic">
                    Không tìm thấy phiếu nhập hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <Fragment key={order.id}>
                    <tr 
                      onClick={() => setExpandedRow(prev => prev === order.id ? null : order.id)}
                      className={`transition-colors cursor-pointer group ${expandedRow === order.id ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3.5 text-slate-400">
                        {expandedRow === order.id ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 group-hover:text-blue-600" />}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-blue-600 font-mono whitespace-nowrap">{order.code}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs font-medium hidden sm:table-cell">
                        <div>{order.timestamp}</div>
                        <div className="text-[10px] text-slate-400">Nhập: {order.importDate}</div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800 hidden lg:table-cell">
                        <div>{order.supplierName}</div>
                        <div className="text-xs text-slate-400 font-mono font-normal">{order.supplierCode}</div>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-blue-600" /> Tạo: <span className="text-blue-700">{order.creator}</span>
                        </div>
                        <div className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                          <Truck className="w-3.5 h-3.5 text-emerald-600" /> Nhập: <strong className="text-emerald-700">{order.importer}</strong>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700 hidden xl:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          {order.branch.includes("285") ? "CS1" : "CS2"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {order.items.slice(0, 2).map((it, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {it.name} <strong className="text-blue-600 font-mono">x{it.quantity}</strong>
                            </span>
                          ))}
                          {order.items.length > 2 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">
                              +{order.items.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-slate-900 hidden sm:table-cell">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${
                          order.status === "completed" 
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                            : "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                        }`}>
                          {order.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                          {order.status === "completed" ? "Đã nhập kho" : "Phiếu tạm (Chờ duyệt)"}
                        </span>
                      </td>
                      {isManager && (
                        <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setSelectedOrderIds([order.id]); setTimeout(handleEditSelected, 0); }} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition-colors" title="Sửa">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedOrderIds([order.id]); setTimeout(handleDeleteSelected, 0); }} className="text-red-600 hover:bg-red-100 p-1.5 rounded transition-colors" title="Xóa">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* Expanded Detail Panel with Audit Logs & Approval Workflow */}
                    {expandedRow === order.id && (
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <td colSpan={isManager ? 10 : 9} className="p-0 border-b-2 border-blue-100 shadow-inner">
                          <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                            
                            {/* Top Info Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                              <div>
                                <div className="flex items-center gap-2 font-black text-slate-800 text-lg">
                                  <FileText className="w-6 h-6 text-blue-600" />
                                  Chi Tiết Phiếu Nhập Hàng #{order.code}
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {order.status === 'completed' ? '✓ Đã hoàn thành nhập kho' : '⏳ Phiếu tạm - Chờ quản lý kiểm duyệt'}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-4">
                                  <span>Tạo lúc: <strong>{order.timestamp}</strong></span>
                                  <span>Ngày thực nhập: <strong>{order.importDate}</strong></span>
                                  <span>Kho nhập: <strong className="text-blue-700">{order.branch}</strong></span>
                                </div>
                              </div>

                              {/* APPROVAL ACTION BOX (NẾU LÀ PHIẾU TẠM) */}
                              {order.status === "draft" && (
                                <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-xl flex items-center gap-3">
                                  <div className="text-xs text-amber-900 max-w-xs">
                                    <strong>🔒 Phiếu Tạm Chờ Duyệt</strong><br/>
                                    Hàng chưa được cộng vào kho. Quản lý cửa hàng cần kiểm tra thực tế và duyệt.
                                  </div>
                                  {isManager ? (
                                    <Button
                                      onClick={(e) => { e.stopPropagation(); handleApproveOrder(order.id, order.code); }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 h-10 shadow-md gap-2"
                                    >
                                      <ShieldCheck className="w-4 h-4" /> Duyệt & Nhập Kho
                                    </Button>
                                  ) : (
                                    <div className="text-xs font-bold text-red-600 bg-white p-2 rounded-lg border border-red-200">
                                      ⚠️ Quyền Nhân viên không thể duyệt
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Personnel & Supplier Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
                              <div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Người lập phiếu:</span>
                                <div className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                                  <User className="w-4 h-4 text-blue-600" />
                                  {order.creator}
                                </div>
                                <div className="text-xs text-slate-500">{order.creatorRole || "Nhân viên"}</div>
                              </div>
                              <div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Người nhận / Nhập kho:</span>
                                <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                                  <Truck className="w-4 h-4 text-emerald-600" />
                                  {order.importer}
                                </div>
                                <div className="text-xs text-slate-500">Xác nhận nhận hàng tại kho</div>
                              </div>
                              <div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Nhà cung cấp:</span>
                                <div className="font-bold text-slate-900 mt-0.5">{order.supplierName}</div>
                                <div className="text-xs font-mono text-blue-600">{order.supplierCode}</div>
                              </div>
                            </div>

                            {/* Items Table */}
                            <div>
                              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Danh sách hàng hóa nhập kho</h5>
                              <table className="w-full text-left text-sm border border-slate-200 rounded-lg overflow-hidden">
                                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                                  <tr>
                                    <th className="p-3">Mã SKU</th>
                                    <th className="p-3">Tên hàng hóa</th>
                                    <th className="p-3 text-center">Số lượng nhập</th>
                                    <th className="p-3 text-right">Đơn giá nhập</th>
                                    <th className="p-3 text-right">Chiết khấu</th>
                                    <th className="p-3 text-right">Thành tiền</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {order.items.map((it, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                      <td className="p-3 font-mono text-xs font-bold text-blue-600">{it.sku}</td>
                                      <td className="p-3 font-semibold text-slate-800">{it.name}</td>
                                      <td className="p-3 text-center font-black text-slate-900">{it.quantity}</td>
                                      <td className="p-3 text-right font-medium text-slate-600">{formatCurrency(it.costPrice)}</td>
                                      <td className="p-3 text-right font-medium text-red-600">
                                        {(it.discountAmount || 0) > 0
                                          ? `-${formatCurrency(it.discountAmount || 0)}${it.discountType === "percent" ? ` (${it.discountValue}%)` : ""}`
                                          : "-"}
                                      </td>
                                      <td className="p-3 text-right font-bold text-blue-700">{formatCurrency(it.amount)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Bottom Grid: Audit Logs (Left) & Financial Summary (Right) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                              
                              {/* AUDIT LOG TRAIL */}
                              <div className="lg:col-span-7 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <History className="w-4 h-4 text-blue-600" />
                                  Nhật ký thao tác & Lưu vết (Audit Log)
                                </h5>
                                <div className="space-y-2.5">
                                  {(order.logs && order.logs.length > 0 ? order.logs : [
                                    { timestamp: order.timestamp, action: "TẠO PHIẾU", actor: order.creator, detail: `Ghi nhận người nhập: ${order.importer}` }
                                  ]).map((log, lIdx) => (
                                    <div key={lIdx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs shadow-2xs">
                                      <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1">
                                        <span className="text-blue-700 flex items-center gap-1">
                                          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                                          {log.action}
                                        </span>
                                        <span className="text-slate-400 font-normal">{log.timestamp}</span>
                                      </div>
                                      <div className="text-slate-600">
                                        Người thực hiện: <strong className="text-slate-900">{log.actor}</strong>
                                      </div>
                                      <div className="text-slate-500 mt-0.5 italic">{log.detail}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Financial Summary */}
                              <div className="lg:col-span-5 flex justify-end">
                                <div className="w-full space-y-2 text-sm bg-blue-50/50 p-5 rounded-xl border border-blue-200">
                                  <div className="flex justify-between text-slate-600"><span>Tổng tiền hàng ({order.totalQuantity} SP):</span> <strong className="text-slate-800">{formatCurrency(order.totalAmount)}</strong></div>
                                  {(order.itemsDiscountTotal || 0) > 0 && (
                                    <div className="flex justify-between text-slate-600"><span>CK theo từng mặt hàng:</span> <strong className="text-red-600">-{formatCurrency(order.itemsDiscountTotal || 0)}</strong></div>
                                  )}
                                  <div className="flex justify-between text-slate-600">
                                    <span>Chiết khấu toàn phiếu{order.discountType === "percent" ? ` (${order.discountValue}%)` : ""}:</span>
                                    <strong className="text-red-600">-{formatCurrency(order.discount || 0)}</strong>
                                  </div>
                                  {(order.vatAmount || 0) > 0 && (
                                    <div className="flex justify-between text-slate-600">
                                      <span>Tiền thuế VAT:</span>
                                      <strong className="text-red-600">+{formatCurrency(order.vatAmount || 0)}</strong>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-base font-black text-slate-900 border-t border-blue-200 pt-2"><span>Cần thanh toán:</span> <span className="text-blue-700">{formatCurrency(order.netPayable)}</span></div>
                                  <div className="flex justify-between text-emerald-700 font-bold"><span>Đã trả nhà cung cấp:</span> <span>{formatCurrency(order.paidAmount)}</span></div>
                                  {order.paidAmount < order.netPayable && (
                                    <div className="text-xs font-black text-red-600 bg-red-50 p-2 rounded border border-red-200 text-right mt-2">
                                      ⚠️ Ghi nợ NCC: {formatCurrency(order.netPayable - order.paidAmount)}
                                    </div>
                                  )}
                                </div>
                              </div>

                            </div>

                            {order.note && <div className="text-xs text-slate-500 italic bg-amber-50 p-3 rounded-lg border border-amber-200">📝 Ghi chú từ người lập: {order.note}</div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TẠO PHIẾU NHẬP HÀNG MỚI (CHUẨN KIOTVIET SCREENSHOT) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white sm:rounded-2xl w-full h-full sm:max-w-[95vw] sm:w-[1400px] sm:h-[95vh] shadow-2xl sm:border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-blue-600 text-white">
              <div className="flex items-center gap-3">
                <Truck className="w-6 h-6 text-blue-200" />
                <div>
                  <h3 className="text-lg font-black">Tạo Phiếu Nhập Hàng Từ Nhà Cung Cấp</h3>
                  <p className="text-xs text-blue-100">Chuẩn hóa luồng duyệt kho giữa Nhân viên & Trưởng cửa hàng</p>
                </div>
              </div>
              <button onClick={() => { setIsCreateModalOpen(false); setEditingOrderId(null); }} className="w-8 h-8 rounded-full bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center font-bold transition-colors">✕</button>
            </div>

            {/* Modal Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto lg:overflow-hidden">
              
              {/* Left Column (Items & Selection) - 8 cols */}
              <div className="lg:col-span-8 p-3 sm:p-6 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 overflow-visible lg:overflow-hidden space-y-5">
                
                {/* 4-COLUMN TOP BAR (CHUẨN SCREENSHOT KIOTVIET) */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                    
                    {/* 1. Người tạo (Readonly display) */}
                    <div>
                      <span className="block text-xs font-bold text-slate-500 mb-1">Người tạo:</span>
                      <div className="font-black text-slate-800 text-sm flex items-center gap-1.5 py-1">
                        <User className="w-4 h-4 text-blue-600" />
                        {currentEmployee.username} 
                        <span className="text-[10px] font-normal text-slate-500">({currentEmployee.role})</span>
                      </div>
                    </div>

                    {/* 2. Người nhập (Select dropdown) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Người nhập:</label>
                      <select
                        value={importerUsername}
                        onChange={(e) => setImporterUsername(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                      >
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.username}>
                            {emp.username} ({emp.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Ngày nhập (Date-time picker) */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ngày nhập:</label>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          value={importDateStr}
                          onChange={(e) => setImportDateStr(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs font-mono"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Second row of selector: NCC & Kho nhập */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tên NCC (Tìm nhà cung cấp):</label>
                      <select
                        value={selectedSupplierCode}
                        onChange={(e) => setSelectedSupplierCode(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs truncate cursor-pointer"
                      >
                        <option value="">Chưa chọn nhà cung cấp</option>
                        {suppliersData.map(s => (
                          <option key={s.code} value={s.code}>
                            {s.name} ({s.phone}) - Nợ: {parseFloat(s.debt || "0").toLocaleString()} đ
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kho Nhập Hàng (Chi nhánh):</label>
                      <select 
                        value={importBranch}
                        onChange={(e) => setImportBranch(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                      >
                        <option value="285 Nguyễn Lương Bằng">CS1: 285 Nguyễn Lương Bằng</option>
                        <option value="379b Tôn Đức Thắng">CS2: 379b Tôn Đức Thắng</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Product Search & Add */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Tìm & chọn hàng hóa nhập kho (F3)</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="Gõ tên hoặc mã SKU để tìm kiếm hàng hóa..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-blue-400 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                    />
                  </div>

                  {/* Search Dropdown */}
                  {productSearch && (
                    <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto z-20">
                      {catalogProducts.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-sm">Không tìm thấy sản phẩm</div>
                      ) : (
                        catalogProducts.slice(0, 30).map(p => {
                          const stock = getProductStockAtBranch(p.sku, p.stock, importBranch);
                          return (
                            <div
                              key={p.sku}
                              onClick={() => handleAddToCart(p)}
                              className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex justify-between items-center transition-colors"
                            >
                              <div>
                                <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span className="font-mono text-blue-600">{p.sku}</span>
                                  <span>• Tồn kho kho nhập: <strong className="text-emerald-700">{stock}</strong></span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-slate-400">Giá vốn gợi ý</div>
                                <div className="font-black text-blue-600 text-sm">{formatCurrency(p.cost || Math.floor(p.price * 0.7) || 20000)}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Cart Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col shadow-2xs min-h-[400px] lg:min-h-0">
                  <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm relative">
                    <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3 min-w-[200px]">Hàng hóa</th>
                        <th className="p-3 text-center w-[120px]">Số lượng</th>
                        <th className="p-3 text-right w-[120px]">Đơn giá</th>
                        <th className="p-3 text-right w-[120px]">Giá bán</th>
                        <th className="p-3 text-center w-[130px]">Chiết khấu</th>
                        <th className="p-3 text-right w-[120px]">Thành tiền</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cartItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                            Chưa có mặt hàng nào trong phiếu nhập. Hãy tìm và chọn hàng hóa phía trên!
                          </td>
                        </tr>
                      ) : (
                        cartItems.map((item) => (
                          <tr key={item.sku} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-bold text-slate-800">
                              <div>{item.name}</div>
                              <div className="text-xs text-slate-400 font-mono font-normal">{item.sku}</div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => updateCartItem(item.sku, "quantity", item.quantity - 1)}
                                  className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
                                >-</button>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateCartItem(item.sku, "quantity", parseInt(e.target.value) || 0)}
                                  className="w-14 text-center font-black border border-slate-300 rounded p-1 text-sm focus:outline-none focus:border-blue-500"
                                />
                                <button 
                                  onClick={() => updateCartItem(item.sku, "quantity", item.quantity + 1)}
                                  className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
                                >+</button>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <input
                                type="number"
                                step="1"
                                value={item.costPrice}
                                onChange={(e) => updateCartItem(item.sku, "costPrice", parseFloat(e.target.value) || 0)}
                                className="w-28 text-right font-bold border border-slate-300 rounded p-1 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                              />
                            </td>
                            <td className="p-3 text-right">
                              <input
                                type="number"
                                step="1000"
                                placeholder="Tự động"
                                value={item.sellingPrice || ""}
                                onChange={(e) => updateCartItem(item.sku, "sellingPrice", parseFloat(e.target.value) || 0)}
                                className="w-24 text-right font-bold border border-slate-300 rounded p-1 text-sm focus:outline-none focus:border-blue-500 text-emerald-700"
                              />
                            </td>
                            {/* Chiết khấu riêng của từng mặt hàng — chọn VNĐ hoặc % */}
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={item.discountType === "percent" ? 100 : undefined}
                                  step={item.discountType === "percent" ? 1 : 1000}
                                  value={item.discountValue || 0}
                                  onChange={(e) => updateCartItem(item.sku, "discountValue", parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right font-bold border border-slate-300 rounded p-1 text-sm text-red-600 focus:outline-none focus:border-blue-500"
                                />
                                <div className="flex rounded overflow-hidden border border-slate-300 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => updateCartItemDiscountType(item.sku, "vnd")}
                                    className={`px-1.5 py-1 text-xs font-bold transition-colors ${(item.discountType || "vnd") === "vnd" ? "bg-blue-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                                  >đ</button>
                                  <button
                                    type="button"
                                    onClick={() => updateCartItemDiscountType(item.sku, "percent")}
                                    className={`px-1.5 py-1 text-xs font-bold border-l border-slate-300 transition-colors ${item.discountType === "percent" ? "bg-blue-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                                  >%</button>
                                </div>
                              </div>
                              {(item.discountAmount || 0) > 0 && (
                                <div className="text-center text-[11px] text-red-600 font-semibold mt-1">
                                  -{formatCurrency(item.discountAmount || 0)}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right font-black text-blue-700">
                              {formatCurrency(item.amount)}
                              {(item.discountAmount || 0) > 0 && (
                                <div className="text-[11px] font-normal text-slate-400 line-through">
                                  {formatCurrency(item.quantity * item.costPrice)}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button onClick={() => removeCartItem(item.sku)} className="text-slate-400 hover:text-red-500 font-bold transition-colors">✕</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>

              {/* Right Column (Financial & Submission) - 4 cols */}
              <div className="lg:col-span-4 p-4 sm:p-6 bg-slate-50 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h4 className="font-black text-base text-slate-800 pb-2 border-b border-slate-200 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Thanh Toán & Công Nợ
                  </h4>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Tổng số lượng nhập:</span>
                      <strong className="text-slate-900 font-black">{cartItems.reduce((acc, i) => acc + i.quantity, 0)}</strong>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Tổng tiền hàng:</span>
                      <strong className="text-slate-900 font-black">{formatCurrency(grossAmount)}</strong>
                    </div>
                    {itemsDiscountTotal > 0 && (
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>CK theo từng mặt hàng:</span>
                        <strong className="text-red-600 font-black">-{formatCurrency(itemsDiscountTotal)}</strong>
                      </div>
                    )}

                    {/* Chiết khấu chung cho TOÀN phiếu — nhập giá trị + chọn VNĐ hoặc % */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex justify-between items-center text-sm text-slate-600">
                        <span>Chiết khấu toàn phiếu:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step={discountType === "percent" ? "1" : "1000"}
                            min="0"
                            max={discountType === "percent" ? 100 : undefined}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-24 text-right font-bold border border-slate-300 rounded p-1 text-sm text-red-600 focus:outline-none focus:border-blue-500"
                          />
                          <div className="flex rounded overflow-hidden border border-slate-300">
                            <button
                              type="button"
                              onClick={() => setDiscountType("vnd")}
                              className={`px-2 py-1 text-xs font-bold transition-colors ${discountType === "vnd" ? "bg-blue-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                            >
                              đ
                            </button>
                            <button
                              type="button"
                              onClick={() => setDiscountType("percent")}
                              className={`px-2 py-1 text-xs font-bold border-l border-slate-300 transition-colors ${discountType === "percent" ? "bg-blue-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                            >
                              %
                            </button>
                          </div>
                        </div>
                      </div>
                      {discountType === "percent" && discountValue > 0 && (
                        <div className="text-right text-xs text-red-600 font-semibold">
                          = -{formatCurrency(discount)}
                        </div>
                      )}
                    </div>
                    
                    {/* THUẾ VAT CHO ĐƠN HÀNG */}
                    <div className="flex flex-col gap-1 items-end pt-3 pb-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700 w-36">Tiền thuế VAT:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={vatAmount}
                            onChange={(e) => setVatAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-32 text-right font-bold border border-slate-300 rounded p-1 text-sm text-red-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-base font-black text-slate-900">
                      <span>Cần trả NCC:</span>
                      <span className="text-blue-700 text-lg">{formatCurrency(netPayable)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-emerald-700">
                      <span>Tiền đã trả NCC:</span>
                      <input
                        type="number"
                        step="1"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-32 text-right font-black border border-emerald-400 bg-emerald-50/50 rounded p-1.5 text-sm text-emerald-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                    {paidAmount < netPayable && (
                      <div className="text-xs font-black text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 text-right">
                        ⚠️ Ghi vào công nợ NCC: {formatCurrency(netPayable - paidAmount)}
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú phiếu nhập</label>
                    <textarea
                      rows={3}
                      placeholder="VD: Nhập hàng định kỳ, thỏa thuận thanh toán 50%..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-blue-500 shadow-inner resize-none"
                    />
                  </div>
                </div>

                {/* Actions with Role-Based Permission Control */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  
                  {/* BUTTON LƯU PHIẾU TẠM (LUÔN SẴN SÀNG CHO NHÂN VIÊN & QUẢN LÝ) */}
                  <Button
                    disabled={cartItems.length === 0}
                    onClick={() => handleCreateOrder(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-black h-12 shadow-md gap-2 text-base rounded-xl border-2 border-amber-400"
                  >
                    💾 Lưu Phiếu Tạm (Chờ Quản Lý Duyệt)
                  </Button>

                  {/* BUTTON HOÀN THÀNH & NHẬP KHO (CHỈ DÀNH CHO QUẢN LÝ) */}
                  <Button
                    disabled={cartItems.length === 0 || !isManager}
                    onClick={() => handleCreateOrder(false)}
                    className={`w-full font-black h-12 shadow-md gap-2 text-base rounded-xl transition-all ${
                      isManager 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                        : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                    }`}
                  >
                    {!isManager && <Lock className="w-5 h-5" />}
                    {isManager ? "🚀 Hoàn Thành & Nhập Kho Ngay" : "🔒 Khóa Quyền: Chỉ Quản Lý Duyệt Kho"}
                  </Button>

                  <div className="text-[11px] text-center text-slate-500 italic">
                    {!isManager ? "⚠️ Nhân viên bán hàng chỉ có thể lập phiếu tạm. Quản lý sẽ duyệt hàng vào kho sau." : "✓ Quyền Trưởng cửa hàng được nhập hàng vào kho lập tức."}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => { setIsCreateModalOpen(false); setEditingOrderId(null); }}
                    className="w-full bg-white border-slate-300 text-slate-700 font-bold h-10 hover:bg-slate-100 rounded-xl mt-1"
                  >
                    Hủy bỏ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
