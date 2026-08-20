import os
import re

file_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src\pages\PosPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add OrderTab interface
cart_item_def = """interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
}"""

order_tab_def = """interface CartItem {
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
}"""

content = content.replace(cart_item_def, order_tab_def)

# 2. Update state declarations
old_states = """  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Checkout states
  const [discountStr, setDiscountStr] = useState<string>("");
  const [customerPaymentStr, setCustomerPaymentStr] = useState<string>("");

  // Payment Method States — 'mixed' = khách trả kết hợp tiền mặt + chuyển khoản
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank' | 'mixed'>('cash');
  const [mixedCashStr, setMixedCashStr] = useState<string>("");"""

new_states = """  const [tabs, setTabs] = useState<OrderTab[]>([
    { id: '1', title: 'Hóa đơn 1', cartItems: [], discountStr: '', customerPaymentStr: '', paymentMethod: 'cash', mixedCashStr: '' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  
  const currentTab = useMemo(() => tabs.find(t => t.id === activeTabId) || tabs[0], [tabs, activeTabId]);
  const updateCurrentTab = (updates: Partial<OrderTab>) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t));
  };

  const { cartItems, discountStr, customerPaymentStr, paymentMethod, mixedCashStr } = currentTab;

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);"""

content = content.replace(old_states, new_states)

# 3. Add handleAddTab & handleRemoveTab inside component (before addToCart)
old_addToCart = """  const addToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.sku === product.sku);
      if (existing) {
        return prev.map(item => item.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { sku: product.sku, name: product.name, price: product.price, quantity: 1 }];
    });
    setSearchQuery("");
    setIsSearchOpen(false);
  };"""

new_addToCart = """  const handleAddTab = () => {
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
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (newTabs.length === 0) {
         return [{ id: Date.now().toString(), title: 'Hóa đơn 1', cartItems: [], discountStr: '', customerPaymentStr: '', paymentMethod: 'cash', mixedCashStr: '' }];
      }
      return newTabs;
    });
    if (activeTabId === id) {
       const idx = tabs.findIndex(t => t.id === id);
       const nextTab = tabs[idx - 1] || tabs[idx + 1] || tabs[0];
       if (nextTab && nextTab.id !== id) {
           setActiveTabId(nextTab.id);
       } else {
           setActiveTabId(tabs[0]?.id || Date.now().toString());
       }
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
  };"""

content = content.replace(old_addToCart, new_addToCart)

# 4. updateQuantity and removeFromCart
old_updateQuantity = """  const updateQuantity = (sku: string, delta: number) => {
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
  };"""

new_updateQuantity = """  const updateQuantity = (sku: string, delta: number) => {
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
  };"""

content = content.replace(old_updateQuantity, new_updateQuantity)

# 5. Reset states in checkout
old_checkout_reset = """    if (settings.autoPrint) {
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
    }"""

new_checkout_reset = """    if (settings.autoPrint) {
      setTimeout(() => {
        window.print();
        handleRemoveTab(activeTabId);
      }, 300);
    } else {
      handleRemoveTab(activeTabId);
    }"""

content = content.replace(old_checkout_reset, new_checkout_reset)

# 6. Tab rendering
old_tabs_render = """          {/* Tabs */}
          <div className="flex items-end self-end h-10 ml-4">
            <div className="bg-[#e9ebee] text-slate-800 px-4 py-2 rounded-t-lg flex items-center gap-4 text-sm font-medium border-t-2 border-blue-600">
              Hóa đơn 1
              <button className="hover:bg-slate-200 rounded p-0.5"><X className="w-3.5 h-3.5 text-slate-500" /></button>
            </div>
            <button className="w-8 h-8 flex items-center justify-center text-white hover:bg-blue-600/50 rounded ml-1 mb-1">
              <Plus className="w-5 h-5" />
            </button>
          </div>"""

new_tabs_render = """          {/* Tabs */}
          <div className="flex items-end self-end h-10 ml-4 max-w-2xl overflow-x-auto scrollbar-hide no-scrollbar">
            {tabs.map(tab => (
              <div 
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex-shrink-0 cursor-pointer px-4 py-2 rounded-t-lg flex items-center gap-4 text-sm font-medium mr-1 transition-colors ${tab.id === activeTabId ? 'bg-[#e9ebee] text-slate-800 border-t-2 border-blue-600' : 'bg-blue-700/50 text-blue-100 hover:bg-blue-600 border-t-2 border-transparent'}`}
              >
                {tab.title}
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
          </div>"""

content = content.replace(old_tabs_render, new_tabs_render)

# 7. update handlers in checkout panel
content = content.replace(
    'onChange={(e) => setDiscountStr(formatCurrency(parseCurrencyStr(e.target.value)))}',
    'onChange={(e) => updateCurrentTab({ discountStr: formatCurrency(parseCurrencyStr(e.target.value)) })}'
)
content = content.replace(
    'onChange={(e) => setCustomerPaymentStr(formatCurrency(parseCurrencyStr(e.target.value)))}',
    'onChange={(e) => updateCurrentTab({ customerPaymentStr: formatCurrency(parseCurrencyStr(e.target.value)) })}'
)
content = content.replace(
    "onClick={() => setPaymentMethod('cash')}",
    "onClick={() => updateCurrentTab({ paymentMethod: 'cash' })}"
)
content = content.replace(
    "onClick={() => setPaymentMethod('card')}",
    "onClick={() => updateCurrentTab({ paymentMethod: 'card' })}"
)
content = content.replace(
    "onClick={() => setPaymentMethod('bank')}",
    "onClick={() => updateCurrentTab({ paymentMethod: 'bank' })}"
)
content = content.replace(
    "onClick={() => setPaymentMethod('mixed')}",
    "onClick={() => updateCurrentTab({ paymentMethod: 'mixed' })}"
)
content = content.replace(
    'onChange={(e) => setMixedCashStr(e.target.value)}',
    'onChange={(e) => updateCurrentTab({ mixedCashStr: e.target.value })}'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied multi tab changes to PosPage.tsx")
