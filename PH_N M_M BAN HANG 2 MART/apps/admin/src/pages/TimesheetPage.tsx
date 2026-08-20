import { useState, useEffect, useMemo } from "react";
import { 
  Search, ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon,
  Check, X, Clock, AlertCircle, CheckCircle2, User, Users,
  FileText, ShieldCheck, Play, Square, Filter, Building2, History,
  DollarSign, Award, AlertTriangle, Eye
} from "lucide-react";
import { Button } from "@2mart/ui";
import { useEmployees, type Employee } from "../hooks/useEmployees";
import { useCurrentBranch } from "../hooks/useCurrentBranch";
import { useSession } from "../hooks/useSession";
import { SHIFTS, buildWeekDays, buildMonthDays, toDayInfo, dayInfoToDate, type ShiftInfo, type DayInfo, type ScheduleAssignment } from "./SchedulePage";
import { matchesSelectedBranch } from "../utils/payrollService";

export type AttendanceStatus = "dung_gio" | "di_muon" | "thieu" | "chua_cham" | "nghi_lam";

export interface AuditLogItem {
  timestamp: string;
  actor: string;
  action: string;
}

export interface AttendanceRecord {
  id: string; // `${shiftId}-${dateKey}-${employeeCode}`
  shiftId: string;
  date: number;
  dateKey: string; // "YYYYMMDD"
  employeeCode: string;
  employeeName: string;
  branch: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  lateMinutes?: number;
  earlyMinutes?: number;
  otMinutes?: number;
  leaveType?: "none" | "co_phep" | "khong_phep";
  note?: string;
  isApproved: boolean;
  auditLogs: AuditLogItem[];
}

const STORAGE_KEY_SCHEDULE = "kiot_rm_schedule_v2";
const STORAGE_KEY_TIMESHEET = "kiot_rm_timesheet_v2";

const recordId = (shiftId: string, dateKey: string, employeeCode: string) => `${shiftId}-${dateKey}-${employeeCode}`;

// "Thứ hai" -> "T2", "Chủ nhật" -> "CN" — nhãn ngắn cho tiêu đề cột ở chế độ xem tháng
const SHORT_WEEKDAY: Record<string, string> = {
  "Chủ nhật": "CN", "Thứ hai": "T2", "Thứ ba": "T3", "Thứ tư": "T4",
  "Thứ năm": "T5", "Thứ sáu": "T6", "Thứ bảy": "T7"
};

// Bản ghi cũ (trước khi có dateKey) chỉ từng tồn tại trong tuần demo 20-26/07/2026
function migrateRecordDateKey(r: AttendanceRecord): AttendanceRecord {
  if (r.dateKey) return r;
  const dateKey = `2026 07 ${String(r.date).padStart(2, "0")}`.replace(/\s/g, "");
  return { ...r, dateKey, id: recordId(r.shiftId, dateKey, r.employeeCode) };
}

