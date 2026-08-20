import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, ScanLine, Plus, X,
  ChevronDown, PenSquare, ArrowLeft,
  Trash2, Minus, Building2, Check
} from "lucide-react";
import { Button, useCatalogPresenter } from "@2mart/ui";
import { commandBus } from "@2mart/core";
import { CreateOrderCommand } from "@2mart/domain";
import { useCurrentBranch, type BranchName } from "../hooks/useCurrentBranch";
import { useSession } from "../hooks/useSession";
import { deductStockAfterSale, getProductStockAtBranch } from "../utils/branchStock";
import { addStockAlert } from "../utils/stockAlerts";
import { BarcodeScannerModal } from "../components/BarcodeScannerModal";

interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderTab {
  id: string;
  title: string;
  cartItems: CartItem[];
  discountStr: string;
  customerPaymentStr: string;
  paymentMethod: 'cash' | 'card' | 'bank' | 'mixed';
  mixedCashStr: string;
}

const POS_BRANCH_OPTIONS: { value: BranchName; label: string }[] = [
  { value: "285 Nguyễn Lương Bằng", label: "CS2: 285 Nguyễn Lương Bằng" },
  { value: "379b Tôn Đức Thắng", label: "CS1: 379b Tôn Đức Thắng" }
];

export function PosPage() {
  const { currentBranch, setCurrentBranch, isCS2 } = useCurrentBranch();
  const { session } = useSession();
  const [tabs, setTabs] = useState<OrderTab[]>([
    { id: '1', title: 'Hóa đơn 1', cartItems: [], discountStr: '', customerPaymentStr: '', paymentMethod: 'cash', mixedCashStr: '' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const currentTab = useMemo(() => tabs.find(t => t.id === activeTabId) || tabs[0], [tabs, activeTabId]);
  const updateCurrentTab = (updates: Partial<OrderTab>) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t));
  };

  const { cartItems, discountStr, customerPaymentStr, paymentMethod, mixedCashStr } = currentTab;

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Dropdown chọn chi nhánh trên thanh tiêu đề POS
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const [bankAccounts, setBankAccounts] = useState<{name: string, number: string}[]>([]);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [newBank, setNewBank] = useState({name: "", number: ""});

  const searchRef = useRef<HTMLDivElement>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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

  const handleAddTab = () => {
    const maxNum = tabs.reduce((max, t) => {
      const match = t.title.match(/Hóa đơn (\d+)/);
      if (match) return Math.max(max, parseInt(match[1]));
      return max;
    }, 0);
    const newId = Date.now().toString();
    setTabs(prev => [...prev, { id: newId, title: `Hóa đơn ${maxNum + 1}`, cartItems: [], discountStr: '', customerPaymentStr: '', paymentMethod: 'cash', mixedCashStr: '' }]);
    setActiveTabId(newId);
  };

  const handleRemoveTab = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const idx = tabs.findIndex(t => t.id === id);
    const nextTab = tabs[idx - 1] || tabs[idx + 1];
    const fallbackId = Date.now().toString();
    const newActiveId = nextTab ? nextTab.id : fallbackId;
    
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (newTabs.length === 0) {
         return [{ id: fallbackId, title: 'Hóa đơn 1', cartItems: [], discountStr: '', customerPaymentStr: '', paymentMethod: 'cash', mixedCashStr: '' }];
      }
      return newTabs;
    });
    
    if (activeTabId === id) {
       setActiveTabId(newActiveId);
    }
  };

  const addToCart = (product: any) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t;
      const existing = t.cartItems.find(item => item.sku === product.sku);
      if (existing) {
        return { ...t, cartItems: t.cartItems.map(item => item.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item) };
      }
      return { ...t, cartItems: [...t.cartItems, { sku: product.sku, name: product.name, price: product.price, quantity: 1 }] };
    }));
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const updateQuantity = (sku: string, delta: number) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t;
      return { ...t, cartItems: t.cartItems.map(item => {
        if (item.sku === sku) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })};
    }));
  };

  const removeFromCart = (sku: string) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t;
      return { ...t, cartItems: t.cartItems.filter(item => item.sku !== sku) };
    }));
  };

  const formatCurrency = (num: number) => num.toLocaleString();
  const parseCurrencyStr = (str: string) => parseInt(str.replace(/\D/g, '')) || 0;

  const subTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = parseCurrencyStr(discountStr);
  const tax = subTotal * 0.015;
  const totalAmount = Math.max(0, subTotal + tax - discount);
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
    if (cartItems.length === 0 || isProcessing) return;
    setIsProcessing(true);

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
      setIsProcessing(false);
      return;
    }

    // In Hóa Đơn Tự Động
    if (settings.autoPrint) {
      setTimeout(() => {
        window.print();
        handleRemoveTab(activeTabId);
        setIsProcessing(false);
      }, 300);
    } else {
      handleRemoveTab(activeTabId);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#e9ebee] font-sans text-sm relative">
      {/* Header - Blue */}
      <header className="h-14 bg-[#0065ff] flex items-center justify-between px-2 shrink-0 gap-2">
        <div className="flex items-center gap-2 flex-1 w-full min-w-0">
          {/* Search Box */}
          <div className="relative w-[45%] lg:w-96 flex-shrink-0 flex items-center bg-white rounded overflow-visible z-50" ref={searchRef}>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.toLowerCase().trim();
                  if (!val) return;
                  const matches = products.filter(p => p.name.toLowerCase().includes(val) || p.sku.toLowerCase().includes(val));
                  if (matches.length > 0) {
                    addToCart(matches[0]);
                  }
                }
              }}
              className="w-full pl-8 pr-10 py-2 text-sm focus:outline-none rounded"
            />
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="absolute right-2 text-blue-600 hover:bg-blue-50 p-1.5 rounded-full transition-colors"
            >
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
                          <span className="text-emerald-600 font-semibold">• Tồn kho ({isCS2 ? "CS2" : "CS1"}): {p.stock}</span>
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
          <div className="flex items-end self-end h-10 ml-1 lg:ml-4 flex-1 overflow-x-auto scrollbar-hide no-scrollbar min-w-0">
            {tabs.map(tab => (
              <div 
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex-shrink-0 cursor-pointer px-3 lg:px-4 py-2 rounded-t-lg flex items-center gap-2 lg:gap-4 text-sm font-medium mr-1 transition-colors ${tab.id === activeTabId ? 'bg-[#e9ebee] text-slate-800 border-t-2 border-blue-600' : 'bg-blue-700/50 text-blue-100 hover:bg-blue-600 border-t-2 border-transparent'}`}
              >
                <span className="truncate max-w-[80px] lg:max-w-none">{tab.title}</span>
                <button 
                  onClick={(e) => handleRemoveTab(tab.id, e)}
                  className={`rounded p-0.5 ${tab.id === activeTabId ? 'hover:bg-slate-200' : 'hover:bg-blue-500/50'}`}
                >
                  <X className={`w-3.5 h-3.5 ${tab.id === activeTabId ? 'text-slate-500' : 'text-blue-200'}`} />
                </button>
              </div>
            ))}
            <button onClick={handleAddTab} className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-white hover:bg-blue-600/50 rounded ml-1 mb-1">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Header Right */}
        <div className="flex items-center gap-2 text-white flex-shrink-0">
          {/* Chọn chi nhánh bán hàng — dạng sổ xuống, đặt ngay cạnh nút Quản lý */}
          <div className="relative shrink-0 hidden lg:block" ref={branchDropdownRef}>
            <button
              onClick={() => setIsBranchDropdownOpen(v => !v)}
              className="flex items-center gap-2 bg-blue-800/80 hover:bg-blue-800 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white border border-blue-400/50 shadow-sm transition-all min-w-[210px] justify-between"
              title="Chọn cơ sở đang bán hàng"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                {POS_BRANCH_OPTIONS.find(o => o.value === currentBranch)?.label || currentBranch}
              </span>
              <ChevronDown className={`w-4 h-4 opacity-70 transition-transform ${isBranchDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isBranchDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col z-[60] animate-in zoom-in-95 duration-150">
                {POS_BRANCH_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => { 
                      setCurrentBranch(option.value); 
                      setIsBranchDropdownOpen(false);
                    }}
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
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-2.5 lg:px-3.5 py-1.5 rounded-lg text-sm font-semibold border border-blue-400/50 shadow-sm transition-all hover:-translate-y-0.5"
            title="Quay về màn hình Quản lý"
          >
            <ArrowLeft className="w-4 h-4" /> Quản lý
          </Link>

          <div className="hidden lg:flex items-center gap-2 cursor-pointer hover:bg-blue-600/50 px-2 py-1 rounded">
            <span className="font-medium">{session?.name || "admin"}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Area (Cart) - scrollable */}
        <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden min-h-0">
          
          {/* Cart List - scrolls */}
          <div className="flex-1 overflow-y-auto bg-white lg:m-2 rounded-lg shadow-sm border-t lg:border border-slate-200">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4 text-center">
                <Search className="w-16 h-16 mb-4 opacity-20" />
                <p>Chưa có sản phẩm nào trong đơn hàng</p>
                <p className="text-xs mt-1">Gõ mã hoặc tên sản phẩm vào ô tìm kiếm</p>
              </div>
            ) : (
              <div className="flex flex-col w-full">
                {/* Table Header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 text-slate-500 text-xs uppercase bg-slate-50 font-semibold">
                  <div className="flex-1">Tên hàng hóa</div>
                  <div className="w-[84px] text-center">Số lượng</div>
                  <div className="w-20 text-right">Thành tiền</div>
                  <div className="w-6"></div>
                </div>
                
                {/* List Body */}
                <div className="flex flex-col divide-y divide-slate-100">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50/30 transition-colors border-b border-slate-100 last:border-0">
                      
                      {/* Name + SKU */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 text-sm truncate">{item.name}</div>
                        <div className="text-xs text-slate-400 truncate">{item.sku}</div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => updateQuantity(item.sku, -1)}
                          className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 bg-white hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-sm text-slate-800">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.sku, 1)}
                          className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 bg-white hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total Price */}
                      <div className="w-20 text-right font-bold text-blue-700 text-sm shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </div>

                      {/* Trash */}
                      <button 
                        onClick={() => removeFromCart(item.sku)}
                        className="text-slate-300 hover:text-red-500 transition-colors shrink-0 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Area (Checkout Panel) - fixed on mobile, sidebar on desktop */}
        <div className="w-full lg:w-[400px] bg-white flex flex-col z-20 border-t border-slate-200 lg:border-t-0 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] lg:shadow-[-2px_0_10px_rgba(0,0,0,0.05)] shrink-0 lg:h-full">
          
          {/* Cashier Info */}
          <div className="hidden lg:flex items-center justify-between p-3 border-b border-slate-100 text-sm">
            <div className="flex items-center gap-1 text-slate-700 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded font-medium">
              {session?.name || "Admin 2Mart"} <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-slate-500">25/07/2026 06:45</div>
          </div>

          {/* Customer Search - Hidden on mobile as per requirement */}
          <div className="p-3 border-b border-slate-100 hidden lg:block">
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
          <div className="p-3 lg:p-4 lg:flex-1 lg:overflow-y-auto">
            {/* Note Input (Moved here for mobile compactness) */}
            <div className="mb-3">
              <div className="bg-slate-50 rounded-lg p-2 flex items-center gap-2 border border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                <PenSquare className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Ghi chú đơn hàng"
                  className="w-full text-sm bg-transparent focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5 lg:gap-4 text-sm">
              <div className="flex justify-between items-center text-slate-700">
                <span>Tổng tiền hàng</span>
                <div className="flex items-center gap-4 lg:gap-6">
                  <span className="text-slate-400 w-4 font-mono text-center">{cartItems.length > 0 ? cartItems.reduce((acc, i) => acc + i.quantity, 0) : 0}</span>
                  <span className="font-semibold w-24 text-right text-base">{formatCurrency(subTotal)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-slate-700">
                <span>Giảm giá</span>
                <input 
                  type="text" 
                  value={discountStr}
                  onChange={(e) => updateCurrentTab({ discountStr: formatCurrency(parseCurrencyStr(e.target.value)) })}
                  placeholder="0" 
                  className="w-24 text-right border-b border-slate-200 focus:outline-none focus:border-blue-500 font-semibold" 
                />
              </div>

              <div className="flex justify-between items-center text-slate-700">
                <span>Thuế (1.5%)</span>
                <span className="font-semibold">{formatCurrency(tax)}</span>
              </div>
              
              <div className="flex justify-between items-center text-slate-700">
                <span>Khách cần trả</span>
                <span className="text-blue-600 text-xl lg:text-2xl font-bold">{formatCurrency(totalAmount)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-700">
                <span>Khách thanh toán</span>
                <input 
                  type="text" 
                  value={customerPaymentStr}
                  onChange={(e) => updateCurrentTab({ customerPaymentStr: formatCurrency(parseCurrencyStr(e.target.value)) })}
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
            <div className="mt-3 lg:mt-6 flex flex-col gap-2 lg:gap-3">
              <div className="text-xs lg:text-sm font-semibold text-slate-700">Phương thức thanh toán</div>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateCurrentTab({ paymentMethod: 'cash' })}
                  className={`flex-1 py-3 lg:py-2 text-sm font-bold lg:font-medium rounded-lg border transition-colors ${paymentMethod === 'cash' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Tiền mặt
                </button>
                <button
                  onClick={() => updateCurrentTab({ paymentMethod: 'bank' })}
                  className={`flex-1 py-3 lg:py-2 text-sm font-bold lg:font-medium rounded-lg border transition-colors ${paymentMethod === 'bank' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Chuyển khoản
                </button>
                <button
                  onClick={() => updateCurrentTab({ paymentMethod: 'mixed' })}
                  className={`flex-1 py-3 lg:py-2 text-sm font-bold lg:font-medium rounded-lg border transition-colors ${paymentMethod === 'mixed' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Kết hợp
                </button>
              </div>

              {/* Thanh toán kết hợp: nhập tiền mặt, phần còn lại tự tính là chuyển khoản. */}
              {paymentMethod === 'mixed' && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-700 font-medium">Tiền mặt khách trả</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={mixedCashStr ? formatCurrency(mixedCash) : ""}
                      onChange={(e) => updateCurrentTab({ mixedCashStr: e.target.value })}
                      placeholder="0"
                      className="w-28 lg:w-32 text-right border-b border-slate-300 bg-transparent focus:outline-none focus:border-blue-500 font-bold text-slate-800 text-lg lg:text-base"
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-700 font-medium">Còn lại chuyển khoản</span>
                    <span className="w-28 lg:w-32 text-right font-bold text-blue-700 text-lg lg:text-base">{formatCurrency(mixedTransfer)}</span>
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
                    className="w-full mt-1 flex items-center justify-center gap-1 text-sm text-blue-600 font-medium hover:underline p-2"
                  >
                    <Plus className="w-4 h-4" /> Thêm tài khoản
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Checkout Button - Sticky Bottom on Mobile */}
          <div className="p-3 lg:p-4 border-t border-slate-200 bg-white sticky bottom-0 z-50">
            <Button 
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || isProcessing}
              className={`w-full h-14 lg:h-16 font-extrabold text-xl lg:text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                cartItems.length > 0 
                  ? 'bg-[#0065ff] hover:bg-blue-700 text-white hover:shadow-xl hover:-translate-y-0.5' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isProcessing ? "ĐANG XỬ LÝ..." : "HOÀN THÀNH ĐƠN HÀNG"}
            </Button>
          </div>
        </div>
      </main>



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
        <div className="flex justify-between text-sm mt-1">
          <span>Thuế (1.5%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
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
      
      {/* Barcode Scanner */}
      <BarcodeScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={(text) => {
          setIsScannerOpen(false);
          const product = products.find(p => p.sku === text || p.name.toLowerCase().includes(text.toLowerCase()));
          if (product) {
            addToCart(product);
          } else {
            alert(`Không tìm thấy hàng hóa nào với mã/tên: ${text}`);
          }
        }}
      />
    </div>
  );
}
