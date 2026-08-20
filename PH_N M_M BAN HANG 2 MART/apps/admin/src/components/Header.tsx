import { useState, useEffect, useRef } from "react";
import { Button } from "@2mart/ui";
import { Bell, User, Building2, CheckCircle2, LogOut, ChevronDown, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentBranch, type BranchName } from "../hooks/useCurrentBranch";
import { useSession } from "../hooks/useSession";
import { getPendingStockAlerts } from "../utils/stockAlerts";
import { MyProfileModal } from "./MyProfileModal";

const BRANCH_OPTIONS: { value: BranchName; shortLabel: string }[] = [
  { value: "285 Nguyễn Lương Bằng", shortLabel: "CS1: 285 Nguyễn Lương Bằng" },
  { value: "379b Tôn Đức Thắng", shortLabel: "CS2: 379b Tôn Đức Thắng" }
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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 text-slate-700 shadow-sm z-30 relative">
      
      {/* Left: để trống — ô tìm kiếm tổng đã được ẩn theo yêu cầu */}
      <div className="flex items-center gap-4 flex-1" />

      {/* Center/Right: Branch Switcher Pill & Actions */}
      <div className="flex items-center gap-4">
        
        {/* Branch Switcher Dropdown */}
        <div className="relative" ref={branchDropdownRef}>
          <button
            onClick={() => setIsBranchDropdownOpen(v => !v)}
            className="flex items-center gap-2 bg-slate-100/90 px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-inner text-xs font-bold text-blue-700 hover:bg-slate-200/70 transition-all min-w-[200px] justify-between"
          >
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              {currentBranchOption?.shortLabel || currentBranch}
            </span>
            <ChevronDown className={`w-4 h-4 opacity-60 transition-transform ${isBranchDropdownOpen ? "rotate-180" : ""}`} />
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
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 h-9 shadow-sm rounded-lg flex items-center justify-center gap-2">
            Bán hàng
          </Button>
        </Link>

        {/* Action Icons */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
          <Link to={isAdmin ? "/inventory" : "#"}>
            <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-9 w-9" title={isAdmin && pendingAlertCount > 0 ? `${pendingAlertCount} giao dịch bán vượt tồn kho cần duyệt` : undefined}>
              <Bell className="w-5 h-5" />
              {isAdmin && pendingAlertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-[1.5px] border-white leading-none">
                  {pendingAlertCount > 9 ? "9+" : pendingAlertCount}
                </span>
              )}
            </Button>
          </Link>
          {/* Nút bánh răng đã được ẩn theo yêu cầu */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="ml-2 w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors"
            title={`Hồ sơ của ${session?.name || ""}`}
          >
            <User className="w-5 h-5" />
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-slate-600 hover:text-red-600 hover:bg-red-50 h-9 w-9"
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
            <div className="text-[11px] text-slate-300 mt-0.5">Kho, Lịch làm việc, Chấm công & Lương đã được liên kết với cơ sở mới.</div>
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
