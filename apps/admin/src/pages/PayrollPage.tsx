import { useState, useMemo, useEffect, Fragment } from "react";
import { 
  Search, Download, DollarSign, Calendar, Building2, CheckCircle2, 
  FileText, TrendingUp, AlertCircle, Award, UserCheck, CreditCard,
  Plus, Trash2, ArrowLeft, RefreshCw, Clock, Filter, ChevronDown, ChevronUp, Check, X, Moon, ShieldCheck, Cloud, CloudOff, Loader2
} from "lucide-react";
import { Button } from "@2mart/ui";
import { useEmployees, type Employee } from "../hooks/useEmployees";
import { useCurrentBranch } from "../hooks/useCurrentBranch";
import { useSession } from "../hooks/useSession";
import { getPayrollSheets, savePayrollSheets, syncPayrollFromTimesheet, createPayrollSheet, PAYROLL_FORMULA_VERSION, type PayrollSheet, type PayrollSheetItem } from "../utils/payrollService";
import { PayslipDetailModal } from "../components/PayslipDetailModal";

const PAYROLL_STATUS_STYLE: Record<string, string> = {
  "Đang tạo": "bg-slate-100 text-slate-700 border-slate-200",
  "Tạm tính": "bg-amber-100 text-amber-800 border-amber-200",
  "Đã chốt lương": "bg-blue-100 text-blue-800 border-blue-200",
  "Đã trả": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Đã hủy": "bg-rose-100 text-rose-800 border-rose-200"
};