export function TimesheetPage() {
  const { currentBranch } = useCurrentBranch();
  const { employees } = useEmployees();
  const { session } = useSession();
  const isStaff = session?.accessLevel === "staff";

  // Employee scope filter (by branch)
  const branchEmployees = useMemo(() => {
    return employees.filter(e => 
      currentBranch === "Tất cả chi nhánh" || 
      e.branch === currentBranch || 
      (!e.branch && currentBranch === "285 Nguyễn Lương Bằng")
    );
  }, [employees, currentBranch]);

  // Lịch làm việc/Bảng chấm công tách riêng theo từng chi nhánh — chọn CS1 chỉ thấy dữ liệu CS1,
  // chọn CS2 chỉ thấy CS2 (kể cả ở chế độ tự chấm công). Chỉ Bảng lương mới gộp dữ liệu 2 cơ sở lại.
  const matchesCurrentBranch = (branchValue?: string) => matchesSelectedBranch(branchValue, currentBranch);

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"manager" | "self">(isStaff ? "self" : "manager");
  const [selectedSelfEmpCode, setSelectedSelfEmpCode] = useState<string>("");

  // Điều hướng xem theo Tuần / Tháng
  const [periodMode, setPeriodMode] = useState<"week" | "month">("week");
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());

  const weekDays = useMemo(() => buildWeekDays(anchorDate), [anchorDate]);
  const todayKey = toDayInfo(new Date()).dateKey;

  // Toàn bộ ngày trong tháng đang xem — mỗi ngày là 1 cột ở chế độ xem tháng
  const monthDays = useMemo(
    () => buildMonthDays(anchorDate.getFullYear(), anchorDate.getMonth() + 1),
    [anchorDate]
  );

  const goToPrevPeriod = () => {
    setAnchorDate(d => periodMode === "week"
      ? new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7)
      : new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const goToNextPeriod = () => {
    setAnchorDate(d => periodMode === "week"
      ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
      : new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };
  const goToToday = () => setAnchorDate(new Date());

  const periodLabel = periodMode === "week"
    ? `${weekDays[0]?.fullDate} - ${weekDays[6]?.fullDate}`
    : `Tháng ${anchorDate.getMonth() + 1}, ${anchorDate.getFullYear()}`;

  // Data State
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});

  // Modals
  const [activeCell, setActiveCell] = useState<{ assign: ScheduleAssignment; shift: ShiftInfo; day: DayInfo } | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [addShiftModal, setAddShiftModal] = useState<{ shift: ShiftInfo; day: DayInfo; defaultEmpCode?: string; defaultEmpName?: string } | null>(null);
  const [selectedAddEmpCode, setSelectedAddEmpCode] = useState<string>("");

  // Form State inside Modal
  const [modalTab, setModalTab] = useState<"attendance" | "history" | "penalty" | "bonus">("attendance");
  const [formWorkStatus, setFormWorkStatus] = useState<"working" | "leave_paid" | "leave_unpaid">("working");
  const [hasCheckIn, setHasCheckIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState("07:00");
  const [hasCheckOut, setHasCheckOut] = useState(false);
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [hasLate, setHasLate] = useState(false);
  const [lateHours, setLateHours] = useState(0);
  const [lateMins, setLateMins] = useState(0);
  const [hasOt, setHasOt] = useState(false);
  const [otHours, setOtHours] = useState(0);
  const [otMins, setOtMins] = useState(0);
  const [noteText, setNoteText] = useState("");

  // Auto set initial self-service employee: nhân viên bị khóa cứng về chính mình,
  // quản lý (nếu bật chế độ mô phỏng) mặc định lấy người đầu tiên trong chi nhánh
  useEffect(() => {
    if (isStaff && session?.code) {
      setSelectedSelfEmpCode(session.code);
    } else if (branchEmployees.length > 0 && !selectedSelfEmpCode) {
      setSelectedSelfEmpCode(branchEmployees[0].code);
    }
  }, [branchEmployees, selectedSelfEmpCode, isStaff, session?.code]);

  // Load schedule and seed initial attendance records
  useEffect(() => {
    // 1. Load Schedule
    const rawSched = localStorage.getItem(STORAGE_KEY_SCHEDULE);
    let schedList: ScheduleAssignment[] = [];
    if (rawSched) {
      try {
        // Bản ghi lịch cũ chưa có dateKey — quy về tuần demo 20-26/07/2026 giống SchedulePage
        schedList = (JSON.parse(rawSched) as ScheduleAssignment[]).map(a =>
          a.dateKey ? a : { ...a, dateKey: `202607${String(a.date).padStart(2, "0")}` }
        );
      } catch (e) {}
    }
    setAssignments(schedList);

    // 2. Load Timesheet records
    const rawTime = localStorage.getItem(STORAGE_KEY_TIMESHEET);
    if (!rawTime || rawTime === "{}") {
      // Seed realistic attendance records matching the user's screenshot!
      const initialRecords: Record<string, AttendanceRecord> = {};
      schedList.forEach((assign) => {
        const id = recordId(assign.shiftId, assign.dateKey, assign.employeeCode);
        // Generate realistic status based on date (20 to 24 are past, 25-26 are future)
        if (assign.date <= 23) {
          const rand = (assign.date + assign.employeeCode.charCodeAt(0)) % 10;
          let status: AttendanceStatus = "dung_gio";
          let inTime = "07:00";
          let outTime = "12:00";
          let lateM = 0;
          let otM = 0;

          if (assign.shiftId === "ca-chieu-3") { inTime = "12:00"; outTime = "17:00"; }
          if (assign.shiftId === "ca-toi-3") { inTime = "17:00"; outTime = "23:00"; }
          if (assign.shiftId === "ca-dem-3") { inTime = "23:00"; outTime = "05:00"; }

          if (rand === 1 || rand === 5) {
            status = "di_muon";
            inTime = assign.shiftId === "ca-sang-3" ? "07:15" : (assign.shiftId === "ca-chieu-3" ? "12:20" : "17:15");
            lateM = 15;
          } else if (rand === 2) {
            status = "thieu";
            outTime = "";
          } else if (rand === 3) {
            status = "nghi_lam";
            inTime = "";
            outTime = "";
          } else if (rand === 7) {
            otM = 45;
          }

          initialRecords[id] = {
            id,
            shiftId: assign.shiftId,
            date: assign.date,
            dateKey: assign.dateKey,
            employeeCode: assign.employeeCode,
            employeeName: assign.employeeName,
            branch: assign.employeeDept || "CS1",
            status,
            checkIn: inTime || undefined,
            checkOut: outTime || undefined,
            lateMinutes: lateM || undefined,
            otMinutes: otM || undefined,
            leaveType: status === "nghi_lam" ? "co_phep" : "none",
            isApproved: assign.date <= 21, // early dates approved
            auditLogs: [
              {
                timestamp: `20/07/2026 07:01`,
                actor: assign.employeeName,
                action: `Tự chấm công vào (${inTime})`
              },
              ...(outTime ? [{
                timestamp: `20/07/2026 ${outTime}`,
                actor: assign.employeeName,
                action: `Tự chấm công ra (${outTime})`
              }] : [])
            ]
          };
        } else {
          // Future / Today not checked in yet
          initialRecords[id] = {
            id,
            shiftId: assign.shiftId,
            date: assign.date,
            dateKey: assign.dateKey,
            employeeCode: assign.employeeCode,
            employeeName: assign.employeeName,
            branch: assign.employeeDept || "CS1",
            status: "chua_cham",
            leaveType: "none",
            isApproved: false,
            auditLogs: []
          };
        }
      });
      localStorage.setItem(STORAGE_KEY_TIMESHEET, JSON.stringify(initialRecords));
      setRecords(initialRecords);
    } else {
      try {
        const parsed: Record<string, AttendanceRecord> = JSON.parse(rawTime);
        const migrated: Record<string, AttendanceRecord> = {};
        let changed = false;
        Object.values(parsed).forEach(r => {
          const m = migrateRecordDateKey(r);
          if (m !== r) changed = true;
          migrated[m.id] = m;
        });
        setRecords(migrated);
        if (changed) localStorage.setItem(STORAGE_KEY_TIMESHEET, JSON.stringify(migrated));
      } catch (e) { setRecords({}); }
    }
  }, []);

  const saveRecords = (newMap: Record<string, AttendanceRecord>) => {
    localStorage.setItem(STORAGE_KEY_TIMESHEET, JSON.stringify(newMap));
    setRecords(newMap);
  };

  // Filtered assignments to display on board
  const displayAssignments = useMemo(() => {
    return assignments.filter(a => {
      // Ca này có thực sự thuộc chi nhánh đang xem không (theo employeeDept thực tế của ca) —
      // áp dụng cho cả chế độ tự chấm công: chọn CS1 chỉ thấy ca CS1, chọn CS2 chỉ thấy ca CS2.
      if (!matchesCurrentBranch(a.employeeDept)) return false;
      // If in self mode, only show current user's shifts!
      if (viewMode === "self" && a.employeeCode !== selectedSelfEmpCode) return false;
      // Search filter
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        return a.employeeName.toLowerCase().includes(lower) || a.employeeCode.toLowerCase().includes(lower);
      }
      return true;
    });
  }, [assignments, currentBranch, viewMode, selectedSelfEmpCode, searchTerm]);

  // Unapproved count for badge
  const unapprovedCount = useMemo(() => {
    return Object.values(records).filter(r => !r.isApproved && r.status !== "chua_cham" && matchesCurrentBranch(r.branch)).length;
  }, [records, currentBranch]);

  // Open Modal Handler
  const openAttendanceModal = (assign: ScheduleAssignment, shift: ShiftInfo, day: DayInfo) => {
    const id = recordId(assign.shiftId, assign.dateKey, assign.employeeCode);
    const rec = records[id] || {
      id,
      shiftId: assign.shiftId,
      date: assign.date,
      dateKey: assign.dateKey,
      employeeCode: assign.employeeCode,
      employeeName: assign.employeeName,
      branch: assign.employeeDept || "CS1",
      status: "chua_cham",
      isApproved: false,
      auditLogs: []
    };

    setModalTab("attendance");
    setFormWorkStatus(rec.status === "nghi_lam" ? (rec.leaveType === "khong_phep" ? "leave_unpaid" : "leave_paid") : "working");
    setHasCheckIn(!!rec.checkIn);
    setCheckInTime(rec.checkIn || (shift.id === "ca-sang-3" ? "07:00" : shift.id === "ca-chieu-3" ? "12:00" : "17:00"));
    setHasCheckOut(!!rec.checkOut);
    setCheckOutTime(rec.checkOut || (shift.id === "ca-sang-3" ? "12:00" : shift.id === "ca-chieu-3" ? "17:00" : "23:00"));
    
    const lateTotal = rec.lateMinutes || 0;
    setHasLate(lateTotal > 0);
    setLateHours(Math.floor(lateTotal / 60));
    setLateMins(lateTotal % 60);

    const otTotal = rec.otMinutes || 0;
    setHasOt(otTotal > 0);
    setOtHours(Math.floor(otTotal / 60));
    setOtMins(otTotal % 60);

    setNoteText(rec.note || "");
    setActiveCell({ assign, shift, day });
  };

  // Open Add Shift Modal (Khi click ô trống hoặc nút + Thêm NV vào ca)
  // defaultEmpName: tên hiển thị lấy từ lịch làm việc — cần thiết cho các mã nhân viên cũ
  // (VD "NV000036") không còn trong danh sách nhân viên hiện tại, nếu không sẽ chỉ thấy mã.
  const openAddShiftModal = (shift: ShiftInfo, day: DayInfo, defaultEmpCode?: string, defaultEmpName?: string) => {
    const targetCode = defaultEmpCode || (viewMode === "self" ? selectedSelfEmpCode : branchEmployees[0]?.code || "");
    setSelectedAddEmpCode(targetCode);
    setAddShiftModal({ shift, day, defaultEmpCode, defaultEmpName });
  };

  // Confirm Add Shift & Open Live Check-In Modal
  const handleConfirmAddShift = () => {
    if (!addShiftModal || !selectedAddEmpCode) return;
    const { shift, day } = addShiftModal;
    // Tìm trong TOÀN BỘ danh sách nhân viên (không chỉ chi nhánh đang xem) để lấy đúng tên,
    // kể cả khi đang tạo ca cho 1 NV có chi nhánh gốc khác — nhưng ca luôn gắn vào chi nhánh
    // ĐANG XEM (currentBranch), không phải chi nhánh gốc của nhân viên.
    const emp = employees.find(e => e.code === selectedAddEmpCode) || {
      code: selectedAddEmpCode,
      name: addShiftModal.defaultEmpName || selectedAddEmpCode,
      role: "Nhân viên"
    };

    const newAssign: ScheduleAssignment = {
      id: recordId(shift.id, day.dateKey, emp.code),
      shiftId: shift.id,
      date: day.date,
      dateKey: day.dateKey,
      employeeCode: emp.code,
      employeeName: emp.name,
      employeeDept: currentBranch
    };

    // 1. Tự động thêm vào đăng ký lịch làm việc ban đầu (Schedule storage)
    const updatedAssigns = [...assignments.filter(a => !(a.shiftId === shift.id && a.dateKey === day.dateKey && a.employeeCode === emp.code)), newAssign];
    localStorage.setItem("kiot_rm_schedule_v2", JSON.stringify(updatedAssigns));
    setAssignments(updatedAssigns);

    // 2. Tạo bản ghi chấm công (Timesheet storage)
    const recId = recordId(shift.id, day.dateKey, emp.code);
    const curRec = records[recId] || {
      id: recId,
      shiftId: shift.id,
      date: day.date,
      dateKey: day.dateKey,
      employeeCode: emp.code,
      employeeName: emp.name,
      branch: currentBranch,
      status: "chua_cham",
      isApproved: false,
      auditLogs: [{
        timestamp: `${day.fullDate} ${new Date().toTimeString().slice(0, 5)}`,
        actor: viewMode === "self" ? emp.name : "Quản lý",
        action: `Đăng ký lịch làm việc bổ sung ca ${shift.name} (${day.name})`
      }]
    };
    const updatedRecords = { ...records, [recId]: curRec };
    saveRecords(updatedRecords);

    // 3. Đóng Modal Đặt lịch và ngay lập tức mở Modal Chấm công để Check-in
    setAddShiftModal(null);
    openAttendanceModal(newAssign, shift, day);
  };

  // Real-Time Action: Check-in Now (Chấm công Vào ngay lập tức)
  const handleLiveCheckIn = () => {
    if (!activeCell) return;
    const { assign, shift, day } = activeCell;
    const id = recordId(assign.shiftId, assign.dateKey, assign.employeeCode);
    const nowStr = new Date().toTimeString().slice(0, 5); // e.g. "07:02"
    
    const cur = records[id] || {
      id, shiftId: assign.shiftId, date: assign.date, dateKey: assign.dateKey, employeeCode: assign.employeeCode,
      employeeName: assign.employeeName, branch: assign.employeeDept || "CS1", isApproved: false, auditLogs: []
    };

    const updated: AttendanceRecord = {
      ...cur,
      status: "dung_gio",
      checkIn: nowStr,
      auditLogs: [
        {
          timestamp: `${day.fullDate} ${nowStr}`,
          actor: viewMode === "self" ? assign.employeeName : "Quản lý (Thanh Tâm)",
          action: `Chấm công VÀO trực tiếp lúc ${nowStr}`
        },
        ...(cur.auditLogs || [])
      ]
    };

    saveRecords({ ...records, [id]: updated });
    setHasCheckIn(true);
    setCheckInTime(nowStr);
    setFormWorkStatus("working");
    alert(`🎉 Đã bắt đầu ca làm việc và chấm công VÀO thành công lúc ${nowStr}!`);
  };

  // Real-Time Action: Check-out Now (Kết ca & Chấm công Ra)
  const handleLiveCheckOut = () => {
    if (!activeCell) return;
    const { assign, shift, day } = activeCell;
    const id = recordId(assign.shiftId, assign.dateKey, assign.employeeCode);
    const nowStr = new Date().toTimeString().slice(0, 5);
    
    const cur = records[id];
    if (!cur || !cur.checkIn) {
      alert("⚠️ Bạn cần chấm công VÀO trước khi kết ca!");
      return;
    }

    const updated: AttendanceRecord = {
      ...cur,
      checkOut: nowStr,
      auditLogs: [
        {
          timestamp: `${day.fullDate} ${nowStr}`,
          actor: viewMode === "self" ? assign.employeeName : "Quản lý (Thanh Tâm)",
          action: `Kết ca và chấm công RA lúc ${nowStr}`
        },
        ...(cur.auditLogs || [])
      ]
    };

    saveRecords({ ...records, [id]: updated });
    setHasCheckOut(true);
    setCheckOutTime(nowStr);
    alert(`🛑 Đã kết ca và chấm công RA thành công lúc ${nowStr}!`);
  };

  // Save Modal Form Changes
  const handleSaveModal = () => {
    if (!activeCell) return;
    const { assign, day } = activeCell;
    const id = recordId(assign.shiftId, assign.dateKey, assign.employeeCode);
    const cur = records[id] || {
      id, shiftId: assign.shiftId, date: assign.date, dateKey: assign.dateKey, employeeCode: assign.employeeCode,
      employeeName: assign.employeeName, branch: assign.employeeDept || "CS1", isApproved: false, auditLogs: []
    };

    let newStatus: AttendanceStatus = "dung_gio";
    const totalLate = hasLate ? (lateHours * 60 + lateMins) : 0;
    const totalOt = hasOt ? (otHours * 60 + otMins) : 0;

    if (formWorkStatus === "leave_paid" || formWorkStatus === "leave_unpaid") {
      newStatus = "nghi_lam";
    } else if (!hasCheckIn || !hasCheckOut) {
      newStatus = "thieu";
    } else if (totalLate > 0) {
      newStatus = "di_muon";
    }

    const updated: AttendanceRecord = {
      ...cur,
      status: newStatus,
      checkIn: (formWorkStatus === "working" && hasCheckIn) ? checkInTime : undefined,
      checkOut: (formWorkStatus === "working" && hasCheckOut) ? checkOutTime : undefined,
      lateMinutes: totalLate > 0 ? totalLate : undefined,
      otMinutes: totalOt > 0 ? totalOt : undefined,
      leaveType: formWorkStatus === "working" ? "none" : (formWorkStatus === "leave_paid" ? "co_phep" : "khong_phep"),
      note: noteText,
      auditLogs: [
        {
          timestamp: `${day.fullDate} ${new Date().toTimeString().slice(0, 5)}`,
          actor: viewMode === "self" ? assign.employeeName : "Quản lý (Thanh Tâm)",
          action: `Cập nhật thủ công: ${newStatus === 'nghi_lam' ? 'Nghỉ làm' : `Vào ${hasCheckIn ? checkInTime : '--'} - Ra ${hasCheckOut ? checkOutTime : '--'}`}`
        },
        ...(cur.auditLogs || [])
      ]
    };

    saveRecords({ ...records, [id]: updated });
    setActiveCell(null);
  };

  // Batch approve all unapproved records in branch
  const handleBatchApprove = () => {
    const updated = { ...records };
    let count = 0;
    Object.keys(updated).forEach(id => {
      const r = updated[id];
      if (!r.isApproved && r.status !== "chua_cham" && matchesCurrentBranch(r.branch)) {
        r.isApproved = true;
        r.auditLogs.unshift({
          timestamp: `26/07/2026 ${new Date().toTimeString().slice(0, 5)}`,
          actor: "Quản lý (Thanh Tâm)",
          action: "Duyệt công xác nhận hợp lệ"
        });
        count++;
      }
    });
    saveRecords(updated);
    setIsApprovalModalOpen(false);
    alert(`✅ Đã duyệt và xác nhận hợp lệ cho ${count} lượt chấm công! Dữ liệu đã sẵn sàng để chuyển sang Bảng Lương.`);
  };

  // Render Status Dot / Indicator
  const renderStatusDot = (status: AttendanceStatus) => {
    switch (status) {
      case "dung_gio":
        return <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shrink-0 shadow-xs" title="Đúng giờ" />;
      case "di_muon":
        return <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block shrink-0 shadow-xs" title="Đi muộn / Về sớm" />;
      case "thieu":
        return <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shrink-0 shadow-xs" title="Chấm công thiếu" />;
      case "nghi_lam":
        return <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block shrink-0" title="Nghỉ làm" />;
      case "chua_cham":
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shrink-0" title="Chưa chấm công / Sắp tới" />;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 flex flex-col h-full relative animate-in fade-in duration-200">
      
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Bảng chấm công</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Building2 className="w-3.5 h-3.5" />
              Cơ sở: {currentBranch}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Theo dõi lịch sử vào ra, kết ca và xác nhận công phục vụ tính lương</p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* View Mode Selector (Manager vs Self-Service) — chỉ Admin mới đổi được chế độ */}
          {!isStaff && (
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setViewMode("manager")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "manager" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Quản lý tất cả</span>
              </button>
              <button
                onClick={() => setViewMode("self")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "self" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Chế độ nhân viên (Tự chấm)</span>
              </button>
            </div>
          )}

          {/* Self-Service Employee Selector when in self mode — nhân viên bị khóa cứng về chính mình nên không cần chọn */}
          {viewMode === "self" && !isStaff && (
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 animate-in fade-in">
              <span className="text-xs font-bold text-blue-900">Mô phỏng NV:</span>
              <select
                value={selectedSelfEmpCode}
                onChange={(e) => setSelectedSelfEmpCode(e.target.value)}
                className="text-xs font-bold text-blue-700 bg-transparent focus:outline-none cursor-pointer pr-1"
              >
                {branchEmployees.map(e => (
                  <option key={e.code} value={e.code}>{e.name} ({e.code})</option>
                ))}
              </select>
            </div>
          )}

          {/* Search Input */}
          <div className="relative w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nhân viên..." 
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          {/* Điều hướng Tuần / Tháng */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-9">
            <button onClick={goToPrevPeriod} className="px-3 py-2 hover:bg-slate-50 border-r border-slate-200 text-slate-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-sm font-medium text-slate-700 whitespace-nowrap flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-slate-500" />
              {periodLabel}
            </div>
            <button onClick={goToNextPeriod} className="px-3 py-2 hover:bg-slate-50 border-l border-slate-200 text-slate-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button variant="outline" onClick={goToToday} className="h-9 px-4 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm font-medium">
            {periodMode === "week" ? "Tuần này" : "Tháng này"}
          </Button>

          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              className="h-9 px-3.5 gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm font-medium min-w-[150px] justify-between"
            >
              <span>{periodMode === "week" ? "Xem theo tuần" : "Xem theo tháng"}</span>
              <ChevronDown className="w-4 h-4 opacity-60" />
            </Button>
            {isPeriodDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col z-50 animate-in zoom-in-95 duration-150">
                <button
                  onClick={() => { setPeriodMode("week"); setIsPeriodDropdownOpen(false); }}
                  className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-blue-50 transition-colors ${periodMode === "week" ? "bg-blue-50/80 text-blue-700 font-semibold" : "text-slate-700"}`}
                >
                  <span>Xem theo tuần</span>
                  {periodMode === "week" && <Check className="w-4 h-4 text-blue-600" />}
                </button>
                <button
                  onClick={() => { setPeriodMode("month"); setIsPeriodDropdownOpen(false); }}
                  className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-blue-50 transition-colors border-t border-slate-100 ${periodMode === "month" ? "bg-blue-50/80 text-blue-700 font-semibold" : "text-slate-700"}`}
                >
                  <span>Xem theo tháng</span>
                  {periodMode === "month" && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Duyệt chấm công button with Red Badge — chỉ Admin mới được duyệt công */}
          {!isStaff && (
          <Button
            onClick={() => setIsApprovalModalOpen(true)}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm h-9 px-4 font-bold flex items-center gap-2 relative"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Duyệt chấm công</span>
            {unapprovedCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center animate-bounce shadow-sm">
                {unapprovedCount}
              </span>
            )}
          </Button>
          )}
        </div>
      </div>

      {/* Self-Service Banner Notice */}
      {viewMode === "self" && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5 mb-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md shrink-0 border border-white/20">
              <Clock className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Xin chào, {branchEmployees.find(e => e.code === selectedSelfEmpCode)?.name || selectedSelfEmpCode}!</h2>
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">Chế độ tự chấm công</span>
              </div>
              <p className="text-xs text-blue-100 mt-1">
                Bạn chỉ nhìn thấy các ca làm việc được phân công cho riêng bạn. Hãy nhấn trực tiếp vào ca làm việc dưới bảng hoặc nút bên phải để bắt đầu chấm công vào / kết ca.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
            <div className="text-right mr-2 hidden sm:block">
              <div className="text-xs text-blue-200">Thời gian hệ thống</div>
              <div className="text-sm font-mono font-bold text-white">{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • Hôm nay</div>
            </div>
          </div>
        </div>
      )}

      {/* Main 2D Matrix Grid: Shifts (Rows) x Days (Columns) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto flex-1">
        {periodMode === "week" && (
        <table className="w-full text-left border-collapse min-w-[1300px]">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
              <th className="px-5 py-4 w-[220px] border-r border-slate-200 text-sm font-bold text-slate-800 bg-slate-50/90">
                Ca làm việc \ Ngày
              </th>
              {weekDays.map(day => (
                <th key={day.dateKey} className="px-3 py-3 text-center border-r border-slate-200 last:border-r-0 min-w-[120px]">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{day.name}</div>
                  <div className={`text-base font-black mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full ${day.dateKey === todayKey ? "bg-blue-600 text-white shadow-sm" : "text-slate-800"}`}>
                    {day.date}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {SHIFTS.map(shift => {
              // Group assignments in this shift by employee
              const shiftAssigns = displayAssignments.filter(a => a.shiftId === shift.id);
              // Get unique employees assigned to this shift across the week
              const empMap = new Map<string, string>();
              shiftAssigns.forEach(a => empMap.set(a.employeeCode, a.employeeName));
              
              // Nếu chế độ tự chấm công, hiển thị dòng nhân viên đang chọn để có thể click vào ô trống đặt ca
              const uniqueEmpCodes = viewMode === "self" 
                ? (selectedSelfEmpCode ? [selectedSelfEmpCode] : [])
                : Array.from(empMap.keys());

              if (uniqueEmpCodes.length === 0 && viewMode === "self") return null;

              return (
                <tr key={shift.id} className="group/row divide-y divide-slate-100">
                  {/* Left Shift & Employee Column */}
                  <td className="px-5 py-4 align-top border-r border-slate-200 bg-slate-50/30 w-[220px]">
                    <div className="font-bold text-slate-800 text-base">{shift.name}</div>
                    <div className="text-xs font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
                      <span>⏰</span> {shift.time}
                    </div>

                    {/* Employee list for this shift */}
                    <div className="mt-4 space-y-2.5">
                      {uniqueEmpCodes.length === 0 ? (
                        <div className="text-xs text-slate-400 italic py-2">Chưa có NV được xếp ca</div>
                      ) : (
                        uniqueEmpCodes.map(code => (
                          <div key={code} className="flex items-center justify-between text-xs font-bold text-slate-700 py-1 border-t border-slate-100 first:border-t-0">
                            <span className="truncate" title={empMap.get(code) || (viewMode === "self" ? branchEmployees.find(e => e.code === code)?.name : code)}>
                              {empMap.get(code) || (viewMode === "self" ? branchEmployees.find(e => e.code === code)?.name : code)}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">{code}</span>
                          </div>
                        ))
                      )}
                      {viewMode === "manager" && (
                        <button
                          onClick={() => openAddShiftModal(shift, weekDays[0])}
                          className="w-full mt-2 py-1.5 px-2 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <span>+</span> Thêm NV vào ca
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Day Columns */}
                  {weekDays.map(day => {
                    const dayAssigns = shiftAssigns.filter(a => a.dateKey === day.dateKey);
                    return (
                      <td key={day.dateKey} className="px-2 py-3 align-top border-r border-slate-200 last:border-r-0 min-w-[120px] bg-white hover:bg-blue-50/20 transition-colors">
                        <div className="flex flex-col gap-2 pt-12">
                          {uniqueEmpCodes.map(code => {
                            const assign = dayAssigns.find(a => a.employeeCode === code);
                            if (!assign) {
                              const empName = empMap.get(code) || (viewMode === "self" ? (branchEmployees.find(e => e.code === code)?.name || "Bạn") : code);
                              return (
                                <div
                                  key={code}
                                  onClick={() => openAddShiftModal(shift, day, code, empName)}
                                  className="h-6 bg-slate-50/50 hover:bg-blue-50 border border-transparent hover:border-dashed hover:border-blue-400 rounded-lg flex items-center justify-center cursor-pointer transition-all text-slate-300 hover:text-blue-600 group/empty shadow-2xs"
                                  title={`Nhấn để đặt lịch bổ sung ca ${shift.name} cho ${empName} (${day.name}, ${day.fullDate})`}
                                >
                                  <span className="text-xs font-bold hidden group-hover/empty:inline">+ Thêm ca</span>
                                  <span className="text-xs group-hover/empty:hidden">--</span>
                                </div>
                              );
                            }

                            const recId = recordId(shift.id, day.dateKey, code);
                            const rec = records[recId] || { status: "chua_cham" as AttendanceStatus };

                            return (
                              <div
                                key={code}
                                onClick={() => openAttendanceModal(assign, shift, day)}
                                className="h-6 bg-slate-50 hover:bg-blue-100/70 border border-slate-200/80 hover:border-blue-300 rounded-lg px-2 flex items-center justify-between cursor-pointer transition-all shadow-2xs group/cell"
                                title={`Nhấn để chấm công cho ${assign.employeeName} (${day.name}, ${day.fullDate})`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  {renderStatusDot(rec.status)}
                                  <span className="text-[11px] font-bold text-slate-700 group-hover/cell:text-blue-900 truncate">
                                    {assign.employeeName.split(' ')[0]}
                                  </span>
                                </div>
                                {rec.checkIn && (
                                  <span className="text-[9px] font-mono text-slate-500 font-semibold">{rec.checkIn}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        )}

        {/* CHẾ ĐỘ XEM THEO THÁNG: ma trận Ca làm việc × Nhân viên × từng ngày trong tháng.
            Bấm vào 1 ô để chấm công (nếu đã có ca) hoặc đặt lịch bổ sung (nếu ô trống). */}
        {periodMode === "month" && (
          <table className="w-full text-left border-collapse" style={{ minWidth: `${380 + monthDays.length * 44}px` }}>
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
                <th className="px-4 py-3 w-[150px] border-r border-slate-200 text-sm font-bold text-slate-800 bg-slate-50/90 sticky left-0 z-20">
                  Ca làm việc
                </th>
                <th className="px-4 py-3 w-[160px] border-r border-slate-200 text-sm font-bold text-slate-800 bg-slate-50/90 sticky left-[150px] z-20">
                  Nhân viên
                </th>
                {monthDays.map(day => (
                  <th key={day.dateKey} className="px-1 py-2 text-center border-r border-slate-200 last:border-r-0 w-[44px] min-w-[44px]">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{SHORT_WEEKDAY[day.name] || day.name}</div>
                    <div className={`text-xs font-black mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full ${day.dateKey === todayKey ? "bg-blue-600 text-white shadow-sm" : "text-slate-800"}`}>
                      {String(day.date).padStart(2, "0")}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {SHIFTS.map(shift => {
                const shiftAssigns = displayAssignments.filter(a => a.shiftId === shift.id && monthDays.some(d => d.dateKey === a.dateKey));
                const empMap = new Map<string, string>();
                shiftAssigns.forEach(a => empMap.set(a.employeeCode, a.employeeName));
                const empCodes = viewMode === "self"
                  ? (selectedSelfEmpCode ? [selectedSelfEmpCode] : [])
                  : Array.from(empMap.keys());

                const shiftCell = (
                  <td rowSpan={Math.max(1, empCodes.length)} className="px-4 py-3 align-top border-r border-slate-200 bg-slate-50/30 w-[150px] sticky left-0 z-10 border-l-4 border-l-blue-500">
                    <div className="font-bold text-slate-800 text-sm">{shift.name}</div>
                    <div className="text-[11px] font-medium text-slate-400 mt-0.5">{shift.time}</div>
                  </td>
                );

                // Ca chưa có nhân viên nào — 1 dòng gợi ý xếp ca
                if (empCodes.length === 0) {
                  return (
                    <tr key={shift.id}>
                      {shiftCell}
                      <td colSpan={monthDays.length + 1} className="px-4 py-4 text-center text-sm text-slate-400 italic">
                        Chọn để xếp nhân viên làm việc cho ca.
                      </td>
                    </tr>
                  );
                }

                return empCodes.map((code, idx) => {
                  const empName = empMap.get(code) || branchEmployees.find(e => e.code === code)?.name || code;
                  return (
                    <tr key={`${shift.id}-${code}`} className="hover:bg-slate-50/40 transition-colors">
                      {idx === 0 && shiftCell}
                      <td className="px-4 py-2.5 border-r border-slate-200 bg-white sticky left-[150px] z-10 w-[160px]">
                        <div className="text-sm font-medium text-slate-700 truncate" title={`${empName} (${code})`}>{empName}</div>
                      </td>
                      {monthDays.map(day => {
                        const assign = shiftAssigns.find(a => a.employeeCode === code && a.dateKey === day.dateKey);
                        const rec = assign ? records[recordId(shift.id, day.dateKey, code)] : undefined;
                        return (
                          <td
                            key={day.dateKey}
                            onClick={() => assign ? openAttendanceModal(assign, shift, day) : openAddShiftModal(shift, day, code, empName)}
                            className={`px-1 py-2.5 text-center border-r border-slate-100 last:border-r-0 cursor-pointer transition-colors ${assign ? "hover:bg-blue-50" : "hover:bg-slate-100/70"}`}
                            title={assign
                              ? `Chấm công ${shift.name} cho ${empName} (${day.name}, ${day.fullDate})`
                              : `Đặt lịch bổ sung ${shift.name} cho ${empName} (${day.name}, ${day.fullDate})`}
                          >
                            {assign && renderStatusDot(rec?.status || "chua_cham")}
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Legend Footer Bar (matching Screenshot 2) */}
      <div className="mt-4 bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 shadow-xs"></span>
          <span>Đúng giờ</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500 shadow-xs"></span>
          <span>Đi muộn / Về sớm</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 shadow-xs"></span>
          <span>Chấm công thiếu</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400 shadow-xs"></span>
          <span>Chưa chấm công</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-300"></span>
          <span>Nghỉ làm</span>
        </div>
      </div>

      {/* MODAL 1: CHẤM CÔNG VÀO / RA & CHI TIẾT (matching Screenshot 3) */}
      {activeCell && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800">Chấm công</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="font-bold text-slate-700">{activeCell.assign.employeeName}</span>
                  <span>|</span>
                  <span className="font-mono">{activeCell.assign.employeeCode}</span>
                  <span>|</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    {renderStatusDot(records[recordId(activeCell.shift.id, activeCell.day.dateKey, activeCell.assign.employeeCode)]?.status || "chua_cham")}
                    <span>{records[recordId(activeCell.shift.id, activeCell.day.dateKey, activeCell.assign.employeeCode)]?.status === "dung_gio" ? "Đúng giờ" : records[recordId(activeCell.shift.id, activeCell.day.dateKey, activeCell.assign.employeeCode)]?.status === "di_muon" ? "Đi muộn / Về sớm" : records[recordId(activeCell.shift.id, activeCell.day.dateKey, activeCell.assign.employeeCode)]?.status === "thieu" ? "Chấm công thiếu" : "Chưa chấm công"}</span>
                  </span>
                </div>
              </div>
              <button onClick={() => setActiveCell(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shift & Date summary */}
            <div className="px-6 pt-4 pb-2 space-y-3 text-sm">
              <div className="flex items-center gap-4">
                <span className="w-24 font-bold text-slate-600">Thời gian:</span>
                <span className="font-semibold text-slate-800">{activeCell.day.name}, {activeCell.day.fullDate}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-24 font-bold text-slate-600">Ca làm việc:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  {activeCell.shift.name} ({activeCell.shift.time})
                </span>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-24 font-bold text-slate-600 pt-2">Ghi chú:</span>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Ghi chú giải trình (lý do đi muộn, lỗi máy chấm công...)"
                  className="flex-1 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500 h-16 resize-none bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* REAL-TIME SELF-SERVICE ACTION BOX */}
            <div className="mx-6 my-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                  Thao tác Chấm công Trực tiếp (Live)
                </div>
                <div className="text-[11px] text-blue-700 mt-0.5">Hệ thống ghi nhận thời gian thực và lưu vào Audit Log cho việc xác nhận sau này.</div>
              </div>
              <div className="flex gap-2">
                {!hasCheckIn ? (
                  <Button onClick={handleLiveCheckIn} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 h-9 shadow-sm gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Bắt đầu VÀO
                  </Button>
                ) : !hasCheckOut ? (
                  <Button onClick={handleLiveCheckOut} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 h-9 shadow-sm gap-1.5">
                    <Square className="w-3.5 h-3.5 fill-white" /> Kết ca RA
                  </Button>
                ) : (
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Đã hoàn tất ca
                  </div>
                )}
              </div>
            </div>

            {/* Tabs Header inside modal */}
            <div className="px-6 border-b border-slate-200 flex gap-6 text-sm font-bold text-slate-500">
              <button 
                onClick={() => setModalTab("attendance")}
                className={`pb-3 border-b-2 transition-colors ${modalTab === "attendance" ? "border-blue-600 text-blue-600 font-black" : "border-transparent hover:text-slate-800"}`}
              >
                Chấm công
              </button>
              <button 
                onClick={() => setModalTab("history")}
                className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${modalTab === "history" ? "border-blue-600 text-blue-600 font-black" : "border-transparent hover:text-slate-800"}`}
              >
                <History className="w-3.5 h-3.5" />
                Lịch sử chấm công (Log)
              </button>
              <button 
                onClick={() => setModalTab("penalty")}
                className={`pb-3 border-b-2 transition-colors ${modalTab === "penalty" ? "border-blue-600 text-blue-600 font-black" : "border-transparent hover:text-slate-800"}`}
              >
                Phạt vi phạm
              </button>
              <button 
                onClick={() => setModalTab("bonus")}
                className={`pb-3 border-b-2 transition-colors ${modalTab === "bonus" ? "border-blue-600 text-blue-600 font-black" : "border-transparent hover:text-slate-800"}`}
              >
                Thưởng
              </button>
            </div>

            {/* Modal Tab Body */}
            <div className="p-6 overflow-y-auto flex-1 max-h-[350px]">
              
              {/* TAB 1: CHẤM CÔNG (Manual overrides & status) */}
              {modalTab === "attendance" && (
                <div className="space-y-5">
                  {/* Status radios */}
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-bold text-slate-700 w-24">Chấm công</span>
                    <div className="flex items-center gap-5 text-sm font-medium">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={formWorkStatus === "working"} onChange={() => setFormWorkStatus("working")} className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                        <span>Đi làm</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={formWorkStatus === "leave_paid"} onChange={() => setFormWorkStatus("leave_paid")} className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                        <span>Nghỉ có phép ℹ️</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={formWorkStatus === "leave_unpaid"} onChange={() => setFormWorkStatus("leave_unpaid")} className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                        <span>Nghỉ không phép ℹ️</span>
                      </label>
                    </div>
                  </div>

                  {/* Check-in input row */}
                  {formWorkStatus === "working" && (
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      
                      {/* Vào / Đi muộn */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-40">
                          <input type="checkbox" checked={hasCheckIn} onChange={(e) => setHasCheckIn(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                          <span className="text-sm font-bold text-slate-800">Vào</span>
                          <div className="relative">
                            <input 
                              type="time" 
                              value={checkInTime} 
                              disabled={!hasCheckIn}
                              onChange={(e) => setCheckInTime(e.target.value)} 
                              className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold w-24 disabled:bg-slate-100 disabled:text-slate-400" 
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-1">
                          <input type="checkbox" checked={hasLate} onChange={(e) => setHasLate(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                          <span className="text-xs font-bold text-slate-700">Đi muộn</span>
                          <input type="number" disabled={!hasLate} value={lateHours} onChange={(e) => setLateHours(Number(e.target.value))} className="w-12 border border-slate-200 rounded px-1.5 py-1 text-xs text-center font-bold disabled:bg-slate-100" />
                          <span className="text-xs text-slate-500">giờ</span>
                          <input type="number" disabled={!hasLate} value={lateMins} onChange={(e) => setLateMins(Number(e.target.value))} className="w-12 border border-slate-200 rounded px-1.5 py-1 text-xs text-center font-bold disabled:bg-slate-100" />
                          <span className="text-xs text-slate-500">phút</span>
                        </div>
                      </div>

                      {/* Ra / Làm thêm (OT) */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-40">
                          <input type="checkbox" checked={hasCheckOut} onChange={(e) => setHasCheckOut(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                          <span className="text-sm font-bold text-slate-800">Ra</span>
                          <div className="relative">
                            <input 
                              type="time" 
                              value={checkOutTime} 
                              disabled={!hasCheckOut}
                              onChange={(e) => setCheckOutTime(e.target.value)} 
                              className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold w-24 disabled:bg-slate-100 disabled:text-slate-400" 
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-1">
                          <input type="checkbox" checked={hasOt} onChange={(e) => setHasOt(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                          <span className="text-xs font-bold text-slate-700">Làm thêm (OT)</span>
                          <input type="number" disabled={!hasOt} value={otHours} onChange={(e) => setOtHours(Number(e.target.value))} className="w-12 border border-slate-200 rounded px-1.5 py-1 text-xs text-center font-bold disabled:bg-slate-100" />
                          <span className="text-xs text-slate-500">giờ</span>
                          <input type="number" disabled={!hasOt} value={otMins} onChange={(e) => setOtMins(Number(e.target.value))} className="w-12 border border-slate-200 rounded px-1.5 py-1 text-xs text-center font-bold disabled:bg-slate-100" />
                          <span className="text-xs text-slate-500">phút</span>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LỊCH SỬ CHẤM CÔNG (AUDIT LOG - XÁC NHẬN CÔNG) */}
              {modalTab === "history" && (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between pb-2 border-b border-slate-200">
                    <span>Nhật ký hoạt động & Thay đổi giờ làm (Audit Trail)</span>
                    <span className="text-blue-600 font-mono">ID: {recordId(activeCell.shift.id, activeCell.day.dateKey, activeCell.assign.employeeCode)}</span>
                  </div>
                  
                  {(!records[recordId(activeCell.shift.id, activeCell.day.dateKey, activeCell.assign.employeeCode)]?.auditLogs || records[recordId(activeCell.shift.id, activeCell.day.dateKey, activeCell.assign.employeeCode)].auditLogs.length === 0) ? (
                    <div className="text-center py-8 text-xs text-slate-400 italic">Chưa có ghi nhận nhật ký chấm công nào cho ca làm việc này.</div>
                  ) : (
                    <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                      {records[recordId(activeCell.shift.id, activeCell.day.dateKey, activeCell.assign.employeeCode)].auditLogs.map((log, idx) => (
                        <div key={idx} className="relative z-10 flex items-start gap-4 pl-1">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0 border-2 border-white shadow-xs">
                            ✓
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 flex-1 border border-slate-200/80">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-extrabold text-slate-800">{log.actor}</span>
                              <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
                            </div>
                            <div className="text-xs text-blue-900 font-medium mt-1">{log.action}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3 & 4: PHẠT / THƯỞNG (Mock info for completeness) */}
              {(modalTab === "penalty" || modalTab === "bonus") && (
                <div className="text-center py-10 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                    {modalTab === "penalty" ? <AlertTriangle className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {modalTab === "penalty" ? "Khoản phạt vi phạm ca làm việc" : "Khoản thưởng phụ cấp ca làm việc"}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {modalTab === "penalty" 
                      ? "Các vi phạm đi muộn hoặc về sớm quá thời gian cho phép sẽ được tự động trừ vào bảng lương theo quy tắc đã thiết lập." 
                      : "Các khoản thưởng nóng, chuyên cần hoặc vượt định mức KPI ca làm việc sẽ được cộng trực tiếp vào phiếu lương cuối tháng."}
                  </p>
                </div>
              )}

            </div>

            {/* Modal Footer (matching Screenshot 3) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setActiveCell(null)} className="text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold px-4 h-9 gap-1.5">
                🗑️ Hủy
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveCell(null)} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold px-5 h-9">
                  Bò qua
                </Button>
                <Button onClick={handleSaveModal} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-6 h-9 shadow-sm">
                  Lưu
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: ĐẶT LỊCH LÀM VIỆC & CHẤM CÔNG ĐỘT XUẤT (MATCHING KIOTVIET SCREENSHOT) */}
      {addShiftModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-lg font-black text-slate-800">{addShiftModal.shift.name}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{addShiftModal.day.name}, {addShiftModal.day.fullDate}</p>
              </div>
              <button 
                onClick={() => setAddShiftModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm font-semibold text-slate-700">
                Chọn nhân viên bạn muốn đặt lịch ở ca này?
              </p>
              
              <div className="flex items-center gap-4">
                <label className="text-sm font-bold text-slate-700 w-28 shrink-0">Tên nhân viên</label>
                <div className="flex-1 relative">
                  <select
                    value={selectedAddEmpCode}
                    onChange={(e) => setSelectedAddEmpCode(e.target.value)}
                    disabled={viewMode === "self" || !!addShiftModal.defaultEmpCode}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs appearance-none pr-8 disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    {(viewMode === "self" || addShiftModal.defaultEmpCode) ? (
                      // Đã khóa vào 1 nhân viên cụ thể — ưu tiên tên trong danh sách nhân viên hiện tại,
                      // nếu là mã cũ không còn trong danh sách thì dùng tên lấy từ lịch làm việc để
                      // luôn hiển thị tên người thật thay vì mã khó nhận biết.
                      (() => {
                        const lockedEmp = employees.find(e => e.code === selectedAddEmpCode);
                        const displayName = lockedEmp?.name || addShiftModal.defaultEmpName;
                        return (
                          <option value={selectedAddEmpCode}>
                            {displayName ? `${displayName} (${selectedAddEmpCode})` : selectedAddEmpCode}
                          </option>
                        );
                      })()
                    ) : (
                      branchEmployees.map(emp => (
                        <option key={emp.code} value={emp.code}>
                          {emp.name} ({emp.code})
                        </option>
                      ))
                    )}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-700">
                💡 <strong>Lưu ý:</strong> Ca được thêm vào này sẽ tự động được thêm vào đăng ký lịch làm việc ban đầu, đồng thời mở bảng chấm công để check-in ngay.
              </div>
            </div>

            {/* Footer matching screenshot */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <Button 
                variant="outline" 
                onClick={() => setAddShiftModal(null)} 
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold px-5 h-9"
              >
                Bỏ qua
              </Button>
              <Button 
                onClick={handleConfirmAddShift} 
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-6 h-9 shadow-sm"
              >
                Đồng ý
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DUYỆT CHẤM CÔNG (BATCH APPROVAL) */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-blue-600 text-white">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-black">Duyệt & Xác nhận Chấm công</h3>
                  <p className="text-xs text-blue-100">Kiểm tra và khóa dữ liệu công làm việc trước khi tính lương cho cơ sở: {currentBranch}</p>
                </div>
              </div>
              <button onClick={() => setIsApprovalModalOpen(false)} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-blue-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <strong>Quy tắc xác nhận công:</strong> Khi nhấn Duyệt, toàn bộ các bản ghi chấm công hợp lệ sẽ được khóa xác nhận (Approved) và lưu vào Audit Log với chữ ký của Trưởng cửa hàng. Dữ liệu này sẽ làm căn cứ pháp lý để chuyển sang Bảng Lương.
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Danh sách chờ duyệt ({unapprovedCount} lượt chấm công)
                </h4>

                {unapprovedCount === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <div className="text-sm font-bold text-slate-700">Tất cả lượt chấm công đã được duyệt hợp lệ!</div>
                    <div className="text-xs text-slate-400 mt-1">Không có dữ liệu công nào chờ xác nhận tại cơ sở này.</div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    {Object.values(records)
                      .filter(r => !r.isApproved && r.status !== "chua_cham" && matchesCurrentBranch(r.branch))
                      .map((rec) => (
                        <div key={rec.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {renderStatusDot(rec.status)}
                            <div>
                              <div className="text-xs font-bold text-slate-800">{rec.employeeName} ({rec.employeeCode})</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">Ngày {rec.date}/07 • {rec.shiftId === 'ca-sang-3' ? 'Ca sáng' : rec.shiftId === 'ca-chieu-3' ? 'Ca chiều' : 'Ca tối'}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-blue-700">
                              {rec.checkIn ? `${rec.checkIn} -> ${rec.checkOut || '--:--'}` : 'Nghỉ làm'}
                            </div>
                            {rec.lateMinutes ? (
                              <div className="text-[10px] text-purple-600 font-bold">Đi muộn {rec.lateMinutes}p</div>
                            ) : rec.otMinutes ? (
                              <div className="text-[10px] text-emerald-600 font-bold">+OT {rec.otMinutes}p</div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold px-4 h-9">
                Đóng
              </Button>
              {unapprovedCount > 0 && (
                <Button onClick={handleBatchApprove} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-6 h-9 shadow-sm gap-2">
                  <Check className="w-4 h-4" /> Duyệt tất cả ({unapprovedCount})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
