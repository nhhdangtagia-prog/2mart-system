import { useState, useEffect, useRef } from "react";
import { Button } from "@2mart/ui";
import { Bell, User, Building2, CheckCircle2, LogOut, ChevronDown, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentBranch, type BranchName } from "../hooks/useCurrentBranch";
import { useSession } from "../hooks/useSession";
import { getPendingStockAlerts } from "../utils/stockAlerts";
import { MyProfileModal } from "./MyProfileModal";
import { TopNav, MobileSidebar } from "./Sidebar";

const BRANCH_OPTIONS: { value: BranchName; shortLabel: string }[] = [
  { value: "379b Tôn Đức Thắng", shortLabel: "CS1: 379b Tôn Đức Thắng" },
  { value: "285 Nguyễn Lương Bằng", shortLabel: "CS2: 285 Nguyễn Lương Bằng" }
];

export function Header() {
  const { currentBranch, setCurrentBranch } = useCurrentBranch();
  const { session, logout } = useSession();
  const isAdmin = session?.accessLevel === "admin";
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [pendingAlertCount, setPendingAlertCount] = useState(0);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => setPendingAlertCount(getPendingStockAlerts(currentBranch).length);
    load();
    window.addEventListener("kiot_stock_alerts_change", load);
    return () => window.removeEventListener("kiot_stock_alerts_change", load);
  }, [currentBranch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBranchSwitch = (branch: BranchName) => {
    setIsBranchDropdownOpen(false);
    if (branch !== currentBranch) {
      setCurrentBranch(branch);
      setToastMessage(`Đã liên kết cơ sở dữ liệu: ${branch}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    }
  };

  const currentBranchOption = BRANCH_OPTIONS.find(b => b.value === currentBranch);

  return (
    <header className="h-16 bg-blue-600 border-b border-blue-700 flex items-center justify-between px-4 text-white shadow-sm z-30 relative">
      
      {/* Logo + Mobile hamburger */}
      <div className="flex items-center gap-2 shrink-0">
        <MobileSidebar />
        <Link to="/" className="hidden sm:block">
          <img src="/logo.png" alt="2!Mart" className="h-9 object-contain drop-shadow-sm" />
        </Link>
      </div>

      {/* Desktop horizontal nav */}
      <TopNav />

      {/* Right: Branch Switcher & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
        
        {/* Branch Switcher Dropdown */}
        <div className="relative" ref={branchDropdownRef}>
          <button
            onClick={() => setIsBranchDropdownOpen(v => !v)}
            className="flex items-center gap-1 sm:gap-2 bg-blue-700/60 px-2 sm:px-3 py-1.5 rounded-lg border border-blue-500/50 text-xs font-bold text-white hover:bg-blue-700 transition-all sm:min-w-[160px] justify-between"
          >
            <span className="flex items-center gap-1.5 truncate max-w-[110px] sm:max-w-none">
              <Building2 className="w-3.5 h-3.5 text-blue-200 shrink-0" />
              <span className="truncate">{currentBranchOption?.shortLabel || currentBranch}</span>
            </span>
            <ChevronDown className={`w-4 h-4 opacity-70 transition-transform shrink-0 ${isBranchDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {isBranchDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col z-50 animate-in zoom-in-95 duration-150">
              {BRANCH_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleBranchSwitch(option.value)}
                  className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-blue-50 transition-colors ${currentBranch === option.value ? "bg-blue-50/80 text-blue-700 font-semibold" : "text-slate-700"}`}
                >
                  <span className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    {option.shortLabel}
                  </span>
                  {currentBranch === option.value && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bán hàng button */}
        <Link to="/pos">
          <Button className="bg-white hover:bg-blue-50 text-blue-700 font-semibold px-2 sm:px-4 h-9 shadow-sm rounded-lg flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 text-sm">
            Bán hàng
          </Button>
        </Link>

        {/* Action Icons */}
        <div className="flex items-center gap-1 pl-2 border-l border-blue-500/50">
          <Link to={isAdmin ? "/inventory" : "#"}>
            <Button variant="ghost" size="icon" className="relative text-blue-100 hover:text-white hover:bg-blue-700 h-9 w-9" title={isAdmin && pendingAlertCount > 0 ? `${pendingAlertCount} giao dịch bán vượt tồn kho cần duyệt` : undefined}>
              <Bell className="w-5 h-5" />
              {isAdmin && pendingAlertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-[1.5px] border-blue-600 leading-none">
                  {pendingAlertCount > 9 ? "9+" : pendingAlertCount}
                </span>
              )}
            </Button>
          </Link>
          <button
            onClick={() => setIsProfileOpen(true)}
            className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center cursor-pointer hover:bg-blue-800 transition-colors border border-blue-500"
            title={`Hồ sơ của ${session?.name || ""}`}
          >
            <User className="w-5 h-5" />
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-blue-100 hover:text-red-400 hover:bg-blue-700 h-9 w-9"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Floating Branch Switch Toast Notification */}
      {showToast && (
        <div className="absolute top-16 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-medium z-50 animate-in slide-in-from-top-2 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
          <div>
            <div className="font-bold text-white text-sm">{toastMessage}</div>
            <div className="text-[11px] text-slate-300 mt-0.5">Kho, Lịch làm việc, Chấm công &amp; Lương đã được liên kết với cơ sở mới.</div>
          </div>
        </div>
      )}

      {/* Hồ sơ cá nhân — chỉ xem, mọi thay đổi phải do Admin cập nhật */}
      {isProfileOpen && session && (
        <MyProfileModal session={session} onClose={() => setIsProfileOpen(false)} />
      )}
    </header>
  );
}
