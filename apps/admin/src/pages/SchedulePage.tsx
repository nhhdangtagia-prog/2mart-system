import { useState, useEffect, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Download, Upload, Check, ChevronDown, User, Users, X, Plus, Info, Repeat, Copy, Building2 } from "lucide-react";
import { Button } from "@2mart/ui";
import { useEmployees, type Employee } from "../hooks/useEmployees";
import { useCurrentBranch, getBranchShortName } from "../hooks/useCurrentBranch";
import { useSession } from "../hooks/useSession";
import { matchesSelectedBranch, normalizeName } from "../utils/payrollService";

export interface ShiftInfo {
  id: string;
  name: string;
  time: string;
}

export const SHIFTS: ShiftInfo[] = [
  { id: "ca-sang-3", name: "Ca sáng 3", time: "07:00 - 12:00" },
  { id: "ca-chieu-3", name: "Ca chiều 3", time: "12:00 - 17:00" },
  { id: "ca-toi-3", name: "Ca tối 3", time: "17:00 - 23:00" },
  { id: "ca-dem-3", name: "Ca đêm 3", time: "23:00 - 05:00" }
];

export interface DayInfo {
  date: number;
  name: string;
  fullDate: string;
  dateKey: string; // "YYYYMMDD" — dùng để phân biệt các ngày trùng số nhưng khác tháng/năm
}

const WEEKDAY_NAMES = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const pad2 = (n: number) => String(n).padStart(2, "0");

export function toDayInfo(d: Date): DayInfo {
  return {
    date: d.getDate(),
    name: WEEKDAY_NAMES[d.getDay()],
    fullDate: `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`,
    dateKey: `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`
  };
}

// Tính 7 ngày (Thứ hai → Chủ nhật) của tuần chứa `anchor`
export function buildWeekDays(anchor: Date): DayInfo[] {
  const day = anchor.getDay(); // 0=CN..6=T7
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + diffToMonday);
  return Array.from({ length: 7 }, (_, i) => toDayInfo(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)));
}

// Tính toàn bộ ngày trong 1 tháng (month: 1-12)
export function buildMonthDays(year: number, month: number): DayInfo[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => toDayInfo(new Date(year, month - 1, i + 1)));
}

export function dateStamp(day: DayInfo): string {
  return day.dateKey;
}

// Chuyển 1 DayInfo về lại đối tượng Date thật (dùng để tính tuần chứa ngày đó, hoặc điều hướng)
export function dayInfoToDate(day: DayInfo): Date {
  const [d, m, y] = day.fullDate.split("/").map(Number);
  return new Date(y, m - 1, d);
}

export interface ScheduleAssignment {
  id: string;
  shiftId: string;
  date: number;
  dateKey: string; // "YYYYMMDD"
  employeeCode: string;
  employeeName: string;
  employeeDept: string;
}

const STORAGE_KEY = "kiot_rm_schedule_v2";

// Dữ liệu cũ (trước khi có dateKey) chỉ từng tồn tại trong tuần demo 20-26/07/2026 — quy ước
// migrate về đúng tháng đó để không mất/lẫn dữ liệu khi nâng cấp.
function migrateAssignmentDateKey(a: ScheduleAssignment): ScheduleAssignment {
  if (a.dateKey) return a;
  return { ...a, dateKey: `2026${pad2(7)}${pad2(a.date)}` };
}

