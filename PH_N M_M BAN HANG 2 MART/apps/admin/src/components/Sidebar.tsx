import { useState } from "react";
import { Button } from "@2mart/ui";
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, ChevronDown, ChevronRight, Truck, Briefcase, Wallet, BarChart2 } from "lucide-react";
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
      { label: "Hóa đơn đầu vào", path: "/purchase/invoices", isNew: true }
    ]
  },
  {
    id: "partners", icon: Users, label: "Đối tác",
    subItems: [
      { label: "Khách hàng", path: "/customers" },
      { label: "Nhà cung cấp", path: "/suppliers" },
      { label: "Đối tác giao hàng", path: "/delivery" }
    ]
  },
  {
    id: "employees", icon: Briefcase, label: "Nhân viên",
    subItems: [
      { label: "Danh sách nhân viên", path: "/employees/list" },
      { label: "Lịch làm việc", path: "/employees/schedule" },
      { label: "Bảng chấm công", path: "/employees/timesheet" },
      { label: "Bảng lương", path: "/employees/payroll" },
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
  }
];

// Nhân viên bán hàng chỉ thấy các mục liên quan trực tiếp đến công việc của chính họ
// (dữ liệu bên trong mỗi trang đã tự lọc theo tài khoản đăng nhập). Các mục quản trị
// khác (Hàng hóa, Mua hàng, Đối tác, Sổ quỹ, Phân tích, Danh sách NV...) đang ẩn —
// cần mở thêm mục nào cho nhân viên thì chỉnh lại danh sách này.
const STAFF_MENU_ITEMS: MenuItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Tổng quan", path: "/" },
  {
    id: "inventory", icon: Package, label: "Hàng hóa",
    subItems: [
      { label: "Danh mục", path: "/inventory" }
    ]
  },
  {
    id: "purchase", icon: Truck, label: "Mua hàng",
    subItems: [
      { label: "Nhập hàng", path: "/purchase/import" }
    ]
  },
  {
    id: "orders", icon: ShoppingCart, label: "Giao dịch",
    subItems: [
      { label: "Hóa đơn của tôi", path: "/orders/invoices" }
    ]
  },
  {
    id: "employees", icon: Briefcase, label: "Nhân viên",
    subItems: [
      { label: "Lịch làm việc", path: "/employees/schedule" },
      { label: "Bảng chấm công", path: "/employees/timesheet" },
      { label: "Bảng lương", path: "/employees/payroll" }
    ]
  }
];

export function Sidebar() {
  const location = useLocation();
  const { session } = useSession();
  const isStaff = session?.accessLevel === "staff";
  const MENU_ITEMS = isStaff ? STAFF_MENU_ITEMS : ADMIN_MENU_ITEMS;

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    inventory: location.pathname.startsWith('/inventory'),
    purchase: location.pathname.startsWith('/purchase'),
    orders: true,
    employees: true,
    partners: location.pathname.startsWith('/customers') || location.pathname.startsWith('/suppliers')
  });

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isPathActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-blue-600 border-r border-blue-700 text-blue-100 flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center px-6 font-bold text-xl text-white tracking-tight border-b border-blue-700/50 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-white text-blue-600 flex items-center justify-center font-black">2M</div>
          <span>2Mart ERP</span>
        </div>
      </div>
      
      <div className="p-3 flex-1 overflow-y-auto space-y-1 scrollbar-hide">
        <div className="text-xs font-semibold text-blue-300 mb-3 mt-2 px-3 uppercase tracking-wider">Main Menu</div>
        
        {MENU_ITEMS.map((item) => {
          const isActive = item.path ? isPathActive(item.path) : item.subItems?.some(s => isPathActive(s.path));
          const isExpanded = expandedMenus[item.id];
          const Icon = item.icon;

          return (
            <div key={item.id} className="flex flex-col mb-1">
              {item.path && !item.subItems ? (
                <Link to={item.path}>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start gap-3 h-10 px-3 ${isActive ? 'bg-blue-700 text-white font-medium' : 'text-blue-100 hover:text-white hover:bg-blue-500/50'}`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Button>
                </Link>
              ) : (
                <Button 
                  variant="ghost" 
                  onClick={() => toggleMenu(item.id)}
                  className={`w-full justify-between gap-3 h-10 px-3 ${isActive ? 'text-white font-medium' : 'text-blue-100 hover:text-white hover:bg-blue-500/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 opacity-70" /> : <ChevronRight className="w-4 h-4 opacity-70" />}
                </Button>
              )}

              {/* Sub Menu */}
              {item.subItems && isExpanded && (
                <div className="flex flex-col mt-1 mb-2 space-y-1 relative before:absolute before:left-5 before:top-0 before:bottom-2 before:w-[1px] before:bg-blue-500/50 animate-in slide-in-from-top-2 fade-in duration-200">
                  {item.subItems.map((sub, idx) => {
                    const isSubActive = location.pathname === sub.path;
                    return (
                      <Link key={idx} to={sub.path} className="relative z-10 flex items-center pl-10 pr-3">
                        <div className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${isSubActive ? 'bg-blue-700/80 text-white font-medium' : 'text-blue-200 hover:text-white hover:bg-blue-500/30'}`}>
                          <span className="text-sm">{sub.label}</span>
                          {sub.isNew && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">MỚI</span>
                          )}
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
        <div className="p-3 border-t border-blue-700/50 shrink-0">
          <Link to="/settings">
            <Button variant="ghost" className="w-full justify-start gap-3 text-blue-100 hover:text-white hover:bg-blue-500/50 h-10 px-3">
              <Settings className="w-5 h-5" />
              Thiết lập
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
