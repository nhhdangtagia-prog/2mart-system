import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, ScanLine, Plus, X, Lock, Undo2, RefreshCw, Printer, Menu,
  ChevronDown, PenSquare, RefreshCcw, MapPin, HelpCircle,
  Trash2, Minus, ArrowLeft, Building2, Check
} from "lucide-react";
import { Button, useCatalogPresenter } from "@2mart/ui";
import { commandBus } from "@2mart/core";
import { CreateOrderCommand } from "@2mart/domain";
import { useCurrentBranch, type BranchName } from "../hooks/useCurrentBranch";
import { useSession } from "../hooks/useSession";
import { getProductStockAtBranch, deductStockAfterSale } from "../utils/branchStock";
import { addStockAlert } from "../utils/stockAlerts";

interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

const POS_BRANCH_OPTIONS: { value: BranchName; label: string }[] = [
  { value: "285 Nguyễn Lương Bằng", label: "CS1: 285 Nguyễn Lương Bằng" },
  { value: "379b Tôn Đức Thắng", label: "CS2: 379b Tôn Đức Thắng" }
];

export function PosPage() {
  const { currentBranch, setCurrentBranch, isCS2 } = useCurrentBranch();
  const { session } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Checkout states
  const [discountStr, setDiscountStr] = useState<string>("");
  const [customerPaymentStr, setCustomerPaymentStr] = useState<string>("");

  // Payment Method States — 'mixed' = khách trả kết hợp tiền mặt + chuyển khoản
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank' | 'mixed'>('cash');
  const [mixedCashStr, setMixedCashStr] = useState<string>("");

  // Dropdown chọn chi nhánh trên thanh tiêu đề POS
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const [bankAccounts, setBankAccounts] = useState<{name: string, number: string}[]>([]);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [newBank, setNewBank] = useState({name: "", number: ""});

  const searchRef = useRef<HTMLDivElement>(null);

  // Click outside to close search dropdown / branch dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Read Model via Presenter (CQRS UI-03.5)
  const { items: products } = useCatalogPresenter();

  // Filter products for search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products
      .filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 10);
  }, [searchQuery, products]);

  const addToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.sku === product.sku);
      if (existing) {
        return prev.map(item => item.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { sku: product.sku, name: product.name, price: product.price, quantity: 1 }];
    });
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const updateQuantity = (sku: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.sku === sku) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (sku: string) => {
    setCartItems(prev => prev.filter(item => item.sku !== sku));
  };

  const formatCurrency = (num: number) => num.toLocaleString();
  const parseCurrencyStr = (str: string) => parseInt(str.replace(/\D/g, '')) || 0;

  const subTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = parseCurrencyStr(discountStr);
  const totalAmount = Math.max(0, subTotal - discount);
  const customerPayment = parseCurrencyStr(customerPaymentStr);
  const change = customerPayment > 0 ? customerPayment - totalAmount : 0;

  // Thanh toán kết hợp: nhập số tiền mặt, phần còn lại mặc định là chuyển khoản
  const mixedCash = Math.min(parseCurrencyStr(mixedCashStr), totalAmount);
  const mixedTransfer = Math.max(0, totalAmount - mixedCash);
  const isMixedInvalid = paymentMethod === "mixed" && (mixedCash <= 0 || mixedCash >= totalAmount);

  // Số tiền theo từng hình thức gửi kèm đơn hàng — nguồn số liệu cho chức năng Kết ca
  const paymentSplit = {
    cashAmount: paymentMethod === "cash" ? totalAmount : paymentMethod === "mixed" ? mixedCash : 0,
    transferAmount: paymentMethod === "bank" ? totalAmount : paymentMethod === "mixed" ? mixedTransfer : 0,
    cardAmount: paymentMethod === "card" ? totalAmount : 0
  };

  // Print Settings
  const [settings, setSettings] = useState({
    paperSize: "K80",
    autoPrint: true,
    storeName: "2Mart Supermarket",
    storeAddress: "285 Nguyễn Lương Bằng, Đống Đa, Hà Nội",
    storePhone: "1900 6522",
    receiptFooter: "Cảm ơn Quý khách & Hẹn gặp lại!"
  });

  useEffect(() => {
    const saved = localStorage.getItem("pos_settings");
    if (saved) {
      try {
        setSettings({ ...settings, ...JSON.parse(saved) });
      } catch (e) {}
    }
  }, []);

  // Ánh xạ tường minh sang mã hình thức thanh toán của hệ thống. Trước đây dùng
  // paymentMethod.toUpperCase() khiến 'bank' thành "BANK" (không hợp lệ) — mọi đơn chuyển khoản
  // bị ghi nhận nhầm thành tiền mặt.
  const PAYMENT_METHOD_MAP = { cash: "CASH", bank: "TRANSFER", card: "CARD", mixed: "MIXED" } as const;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    if (paymentMethod === "mixed" && isMixedInvalid) {
      alert("Thanh toán kết hợp: số tiền mặt phải lớn hơn 0 và nhỏ hơn tổng tiền đơn hàng.");
      return;
    }

    try {
      // CQRS UI-04: Dispatch Command instead of mutating LocalStorage directly!
      const res = await commandBus.execute(new CreateOrderCommand({
        customerName: "Khách lẻ tại quầy",
        employeeName: session?.name || "Thu ngân ca 1",
        employeeCode: session?.code,
        paymentMethod: PAYMENT_METHOD_MAP[paymentMethod],
        ...paymentSplit,
        branch: currentBranch,
        items: cartItems.map(c => ({
          sku: c.sku,
          name: c.name,
          quantity: c.quantity,
          price: c.price
        })),
        discount
      }));

      // Quy ước: KHÔNG chặn bán hàng khi tồn kho không đủ — vẫn lập hóa đơn & in bill bình thường,
      // nhưng ghi nhận lại để đề xuất Admin kiểm kê và điều chỉnh tồn kho.
      const orderCode = (res as any)?.code || "Mới";
      cartItems.forEach(c => {
        const product = products.find(p => p.sku === c.sku);
        const availableStock = getProductStockAtBranch(c.sku, product?.stock ?? 0, currentBranch);
        if (c.quantity > availableStock) {
          addStockAlert({
            sku: c.sku,
            productName: c.name,
            branch: currentBranch,
            orderCode,
            requestedQty: c.quantity,
            availableStockAtSale: availableStock,
            employeeName: session?.name || "Thu ngân ca 1"
          });
        }
      });

      deductStockAfterSale(cartItems.map(c => ({
        sku: c.sku,
        quantity: c.quantity,
        baseStock: products.find(p => p.sku === c.sku)?.stock
      })), currentBranch);

      alert(`Thanh toán thành công đơn hàng ${orderCode} (${formatCurrency(totalAmount)} VNĐ) tại ${currentBranch}! Tồn kho của cơ sở này đã tự động giảm chính xác.`);
    } catch (err: any) {
      alert(`Lỗi thanh toán: ${err.message || err}`);
    }

    // In Hóa Đơn Tự Động
    if (settings.autoPrint) {
      setTimeout(() => {
        window.print();
        setCartItems([]);
        setDiscountStr("");
        setCustomerPaymentStr("");
      }, 300);
    } else {
      setCartItems([]);
      setDiscountStr("");
      setCustomerPaymentStr("");
      setMixedCashStr("");
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#e9ebee] font-sans text-sm relative">
      {/* Header - Blue */}
      <header className="h-14 bg-[#0065ff] flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative w-96 flex items-center bg-white rounded overflow-visible z-50" ref={searchRef}>
            <Search className="w-4 h-4 text-slate-400 absolute left-2" />
            <input 
              type="text" 
              placeholder="Tìm hàng hóa (F3)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full pl-8 pr-10 py-2 text-sm focus:outline-none rounded"
            />
            <button className="absolute right-2 text-blue-600">
              <ScanLine className="w-5 h-5" />
            </button>
            
            {/* Search Dropdown */}
            {isSearchOpen && searchQuery && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-[400px] overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  searchResults.map(p => (
                    <div 
                      key={p.sku} 
                      onClick={() => addToCart(p)}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{p.sku}</span>
                          <span className="text-emerald-600 font-semibold">• Tồn kho ({isCS2 ? "CS2" : "CS1"}): {getProductStockAtBranch(p.sku, p.stock, currentBranch)}</span>
                        </div>
                      </div>
                      <div className="font-bold text-blue-600">{formatCurrency(p.price)}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500">Không tìm thấy hàng hóa</div>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-end self-end h-10 ml-4">
            <div className="bg-[#e9ebee] text-slate-800 px-4 py-2 rounded-t-lg flex items-center gap-4 text-sm font-medium border-t-2 border-blue-600">
              Hóa đơn 1
              <button className="hover:bg-slate-200 rounded p-0.5"><X className="w-3.5 h-3.5 text-slate-500" /></button>
            </div>
            <button className="w-8 h-8 flex items-center justify-center text-white hover:bg-blue-600/50 rounded ml-1 mb-1">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Header Right */}
        <div className="flex items-center gap-3 text-white">
          {/* Chọn chi nhánh bán hàng — dạng sổ xuống, đặt ngay cạnh nút Quản lý */}
          <div className="relative shrink-0" ref={branchDropdownRef}>
            <button
              onClick={() => setIsBranchDropdownOpen(v => !v)}
              className="flex items-center gap-2 bg-blue-800/80 hover:bg-blue-800 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white border border-blue-400/50 shadow-sm transition-all min-w-[210px] justify-between"
              title="Chọn cơ sở đang bán hàng"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                {isCS2 ? "CS2: 379b Tôn Đức Thắng" : "CS1: 285 Nguyễn Lương Bằng"}
              </span>
              <ChevronDown className={`w-4 h-4 opacity-70 transition-transform ${isBranchDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isBranchDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col z-[60] animate-in zoom-in-95 duration-150">
                {POS_BRANCH_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => { setCurrentBranch(option.value); setIsBranchDropdownOpen(false); }}
                    className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-blue-50 transition-colors ${currentBranch === option.value ? "bg-blue-50/80 text-blue-700 font-semibold" : "text-slate-700"}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      {option.label}
                    </span>
                    {currentBranch === option.value && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/"
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-1.5 rounded-lg text-sm font-semibold border border-blue-400/50 shadow-sm transition-all hover:-translate-y-0.5 mr-2"
            title="Quay về màn hình Quản lý"
          >
            <ArrowLeft className="w-4 h-4" /> Quản lý
          </Link>
          <div className="flex items-center gap-2 mr-2 border-l border-blue-500/50 pl-4">
            <button className="hover:bg-blue-600/50 p-1.5 rounded" title="Khóa màn hình (F9)"><Lock className="w-5 h-5" /></button>
            <button className="hover:bg-blue-600/50 p-1.5 rounded" title="Hoàn tác"><Undo2 className="w-5 h-5" /></button>
            <button className="hover:bg-blue-600/50 p-1.5 rounded" title="Đồng bộ"><RefreshCw className="w-5 h-5" /></button>
            <button className="hover:bg-blue-600/50 p-1.5 rounded" title="In" onClick={() => window.print()}><Printer className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-blue-600/50 px-2 py-1 rounded">
            <span className="font-medium">{session?.name || "admin"}</span>
          </div>
          <button className="hover:bg-blue-600/50 p-1.5 rounded"><Menu className="w-6 h-6" /></button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Area (Cart) */}
        <div className="flex-1 flex flex-col relative bg-[#f0f2f5]">
          
          {/* Cart List */}
          <div className="flex-1 overflow-auto bg-white m-2 rounded-lg shadow-sm border border-slate-200 pb-12">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Search className="w-16 h-16 mb-4 opacity-20" />
                <p>Chưa có sản phẩm nào trong đơn hàng</p>
                <p className="text-xs mt-1">Gõ mã hoặc tên sản phẩm vào ô tìm kiếm</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase bg-slate-50">
                    <th className="px-4 py-3 font-semibold">Tên hàng hóa</th>
                    <th className="px-4 py-3 font-semibold text-center w-32">Số lượng</th>
                    <th className="px-4 py-3 font-semibold text-right w-32">Đơn giá</th>
                    <th className="px-4 py-3 font-semibold text-right w-32">Thành tiền</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cartItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => updateQuantity(item.sku, -1)}
                            className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-semibold text-slate-700">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.sku, 1)}
                            className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(item.price * item.quantity)}</td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => removeFromCart(item.sku)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Note Input */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-white rounded-lg p-2.5 flex items-center gap-2 shadow-sm border border-slate-200">
              <PenSquare className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Ghi chú đơn hàng"
                className="w-full text-sm focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Right Area (Checkout Panel) */}
        <div className="w-[380px] bg-white flex flex-col shadow-[-2px_0_10px_rgba(0,0,0,0.05)] z-10">
          
          {/* Cashier Info */}
          <div className="flex items-center justify-between p-3 border-b border-slate-100 text-sm">
            <div className="flex items-center gap-1 text-slate-700 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded font-medium">
              {session?.name || "Admin 2Mart"} <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-slate-500">25/07/2026 06:45</div>
          </div>

          {/* Customer Search */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative flex items-center bg-slate-50 rounded border border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5" />
              <input 
                type="text" 
                placeholder="Tìm khách hàng (F4)"
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-transparent focus:outline-none"
              />
              <button className="absolute right-2 text-slate-400 hover:text-blue-600">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Summary Details */}
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex justify-between items-center text-slate-700">
                <span>Tổng tiền hàng</span>
                <div className="flex items-center gap-6">
                  <span className="text-slate-400 w-4 font-mono text-center">{cartItems.length > 0 ? cartItems.reduce((acc, i) => acc + i.quantity, 0) : 0}</span>
                  <span className="font-semibold w-24 text-right text-base">{formatCurrency(subTotal)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-slate-700">
                <span>Giảm giá</span>
                <input 
                  type="text" 
                  value={discountStr}
                  onChange={(e) => setDiscountStr(formatCurrency(parseCurrencyStr(e.target.value)))}
                  placeholder="0" 
                  className="w-24 text-right border-b border-slate-200 focus:outline-none focus:border-blue-500 font-semibold" 
                />
              </div>
              
              <div className="flex justify-between items-center text-slate-700">
                <span>Khách cần trả</span>
                <span className="text-blue-600 text-2xl font-bold">{formatCurrency(totalAmount)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-700 mt-2">
                <span>Khách thanh toán</span>
                <input 
                  type="text" 
                  value={customerPaymentStr}
                  onChange={(e) => setCustomerPaymentStr(formatCurrency(parseCurrencyStr(e.target.value)))}
                  placeholder="0" 
                  className="w-24 text-right border-b border-slate-200 focus:outline-none focus:border-blue-500 font-semibold" 
                />
              </div>
              
              <div className="flex justify-between items-center text-slate-700">
                <span>Tiền thừa trả khách</span>
                <span className="font-semibold w-24 text-right text-base">{customerPayment > 0 ? formatCurrency(change) : ""}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mt-6 flex flex-col gap-3">
              <div className="text-sm font-semibold text-slate-700">Phương thức thanh toán</div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${paymentMethod === 'cash' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Tiền mặt
                </button>
                <button 
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${paymentMethod === 'card' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Thẻ
                </button>
                <button
                  onClick={() => setPaymentMethod('bank')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${paymentMethod === 'bank' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Chuyển khoản
                </button>
                <button
                  onClick={() => setPaymentMethod('mixed')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${paymentMethod === 'mixed' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Kết hợp
                </button>
              </div>

              {/* Thanh toán kết hợp: nhập tiền mặt, phần còn lại tự tính là chuyển khoản.
                  Ghi nhận riêng 2 số này để khi Kết ca ra đúng số tiền thực tế từng loại. */}
              {paymentMethod === 'mixed' && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-700 font-medium">Tiền mặt khách trả</span>
                    <input
                      type="text"
                      value={mixedCashStr ? formatCurrency(mixedCash) : ""}
                      onChange={(e) => setMixedCashStr(e.target.value)}
                      placeholder="0"
                      className="w-28 text-right border-b border-slate-300 bg-transparent focus:outline-none focus:border-blue-500 font-bold text-slate-800"
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-700 font-medium">Còn lại chuyển khoản</span>
                    <span className="w-28 text-right font-bold text-blue-700">{formatCurrency(mixedTransfer)}</span>
                  </div>
                  {isMixedInvalid && (
                    <div className="text-xs text-red-600 font-medium pt-1 border-t border-slate-200">
                      Nhập số tiền mặt lớn hơn 0 và nhỏ hơn tổng tiền đơn ({formatCurrency(totalAmount)} đ).
                    </div>
                  )}
                </div>
              )}

              {/* Bank Accounts List (if Bank is selected) */}
              {paymentMethod === 'bank' && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  {bankAccounts.length === 0 ? (
                    <div className="text-center text-sm text-slate-500 py-2">
                      Bạn chưa có tài khoản ngân hàng
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 mb-2">
                      {bankAccounts.map((acc, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-2 border border-slate-200 rounded text-sm cursor-pointer hover:border-blue-400">
                          <span className="font-medium text-slate-700">{acc.name}</span>
                          <span className="text-slate-500">{acc.number}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button 
                    onClick={() => setIsAddBankModalOpen(true)}
                    className="w-full mt-1 flex items-center justify-center gap-1 text-sm text-blue-600 font-medium hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Thêm tài khoản
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Checkout Button */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Button 
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              className={`w-full h-14 font-bold text-lg rounded-xl shadow-sm transition-all ${
                cartItems.length > 0 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md hover:-translate-y-0.5' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              THANH TOÁN
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 bg-white border-t border-slate-200 flex items-center justify-between px-4 shrink-0 text-sm z-20">
        <div className="flex items-center gap-4 text-slate-500 text-xs">
          <span>💡 Phím tắt: <strong className="text-slate-700">F3</strong> Tìm hàng | <strong className="text-slate-700">F4</strong> Khách hàng | <strong className="text-slate-700">F9</strong> Khóa máy</span>
        </div>
        
        <div className="flex items-center gap-6 text-slate-600">
          <button className="hover:bg-slate-100 p-1.5 rounded text-slate-400 hover:text-blue-600 transition-colors" title="Làm mới">
            <RefreshCcw className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2.5 py-1.5 rounded border border-transparent hover:border-slate-200 transition-all">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-slate-700">{currentBranch}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          
          <div className="flex items-center gap-2">
            <button className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors" title="Trợ giúp">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* Add Bank Modal */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-96 max-w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Thêm tài khoản ngân hàng</h3>
              <button onClick={() => setIsAddBankModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên Ngân hàng</label>
                <input 
                  type="text" 
                  placeholder="VD: Vietcombank, Techcombank..." 
                  value={newBank.name}
                  onChange={(e) => setNewBank({...newBank, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số Tài khoản</label>
                <input 
                  type="text" 
                  placeholder="Nhập số tài khoản" 
                  value={newBank.number}
                  onChange={(e) => setNewBank({...newBank, number: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <Button variant="outline" onClick={() => setIsAddBankModalOpen(false)} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100">
                Hủy bỏ
              </Button>
              <Button 
                onClick={() => {
                  if (newBank.name && newBank.number) {
                    setBankAccounts([...bankAccounts, newBank]);
                    setNewBank({name: "", number: ""});
                    setIsAddBankModalOpen(false);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!newBank.name || !newBank.number}
              >
                Thêm tài khoản
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Area */}
      <div id="print-section" className="hidden print:block text-black font-mono text-xs p-2 bg-white" style={{ width: settings.paperSize === 'K80' ? '300px' : settings.paperSize === 'K58' ? '220px' : '100%' }}>
        <div className="text-center mb-4 border-b border-dashed border-gray-400 pb-2">
          <h2 className="font-bold text-base">{settings.storeName}</h2>
          <p>{settings.storeAddress}</p>
          <p>ĐT: {settings.storePhone}</p>
        </div>
        <h3 className="text-center font-bold text-sm mb-2">HÓA ĐƠN BÁN LẺ</h3>
        <div className="flex justify-between mb-2 border-b border-dashed border-gray-400 pb-2">
          <span>Số: HD{Math.floor(Math.random() * 10000)}</span>
          <span>{new Date().toLocaleDateString('vi-VN')}</span>
        </div>
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="flex justify-between font-bold">
            <span>Sản phẩm</span>
            <span>TT</span>
          </div>
          {cartItems.map((item, i) => (
            <div key={i} className="flex justify-between mt-1">
              <span>{item.name} x{item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold text-sm mt-2">
          <span>TỔNG TIỀN</span>
          <span>{formatCurrency(subTotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm mt-1">
            <span>Giảm giá</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm mt-1">
          <span>KHÁCH CẦN TRẢ</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span>Khách thanh toán</span>
          <span>{formatCurrency(customerPayment)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span>Tiền thừa</span>
          <span>{formatCurrency(change)}</span>
        </div>
        <div className="text-center mt-6 border-t border-dashed border-gray-400 pt-2">
          <p>{settings.receiptFooter}</p>
        </div>
      </div>
    </div>
  );
}