export function SchedulePage() {
  const { currentBranch } = useCurrentBranch();
  const { employees } = useEmployees();
  const { session } = useSession();

  // Helper function to get username by fuzzy matching
  const getUsername = (code: string, name: string) => {
    const emp = employees.find(e => 
      e.code === code || 
      normalizeName(e.name).includes(normalizeName(name)) || 
      normalizeName(name).includes(normalizeName(e.name))
    );
    return emp?.username || name;
  };

  const isStaff = session?.accessLevel === "staff";

  const branchEmpCodes = useMemo(() => {
    return new Set(
      employees
        .filter(e => currentBranch === "Tất cả chi nhánh" || e.branch === currentBranch || (!e.branch && currentBranch === "285 Nguyễn Lương Bằng"))
        .map(e => e.code)
    );
  }, [employees, currentBranch]);
  
  const [viewMode, setViewMode] = useState<"ca" | "nhanvien">("ca");
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Điều hướng xem theo Tuần / Tháng
  const [periodMode, setPeriodMode] = useState<"week" | "month">("week");
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());

  const weekDays = useMemo(() => buildWeekDays(anchorDate), [anchorDate]);
  const todayKey = useMemo(() => toDayInfo(new Date()).dateKey, []);

  // Lưới 6 tuần (42 ô) cho chế độ xem tháng — có đệm thêm ngày đầu/cuối tháng liền kề để lấp đủ lưới
  const monthGridDays = useMemo(() => {
    const firstOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const gridStart = dayInfoToDate(buildWeekDays(firstOfMonth)[0]);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      return { ...toDayInfo(d), inMonth: d.getMonth() === anchorDate.getMonth() };
    });
  }, [anchorDate]);

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

  // Schedule State in LocalStorage
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);

  // Modal 1 State (Theo Ca)
  const [activeShiftCell, setActiveShiftCell] = useState<{ shift: ShiftInfo; day: DayInfo } | null>(null);
  const [modal1SelectedCodes, setModal1SelectedCodes] = useState<string[]>([]);
  const [modal1RepeatWeek, setModal1RepeatWeek] = useState(false);
  const [modal1Search, setModal1Search] = useState("");

  // Modal 2 State (Theo Nhân Viên)
  const [activeEmpCell, setActiveEmpCell] = useState<{ emp: Employee; day: DayInfo } | null>(null);
  const [modal2SelectedShifts, setModal2SelectedShifts] = useState<string[]>([]);
  const [modal2RepeatWeek, setModal2RepeatWeek] = useState(false);
  const [modal2CopyOthers, setModal2CopyOthers] = useState(false);
  const [modal2OtherCodes, setModal2OtherCodes] = useState<string[]>([]);

  // Load / Seed Schedule
  useEffect(() => {
    fetch('/api/schedules')
      .then(res => res.json())
      .then(data => {
        if (!data || data.length === 0) {
          setAssignments([]);
        } else {
          try {
            const migrated = data.map(migrateAssignmentDateKey);
            setAssignments(migrated);
            if (migrated.some((a: any, i: number) => a !== data[i])) {
              fetch('/api/schedules/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(migrated)
              });
            }
          } catch {
            setAssignments([]);
          }
        }
      })
      .catch(() => setAssignments([]));
  }, []);

  const saveAssignments = (newList: ScheduleAssignment[]) => {
    fetch('/api/schedules/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newList)
    }).then(() => setAssignments(newList));
  };

  // Delete single assignment directly from badge
  const handleDeleteAssignment = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveAssignments(assignments.filter(a => a.id !== id));
  };

  // Filtered employees for Mode 2
  const displayEmployees = useMemo(() => {
    const list = employees.filter(e => branchEmpCodes.has(e.code));
    if (!searchTerm) return list.slice(0, 30); // limit 30 for smooth render
    const lower = searchTerm.toLowerCase();
    return list.filter(e => e.name.toLowerCase().includes(lower) || e.code.toLowerCase().includes(lower));
  }, [employees, searchTerm, branchEmpCodes]);

  // --- Modal 1 Handlers (Theo Ca) ---
  const openModal1 = (shift: ShiftInfo, day: DayInfo) => {
    const currentOnThisCell = assignments.filter(a => a.shiftId === shift.id && a.dateKey === day.dateKey && (currentBranch === "Tất cả chi nhánh" || a.employeeDept === currentBranch));
    setModal1SelectedCodes(currentOnThisCell.map(a => a.employeeCode));
    setModal1RepeatWeek(false);
    setModal1Search("");
    setActiveShiftCell({ shift, day });
  };

  const handleSaveModal1 = () => {
    if (!activeShiftCell) return;
    const { shift, day } = activeShiftCell;
    const targetDays = modal1RepeatWeek ? buildWeekDays(dayInfoToDate(day)) : [day];

    // Remove existing assignments for this shift on target dates
    const targetKeys = targetDays.map(d => d.dateKey);
    let updated = assignments.filter(a => !(a.shiftId === shift.id && targetKeys.includes(a.dateKey) && (currentBranch === "Tất cả chi nhánh" || a.employeeDept === currentBranch)));

    // Insert new assignments for all selected employee codes
    // Lưu employeeDept là chi nhánh admin đang xem lúc phân ca (chi nhánh ca đó thực sự
    // thuộc về), không phải chi nhánh gốc cố định của nhân viên — cho phép 1 nhân viên
    // làm việc ở nhiều cơ sở khác nhau.
    targetDays.forEach(targetDay => {
      modal1SelectedCodes.forEach(code => {
        const emp = employees.find(e => e.code === code || e.id === code);
        const name = emp ? emp.name : code;
        updated.push({
          id: `${shift.id}-${targetDay.dateKey}-${code}-${Date.now()}-${Math.random()}`,
          shiftId: shift.id,
          date: targetDay.date,
          dateKey: targetDay.dateKey,
          employeeCode: code,
          employeeName: name,
          employeeDept: currentBranch
        });
      });
    });

    saveAssignments(updated);
    setActiveShiftCell(null);
  };

  // --- Modal 2 Handlers (Theo Nhân Viên) ---
  const openModal2 = (emp: Employee, day: DayInfo) => {
    const currentOnThisCell = assignments.filter(a => a.employeeCode === emp.code && a.dateKey === day.dateKey && (currentBranch === "Tất cả chi nhánh" || a.employeeDept === currentBranch));
    setModal2SelectedShifts(currentOnThisCell.map(a => a.shiftId));
    setModal2RepeatWeek(false);
    setModal2CopyOthers(false);
    setModal2OtherCodes([]);
    setActiveEmpCell({ emp, day });
  };

  const handleSaveModal2 = () => {
    if (!activeEmpCell) return;
    const { emp, day } = activeEmpCell;
    const targetDays = modal2RepeatWeek ? buildWeekDays(dayInfoToDate(day)) : [day];
    const targetKeys = targetDays.map(d => d.dateKey);
    const targetEmpCodes = [emp.code, ...(modal2CopyOthers ? modal2OtherCodes : [])];

    // Remove existing assignments for target employees on target dates
    let updated = assignments.filter(a => !(targetEmpCodes.includes(a.employeeCode) && targetKeys.includes(a.dateKey) && (currentBranch === "Tất cả chi nhánh" || a.employeeDept === currentBranch)));

    // Insert new assignments for all selected shifts
    // employeeDept = chi nhánh admin đang xem (chi nhánh ca đó thực sự thuộc về), không
    // phải chi nhánh gốc cố định của nhân viên — cho phép phân ca chéo cơ sở.
    targetEmpCodes.forEach(code => {
      const eObj = employees.find(e => e.code === code || e.id === code) || emp;
      targetDays.forEach(targetDay => {
        modal2SelectedShifts.forEach(shiftId => {
          updated.push({
            id: `${shiftId}-${targetDay.dateKey}-${code}-${Date.now()}-${Math.random()}`,
            shiftId,
            date: targetDay.date,
            dateKey: targetDay.dateKey,
            employeeCode: code,
            employeeName: eObj.name,
            employeeDept: currentBranch
          });
        });
      });
    });

    saveAssignments(updated);
    setActiveEmpCell(null);
  };

  // Helper colors for shift badges
  const getShiftBadgeStyle = (shiftId: string) => {
    switch (shiftId) {
      case "ca-sang-3": return "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200";
      case "ca-chieu-3": return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200";
      case "ca-toi-3": return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200";
      case "ca-dem-3": return "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
    }
  };

  // Nhân viên bán hàng: chỉ xem lịch làm việc của chính mình, nhưng được tự đăng ký / hủy ca cho bản thân.
  // Tách riêng theo chi nhánh đang chọn ở header — chọn CS1 chỉ thấy/đăng ký ca CS1, CS2 thì CS2.
  if (isStaff) {
    const myAssignments = assignments.filter(a => 
      a.employeeCode === session?.code && 
      (currentBranch === "Tất cả chi nhánh" || a.employeeDept === currentBranch)
    );

    const handleRegisterMyShift = (shiftId: string, day: DayInfo) => {
      if (!session) return;
      const newAssign: ScheduleAssignment = {
        id: `${shiftId}-${day.dateKey}-${session.code}-${Date.now()}`,
        shiftId,
        date: day.date,
        dateKey: day.dateKey,
        employeeCode: session.code,
        employeeName: session.name,
        employeeDept: currentBranch
      };
      saveAssignments([...assignments, newAssign]);
    };

    const handleCancelMyShift = (assignId: string) => {
      saveAssignments(assignments.filter(a => a.id !== assignId));
    };

    return (
      <div className="w-full p-4 sm:p-6 flex flex-col animate-in fade-in duration-200">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Lịch làm việc của tôi</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Building2 className="w-3.5 h-3.5" />
              Cơ sở: {currentBranch}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Hiển thị toàn bộ ca làm việc của <strong>{session?.name}</strong> tại chi nhánh đang chọn. Khi bạn đăng ký ca trống, ca đó sẽ được ghi nhận cho cơ sở đang chọn ở góc trên. Bấm vào ô trống để tự đăng ký ca làm việc.
          </p>
        </div>

        {/* Điều hướng tuần */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-9">
            <button onClick={goToPrevPeriod} className="px-3 py-2 hover:bg-slate-50 border-r border-slate-200 text-slate-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 text-sm font-medium text-slate-700">{periodLabel}</div>
            <button onClick={goToNextPeriod} className="px-3 py-2 hover:bg-slate-50 border-l border-slate-200 text-slate-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Button variant="outline" onClick={goToToday} className="h-9 px-4 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm font-medium">
            Tuần này
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3.5 w-[180px] text-sm font-semibold text-slate-800 border-r border-slate-200">Ca làm việc</th>
                {weekDays.map((day) => (
                  <th key={day.dateKey} className="px-3 py-3.5 text-center border-r border-slate-200 last:border-r-0 min-w-[130px]">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">{day.name}</div>
                    <div className="text-sm font-bold text-slate-800">{day.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {SHIFTS.map((shift) => (
                <tr key={shift.id}>
                  <td className="px-5 py-4 border-r border-slate-200 bg-slate-50/40">
                    <div className="font-bold text-slate-800 text-sm">{shift.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{shift.time}</div>
                  </td>
                  {weekDays.map((day) => {
                    const assign = myAssignments.find(a => a.shiftId === shift.id && a.dateKey === day.dateKey);
                    return (
                      <td key={day.dateKey} className="px-2.5 py-2.5 border-r border-slate-200 last:border-r-0 min-w-[130px]">
                        {assign ? (
                          <div
                            className="bg-[#e8f2ff] text-blue-900 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center justify-between border border-blue-200 shadow-2xs group/badge hover:bg-blue-100 transition-all"
                            title={session?.name}
                          >
                            <span className="truncate">{getBranchShortName(assign.employeeDept)}</span>
                            <button
                              onClick={() => handleCancelMyShift(assign.id)}
                              className="opacity-0 group-hover/badge:opacity-100 ml-1 p-0.5 rounded hover:bg-blue-200 text-blue-700 transition-opacity"
                              title="Hủy đăng ký ca này"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRegisterMyShift(shift.id, day)}
                            className="w-full h-full min-h-[36px] rounded-lg border border-dashed border-transparent hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-center gap-1 text-slate-300 hover:text-blue-600 transition-all"
                            title={`Đăng ký ${shift.name} (${day.name}, ${day.fullDate})`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium">Đăng ký ca</span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-slate-500">
          Tổng cộng <strong className="text-slate-800">{myAssignments.filter(a => weekDays.some(d => d.dateKey === a.dateKey)).length}</strong> ca trong tuần này.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col h-full relative animate-in fade-in duration-200">

      {/* Header Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Lịch làm việc</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Building2 className="w-3.5 h-3.5" />
              Cơ sở: {currentBranch}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Phân ca làm việc, theo dõi lịch và ước tính lương theo tuần tách biệt theo từng chi nhánh</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nhân viên" 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>
          
          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-9">
            <button onClick={goToPrevPeriod} className="px-3 py-2 hover:bg-slate-50 border-r border-slate-200 text-slate-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 text-sm font-medium text-slate-700 whitespace-nowrap">{periodLabel}</div>
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
        </div>

        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
              className="h-9 px-3.5 gap-2 bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 shadow-sm font-semibold min-w-[180px] justify-between"
            >
              <div className="flex items-center gap-2">
                {viewMode === 'ca' ? <CalendarIcon className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-blue-600" />}
                <span>{viewMode === 'ca' ? 'Xem theo ca' : 'Xem theo nhân viên'}</span>
              </div>
              <ChevronDown className="w-4 h-4 opacity-60" />
            </Button>

            {isViewDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col z-50 animate-in zoom-in-95 duration-150">
                <button
                  onClick={() => { setViewMode('ca'); setIsViewDropdownOpen(false); }}
                  className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-blue-50 transition-colors ${viewMode === 'ca' ? "bg-blue-50/80 text-blue-700 font-semibold" : "text-slate-700"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarIcon className="w-4 h-4 text-slate-500" />
                    <span>Xem theo ca</span>
                  </div>
                  {viewMode === 'ca' && <Check className="w-4 h-4 text-blue-600" />}
                </button>
                <button
                  onClick={() => { setViewMode('nhanvien'); setIsViewDropdownOpen(false); }}
                  className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-blue-50 transition-colors border-t border-slate-100 ${viewMode === 'nhanvien' ? "bg-blue-50/80 text-blue-700 font-semibold" : "text-slate-700"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Xem theo nhân viên</span>
                  </div>
                  {viewMode === 'nhanvien' && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              </div>
            )}
          </div>

          <Button variant="outline" className="h-9 px-3 gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
            <Upload className="w-4 h-4" /> Import
          </Button>
          <Button variant="outline" className="h-9 px-3 gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
            <Download className="w-4 h-4" /> Xuất file
          </Button>
        </div>
      </div>

      {/* Main Grid Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-auto">
        
        {/* VIEW MODE 1: XEM THEO CA */}
        {periodMode === "week" && viewMode === "ca" && (
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <th className="px-6 py-4 w-[200px] border-r border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50/90">
                  Ca làm việc
                </th>
                {weekDays.map((day) => {
                  const isToday = day.dateKey === todayKey;
                  return (
                  <th key={day.dateKey} className={`px-4 py-4 text-sm border-r border-slate-200 last:border-r-0 text-center ${isToday ? 'bg-blue-50 border-t-4 border-t-blue-600 shadow-sm' : 'bg-white font-normal'}`}>
                    <span className={`mr-1.5 ${isToday ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>{day.name}</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${isToday ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100' : 'text-slate-800 bg-slate-100'}`}>{day.date}</span>
                  </th>
                )})}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {SHIFTS.map((shift) => (
                <tr key={shift.id} className="group">
                  {/* Shift Info Column */}
                  <td className="px-6 py-5 align-top border-r border-slate-200 bg-slate-50/40 group-hover:bg-slate-50/90 transition-colors w-[200px]">
                    <div className="font-bold text-slate-800 text-base">{shift.name}</div>
                    <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                      <span>⏰</span> {shift.time}
                    </div>
                  </td>

                  {weekDays.map((day) => {
                    const cellAssignments = assignments.filter(a => 
                      a.shiftId === shift.id && 
                      a.dateKey === day.dateKey && 
                      (currentBranch === "Tất cả chi nhánh" || a.employeeDept === currentBranch)
                    );
                    return (
                      <td
                        key={day.dateKey}
                        onClick={() => openModal1(shift, day)}
                        className={`px-2.5 py-2.5 align-top border-r border-slate-200 last:border-r-0 min-w-[140px] cursor-pointer transition-colors relative group/cell ${day.dateKey === todayKey ? 'bg-blue-50/50 hover:bg-blue-100/50 border-l border-r border-blue-100' : 'bg-white hover:bg-blue-50/30'}`}
                      >
                        <div className="flex flex-col gap-1.5 h-full min-h-[70px]">
                          {cellAssignments.map((assign) => (
                            <div 
                              key={assign.id}
                              className="bg-[#e8f2ff] text-blue-900 text-xs font-semibold px-2.5 py-1.5 rounded-lg truncate flex items-center justify-between group/badge border border-blue-200 shadow-2xs hover:bg-blue-100 transition-all"
                              title={`${assign.employeeName} (${assign.employeeCode})`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="truncate">{getUsername(assign.employeeCode, assign.employeeName)}</span>
                              <button 
                                onClick={(e) => handleDeleteAssignment(assign.id, e)}
                                className="opacity-0 group-hover/badge:opacity-100 ml-1 p-0.5 rounded hover:bg-blue-200 text-blue-700 transition-opacity"
                                title="Xóa lịch làm việc này"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {/* Empty clickable area / Add icon on hover */}
                          <div className="flex-1 rounded-lg border border-transparent group-hover/cell:border-dashed group-hover/cell:border-blue-300 group-hover/cell:bg-blue-50/50 flex items-center justify-center transition-all min-h-[28px] text-blue-600 opacity-0 group-hover/cell:opacity-100">
                            <Plus className="w-4 h-4" /> <span className="text-[11px] font-medium ml-1">Thêm NV</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* VIEW MODE 2: XEM THEO NHÂN VIÊN */}
        {periodMode === "week" && viewMode === "nhanvien" && (
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <th className="px-5 py-4 w-[220px] border-r border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50/90">
                  Nhân viên
                </th>
                {weekDays.map((day) => (
                  <th key={day.dateKey} className="px-3 py-4 text-sm border-r border-slate-200 text-center font-normal bg-white">
                    <span className="text-slate-500 mr-1.5">{day.name}</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-xs">{day.date}</span>
                  </th>
                ))}
                <th className="px-5 py-4 w-[160px] text-right text-sm font-semibold text-slate-800 bg-slate-50/90">
                  Lương dự kiến <Info className="w-3.5 h-3.5 inline text-slate-400 ml-0.5" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayEmployees.map((emp) => {
                // Count total shifts assigned to this employee across the week đang xem
                const empAssignments = assignments.filter(a => (a.employeeCode === emp.code || a.employeeCode === emp.id) && weekDays.some(d => d.dateKey === a.dateKey));
                const totalShifts = empAssignments.length;
                const estimatedSalary = totalShifts * 110000; // 110,000đ / ca (2 ca = 220,000đ)

                return (
                  <tr key={emp.code} className="group hover:bg-slate-50/60 transition-colors">
                    {/* Employee Info Column */}
                    <td className="px-5 py-4 align-top border-r border-slate-200 bg-slate-50/30 w-[220px]">
                      <div className="font-bold text-slate-800 text-sm">{emp.name}</div>
                      <div className="text-xs text-blue-600 font-semibold mt-0.5">{emp.code}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{emp.department || "CS1"}</div>
                    </td>
                    
                    {weekDays.map((day) => {
                      const cellAssignments = assignments.filter(a => 
                        (a.employeeCode === emp.code || a.employeeCode === emp.id) && 
                        a.dateKey === day.dateKey && 
                        (currentBranch === "Tất cả chi nhánh" || a.employeeDept === currentBranch)
                      );
                      return (
                        <td
                          key={day.dateKey}
                          onClick={() => openModal2(emp, day)}
                          className="px-2 py-2 align-top border-r border-slate-200 min-w-[130px] cursor-pointer hover:bg-blue-50/40 transition-colors relative group/cell"
                        >
                          <div className="flex flex-col gap-1.5 h-full min-h-[60px]">
                            {cellAssignments.map((assign) => {
                              const shiftObj = SHIFTS.find(s => s.id === assign.shiftId);
                              const shiftName = shiftObj ? shiftObj.name : assign.shiftId;
                              return (
                                <div 
                                  key={assign.id}
                                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg truncate flex items-center justify-between group/badge border shadow-2xs transition-all ${getShiftBadgeStyle(assign.shiftId)}`}
                                  title={`${shiftName} (${shiftObj?.time})`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="truncate">{shiftName}</span>
                                  <button 
                                    onClick={(e) => handleDeleteAssignment(assign.id, e)}
                                    className="opacity-0 group-hover/badge:opacity-100 ml-1 p-0.5 rounded hover:bg-black/10 transition-opacity"
                                    title="Xóa ca làm việc này"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                            <div className="flex-1 rounded-lg border border-transparent group-hover/cell:border-dashed group-hover/cell:border-blue-300 group-hover/cell:bg-blue-50/60 flex items-center justify-center transition-all min-h-[24px] text-blue-600 opacity-0 group-hover/cell:opacity-100">
                              <Plus className="w-3.5 h-3.5" /> <span className="text-[11px] font-medium ml-1">Thêm ca</span>
                            </div>
                          </div>
                        </td>
                      );
                    })}

                    {/* Salary Estimation Column */}
                    <td className="px-5 py-4 align-middle text-right bg-slate-50/20">
                      <div className="font-bold text-slate-800 text-sm">
                        {totalShifts > 0 ? estimatedSalary.toLocaleString("vi-VN") : "0"}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">{totalShifts} ca</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* CHẾ ĐỘ XEM THEO THÁNG: lưới lịch, bấm vào 1 ngày để xem chi tiết tuần chứa ngày đó */}
        {periodMode === "month" && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"].map(label => (
                <div key={label} className="text-xs font-bold text-slate-400 uppercase text-center pb-1">{label}</div>
              ))}
              {monthGridDays.map(cell => {
                const dayAssignments = assignments.filter(a => a.dateKey === cell.dateKey && branchEmpCodes.has(a.employeeCode));
                const nightCount = dayAssignments.filter(a => a.shiftId === "ca-dem-3").length;
                const isToday = cell.dateKey === toDayInfo(new Date()).dateKey;
                return (
                  <div
                    key={cell.dateKey}
                    onClick={() => { if (cell.inMonth) { setAnchorDate(dayInfoToDate(cell)); setPeriodMode("week"); } }}
                    className={`min-h-[86px] rounded-lg border p-2 flex flex-col gap-1.5 transition-all ${
                      cell.inMonth
                        ? `bg-white border-slate-200 cursor-pointer hover:border-blue-300 hover:shadow-sm ${isToday ? "ring-2 ring-blue-400" : ""}`
                        : "bg-slate-50/50 border-slate-100"
                    }`}
                  >
                    <div className={`text-xs font-bold ${cell.inMonth ? "text-slate-700" : "text-slate-300"}`}>{cell.date}</div>
                    {cell.inMonth && dayAssignments.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-auto">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{dayAssignments.length} ca</span>
                        {nightCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">{nightCount} đêm</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: THÊM LỊCH LÀM VIỆC (XEM THEO CA) */}
      {activeShiftCell && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Thêm lịch làm việc</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {activeShiftCell.shift.name} ({activeShiftCell.shift.time}) | <strong className="text-slate-700">{activeShiftCell.day.name}, {activeShiftCell.day.fullDate}</strong>
                </p>
              </div>
              <button 
                onClick={() => setActiveShiftCell(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">Chọn nhân viên <Plus className="w-4 h-4 inline text-blue-600 ml-0.5" /></span>
                <span className="text-xs text-slate-500">Đã chọn: <strong className="text-blue-600 font-bold">{modal1SelectedCodes.length}</strong></span>
              </div>

              {/* Search box inside modal */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={modal1Search}
                  onChange={(e) => setModal1Search(e.target.value)}
                  placeholder="Tìm kiếm nhân viên" 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Checkbox grid — hiển thị TẤT CẢ nhân viên (không chỉ chi nhánh hiện tại) để admin có thể phân công nhân viên từ cơ sở khác đến làm việc */}
              <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                {employees
                  .filter(e => !modal1Search || e.name.toLowerCase().includes(modal1Search.toLowerCase()) || e.code.toLowerCase().includes(modal1Search.toLowerCase()))
                  .map((emp) => {
                    const isChecked = modal1SelectedCodes.includes(emp.code);
                    const isFromOtherBranch = !branchEmpCodes.has(emp.code);
                    return (
                      <div
                        key={emp.code}
                        onClick={() => {
                          setModal1SelectedCodes(prev =>
                            prev.includes(emp.code) ? prev.filter(c => c !== emp.code) : [...prev, emp.code]
                          );
                        }}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? "bg-blue-50 border-blue-300 shadow-2xs" : "bg-white border-slate-200 hover:border-slate-300"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer pointer-events-none"
                        />
                        <div className="truncate">
                          <div className={`text-sm font-semibold truncate ${isChecked ? "text-blue-900" : "text-slate-800"}`}>{emp.name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                            {emp.code}
                            {isFromOtherBranch && (
                              <span className="text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 py-px font-semibold">Cơ sở khác: {emp.branch || emp.department || "?"}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Weekly repeat toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 mt-2">
                <div className="flex items-center gap-2.5">
                  <Repeat className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-bold text-slate-800">Lặp lại hàng tuần</div>
                    <div className="text-xs text-slate-500">Lịch làm việc sẽ được tự động lặp lại vào các ngày trong tuần</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={modal1RepeatWeek}
                    onChange={(e) => setModal1RepeatWeek(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setActiveShiftCell(null)}
                className="px-5 font-medium bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Bỏ qua
              </Button>
              <Button 
                onClick={handleSaveModal1}
                className="px-6 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
              >
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: THÊM LỊCH LÀM VIỆC (XEM THEO NHÂN VIÊN) */}
      {activeEmpCell && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Thêm lịch làm việc</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  <strong className="text-blue-600 font-semibold">{activeEmpCell.emp.name}</strong> ({activeEmpCell.emp.code}) | <strong className="text-slate-700">{activeEmpCell.day.name}, {activeEmpCell.day.fullDate}</strong>
                </p>
              </div>
              <button 
                onClick={() => setActiveEmpCell(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">Chọn ca làm việc <Plus className="w-4 h-4 inline text-blue-600 ml-0.5" /></span>
                <span className="text-xs text-slate-500">Đã chọn: <strong className="text-blue-600 font-bold">{modal2SelectedShifts.length}</strong></span>
              </div>

              {/* Checkbox grid for Shifts */}
              <div className="grid grid-cols-2 gap-3 p-1">
                {SHIFTS.map((shift) => {
                  const isChecked = modal2SelectedShifts.includes(shift.id);
                  return (
                    <div 
                      key={shift.id}
                      onClick={() => {
                        setModal2SelectedShifts(prev => 
                          prev.includes(shift.id) ? prev.filter(id => id !== shift.id) : [...prev, shift.id]
                        );
                      }}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${isChecked ? "bg-blue-50 border-blue-400 shadow-2xs" : "bg-white border-slate-200 hover:border-slate-300"}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        readOnly
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer pointer-events-none" 
                      />
                      <div>
                        <div className={`text-sm font-bold ${isChecked ? "text-blue-900" : "text-slate-800"}`}>{shift.name}</div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">{shift.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weekly repeat toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 mt-2">
                <div className="flex items-center gap-2.5">
                  <Repeat className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-bold text-slate-800">Lặp lại hàng tuần</div>
                    <div className="text-xs text-slate-500">Lịch làm việc sẽ được tự động lặp lại vào các ngày trong tuần</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={modal2RepeatWeek}
                    onChange={(e) => setModal2RepeatWeek(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Copy to other employees toggle */}
              <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Copy className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-sm font-bold text-slate-800">Thêm lịch tương tự cho nhân viên khác</div>
                      <div className="text-xs text-slate-500">Lịch làm việc sẽ được áp dụng cho các nhân viên được chọn</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={modal2CopyOthers}
                      onChange={(e) => setModal2CopyOthers(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Other employees multiselect grid when copy toggle is on */}
                {modal2CopyOthers && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-200 max-h-[160px] overflow-y-auto">
                    {employees
                      .filter(e => e.code !== activeEmpCell.emp.code)
                      .map((other) => {
                        const isSelected = modal2OtherCodes.includes(other.code);
                        const isFromOtherBranch = !branchEmpCodes.has(other.code);
                        return (
                          <div
                            key={other.code}
                            onClick={() => {
                              setModal2OtherCodes(prev =>
                                prev.includes(other.code) ? prev.filter(c => c !== other.code) : [...prev, other.code]
                              );
                            }}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-all ${isSelected ? "bg-blue-100/60 border-blue-400 text-blue-900 font-semibold" : "bg-white border-slate-200 text-slate-700"}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer pointer-events-none"
                            />
                            <span className="truncate">{other.name} ({other.code}){isFromOtherBranch ? " · cơ sở khác" : ""}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setActiveEmpCell(null)}
                className="px-5 font-medium bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Bỏ qua
              </Button>
              <Button 
                onClick={handleSaveModal2}
                className="px-6 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
              >
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
