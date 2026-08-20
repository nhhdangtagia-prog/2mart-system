import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@2mart/ui";
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, ChevronDown, Truck, Briefcase, Wallet, BarChart2, X, Menu, Play } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSession } from "../hooks/useSession";

type SubMenuItem = { label: string; path: string; isNew?: boolean };
type MenuItem = {
  id: string;
  icon: any;
  label: string;
  path?: string;
  subItems?: SubMenuItem[];
};

const ADMIN_MENU_ITEMS: MenuItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Tổng quan", path: "/" },
  {
    id: "inventory", icon: Package, label: "Hàng hóa",
    subItems: [
      { label: "Danh mục", path: "/inventory" },
      { label: "Thiết lập giá", path: "/inventory/prices" },
      { label: "Kiểm kho", path: "/inventory/audit" }
    ]
  },
  {
    id: "orders", icon: ShoppingCart, label: "Giao dịch",
    subItems: [
      { label: "Hóa đơn", path: "/orders/invoices" },
      { label: "Đặt hàng", path: "/orders/booking" },
      { label: "Trả hàng", path: "/orders/returns" }
    ]
  },
  {
    id: "purchase", icon: Truck, label: "Mua hàng",
    subItems: [
      { label: "Nhập hàng", path: "/purchase/import" },
      { label: "Trả hàng nhập", path: "/purchase/returns" },
      { label: "Hóa đơn đầu vào", path: "/purchase/invoices", isNew: true },
      { label: "Nhà cung cấp", path: "/suppliers" }
    ]
  },
  {
    id: "employees", icon: Briefcase, label: "Nhân viên",
    subItems: [
      { label: "Danh sách nhân viên", path: "/employees/list" },
      { label: "Lịch làm việc", path: "/employees/schedule" },
      { label: "Bảng chấm công", path: "/employees/timesheet" },
      { label: "Bảng lương", path: "/employees/payroll" },
      { label: "Ứng lương", path: "/employees/salary-advances" },
      { label: "Thiết lập nhân viên", path: "/employees/settings" }
    ]
  },
  {
    id: "cashbook", icon: Wallet, label: "Sổ quỹ",
    subItems: [
      { label: "Phiếu thu", path: "/cashbook/receipts" },
      { label: "Phiếu chi", path: "/cashbook/payments" },
      { label: "Sổ quỹ", path: "/cashbook/report" }
    ]
  },
  {
    id: "analytics", icon: BarChart2, label: "Phân tích",
    subItems: [
      { label: "Cuối ngày", path: "/analytics/eod" },
      { label: "Bán hàng", path: "/analytics/sales" },
      { label: "Hàng hóa", path: "/analytics/inventory" },
      { label: "Tài chính", path: "/analytics/finance" }
    ]
  },
  { id: "karabox", icon: Play, label: "Karabox", path: "/karabox" }
];

const STAFF_MENU_ITEMS: MenuItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Tổng quan", path: "/" },
  {
    id: "inventory", icon: Package, label: "Hàng hóa",
    subItems: [{ label: "Danh mục", path: "/inventory" }]
  },
  {
    id: "purchase", icon: Truck, label: "Mua hàng",
    subItems: [
      { label: "Nhập hàng", path: "/purchase/import" },
      { label: "Nhà cung cấp", path: "/suppliers" }
    ]
  },
  {
    id: "orders", icon: ShoppingCart, label: "Giao dịch",
    subItems: [{ label: "Hóa đơn của tôi", path: "/orders/invoices" }]
  },
  {
    id: "cashbook", icon: Wallet, label: "Sổ quỹ",
    subItems: [
      { label: "Phiếu thu", path: "/cashbook/receipts" },
      { label: "Phiếu chi", path: "/cashbook/payments" },
      { label: "Sổ quỹ", path: "/cashbook/report" }
    ]
  },
  {
    id: "employees", icon: Briefcase, label: "Nhân viên",
    subItems: [
      { label: "Lịch làm việc", path: "/employees/schedule" },
      { label: "Bảng chấm công", path: "/employees/timesheet" },
      { label: "Bảng lương", path: "/employees/payroll" },
      { label: "Ứng lương", path: "/employees/salary-advances" }
    ]
  },
  { id: "karabox", icon: Play, label: "Karabox", path: "/karabox" }
];