export function PayrollPage() {
  const { currentBranch, isCS2 } = useCurrentBranch();
  const { employees } = useEmployees();
  const { session } = useSession();
  const isStaff = session?.accessLevel === "staff";
  const [sheets, setSheets] = useState<PayrollSheet[]>(getPayrollSheets());
  
  // Navigation State: "list" | "editor"
  const [viewMode, setViewMode] = useState<"list" | "editor">("list");
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  
  // List View Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>(["285 Nguyễn Lương Bằng", "379b Tôn Đức Thắng"]);
  const [statusFilters, setStatusFilters] = useState<string[]>(["Đang tạo", "Tạm tính", "Đã chốt lương"]);
  const [selectedSheetIds, setSelectedSheetIds] = useState<string[]>([]);

  // Tự động cập nhật lại các bảng lương cũ theo công thức mới khi load trang
  useEffect(() => {
    if (sheets.length === 0) return;
    let migrated = false;
    const migratedSheets = sheets.map(sheet => {
      if (!sheet.items) return sheet;
      
      // Tính lại lương thực nhận cho từng nhân viên
      const migratedItems = sheet.items.map(item => ({
        ...item,
        netSalary: Math.max(0, (item.totalIncome || 0) - (item.deductions || 0) - (item.advanceAmount || 0))
      }));
      
      const totalIncome = migratedItems.reduce((sum, i) => sum + (i.totalIncome || 0), 0);
      const deductions = migratedItems.reduce((sum, i) => sum + (i.deductions || 0), 0);
      const advances = migratedItems.reduce((sum, i) => sum + (i.advanceAmount || 0), 0);
      const paidAmounts = migratedItems.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
      const netSalary = migratedItems.reduce((sum, i) => sum + (i.netSalary || 0), 0);
      
      const correctTotalSalary = Math.max(0, totalIncome - deductions);
      const correctTotalPaid = advances + paidAmounts;
      const correctTotalRemaining = Math.max(0, netSalary - paidAmounts);
      
      if (sheet.totalSalary !== correctTotalSalary || 
          sheet.totalPaid !== correctTotalPaid || 
          sheet.totalRemaining !== correctTotalRemaining) {
        migrated = true;
        return {
          ...sheet,
          items: migratedItems,
          totalSalary: correctTotalSalary,
          totalPaid: correctTotalPaid,
          totalRemaining: correctTotalRemaining
        };
      }
      return sheet;
    });

    if (migrated) {
      savePayrollSheets(migratedSheets);
      setSheets(migratedSheets);
      console.log("Migrated sheets to new logic");
    }
  }, []); // Run once on mount (sheets is deliberately omitted so it only migrates once)
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "payslip" | "history">("info");

  // Editor View State
  const [editorSearch, setEditorSearch] = useState("");
  const [editingItems, setEditingItems] = useState<PayrollSheetItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Tiền mặt");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMonth, setCreateMonth] = useState<number>(new Date().getMonth() + 1);
  const [createYear, setCreateYear] = useState<number>(new Date().getFullYear());
  const [createBranch, setCreateBranch] = useState<string>(currentBranch === "Tất cả chi nhánh" ? "285 Nguyễn Lương Bằng" : currentBranch);

  // Sync status
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncErrorMsg, setSyncErrorMsg] = useState("");

  useEffect(() => {
    const onStatus = (e: any) => {
      setSyncStatus(e.detail);
      if (e.detail === "success") {
        setSyncErrorMsg("");
        setTimeout(() => setSyncStatus("idle"), 3000);
      }
    };
    const onError = (e: any) => {
      setSyncStatus("error");
      setSyncErrorMsg(e.detail);
    };

    window.addEventListener("payroll_sync_status", onStatus);
    window.addEventListener("payroll_sync_error", onError);

    return () => {
      window.removeEventListener("payroll_sync_status", onStatus);
      window.removeEventListener("payroll_sync_error", onError);
    };
  }, []);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (syncStatus === "syncing" || syncStatus === "error") {
        e.preventDefault();
        e.returnValue = "Dữ liệu chưa được lưu an toàn lên máy chủ. Bạn có chắc muốn thoát?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [syncStatus]);

  // Phiếu lương chi tiết (mở khi bấm vào tên nhân viên trong bảng lương)
  const [viewingPayslip, setViewingPayslip] = useState<{
    item: PayrollSheetItem;
    sheetInfo: { id: string; code: string; name: string; periodRange: string; branch: string };
    isEditable: boolean;
  } | null>(null);

  // Auto-sync realtime cho các bảng lương đang ở trạng thái "Đang tạo"
  useEffect(() => {
    if (employees.length === 0) return;

    const handleSyncDrafts = () => {
      const current = getPayrollSheets();
      let hasChanges = false;
      const updated = current.map(s => {
        if (s.status === "Đang tạo" || s.status === "Tạm tính") {
          const synced = syncPayrollFromTimesheet(s.id, employees);
          if (synced) {
            hasChanges = true;
            return synced;
          }
        }
        return s;
      });
      if (hasChanges) {
        setSheets(getPayrollSheets());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "kiot_rm_timesheet_v2") {
        handleSyncDrafts();
      }
    };

    if (!localStorage.getItem("kiot_rm_timesheet_v2")) {
      fetch('/api/timesheets')
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const migrated: Record<string, any> = {};
            data.forEach((r: any) => {
              const dateKey = r.dateKey || `202607${String(r.date).padStart(2, "0")}`;
              const id = r.id || `${r.shiftId}-${dateKey}-${r.employeeCode}`;
              migrated[id] = { ...r, dateKey, id };
            });
            localStorage.setItem("kiot_rm_timesheet_v2", JSON.stringify(migrated));
            handleSyncDrafts();
          }
        })
        .catch(console.error);
    }

    if (!localStorage.getItem("kiot_rm_payroll_sheets_v2")) {
      fetch('/api/payrolls')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data) && data.length > 0) {
            localStorage.setItem("kiot_rm_payroll_sheets_v2", JSON.stringify(data));
            setSheets(data);
            handleSyncDrafts();
          }
        })
        .catch(console.error);
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("kiot_timesheet_change", handleSyncDrafts);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("kiot_timesheet_change", handleSyncDrafts);
    };
  }, [employees]);

  // Tự động đồng bộ lại các bảng lương còn giữ dữ liệu mẫu cũ (chưa từng đồng bộ với nhân viên/chấm công
  // thật — tránh tình trạng nhân viên không thấy lương của mình hoặc bị trùng mã với dữ liệu mẫu cũ của
  // người khác), HOẶC đang được tính theo công thức lương CŨ (formulaVersion lỗi thời) — mỗi khi cơ chế
  // tính lương thay đổi (đơn giá/giờ, phụ cấp, ngày lễ...), các bảng lương cũ sẽ tự cập nhật lại ngay.
  useEffect(() => {
    if (employees.length === 0) return;
    const current = getPayrollSheets();
    const staleSheets = current.filter(s => {
      // KHÔNG BAO GIỜ tự động đồng bộ lại/tính lại cho các bảng lương đã chốt hoặc đã trả
      if (s.status === "Đã chốt lương" || s.status === "Đã trả" || s.status === "Đã hủy") {
        return false;
      }
      if (!s.items || s.items.length === 0) return true;
      if ((s.formulaVersion || 0) < PAYROLL_FORMULA_VERSION) return true;
      if (s.status === "Đang tạo") return true; // Cập nhật realtime cho trạng thái Đang tạo mỗi khi mở trang
      // So khớp CẢ mã lẫn tên — dữ liệu mẫu ban đầu dùng mã trùng với nhân viên thật (VD NV001)
      // nhưng tên khác, nên chỉ so mã không đủ để phát hiện dữ liệu mẫu chưa đồng bộ.
      return !s.items.some(i => employees.some(e => e.code === i.employeeCode && e.name === i.employeeName));
    });
    if (staleSheets.length === 0) return;
    staleSheets.forEach(s => syncPayrollFromTimesheet(s.id, employees));
    setSheets(getPayrollSheets());
  }, [employees]);

  // Current active sheet object
  const activeSheet = useMemo(() => {
    return sheets.find(s => s.id === activeSheetId) || sheets[0];
  }, [sheets, activeSheetId]);

  // Sync editor items when entering editor mode
  const handleOpenEditor = (sheet: PayrollSheet) => {
    // Nếu bảng lương chưa có items (VD tạo mới hoặc mock rỗng), tự động đồng bộ từ chấm công!
    let targetSheet = sheet;
    if (!sheet.items || sheet.items.length === 0) {
      const synced = syncPayrollFromTimesheet(sheet.id, employees);
      if (synced) targetSheet = synced;
    }
    setActiveSheetId(targetSheet.id);
    setEditingItems(targetSheet.items ? [...targetSheet.items] : []);
    setViewMode("editor");
  };

  // Sync from timesheet action
  const handleSyncFromTimesheet = (sheetId: string) => {
    const currentItems = activeSheet && activeSheet.id === sheetId ? editingItems : undefined;
    const updated = syncPayrollFromTimesheet(sheetId, employees, currentItems);
    if (updated) {
      setSheets(getPayrollSheets());
      if (activeSheetId === sheetId) {
        setEditingItems([...updated.items]);
      }
      alert(`🔄 ĐÃ TẢI LẠI DỮ LIỆU TỪ CHẤM CÔNG THÀNH CÔNG!\n• Hệ thống đã tự động tính toán Lương chính, OT và đặc biệt tự động cộng trợ cấp Ca đêm (15,000đ / buổi hoàn thành) vào Bảng tính lương #${updated.code}.`);
    }
  };

  // Create new payroll sheet
  const confirmCreateSheet = () => {
    const lastDay = new Date(createYear, createMonth, 0).getDate();
    const name = `Bảng lương tháng ${createMonth}/${createYear}`;
    const range = `01/${String(createMonth).padStart(2, '0')}/${createYear} - ${lastDay}/${String(createMonth).padStart(2, '0')}/${createYear}`;
    const newSheet = createPayrollSheet(name, createBranch, range);
    const synced = syncPayrollFromTimesheet(newSheet.id, employees);
    setSheets(getPayrollSheets());
    setIsCreateModalOpen(false);
    if (synced) {
      handleOpenEditor(synced);
    } else {
      handleOpenEditor(newSheet);
    }
  };

  // Filtered sheets for list view
  const filteredSheets = useMemo(() => {
    return sheets.filter(s => {
      const matchSearch = !searchTerm || 
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.branch.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBranch = selectedBranches.length === 0 || selectedBranches.some(b => s.branch.includes(b.slice(0, 10)));
      const matchStatus = statusFilters.length === 0 || statusFilters.includes(s.status);
      return matchSearch && matchBranch && matchStatus;
    });
  }, [sheets, searchTerm, selectedBranches, statusFilters]);

  // Overall totals in list table header
  const overallTotals = useMemo(() => {
    return filteredSheets.reduce((acc, s) => {
      acc.totalSalary += (s.totalSalary || 0);
      acc.totalPaid += (s.totalPaid || 0);
      acc.totalRemaining += (s.totalRemaining || 0);
      return acc;
    }, { totalSalary: 0, totalPaid: 0, totalRemaining: 0 });
  }, [filteredSheets]);

  const toggleBranchFilter = (branchName: string) => {
    setSelectedBranches(prev => 
      prev.includes(branchName) ? prev.filter(b => b !== branchName) : [...prev, branchName]
    );
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const formatCurrency = (val: number | undefined) => {
    return (val || 0).toLocaleString("vi-VN");
  };

  // ==========================================
  // EDITOR VIEW HANDLERS (CÓ HỖ TRỢ CA ĐÊM 15k)
  // ==========================================
  const updateEditorItem = (empCode: string, field: keyof PayrollSheetItem, value: any) => {
    setEditingItems(prev => prev.map(item => {
      if (item.employeeCode === empCode) {
        const updated = { ...item, [field]: value };
        updated.totalIncome = (updated.basicSalary || 0) + (updated.overtimeSalary || 0) + (updated.nightShiftAllowance || 0) + (updated.allowances || 0) + (updated.bonuses || 0);
        updated.netSalary = Math.max(0, updated.totalIncome - (updated.deductions || 0) - (updated.advanceAmount || 0));
        return updated;
      }
      return item;
    }));
  };

  const removeEditorItem = (empCode: string) => {
    setEditingItems(prev => prev.filter(i => i.employeeCode !== empCode));
  };

  // Lưu số tiền đã ứng + giảm trừ chỉnh sửa từ Phiếu lương chi tiết
  const handleSavePayslip = (empCode: string, updates: { advanceAmount: number; deductions: number }) => {
    setEditingItems(prev => prev.map(item => {
      if (item.employeeCode !== empCode) return item;
      const updated = { ...item, advanceAmount: updates.advanceAmount, deductions: updates.deductions };
      updated.netSalary = Math.max(0, updated.totalIncome - updated.deductions - updated.advanceAmount);
      return updated;
    }));
  };

  const editorTotals = useMemo(() => {
    return editingItems.reduce((acc, i) => {
      acc.basicSalary += (i.basicSalary || 0);
      acc.overtimeSalary += (i.overtimeSalary || 0);
      acc.nightShiftsCount += (i.nightShiftsCount || 0);
      acc.nightShiftAllowance += (i.nightShiftAllowance || 0);
      acc.allowances += (i.allowances || 0);
      acc.bonuses += (i.bonuses || 0);
      acc.totalIncome += (i.totalIncome || 0);
      acc.deductions += (i.deductions || 0);
      acc.netSalary += (i.netSalary || 0);
      acc.advanceAmount += (i.advanceAmount || 0);
      return acc;
    }, { basicSalary: 0, overtimeSalary: 0, nightShiftsCount: 0, nightShiftAllowance: 0, allowances: 0, bonuses: 0, totalIncome: 0, deductions: 0, netSalary: 0, advanceAmount: 0 });
  }, [editingItems]);

  const filteredEditorItems = useMemo(() => {
    if (!editorSearch) return editingItems;
    const lower = editorSearch.toLowerCase();
    return editingItems.filter(i => 
      i.employeeName.toLowerCase().includes(lower) || 
      i.employeeCode.toLowerCase().includes(lower)
    );
  }, [editingItems, editorSearch]);

  const handleExportListExcel = () => {
    if (filteredSheets.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }
    import('xlsx').then(XLSX => {
      const data = filteredSheets.map((s, index) => ({
        "STT": index + 1,
        "Mã bảng lương": s.code,
        "Tên bảng lương": s.name,
        "Kỳ làm việc": s.periodRange,
        "Chi nhánh": s.branch,
        "Tổng lương": s.totalSalary,
        "Đã trả": s.totalPaid,
        "Còn nợ": s.totalRemaining,
        "Trạng thái": s.status,
        "Ngày tạo": new Date(s.createdAt).toLocaleString('vi-VN')
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách bảng lương");
      XLSX.writeFile(wb, `Danh_sach_bang_luong.xlsx`);
    });
  };

  const handleExportSingleSheetExcel = (sheet: PayrollSheet) => {
    if (!sheet.items || sheet.items.length === 0) {
      alert("Bảng lương này chưa có dữ liệu chi tiết!");
      return;
    }
    import('xlsx').then(XLSX => {
      const data = sheet.items.map((item, index) => ({
        "STT": index + 1,
        "Mã NV": item.employeeCode,
        "Tên nhân viên": item.employeeName,
        "Lương chính": item.basicSalary,
        "Làm thêm (OT)": item.overtimeSalary,
        "Số buổi đêm": item.nightShiftsCount || 0,
        "Hỗ trợ ca đêm": item.nightShiftAllowance || 0,
        "Phụ cấp khác": item.allowances,
        "Thưởng": item.bonuses,
        "Tổng thu nhập": item.totalIncome,
        "Giảm trừ": item.deductions,
        "Ứng lương": item.advanceAmount,
        "Lương thực nhận": item.netSalary
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bảng lương");
      XLSX.writeFile(wb, `Bang_luong_${sheet.code}.xlsx`);
    });
  };

  const handleExportEditorExcel = () => {
    if (!activeSheet || editingItems.length === 0) return;
    import('xlsx').then(XLSX => {
      const data = editingItems.map((item, index) => ({
        "STT": index + 1,
        "Mã NV": item.employeeCode,
        "Tên nhân viên": item.employeeName,
        "Lương chính": item.basicSalary,
        "Làm thêm (OT)": item.overtimePay,
        "Số buổi đêm": item.nightShifts || 0,
        "Hỗ trợ ca đêm": item.nightShiftPay || 0,
        "Phụ cấp khác": item.allowance,
        "Thưởng": item.bonus,
        "Tổng thu nhập": item.totalIncome,
        "Giảm trừ": item.deduction,
        "Ứng lương": item.advance,
        "Lương thực nhận": item.netSalary
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bảng lương");
      XLSX.writeFile(wb, `Bang_luong_${activeSheet.code}.xlsx`);
    });
  };

  const handleSaveEditor = (newStatus?: PayrollSheet["status"]) => {
    if (!activeSheet) return;
    const updatedSheets = sheets.map(s => {
      if (s.id !== activeSheet.id) return s;
      const updated: PayrollSheet = {
        ...s,
        items: editingItems,
        totalEmployees: editingItems.length,
        totalSalary: Math.max(0, editorTotals.totalIncome - editorTotals.deductions),
        totalPaid: editorTotals.advanceAmount + (s.items.reduce((sum, i) => sum + (i.paidAmount || 0), 0)),
        totalRemaining: Math.max(0, editorTotals.netSalary - (s.items.reduce((sum, i) => sum + (i.paidAmount || 0), 0))),
        updatedAt: new Date().toLocaleString("vi-VN"),
        status: newStatus || s.status
      };
      if (newStatus === "Đã chốt lương") {
        updated.approver = "Thanh Tâm (Trưởng cửa hàng)";
      }
      return updated;
    });

    savePayrollSheets(updatedSheets);
    setSheets(updatedSheets);
    if (newStatus === "Đã chốt lương") {
      alert("✔ ĐÃ CHỐT LƯƠNG THÀNH CÔNG!\nBảng tính lương đã được khóa để chuẩn bị thanh toán cho nhân viên.");
      setViewMode("list");
    } else {
      alert("💾 Đã lưu tạm các thay đổi trong bảng lương!");
    }
  };

  const handleCancelSheet = (sheetId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy bảng lương này không?')) return;
    
    const updatedSheets = sheets.map(s => {
      if (s.id === sheetId) {
        return { ...s, status: 'Đã hủy', updatedAt: new Date().toLocaleString('vi-VN') } as PayrollSheet;
      }
      return s;
    });
    
    savePayrollSheets(updatedSheets);
    setSheets(updatedSheets);
    setExpandedRow(null);
  };

  const handleConfirmPayment = () => {
    if (!activeSheet || paymentAmount <= 0) {
      alert("Vui lòng nhập số tiền thanh toán hợp lệ!");
      return;
    }
    const updatedSheets = sheets.map(s => {
      if (s.id !== activeSheet.id) return s;
      const newPaid = (s.totalPaid || 0) + paymentAmount;
      const newRem = Math.max(0, (s.totalSalary || 0) - newPaid);
      return {
        ...s,
        totalPaid: newPaid,
        totalRemaining: newRem,
        status: newRem === 0 ? "Đã trả" : "Đã chốt lương",
        updatedAt: new Date().toLocaleString("vi-VN"),
        payments: [
          ...(s.payments || []),
          {
            id: crypto.randomUUID(),
            timestamp: new Date().toLocaleString("vi-VN"),
            amount: paymentAmount,
            paymentMethod,
            payer: "Thanh Tâm (Quản lý)"
          }
        ]
      } as PayrollSheet;
    });

    savePayrollSheets(updatedSheets);
    setSheets(updatedSheets);
    setIsPaymentModalOpen(false);
    alert(`💵 ĐÃ THANH TOÁN ${formatCurrency(paymentAmount)} đ THÀNH CÔNG!\n• Phương thức: ${paymentMethod}\n• Còn cần trả: ${formatCurrency(Math.max(0, activeSheet.totalSalary - (activeSheet.totalPaid + paymentAmount)))} đ`);
    setViewMode("list");
  };

  // =========================================================================
  // RENDER: NHÂN VIÊN BÁN HÀNG — chỉ xem lương của chính mình, không sửa/duyệt/trả
  // =========================================================================
  if (isStaff) {
    const myEntries = sheets.flatMap(sheet => {
      const item = sheet.items?.find(i => i.employeeCode === session?.code);
      return item ? [{ sheet, item }] : [];
    });

    // Nhân viên tự đồng bộ lại lương của mình từ chấm công mới nhất — không cần chờ admin bấm hộ.
    const handleStaffSync = () => {
      const allSheets = getPayrollSheets();
      allSheets.forEach(s => {
        if (s.status !== "Đã chốt lương" && s.status !== "Đã trả" && s.status !== "Đã hủy") {
          syncPayrollFromTimesheet(s.id, employees);
        }
      });
      setSheets(getPayrollSheets());
      setStaffSyncedAt(new Date().toLocaleTimeString("vi-VN"));
    };

    return (
      <div className="w-full p-4 sm:p-6 flex flex-col animate-in fade-in duration-200">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Lương của tôi</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Chỉ hiển thị các kỳ lương của <strong>{session?.name}</strong> — không thấy lương của nhân viên khác.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
          </div>
        </div>

        {myEntries.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            Chưa có dữ liệu lương nào cho bạn.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {myEntries.map(({ sheet, item }) => (
              <div
                key={sheet.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                onClick={() => setViewingPayslip({
                  item,
                  sheetInfo: { id: sheet.id, code: sheet.code, name: sheet.name, periodRange: sheet.periodRange, branch: sheet.branch },
                  isEditable: false
                })}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-slate-800 hover:underline">{sheet.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{sheet.periodRange} • {sheet.branch}</div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${PAYROLL_STATUS_STYLE[sheet.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {sheet.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-500">Lương chính</div>
                    <div className="font-semibold text-slate-800">{formatCurrency(item.basicSalary)} đ</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Phụ cấp + thưởng</div>
                    <div className="font-semibold text-slate-800">{formatCurrency(item.allowances + item.bonuses + item.overtimeSalary + (item.nightShiftAllowance || 0))} đ</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Giảm trừ</div>
                    <div className="font-semibold text-rose-600">-{formatCurrency(item.deductions)} đ</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Thực nhận</div>
                    <div className="font-bold text-blue-700">{formatCurrency(item.netSalary)} đ</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Đã trả: <strong className="text-slate-700">{formatCurrency(item.paidAmount)} đ</strong>
                  {item.paidAmount < item.netSalary && (
                    <span className="text-amber-600 font-semibold"> • Còn lại: {formatCurrency(item.netSalary - item.paidAmount)} đ</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewingPayslip && (
          <PayslipDetailModal
            item={viewingPayslip.item}
            sheet={viewingPayslip.sheetInfo}
            isEditable={false}
            onClose={() => setViewingPayslip(null)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // =========================================================================
  const handleBulkCancel = () => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy ${selectedSheetIds.length} bảng lương đã chọn?`)) return;
    const updatedSheets = sheets.map(s => {
      if (selectedSheetIds.includes(s.id)) {
        return { ...s, status: 'Đã hủy', updatedAt: new Date().toLocaleString('vi-VN') } as PayrollSheet;
      }
      return s;
    });
    savePayrollSheets(updatedSheets);
    setSheets(updatedSheets);
    setSelectedSheetIds([]);
  };

  const handleBulkApprove = () => {
    if (!window.confirm(`Bạn có chắc chắn muốn chốt ${selectedSheetIds.length} bảng lương đã chọn?`)) return;
    const updatedSheets = sheets.map(s => {
      if (selectedSheetIds.includes(s.id)) {
        return { 
          ...s, 
          status: 'Đã chốt lương', 
          approver: "Thanh Tâm (Trưởng cửa hàng)",
          updatedAt: new Date().toLocaleString('vi-VN') 
        } as PayrollSheet;
      }
      return s;
    });
    savePayrollSheets(updatedSheets);
    setSheets(updatedSheets);
    setSelectedSheetIds([]);
    alert("✅ ĐÃ CHỐT LƯƠNG THÀNH CÔNG HÀNG LOẠT!");
  };

  const handleBulkUpdate = () => {
    if (!window.confirm(`Cập nhật ${selectedSheetIds.length} bảng lương từ nhật ký chấm công mới nhất?`)) return;
    selectedSheetIds.forEach(id => {
      syncPayrollFromTimesheet(id, employees);
    });
    setSheets(getPayrollSheets());
    setSelectedSheetIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedSheetIds.length === filteredSheets.length) {
      setSelectedSheetIds([]);
    } else {
      setSelectedSheetIds(filteredSheets.map(s => s.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedSheetIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // --- RENDERS ---
  if (viewMode === "editor" && activeSheet) {
    return (
      <div className="w-full p-4 sm:p-6 flex flex-col h-full relative animate-in fade-in duration-200 space-y-4">
        
        {/* Top Navigation & Action Bar Chuẩn Screenshot 3 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2 text-slate-700 hover:text-blue-600 font-black text-lg transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
              Cập nhật bảng tính lương
            </button>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {activeSheet.code} — {activeSheet.name} ({activeSheet.branch})
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button 
              variant="outline"
              onClick={handleExportEditorExcel}
              className="gap-2 bg-white text-slate-700 border-slate-300 hover:bg-slate-50 font-bold px-4 h-10 shadow-2xs"
            >
              <Download className="w-4 h-4" /> Xuất file
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleSaveEditor()}
              className="gap-2 bg-white text-slate-700 border-slate-300 hover:bg-slate-50 font-bold px-4 h-10 shadow-2xs"
            >
              💾 Lưu tạm
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setPaymentAmount(activeSheet.totalRemaining || activeSheet.totalSalary || 0);
                setIsPaymentModalOpen(true);
              }}
              className="gap-2 bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 font-bold px-4 h-10 shadow-2xs"
            >
              💵 Thanh toán
            </Button>
            <Button 
              onClick={() => handleSaveEditor("Đã chốt lương")}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-5 h-10 shadow-md border-transparent"
            >
              ✔ Chốt lương
            </Button>
            <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-colors border border-slate-200">
              ☰
            </button>
          </div>
        </div>

        {/* Notice Bar với thông báo hỗ trợ ca đêm 15k */}
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-purple-900 text-white p-3.5 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-[11px] shrink-0 uppercase tracking-wide">
              <Moon className="w-3 h-3 fill-slate-950" /> CA ĐÊM +15K/BUỔI
            </span>
            <span>Nhân viên hoàn thành ca đêm được tự động cộng <strong>15,000 đ/ca</strong> vào Hỗ trợ ca đêm. Tất cả dữ liệu Lương, OT và Ca đêm được đồng bộ trực tiếp từ Bảng Chấm Công.</span>
          </div>
          <button 
            onClick={() => handleSyncFromTimesheet(activeSheet.id)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-1.5 rounded-lg border border-blue-400 flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Đồng bộ lại từ chấm công
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm nhân viên theo mã hoặc tên..."
              value={editorSearch}
              onChange={(e) => setEditorSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            Đang hiển thị <strong>{filteredEditorItems.length}</strong> nhân viên trong bảng lương
          </div>
        </div>

        {/* Table Chuẩn KiotViet có Cột Hỗ Trợ Ca Đêm */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[1450px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <th className="p-4 text-center w-12">STT</th>
                <th className="p-4 min-w-[170px]">Tên nhân viên</th>
                <th className="p-4 text-right w-32">Lương chính</th>
                <th className="p-4 text-right w-28">Làm thêm OT</th>
                <th className="p-4 text-center w-28 bg-purple-50/70 text-purple-900 border-x border-purple-100">Số buổi đêm</th>
                <th className="p-4 text-right w-36 bg-purple-50/70 text-purple-900 border-r border-purple-100">Hỗ trợ ca đêm (15k)</th>
                <th className="p-4 text-right w-28">Phụ cấp khác</th>
                <th className="p-4 text-right w-28">Thưởng</th>
                <th className="p-4 text-right w-36 font-bold text-slate-900">Tổng thu nhập</th>
                <th className="p-4 text-right w-28">Giảm trừ</th>
                <th className="p-4 text-right w-28 text-orange-700">Ứng lương</th>
                <th className="p-4 text-right w-36 font-bold text-blue-700">Lương thực nhận ℹ️</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              
              {/* DÒNG TỔNG CỘNG (TOP SUMMARY ROW CHUẨN SCREENSHOT 3) */}
              <tr className="bg-blue-50/60 font-black text-slate-900 border-b-2 border-blue-200 text-sm sticky top-12 z-10 shadow-2xs">
                <td colSpan={2} className="p-4 text-blue-900">Tổng cộng ({editingItems.length} NV)</td>
                <td className="p-4 text-right font-mono text-base">{formatCurrency(editorTotals.basicSalary)}</td>
                <td className="p-4 text-right font-mono">{formatCurrency(editorTotals.overtimeSalary)}</td>
                <td className="p-4 text-center font-mono bg-purple-100/60 text-purple-950 text-base border-x border-purple-200">{editorTotals.nightShiftsCount} buổi</td>
                <td className="p-4 text-right font-mono bg-purple-100/60 text-purple-950 font-black text-base border-r border-purple-200">{formatCurrency(editorTotals.nightShiftAllowance)}</td>
                <td className="p-4 text-right font-mono">{formatCurrency(editorTotals.allowances)}</td>
                <td className="p-4 text-right font-mono">{formatCurrency(editorTotals.bonuses)}</td>
                <td className="p-4 text-right font-mono text-base text-slate-950">{formatCurrency(editorTotals.totalIncome)}</td>
                <td className="p-4 text-right font-mono text-red-600">{formatCurrency(editorTotals.deductions)}</td>
                <td className="p-4 text-right font-mono text-orange-700 font-bold">{formatCurrency(editorTotals.advanceAmount)}</td>
                <td className="p-4 text-right font-mono text-lg text-blue-700">{formatCurrency(editorTotals.netSalary)}</td>
              </tr>

              {filteredEditorItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-16 text-center text-slate-400 italic">
                    Không có dữ liệu nhân viên trong bảng lương này. Hãy bấm "Đồng bộ chấm công"!
                  </td>
                </tr>
              ) : (
                filteredEditorItems.map((item, idx) => (
                  <tr key={item.employeeCode} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 text-center text-slate-400 font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => removeEditorItem(item.employeeCode)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          title="Xóa khỏi bảng lương"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span>{idx + 1}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div
                        className="font-bold text-blue-600 hover:underline cursor-pointer"
                        onClick={() => setViewingPayslip({
                          item,
                          sheetInfo: { id: activeSheet.id, code: activeSheet.code, name: activeSheet.name, periodRange: activeSheet.periodRange, branch: activeSheet.branch },
                          isEditable: true
                        })}
                      >
                        {item.employeeName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{item.employeeCode}</div>
                    </td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        step="1"
                        value={item.basicSalary}
                        onChange={(e) => updateEditorItem(item.employeeCode, "basicSalary", parseFloat(e.target.value) || 0)}
                        className="w-24 text-right font-bold border border-slate-200 rounded-lg p-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        step="1"
                        value={item.overtimeSalary}
                        onChange={(e) => updateEditorItem(item.employeeCode, "overtimeSalary", parseFloat(e.target.value) || 0)}
                        className="w-20 text-right font-semibold border border-slate-200 rounded-lg p-1.5 text-sm focus:outline-none focus:border-blue-500 text-slate-700"
                      />
                    </td>
                    
                    {/* CỘT SỐ BUỔI LÀM ĐÊM */}
                    <td className="p-3 text-center bg-purple-50/40 border-x border-purple-100">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.nightShiftsCount || 0}
                        onChange={(e) => updateEditorItem(item.employeeCode, "nightShiftsCount", parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-black border-2 border-purple-300 rounded-lg p-1.5 text-sm focus:outline-none focus:border-purple-600 text-purple-900 bg-white shadow-2xs"
                      />
                    </td>

                    {/* CỘT TIỀN HỖ TRỢ CA ĐÊM (15k * Số buổi) */}
                    <td className="p-4 text-right font-mono font-black text-purple-950 bg-purple-50/40 border-r border-purple-100 text-base">
                      {formatCurrency(item.nightShiftAllowance)}
                    </td>

                    <td className="p-3 text-right">
                      <input
                        type="number"
                        step="1"
                        value={item.allowances}
                        onChange={(e) => updateEditorItem(item.employeeCode, "allowances", parseFloat(e.target.value) || 0)}
                        className="w-20 text-right font-semibold border border-slate-200 rounded-lg p-1.5 text-sm focus:outline-none focus:border-blue-500 text-slate-700"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        step="1"
                        value={item.bonuses}
                        onChange={(e) => updateEditorItem(item.employeeCode, "bonuses", parseFloat(e.target.value) || 0)}
                        className="w-20 text-right font-semibold border border-slate-200 rounded-lg p-1.5 text-sm focus:outline-none focus:border-blue-500 text-slate-700"
                      />
                    </td>
                    <td className="p-4 text-right font-black text-slate-900 font-mono">
                      {formatCurrency(item.totalIncome)}
                    </td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        step="1"
                        value={item.deductions}
                        onChange={(e) => updateEditorItem(item.employeeCode, "deductions", parseFloat(e.target.value) || 0)}
                        className="w-20 text-right font-semibold border border-red-200 text-red-600 rounded-lg p-1.5 text-sm focus:outline-none focus:border-red-500"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        step="1"
                        value={item.advanceAmount || 0}
                        onChange={(e) => updateEditorItem(item.employeeCode, "advanceAmount", parseFloat(e.target.value) || 0)}
                        className="w-24 text-right font-semibold border border-orange-200 text-orange-700 rounded-lg p-1.5 text-sm focus:outline-none focus:border-orange-500 bg-orange-50/50"
                      />
                    </td>
                    <td className="p-4 text-right font-black text-blue-700 font-mono text-base">
                      {formatCurrency(item.netSalary)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL THANH TOÁN LƯƠNG */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                  Thanh Toán Bảng Lương #{activeSheet.code}
                </h3>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tổng quỹ lương:</span>
                  <strong className="text-slate-900 font-bold">{formatCurrency(activeSheet.totalSalary)} đ</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Đã thanh toán trước đó:</span>
                  <strong className="text-emerald-600 font-bold">{formatCurrency(activeSheet.totalPaid)} đ</strong>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-100 pt-2">
                  <span>Còn cần trả:</span>
                  <span className="text-red-600">{formatCurrency(activeSheet.totalRemaining)} đ</span>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số tiền thanh toán đợt này (VNĐ):</label>
                  <input
                    type="number"
                    step="1"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border-2 border-emerald-500 rounded-xl p-3 text-lg font-black text-emerald-800 focus:outline-none focus:bg-white text-right font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phương thức thanh toán:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Chuyển khoản ngân hàng">Chuyển khoản ngân hàng</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 font-bold h-11">
                  Hủy
                </Button>
                <Button onClick={handleConfirmPayment} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black h-11 shadow-md">
                  Xác nhận Trả Lương
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL PHIẾU LƯƠNG CHI TIẾT */}
        {viewingPayslip && (
          <PayslipDetailModal
            item={viewingPayslip.item}
            sheet={viewingPayslip.sheetInfo}
            isEditable={viewingPayslip.isEditable}
            onClose={() => setViewingPayslip(null)}
            onSave={(updates) => handleSavePayslip(viewingPayslip.item.employeeCode, updates)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col h-full relative animate-in fade-in duration-200 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-blue-600" />
            Quản Lý Bảng Lương & Chi Trả
            
            {/* Sync Indicator */}
            {syncStatus === "syncing" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 ml-3">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang lưu...
              </span>
            )}
            {syncStatus === "success" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 ml-3 transition-opacity">
                <Cloud className="w-3.5 h-3.5" />
                Đã lưu an toàn
              </span>
            )}
            {syncStatus === "error" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 ml-3 cursor-help group relative">
                <CloudOff className="w-3.5 h-3.5" />
                Lỗi đồng bộ
                <div className="absolute top-full left-0 mt-1 hidden group-hover:block w-64 p-2.5 bg-slate-800 text-white text-[11px] font-normal tracking-wide rounded-lg shadow-xl z-50 whitespace-normal">
                  {syncErrorMsg || "Lỗi lưu dữ liệu. Hệ thống đã tạo bản sao lưu cục bộ."}
                </div>
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Liên kết tự động với nhật ký chấm công, định mức chi nhánh và hỗ trợ ca đêm (15k/ca)</p>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md px-5 h-10 border-transparent">
            <Plus className="w-5 h-5 stroke-[3]" /> + Bảng tính lương
          </Button>
          <Button variant="outline" onClick={handleExportListExcel} className="gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border-slate-200 font-semibold h-10">
            <Download className="w-4 h-4" /> Xuất file
          </Button>
          <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm font-bold">
            ☰
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-6 sticky top-6">
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5">
              Chi nhánh trả lương
            </label>
            <div className="flex flex-wrap gap-2">
              {["285 Nguyễn Lương Bằng", "379b Tôn Đức Thắng"].map(b => {
                const isSelected = selectedBranches.includes(b);
                return (
                  <button
                    key={b}
                    onClick={() => toggleBranchFilter(b)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      isSelected 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>{b.includes("285") ? "CS1" : "CS2"}: {b.slice(0, 15)}...</span>
                    {isSelected ? <X className="w-3.5 h-3.5" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
              Kỳ hạn trả lương
            </label>
            <select className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs">
              <option value="Hàng tháng">Hàng tháng</option>
              <option value="Hàng tuần">Hàng tuần</option>
              <option value="Tất cả">Tất cả kỳ hạn</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
              Trạng thái bảng lương
            </label>
            <div className="space-y-2.5 text-sm font-bold text-slate-700">
              {["Đang tạo", "Tạm tính", "Đã chốt lương", "Đã trả", "Đã hủy"].map(status => (
                <label key={status} className="flex items-center gap-2.5 cursor-pointer select-none hover:text-blue-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={statusFilters.includes(status)}
                    onChange={() => toggleStatusFilter(status)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>{status}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <button 
              onClick={() => { setSelectedBranches(["285 Nguyễn Lương Bằng", "379b Tôn Đức Thắng"]); setStatusFilters(["Đang tạo", "Tạm tính", "Đã chốt lương"]); }}
              className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
            >
              🔄 Đặt lại bộ lọc
            </button>
          </div>
        </div>

        <div className="lg:col-span-9 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4 h-[72px]">
            {selectedSheetIds.length > 0 ? (
              <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="text-sm font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã chọn {selectedSheetIds.length} bảng lương
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={handleBulkCancel} className="h-10 text-rose-600 border-rose-200 hover:bg-rose-50 font-bold bg-white">
                    Xóa
                  </Button>
                  <Button variant="outline" onClick={handleBulkUpdate} className="h-10 text-slate-700 border-slate-300 hover:bg-slate-50 font-bold bg-white">
                    Cập nhật
                  </Button>
                  <Button onClick={handleBulkApprove} className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md border-transparent">
                    Chốt lương
                  </Button>
                  <div className="w-px h-6 bg-slate-200 mx-1"></div>
                  <Button variant="ghost" onClick={() => setSelectedSheetIds([])} className="h-10 text-slate-500 hover:bg-slate-200 font-bold">
                    Bỏ chọn
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative flex-1 max-w-md animate-in fade-in duration-200">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Theo mã, tên bảng lương..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
                <div className="text-xs font-bold text-slate-500">
                  Tổng số <strong>{filteredSheets.length}</strong> bảng tính lương
                </div>
              </>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 w-4 h-4 cursor-pointer" 
                      checked={filteredSheets.length > 0 && selectedSheetIds.length === filteredSheets.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-4">Mã</th>
                  <th className="p-4">Tên</th>
                  <th className="p-4">Kỳ hạn trả</th>
                  <th className="p-4">Kỳ làm việc</th>
                  <th className="p-4">Chi nhánh</th>
                  <th className="p-4 text-right">Tổng lương</th>
                  <th className="p-4 text-right">Đã trả nhân viên</th>
                  <th className="p-4 text-right">Còn cần trả</th>
                  <th className="p-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <tr className="bg-blue-50/40 font-black text-slate-900 border-b-2 border-blue-200">
                  <td className="p-4"></td>
                  <td colSpan={5} className="p-4 text-blue-900">Tổng cộng:</td>
                  <td className="p-4 text-right font-mono text-base">{formatCurrency(overallTotals.totalSalary)}</td>
                  <td className="p-4 text-right font-mono text-emerald-700">{formatCurrency(overallTotals.totalPaid)}</td>
                  <td className="p-4 text-right font-mono text-red-600 text-base">{formatCurrency(overallTotals.totalRemaining)}</td>
                  <td className="p-4"></td>
                </tr>
                {filteredSheets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-16 text-center text-slate-400 italic">
                      Không tìm thấy bảng lương nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredSheets.map((sheet) => (
                    <Fragment key={sheet.id}>
                      <tr 
                        onClick={() => setExpandedRow(prev => prev === sheet.id ? null : sheet.id)}
                        className={`transition-colors cursor-pointer group ${expandedRow === sheet.id ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'}`}
                      >
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-blue-600 w-4 h-4 cursor-pointer" 
                            checked={selectedSheetIds.includes(sheet.id)}
                            onChange={() => toggleSelectRow(sheet.id)}
                          />
                        </td>
                        <td className="p-4 font-bold text-blue-600 font-mono">{sheet.code}</td>
                        <td className="p-4 font-bold text-slate-800">{sheet.name}</td>
                        <td className="p-4 text-slate-600">{sheet.periodType}</td>
                        <td className="p-4 text-slate-500 font-mono text-xs">{sheet.periodRange}</td>
                        <td className="p-4 font-semibold text-slate-700">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-xs">
                            <Building2 className="w-3 h-3 text-blue-600" />
                            {sheet.branch.includes("285") ? "CS1" : "CS2"}
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-slate-900 font-mono">{formatCurrency(sheet.totalSalary)}</td>
                        <td className="p-4 text-right font-bold text-emerald-700 font-mono">{formatCurrency(sheet.totalPaid)}</td>
                        <td className="p-4 text-right font-black text-red-600 font-mono">{formatCurrency(sheet.totalRemaining)}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${
                            sheet.status === "Đã chốt lương" ? "bg-blue-100 text-blue-800 border-blue-200" :
                            sheet.status === "Đã trả" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                            sheet.status === "Đã hủy" ? "bg-slate-100 text-slate-500 border-slate-200" :
                            "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                          }`}>
                            {sheet.status === "Đã chốt lương" ? <CheckCircle2 className="w-3 h-3 text-blue-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                            {sheet.status}
                          </span>
                        </td>
                      </tr>
                      {expandedRow === sheet.id && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={10} className="p-6 border-b-2 border-blue-200 shadow-inner">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
                              <div className="flex border-b border-slate-200 px-6 pt-3 gap-6 font-bold text-sm bg-slate-50/50">
                                <button
                                  onClick={() => setDetailTab("info")}
                                  className={`pb-3 border-b-2 transition-all ${detailTab === "info" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                                >
                                  Thông tin
                                </button>
                                <button
                                  onClick={() => setDetailTab("payslip")}
                                  className={`pb-3 border-b-2 transition-all ${detailTab === "payslip" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                                >
                                  Phiếu lương ({sheet.items?.length || 0} NV)
                                </button>
                                <button
                                  onClick={() => setDetailTab("history")}
                                  className={`pb-3 border-b-2 transition-all ${detailTab === "history" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                                >
                                  Lịch sử thanh toán ({sheet.payments?.length || 0})
                                </button>
                              </div>
                              {detailTab === "info" && (
                                <div className="p-6 space-y-6">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                                    <div className="space-y-4">
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Mã:</span>
                                        <strong className="text-slate-800 font-mono text-base">{sheet.code}</strong>
                                      </div>
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Ngày tạo:</span>
                                        <span className="font-semibold text-slate-700">{sheet.createdAt}</span>
                                      </div>
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Tổng số nhân viên:</span>
                                        <strong className="text-slate-900 font-black text-base">{sheet.totalEmployees || sheet.items?.length || 5}</strong>
                                      </div>
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Chi nhánh trả lương:</span>
                                        <strong className="text-blue-700 font-bold">{sheet.branch}</strong>
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Tên:</span>
                                        <strong className="text-slate-900 font-bold">{sheet.name}</strong>
                                      </div>
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Người tạo:</span>
                                        <span className="font-semibold text-slate-700">{sheet.creator || "Auto"}</span>
                                      </div>
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Tổng lương:</span>
                                        <strong className="text-slate-900 font-black font-mono text-base">{formatCurrency(sheet.totalSalary)}</strong>
                                      </div>
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Phạm vi áp dụng:</span>
                                        <span className="font-semibold text-slate-700">Tất cả nhân viên chi nhánh</span>
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Kỳ hạn trả:</span>
                                        <span className="font-semibold text-slate-700">{sheet.periodType}</span>
                                      </div>
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Người lập bảng:</span>
                                        <span className="font-semibold text-slate-700">{sheet.creator || "Auto"}</span>
                                      </div>
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Đã trả nhân viên:</span>
                                        <strong className="text-emerald-700 font-black font-mono text-base">{formatCurrency(sheet.totalPaid)}</strong>
                                      </div>
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Người chốt lương:</span>
                                        <span className="font-semibold text-blue-700">{sheet.approver || "Chưa chốt"}</span>
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Kỳ làm việc:</span>
                                        <span className="font-semibold text-slate-800 font-mono">{sheet.periodRange}</span>
                                      </div>
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Trạng thái:</span>
                                        <span className="font-bold text-amber-700">{sheet.status}</span>
                                      </div>
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Còn cần trả:</span>
                                        <strong className="text-red-600 font-black font-mono text-base">{formatCurrency(sheet.totalRemaining)}</strong>
                                      </div>
                                      <div>
                                        <span className="block text-xs font-bold text-slate-400">Ghi chú:</span>
                                        <span className="italic text-slate-500">{sheet.note || "Không có ghi chú..."}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {detailTab === "payslip" && (
                                <div className="p-6">
                                  <table className="w-full text-left text-sm border border-slate-200 rounded-xl overflow-hidden">
                                    <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                                      <tr>
                                        <th className="p-3">Mã NV</th>
                                        <th className="p-3">Tên nhân viên</th>
                                        <th className="p-3 text-right">Lương chính</th>
                                        <th className="p-3 text-right">Làm thêm OT</th>
                                        <th className="p-3 text-center bg-purple-50 text-purple-900">Ca đêm (+15k)</th>
                                        <th className="p-3 text-right">Phụ cấp khác</th>
                                        <th className="p-3 text-right">Giảm trừ</th>
                                        <th className="p-3 text-right font-bold text-blue-700">Lương thực nhận</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {(!sheet.items || sheet.items.length === 0) ? (
                                        <tr><td colSpan={8} className="p-8 text-center text-slate-400 italic">Chưa tải chi tiết. Hãy bấm "Tải lại dữ liệu"!</td></tr>
                                      ) : (
                                        sheet.items.map(it => (
                                          <tr key={it.employeeCode} className="hover:bg-slate-50">
                                            <td className="p-3 font-mono text-xs font-bold text-slate-500">{it.employeeCode}</td>
                                            <td
                                              className="p-3 font-bold text-blue-600 hover:underline cursor-pointer"
                                              onClick={() => setViewingPayslip({
                                                item: it,
                                                sheetInfo: { id: sheet.id, code: sheet.code, name: sheet.name, periodRange: sheet.periodRange, branch: sheet.branch },
                                                isEditable: false
                                              })}
                                            >
                                              {it.employeeName}
                                            </td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(it.basicSalary)}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(it.overtimeSalary)}</td>
                                            <td className="p-3 text-center font-mono font-bold text-purple-900 bg-purple-50/40">
                                              {it.nightShiftsCount ? `${it.nightShiftsCount} buổi (${formatCurrency(it.nightShiftAllowance)} đ)` : "-"}
                                            </td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(it.allowances)}</td>
                                            <td className="p-3 text-right font-mono text-red-600">{formatCurrency(it.deductions)}</td>
                                            <td className="p-3 text-right font-mono font-black text-blue-700">{formatCurrency(it.netSalary)}</td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              {detailTab === "history" && (
                                <div className="p-6">
                                  {(!sheet.payments || sheet.payments.length === 0) ? (
                                    <div className="text-center py-8 text-slate-400 italic">Chưa có đợt thanh toán nào cho bảng lương này.</div>
                                  ) : (
                                    <div className="space-y-3">
                                      {sheet.payments.map((p, pIdx) => (
                                        <div key={p.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-sm">
                                          <div>
                                            <div className="font-bold text-slate-800">Thanh toán lần #{pIdx + 1}: <strong className="text-emerald-700 font-mono text-base">{formatCurrency(p.amount)} đ</strong></div>
                                            <div className="text-xs text-slate-500 mt-0.5">Thời gian: {p.timestamp} • Phương thức: {p.paymentMethod}</div>
                                          </div>
                                          <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">Người trả: {p.payer}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                                <Button variant="outline" onClick={() => handleCancelSheet(sheet.id)} className="gap-1.5 bg-white text-red-600 border-red-200 hover:bg-red-50 font-bold">
                                  <Trash2 className="w-4 h-4" /> Hủy bỏ
                                </Button>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                    Dữ liệu được cập nhật vào: <strong className="text-slate-800 font-mono">{sheet.updatedAt}</strong> ℹ️
                                  </span>
                                  <button
                                    onClick={() => handleSyncFromTimesheet(sheet.id)}
                                    className="bg-white hover:bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-xl border border-blue-300 flex items-center gap-1.5 text-xs transition-colors shadow-2xs"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" /> Tải lại dữ liệu (chấm công)
                                  </button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    onClick={() => handleOpenEditor(sheet)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 h-10 shadow-md gap-2"
                                  >
                                    <Check className="w-4 h-4 stroke-[3]" /> Xem bảng lương / Cập nhật
                                  </Button>
                                  <Button variant="outline" onClick={() => handleExportSingleSheetExcel(sheet)} className="bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-bold h-10">
                                    Xuất file
                                  </Button>
                                </div>
                              </div>
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
      </div>
      {viewingPayslip && (
        <PayslipDetailModal
          item={viewingPayslip.item}
          sheet={viewingPayslip.sheetInfo}
          isEditable={viewingPayslip.isEditable}
          onClose={() => setViewingPayslip(null)}
          onSave={(updates) => handleSavePayslip(viewingPayslip.item.employeeCode, updates)}
        />
      )}

      {/* CREATE SHEET MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Tạo Bảng Tính Lương Mới
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tháng tính lương</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <select
                      className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                      value={createMonth}
                      onChange={(e) => setCreateMonth(Number(e.target.value))}
                    >
                      {[6, 7, 8, 9, 10, 11, 12].map(m => (
                        <option key={m} value={m}>Tháng {m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <select
                      className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                      value={createYear}
                      onChange={(e) => setCreateYear(Number(e.target.value))}
                    >
                      <option value={2026}>2026</option>
                      <option value={2027}>2027</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Kỳ lương sẽ được tạo từ ngày 01 đến ngày cuối cùng của tháng.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Chi nhánh áp dụng</label>
                <select
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                  value={createBranch}
                  onChange={(e) => setCreateBranch(e.target.value)}
                >
                  <option value="285 Nguyễn Lương Bằng">285 Nguyễn Lương Bằng</option>
                  <option value="379b Tôn Đức Thắng">379b Tôn Đức Thắng</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="font-bold bg-white h-11 px-5 border-slate-200 text-slate-600 hover:bg-slate-50">
                Hủy bỏ
              </Button>
              <Button onClick={confirmCreateSheet} className="font-bold bg-blue-600 text-white h-11 px-6 hover:bg-blue-700 shadow-sm border-transparent">
                Tạo Bảng Lương
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR TOAST NOTIFICATION */}
      {syncStatus === "error" && (
        <div className="fixed bottom-6 right-6 bg-rose-600 text-white px-5 py-4 rounded-xl shadow-2xl z-50 max-w-sm flex gap-3 items-start animate-bounce">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-rose-200" />
          <div className="flex-1">
            <div className="font-black text-base mb-1 tracking-tight">Lỗi Lưu Dữ Liệu!</div>
            <div className="text-rose-100 text-sm font-medium leading-snug">
              Không thể đồng bộ lên máy chủ. Đừng lo, bản nháp đã được sao lưu cục bộ trên máy bạn. Vui lòng không đóng trình duyệt lúc này!
            </div>
            {syncErrorMsg && (
              <div className="text-[10px] text-rose-200 mt-2 font-mono bg-rose-800/50 p-2 rounded break-all border border-rose-500/30">
                {syncErrorMsg}
              </div>
            )}
          </div>
          <button onClick={() => setSyncStatus("idle")} className="p-1 hover:bg-rose-500 rounded-lg shrink-0 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