// ─── Dropdown item for horizontal nav ────────────────────────────────────────
function NavDropdown({ item, isActive }: { item: MenuItem; isActive: boolean }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<any>(null);
  const location = useLocation();

  const calcPos = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, []);

  const handleOpen = () => {
    calcPos();
    setOpen(o => !o);
  };

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    calcPos();
    setOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const Icon = item.icon;

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
          isActive
            ? "bg-blue-700 text-white"
            : "text-blue-100 hover:bg-blue-700/60 hover:text-white"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span>{item.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          ref={dropRef}
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left }}
          className="w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-[9999]"
        >
          {item.subItems!.map((sub, idx) => {
            const isSubActive = location.pathname === sub.path;
            return (
              <Link
                key={idx}
                to={sub.path}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  isSubActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>{sub.label}</span>
                {sub.isNew && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">MỚI</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Horizontal top nav (desktop) ────────────────────────────────────────────
export function TopNav() {
  const location = useLocation();
  const { session } = useSession();
  const isStaff = session?.accessLevel === "staff";
  const MENU_ITEMS = isStaff ? STAFF_MENU_ITEMS : ADMIN_MENU_ITEMS;

  const isPathActive = (item: MenuItem) => {
    if (item.path) return item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
    return item.subItems?.some(s => location.pathname.startsWith(s.path)) ?? false;
  };

  return (
    <nav className="hidden lg:flex items-center gap-1 px-2 flex-1">
      {MENU_ITEMS.map(item => {
        const active = isPathActive(item);
        const Icon = item.icon;

        if (item.path && !item.subItems) {
          return (
            <Link key={item.id} to={item.path}>
              <button className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                active ? "bg-blue-700 text-white" : "text-blue-100 hover:bg-blue-700/60 hover:text-white"
              }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            </Link>
          );
        }

        return <NavDropdown key={item.id} item={item} isActive={active} />;
      })}

      {!isStaff && (
        <Link to="/settings">
          <button className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            location.pathname === "/settings" ? "bg-blue-700 text-white" : "text-blue-100 hover:bg-blue-700/60 hover:text-white"
          }`}>
            <Settings className="w-4 h-4 shrink-0" />
            <span>Thiết lập</span>
          </button>
        </Link>
      )}
    </nav>
  );
}

// ─── Vertical sidebar (mobile drawer) ────────────────────────────────────────
export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const { session } = useSession();
  const isStaff = session?.accessLevel === "staff";
  const MENU_ITEMS = isStaff ? STAFF_MENU_ITEMS : ADMIN_MENU_ITEMS;

  const isPathActive = (path: string) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const toggleMenu = (id: string) => setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      {/* Hamburger button - only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 text-white hover:bg-blue-700 rounded-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-blue-600 flex flex-col animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-blue-700/50">
              <img src="/logo.png" alt="2!Mart" className="h-10 object-contain" />
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-blue-700 rounded-lg text-blue-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {MENU_ITEMS.map(item => {
                const isActive = item.path ? isPathActive(item.path) : item.subItems?.some(s => isPathActive(s.path));
                const isExpanded = expandedMenus[item.id];
                const Icon = item.icon;

                return (
                  <div key={item.id} className="flex flex-col mb-1">
                    {item.path && !item.subItems ? (
                      <Link to={item.path} onClick={() => setOpen(false)}>
                        <Button variant="ghost" className={`w-full gap-3 h-10 px-3 justify-start ${isActive ? 'bg-blue-700 text-white font-medium' : 'text-blue-100 hover:text-white hover:bg-blue-500/50'}`}>
                          <Icon className="w-5 h-5 shrink-0" />
                          <span>{item.label}</span>
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="ghost" onClick={() => toggleMenu(item.id)} className={`w-full gap-3 h-10 px-3 justify-between ${isActive ? 'text-white font-medium' : 'text-blue-100 hover:text-white hover:bg-blue-500/50'}`}>
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 opacity-70 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </Button>
                    )}

                    {item.subItems && isExpanded && (
                      <div className="flex flex-col mt-1 mb-2 space-y-1 relative before:absolute before:left-5 before:top-0 before:bottom-2 before:w-[1px] before:bg-blue-500/50">
                        {item.subItems.map((sub, idx) => {
                          const isSubActive = location.pathname === sub.path;
                          return (
                            <Link key={idx} to={sub.path} onClick={() => setOpen(false)} className="relative z-10 flex items-center pl-10 pr-3">
                              <div className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${isSubActive ? 'bg-blue-700/80 text-white font-medium' : 'text-blue-200 hover:text-white hover:bg-blue-500/30'}`}>
                                <span className="text-sm">{sub.label}</span>
                                {sub.isNew && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">MỚI</span>}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!isStaff && (
              <div className="p-3 border-t border-blue-700/50">
                <Link to="/settings" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-blue-100 hover:text-white hover:bg-blue-500/50 h-10 px-3">
                    <Settings className="w-5 h-5" />
                    Thiết lập
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Keep backward compat export
export function Sidebar() { return null; }
