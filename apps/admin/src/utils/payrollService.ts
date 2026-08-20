import { type Employee } from "../hooks/useEmployees";

export interface BranchShiftBreakdown {
  branch: string;
  shifts: number;
  nightShifts: number;
}

export interface PayrollSheetItem {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  basicSalary: number;         // LÆ°Æ¡ng chĂ­nh (tĂ­nh tá»« cháº¥m cĂ´ng hoáº·c Ä‘á»‹nh má»©c)
  overtimeSalary: number;      // LĂ m thĂªm (OT)
  nightShiftsCount?: number;   // Sá»‘ buá»•i lĂ m Ä‘Ăªm
  nightShiftAllowance?: number;// Há»— trá»£ ca Ä‘Ăªm (15,000 Ä‘ / ca Ä‘Ăªm hoĂ n thĂ nh)
  allowances: number;          // Phá»¥ cáº¥p (Ä‚n trÆ°a, gá»­i xe...)
  bonuses: number;             // ThÆ°á»Ÿng
  totalIncome: number;         // Tá»•ng thu nháº­p
  deductions: number;          // Giáº£m trá»« (Pháº¡t Ä‘i muá»™n, nghá»‰ khĂ´ng phĂ©p...)
  netSalary: number;           // LÆ°Æ¡ng thá»±c nháº­n (Tá»•ng thu nháº­p - Giáº£m trá»«)
  paidAmount: number;          // ÄĂ£ thanh toĂ¡n
  branchBreakdown?: BranchShiftBreakdown[]; // Sá»‘ ca lĂ m viá»‡c tá»•ng há»£p theo tá»«ng chi nhĂ¡nh (cho NV lĂ m nhiá»u cÆ¡ sá»Ÿ)
  totalHours?: number;         // Tá»•ng sá»‘ giá» lĂ m (tá»« giá» vĂ o/ra cháº¥m cĂ´ng + giá» OT)
  advanceAmount?: number;      // Sá»‘ tiá»n Ä‘Ă£ á»©ng lÆ°Æ¡ng
  note?: string;
}

export interface PayrollPaymentHistory {
  id: string;
  timestamp: string;
  amount: number;
  paymentMethod: string; // Tiá»n máº·t, Chuyá»ƒn khoáº£n
  payer: string;
  note?: string;
}

export interface PayrollSheet {
  id: string;
  code: string;           // VD: BL000059
  name: string;           // VD: Báº£ng lÆ°Æ¡ng thĂ¡ng 7/2026
  periodType: string;     // VD: HĂ ng thĂ¡ng
  periodRange: string;    // VD: 01/07/2026 - 31/07/2026
  branch: string;         // VD: 285 Nguyá»…n LÆ°Æ¡ng Báº±ng
  createdAt: string;      // VD: 01/07/2026 00:26:07
  updatedAt: string;
  creator: string;        // VD: Auto hoáº·c Quáº£n lĂ½
  creator: string;        // VD: Auto hoặc Quản lý
  approver?: string;      // Người chốt lương
  status: "Đang tạo" | "Tạm tính" | "Đã chốt lương" | "Đã trả" | "Đã hủy";
  totalEmployees: number;
  totalSalary: number;    // Tổng lương thực nhận
  totalPaid: number;      // Đã trả nhân viên
  totalRemaining: number; // Còn cần trả
  items: PayrollSheetItem[];
  payments?: PayrollPaymentHistory[];
  note?: string;
  formulaVersion?: number; // đánh dấu bảng lương đã được tính theo cơ chế lương phiên bản nào (xem PAYROLL_FORMULA_VERSION)
}

// ===================== PHIẾU ỨNG LƯƠNG =====================
export type AdvanceStatus = "pending" | "approved" | "rejected";

export interface SalaryAdvanceRequest {
  id: string;               // UUID
  employeeCode: string;
  employeeName: string;
  branch: string;
  month: number;            // 1-12
  year: number;
  requestDate: string;      // ISO string
  amount: number;           // Số tiền ứng
  earnedSalary: number;     // Lương đã làm được tại thời điểm ứng
  maxAllowed: number;       // 50% của earnedSalary
  note?: string;
  status: AdvanceStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
}

const STORAGE_KEY_ADVANCES = "kiot_salary_advances_v1";

export async function fetchSalaryAdvancesFromServer() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data[STORAGE_KEY_ADVANCES] !== undefined) {
      const serverAdvances = Array.isArray(data[STORAGE_KEY_ADVANCES]) ? data[STORAGE_KEY_ADVANCES] : JSON.parse(data[STORAGE_KEY_ADVANCES] || '[]');
      localStorage.setItem(STORAGE_KEY_ADVANCES, JSON.stringify(serverAdvances));
      window.dispatchEvent(new Event('kiot_advances_change'));
    } else {
      const local = getSalaryAdvances();
      if (local.length > 0) {
        fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [STORAGE_KEY_ADVANCES]: local }) }).catch(console.error);
      }
    }
  } catch (e) {
    console.error('Failed to sync advances', e);
  }
}

export function getSalaryAdvances(): SalaryAdvanceRequest[] {
  const raw = localStorage.getItem(STORAGE_KEY_ADVANCES);
  if (!raw) return [];
  try { return JSON.parse(raw) as SalaryAdvanceRequest[]; } catch { return []; }
}

export function saveSalaryAdvances(advances: SalaryAdvanceRequest[]) {
  localStorage.setItem(STORAGE_KEY_ADVANCES, JSON.stringify(advances));
  window.dispatchEvent(new Event('kiot_advances_change'));
  fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [STORAGE_KEY_ADVANCES]: advances }) }).catch(console.error);
}

export function addSalaryAdvance(req: SalaryAdvanceRequest) {
  const advances = getSalaryAdvances();
  advances.unshift(req);
  saveSalaryAdvances(advances);
}

export function updateSalaryAdvance(req: SalaryAdvanceRequest) {
  const advances = getSalaryAdvances();
  const idx = advances.findIndex(a => a.id === req.id);
  if (idx !== -1) {
    advances[idx] = req;
    saveSalaryAdvances(advances);
  }
}

export function removeSalaryAdvance(id: string) {
  const advances = getSalaryAdvances();
  const filtered = advances.filter(a => a.id !== id);
  saveSalaryAdvances(filtered);
}

export function getAdvancesForEmployeeInMonth(empCode: string, month: number, year: number): number {
  const advances = getSalaryAdvances();
  return advances
    .filter(a => a.employeeCode === empCode && a.month === month && a.year === year && a.status === "approved")
    .reduce((sum, a) => sum + a.amount, 0);
}

export function approveSalaryAdvance(id: string, approvedBy: string): SalaryAdvanceRequest | null {
  const advances = getSalaryAdvances();
  const idx = advances.findIndex(a => a.id === id);
  if (idx === -1) return null;
  advances[idx] = {
    ...advances[idx],
    status: "approved",
    approvedBy,
    approvedAt: new Date().toLocaleString("vi-VN"),
  };
  saveSalaryAdvances(advances);
  return advances[idx];
}

export function rejectSalaryAdvance(id: string, reason: string) {
  const advances = getSalaryAdvances();
  const idx = advances.findIndex(a => a.id === id);
  if (idx === -1) return;
  advances[idx] = { ...advances[idx], status: "rejected", rejectedReason: reason };
  saveSalaryAdvances(advances);
}

// TÄƒng sá»‘ nĂ y má»—i khi thay Ä‘á»•i cĂ´ng thá»©c tĂ­nh lÆ°Æ¡ng (Ä‘Æ¡n giĂ¡/giá», phá»¥ cáº¥p, ngĂ y lá»…...) â€” cĂ¡c báº£ng
// lÆ°Æ¡ng Ä‘ang giá»¯ formulaVersion cÅ© hÆ¡n sáº½ Ä‘Æ°á»£c tá»± Ä‘á»™ng Ä‘á»“ng bá»™ láº¡i theo cĂ´ng thá»©c má»›i nháº¥t.
export const PAYROLL_FORMULA_VERSION = 5;

const STORAGE_KEY_PAYROLL_SHEETS = "kiot_rm_payroll_sheets_v2";

// Chuẩn hoá nhãn chi nhánh cho các bản ghi chấm công cũ còn lưu mã bộ phận (CS1/CS2/CS3)
// thay vì tên chi nhánh thật — quy về 1 trong 2 chi nhánh thật đang vận hành.
export function normalizeBranchLabel(rawBranch: string | undefined): string {
  if (!rawBranch) return "285 Nguyễn Lương Bằng";
  if (rawBranch.includes("379b") || rawBranch.includes("CS2")) return "379b Tôn Đức Thắng";
  if (rawBranch.includes("285") || rawBranch.includes("CS1") || rawBranch.includes("CS3")) return "285 Nguyễn Lương Bằng";
  return rawBranch;
}

// Dùng để tách riêng dữ liệu Lịch làm việc/Bảng chấm công theo từng chi nhánh (CS1 xem CS1, CS2 xem
// CS2) — chỉ Bảng lương mới gộp chung dữ liệu từ cả 2 chi nhánh lại. "Tất cả chi nhánh" khớp mọi giá trị.
export function matchesSelectedBranch(recordBranch: string | undefined, currentBranch: string): boolean {
  if (currentBranch === "Tất cả chi nhánh") return true;
  return normalizeBranchLabel(recordBranch) === currentBranch;
}

// ChĂ­nh sĂ¡ch lÆ°Æ¡ng theo ca: NV má»›i (lĂ m dÆ°á»›i N thĂ¡ng, tĂ­nh tá»« ngĂ y vĂ o lĂ m) hÆ°á»Ÿng má»©c tháº¥p hÆ¡n NV
// chĂ­nh thá»©c. CĂ¡c má»©c nĂ y cáº¥u hĂ¬nh Ä‘Æ°á»£c á»Ÿ Thiáº¿t láº­p nhĂ¢n viĂªn > TĂ­nh lÆ°Æ¡ng (theo tá»«ng chi nhĂ¡nh);
// Ä‘Ă¢y chá»‰ lĂ  giĂ¡ trá»‹ máº·c Ä‘á»‹nh khi admin chÆ°a cáº¥u hĂ¬nh gĂ¬. ChÆ°a tĂ­nh phá»¥ cáº¥p ca Ä‘Ăªm (cá»™ng riĂªng bĂªn dÆ°á»›i).
export interface ShiftRateTier { day: number; night: number; }
export const DEFAULT_NEW_HIRE_RATES: ShiftRateTier = { day: 18000, night: 20000 };
export const DEFAULT_REGULAR_RATES: ShiftRateTier = { day: 20000, night: 22000 };
export const DEFAULT_REGULAR_TENURE_MONTHS = 3;
export const DEFAULT_NIGHT_SHIFT_ALLOWANCE = 15000;

function isRegularEmployee(joinDate: string | undefined, tenureMonths: number): boolean {
  if (!joinDate) return true; // khĂ´ng rĂµ ngĂ y vĂ o lĂ m â€” máº·c Ä‘á»‹nh coi lĂ  chĂ­nh thá»©c
  const join = new Date(joinDate);
  if (Number.isNaN(join.getTime())) return true;
  const threshold = new Date(join);
  threshold.setMonth(threshold.getMonth() + tenureMonths);
  return new Date() >= threshold;
}

// ===================== NGĂ€Y Lá»„ & Há»† Sá» LÆ¯Æ NG NGĂ€Y Lá»„ (Ă¡p dá»¥ng chung toĂ n há»‡ thá»‘ng) =====================
export interface HolidayItem { id: string; date: string; name: string; } // date dáº¡ng "DD/MM/YYYY"
export interface HolidaySettings { multiplier: number; holidays: HolidayItem[]; } // multiplier: 2 = 200%

const STORAGE_KEY_HOLIDAYS = "kiot_holiday_settings_v1";
export const DEFAULT_HOLIDAY_MULTIPLIER = 2;

export function getHolidaySettings(): HolidaySettings {
  const raw = localStorage.getItem(STORAGE_KEY_HOLIDAYS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return { multiplier: parsed.multiplier ?? DEFAULT_HOLIDAY_MULTIPLIER, holidays: parsed.holidays ?? [] };
    } catch (e) {}
  }
  return { multiplier: DEFAULT_HOLIDAY_MULTIPLIER, holidays: [] };
}

export function saveHolidaySettings(settings: HolidaySettings) {
  localStorage.setItem(STORAGE_KEY_HOLIDAYS, JSON.stringify(settings));
}

// Helpers for date/time and rules
export const normalizeName = (name: string) => {
  if (!name) return "";
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Ä‘/g, "d").replace(/Ä/g, "D").replace(/\s+/g, "").toLowerCase();
};

function parsePeriodMonthYear(periodRange: string): { month: number; year: number } | null {
  const m = periodRange.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return { month: parseInt(m[2], 10), year: parseInt(m[3], 10) };
}

// Æ¯u tiĂªn dateKey ("YYYYMMDD") lÆ°u trĂªn chĂ­nh báº£n ghi cháº¥m cĂ´ng â€” chĂ­nh xĂ¡c ká»ƒ cáº£ khi dá»¯ liá»‡u tráº£i
// nhiá»u thĂ¡ng; chá»‰ suy luáº­n thĂ¡ng/nÄƒm tá»« ká»³ lÆ°Æ¡ng cho cĂ¡c báº£n ghi cÅ© chÆ°a cĂ³ dateKey.
function isHolidayDate(day: number, dateKey: string | undefined, monthYear: { month: number; year: number } | null, holidays: HolidayItem[]): boolean {
  if (holidays.length === 0) return false;
  if (dateKey && dateKey.length === 8) {
    const full = `${dateKey.slice(6, 8)}/${dateKey.slice(4, 6)}/${dateKey.slice(0, 4)}`;
    return holidays.some(h => h.date === full);
  }
  if (!monthYear) return false;
  const full = `${String(day).padStart(2, "0")}/${String(monthYear.month).padStart(2, "0")}/${monthYear.year}`;
  return holidays.some(h => h.date === full);
}

// TĂ­nh sá»‘ giá» cá»§a 1 ca tá»« giá» vĂ o/ra dáº¡ng "HH:MM", cĂ³ xá»­ lĂ½ ca qua Ä‘Ăªm (giá» ra < giá» vĂ o)
function calcShiftHours(checkIn?: string, checkOut?: string, shiftId?: string): number {
  if (checkIn && checkOut) {
    const [inH, inM] = checkIn.split(":").map(Number);
    const [outH, outM] = checkOut.split(":").map(Number);
    if (!Number.isNaN(inH) && !Number.isNaN(outH)) {
      let minutes = (outH * 60 + outM) - (inH * 60 + inM);
      if (minutes < 0) minutes += 24 * 60;
      return minutes / 60;
    }
  }
  
  if (shiftId) {
    const id = shiftId.toLowerCase();
    if (id.includes("ca-sang")) return 5;
    if (id.includes("ca-chieu")) return 5;
    if (id.includes("ca-toi")) return 6;
    if (id.includes("ca-dem")) return 8;
  }
  
  return 0;
}

/**
 * Láº¥y danh sĂ¡ch cĂ¡c báº£ng tĂ­nh lÆ°Æ¡ng tá»« localStorage (hoáº·c dá»¯ liá»‡u máº«u chuáº©n KiotViet)
 */
export function getPayrollSheets(): PayrollSheet[] {
  const saved = localStorage.getItem(STORAGE_KEY_PAYROLL_SHEETS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {}
  }

  // Dá»¯ liá»‡u máº«u khá»Ÿi táº¡o chuáº©n Ä‘Ăºng con sá»‘ trong Screenshot 1 & 2 cá»§a KiotViet
  const defaultSheets: PayrollSheet[] = [
    {
      id: "mock-bl-059",
      code: "BL000059",
      name: "Báº£ng lÆ°Æ¡ng thĂ¡ng 7/2026",
      periodType: "HĂ ng thĂ¡ng",
      periodRange: "01/07/2026 - 31/07/2026",
      branch: "285 Nguyá»…n LÆ°Æ¡ng Báº±ng",
      createdAt: "01/07/2026 00:26:07",
      updatedAt: "25/07/2026 03:13:13",
      creator: "Auto",
      status: "Táº¡m tĂ­nh",
      totalEmployees: 5,
      totalSalary: 5521666,
      totalPaid: 0,
      totalRemaining: 5521666,
      items: [
        { employeeId: "NV041", employeeCode: "NV000041", employeeName: "Minh TrĂºc", basicSalary: 120000, overtimeSalary: 0, nightShiftsCount: 0, nightShiftAllowance: 0, allowances: 0, bonuses: 0, totalIncome: 120000, deductions: 0, netSalary: 120000, paidAmount: 0 },
        { employeeId: "NV051", employeeCode: "NV000051", employeeName: "Nguyá»…n UyĂªn", basicSalary: 1620333, overtimeSalary: 0, nightShiftsCount: 0, nightShiftAllowance: 0, allowances: 0, bonuses: 0, totalIncome: 1620333, deductions: 0, netSalary: 1620333, paidAmount: 0 },
        { employeeId: "NV043", employeeCode: "NV000043", employeeName: "Thanh TĂ¢m", basicSalary: 2404333, overtimeSalary: 0, nightShiftsCount: 0, nightShiftAllowance: 0, allowances: 0, bonuses: 0, totalIncome: 2404333, deductions: 0, netSalary: 2404333, paidAmount: 0 },
        { employeeId: "NV049", employeeCode: "NV000049", employeeName: "Trá»ng KhĂ¡nh", basicSalary: 993000, overtimeSalary: 0, nightShiftsCount: 0, nightShiftAllowance: 0, allowances: 0, bonuses: 0, totalIncome: 993000, deductions: 0, netSalary: 993000, paidAmount: 0 },
        { employeeId: "NV046", employeeCode: "NV000046", employeeName: "Trung ThĂ nh", basicSalary: 384000, overtimeSalary: 0, nightShiftsCount: 0, nightShiftAllowance: 0, allowances: 0, bonuses: 0, totalIncome: 384000, deductions: 0, netSalary: 384000, paidAmount: 0 }
      ],
      payments: []
    },
    {
      id: "mock-bl-057",
      code: "BL000057",
      name: "Báº£ng lÆ°Æ¡ng thĂ¡ng 7/2026",
      periodType: "HĂ ng thĂ¡ng",
      periodRange: "01/07/2026 - 31/07/2026",
      branch: "379b TĂ´n Äá»©c Tháº¯ng",
      createdAt: "01/07/2026 00:25:12",
      updatedAt: "25/07/2026 02:45:00",
      creator: "Auto",
      status: "Táº¡m tĂ­nh",
      totalEmployees: 2,
      totalSalary: 6641666,
      totalPaid: 0,
      totalRemaining: 6641666,
      items: [
        { employeeId: "NV001", employeeCode: "NV001", employeeName: "Quá»‘c Anh", basicSalary: 2500000, overtimeSalary: 150000, nightShiftsCount: 3, nightShiftAllowance: 45000, allowances: 500000, bonuses: 155000, totalIncome: 3350000, deductions: 50000, netSalary: 3300000, paidAmount: 0 },
        { employeeId: "NV002", employeeCode: "NV002", employeeName: "Diá»…m Quá»³nh", basicSalary: 2800000, overtimeSalary: 0, nightShiftsCount: 2, nightShiftAllowance: 30000, allowances: 511666, bonuses: 0, totalIncome: 3341666, deductions: 0, netSalary: 3341666, paidAmount: 0 }
      ],
      payments: []
    },
    {
      id: "mock-bl-056",
      code: "BL000056",
      name: "Báº£ng lÆ°Æ¡ng thĂ¡ng 6/2026",
      periodType: "HĂ ng thĂ¡ng",
      periodRange: "01/06/2026 - 30/06/2026",
      branch: "285 Nguyá»…n LÆ°Æ¡ng Báº±ng",
      createdAt: "01/06/2026 00:10:00",
      updatedAt: "30/06/2026 18:00:00",
      creator: "Auto",
      status: "Táº¡m tĂ­nh",
      totalEmployees: 5,
      totalSalary: 5744667,
      totalPaid: 0,
      totalRemaining: 5744667,
      items: [],
      payments: []
    },
    {
      id: "mock-bl-054",
      code: "BL000054",
      name: "Báº£ng lÆ°Æ¡ng thĂ¡ng 6/2026",
      periodType: "HĂ ng thĂ¡ng",
      periodRange: "01/06/2026 - 30/06/2026",
      branch: "379b TĂ´n Äá»©c Tháº¯ng",
      createdAt: "01/06/2026 00:15:00",
      updatedAt: "30/06/2026 19:30:00",
      creator: "Auto",
      status: "Táº¡m tĂ­nh",
      totalEmployees: 6,
      totalSalary: 9364701,
      totalPaid: 0,
      totalRemaining: 9364701,
      items: [],
      payments: []
    },
    {
      id: "mock-bl-053",
      code: "BL000053",
      name: "Báº£ng lÆ°Æ¡ng thĂ¡ng 5/2026",
      periodType: "HĂ ng thĂ¡ng",
      periodRange: "01/05/2026 - 31/05/2026",
      branch: "285 Nguyá»…n LÆ°Æ¡ng Báº±ng",
      createdAt: "01/05/2026 00:10:00",
      updatedAt: "31/05/2026 17:45:00",
      creator: "Auto",
      status: "Táº¡m tĂ­nh",
      totalEmployees: 5,
      totalSalary: 6865833,
      totalPaid: 0,
      totalRemaining: 6865833,
      items: [],
      payments: []
    }
  ];

  localStorage.setItem(STORAGE_KEY_PAYROLL_SHEETS, JSON.stringify(defaultSheets));
  return defaultSheets;
}

/**
 * LÆ°u toĂ n bá»™ danh sĂ¡ch báº£ng tĂ­nh lÆ°Æ¡ng
 */
let syncTimeout: any;

export function savePayrollSheets(sheets: PayrollSheet[]) {
  const rawData = JSON.stringify(sheets);
  
  // 1. LocalStorage Versioning (Backup 5 phiên bản gần nhất)
  try {
    const backupKey = `kiot_rm_payroll_backup_${Date.now()}`;
    localStorage.setItem(backupKey, rawData);
    
    // Dọn dẹp các backup cũ, chỉ giữ 5 bản mới nhất
    const keys = Object.keys(localStorage).filter(k => k.startsWith('kiot_rm_payroll_backup_'));
    if (keys.length > 5) {
      keys.sort().slice(0, keys.length - 5).forEach(k => localStorage.removeItem(k));
    }
  } catch (e) {
    console.warn("Could not save backup to LocalStorage", e);
  }

  // 2. Lưu dữ liệu chính
  localStorage.setItem(STORAGE_KEY_PAYROLL_SHEETS, rawData);
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("payroll_sync_status", { detail: "syncing" }));

  // 3. Debounce Sync với Server
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    fetch('/api/payrolls/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawData
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error(await res.text());
      }
      window.dispatchEvent(new CustomEvent("payroll_sync_status", { detail: "success" }));
    }).catch(err => {
      console.error("Sync payrolls failed:", err);
      window.dispatchEvent(new CustomEvent("payroll_sync_error", { detail: err.toString() }));
    });
  }, 1000);
}

/**
 * Tá»° Äá»˜NG Láº¤Y Dá»® LIá»†U Tá»ª Báº¢NG CHáº¤M CĂ”NG & THIáº¾T Láº¬P LÆ¯Æ NG Äá»‚ TĂNH TOĂN Báº¢NG LÆ¯Æ NG
 * CĂ“ CÆ  CHáº¾ Há»– TRá»¢ CA ÄĂM (15,000Ä‘ / CA ÄĂM HOĂ€N THĂ€NH)
 */
export function syncPayrollFromTimesheet(sheetId: string, employees: Employee[], currentItems?: PayrollSheetItem[]): PayrollSheet | null {
  const sheets = getPayrollSheets();
  const idx = sheets.findIndex(s => s.id === sheetId);
  if (idx === -1) return null;

  const sheet = sheets[idx];
  const branch = sheet.branch;
  const isCS2 = branch.includes("379b");

  // Láº¥y dá»¯ liá»‡u cháº¥m cĂ´ng tá»« localStorage
  const rawTime = localStorage.getItem("kiot_rm_timesheet_v2");
  let recMap: Record<string, any> = {};
  if (rawTime) { try { recMap = JSON.parse(rawTime); } catch (e) {} }

  // Láº¥y thiáº¿t láº­p phá»¥ cáº¥p / Ä‘á»‹nh má»©c lÆ°Æ¡ng â€” KHĂ”NG cĂ³ phá»¥ cáº¥p máº·c Ä‘á»‹nh, admin pháº£i tá»± cáº¥u hĂ¬nh á»Ÿ
  // Thiáº¿t láº­p nhĂ¢n viĂªn > TĂ­nh lÆ°Æ¡ng náº¿u muá»‘n cĂ³ phá»¥ cáº¥p.
  const rawSet = localStorage.getItem("kiot_emp_settings_" + branch);
  let setObj: {
    standardHours: number;
    allowances: { name: string; amount: number }[];
    deductions: { name: string; amount: number }[];
    newHireRates: ShiftRateTier;
    regularRates: ShiftRateTier;
    regularTenureMonths: number;
    nightShiftAllowanceAmount: number;
  } = {
    standardHours: isCS2 ? 7.5 : 8,
    allowances: [],
    deductions: [
      { name: 'Pháº¡t Ä‘i muá»™n', amount: 50000 }
    ],
    newHireRates: DEFAULT_NEW_HIRE_RATES,
    regularRates: DEFAULT_REGULAR_RATES,
    regularTenureMonths: DEFAULT_REGULAR_TENURE_MONTHS,
    nightShiftAllowanceAmount: DEFAULT_NIGHT_SHIFT_ALLOWANCE
  };
  if (rawSet) { try { setObj = { ...setObj, ...JSON.parse(rawSet) }; } catch (e) {} }

  // NgĂ y lá»… Ă¡p dá»¥ng chung cho cáº£ há»‡ thá»‘ng â€” ca lĂ m vĂ o Ä‘Ăºng ngĂ y lá»… Ä‘Æ°á»£c nhĂ¢n há»‡ sá»‘ (máº·c Ä‘á»‹nh x2).
  const holidaySettings = getHolidaySettings();
  const periodMonthYear = parsePeriodMonthYear(sheet.periodRange);

  // Lá»c cĂ¡c nhĂ¢n viĂªn thuá»™c chi nhĂ¡nh nĂ y
  const branchEmps = employees.filter(e =>
    e.branch === branch || (!e.branch && branch.includes("285"))
  );

  const updatedItems: PayrollSheetItem[] = branchEmps.map(emp => {
    // TĂ¬m cĂ¡c báº£n ghi cháº¥m cĂ´ng cá»§a nhĂ¢n viĂªn (khá»›p báº±ng mĂ£ nhĂ¢n viĂªn HOáº¶C tĂªn nhĂ¢n viĂªn Ä‘á»ƒ phĂ²ng há» dá»¯ liá»‡u cÅ© bá»‹ sai mĂ£)
    let empRecords = Object.values(recMap).filter(r => 
      r.employeeCode === emp.code || 
      normalizeName(r.employeeName).includes(normalizeName(emp.name))
    );
    if (periodMonthYear) {
      const targetPrefix = `${periodMonthYear.year}${String(periodMonthYear.month).padStart(2, '0')}`;
      empRecords = empRecords.filter(r => r.dateKey && r.dateKey.startsWith(targetPrefix));
    }
    const shiftRates = emp.salaryPolicy === "Mức 2" ? setObj.regularRates : setObj.newHireRates;

    let workDays = 0;
    let totalLateMins = 0;
    let totalOtMins = 0;
    let nightShiftsCount = 0;
    let totalHours = 0;
    let shiftWageTotal = 0;
    const branchTally: Record<string, { shifts: number; nightShifts: number }> = {};

    empRecords.forEach(r => {
      // Nháº­n diá»‡n ca Ä‘Ăªm hoĂ n thĂ nh (shiftId chá»©a "dem" hoáº·c "Ä‘Ăªm" hoáº·c giá» lĂ m Ä‘Ăªm tá»« 22h-05h)
      const isNightShift = r.shiftId && (
        r.shiftId.toLowerCase().includes("dem") ||
        r.shiftId.toLowerCase().includes("Ä‘Ăªm") ||
        r.shiftId === "ca-dem-3" ||
        (r.note && r.note.toLowerCase().includes("Ä‘Ăªm"))
      );
      const validShift = r.status === "dung_gio" || r.status === "di_muon" || (r.checkIn && r.checkOut);

      if (validShift) {
        // LÆ°Æ¡ng chĂ­nh tĂ­nh theo Sá» GIá»œ THá»°C Táº¾ Ä‘Ă£ cháº¥m cĂ´ng vĂ o/ra (ká»ƒ cáº£ phĂºt láº» Ä‘i sá»›m/vá» muá»™n
        // ngoĂ i giá» ca chuáº©n), nhĂ¢n vá»›i Ä‘Æ¡n giĂ¡/giá» theo loáº¡i ca (ngĂ y/Ä‘Ăªm) vĂ  thĂ¢m niĂªn nhĂ¢n viĂªn.
        const hoursWorked = calcShiftHours(r.checkIn, r.checkOut, r.shiftId);
        workDays += 1;
        totalHours += hoursWorked;
        const rate = isNightShift ? (shiftRates?.night || 0) : (shiftRates?.day || 0);
        const isHoliday = isHolidayDate(r.date, r.dateKey, periodMonthYear, holidaySettings.holidays);
        shiftWageTotal += hoursWorked * rate * (isHoliday ? holidaySettings.multiplier : 1);
        // Tá»•ng há»£p sá»‘ ca theo tá»«ng chi nhĂ¡nh â€” cho phĂ©p 1 NV lĂ m nhiá»u cÆ¡ sá»Ÿ váº«n ra 1 báº£ng lÆ°Æ¡ng chĂ­nh thá»©c
        const recBranch = normalizeBranchLabel(r.branch);
        if (!branchTally[recBranch]) branchTally[recBranch] = { shifts: 0, nightShifts: 0 };
        branchTally[recBranch].shifts += 1;
        if (isNightShift) {
          nightShiftsCount += 1;
          branchTally[recBranch].nightShifts += 1;
        }
      }
      if (r.lateMinutes) totalLateMins += r.lateMinutes;
      if (r.otMinutes) totalOtMins += r.otMinutes;
    });
    totalHours += totalOtMins / 60;

    const branchBreakdown: BranchShiftBreakdown[] = Object.entries(branchTally).map(([b, v]) => ({
      branch: b,
      shifts: v.shifts,
      nightShifts: v.nightShifts
    }));

    // Náº¿u cĂ³ dá»¯ liá»‡u Ä‘ang chá»‰nh sá»­a trĂªn UI (currentItems), Æ°u tiĂªn dĂ¹ng dá»¯ liá»‡u Ä‘Ă³ thay vĂ¬ DB cÅ©
    const sourceItems = currentItems || sheet.items;
    const existingItem = sourceItems.find(i => i.employeeCode === emp.code);

    // LÆ°Æ¡ng chĂ­nh = sá»‘ giá» thá»±c táº¿ Ä‘Ă£ lĂ m Ă— Ä‘Æ¡n giĂ¡/giá» theo loáº¡i ca & thĂ¢m niĂªn (nhĂ¢n Ä‘Ă´i náº¿u rÆ¡i
    // vĂ o ngĂ y lá»…), Cá»˜NG THĂM há»— trá»£ ca Ä‘Ăªm riĂªng á»Ÿ dÆ°á»›i.
    const basicSalary = Math.round(shiftWageTotal);
    const overtimeSalary = Math.round((totalOtMins / 60) * (shiftRates?.day || 0) * 1.5);
    const finalNightShifts = nightShiftsCount;
    const nightShiftAllowance = finalNightShifts * setObj.nightShiftAllowanceAmount;

    // Giá»¯ láº¡i phá»¥ cáº¥p khĂ¡c vĂ  thÆ°á»Ÿng do admin nháº­p thá»§ cĂ´ng
    const autoAllowances = setObj.allowances.reduce((sum, a) => sum + (a.amount || 0), 0);
    const allowances = existingItem && existingItem.allowances !== undefined ? existingItem.allowances : autoAllowances;
    const bonuses = existingItem ? existingItem.bonuses : 0;
    const totalIncome = basicSalary + overtimeSalary + nightShiftAllowance + allowances + bonuses;
    
    // Giáº£m trá»«: Pháº¡t Ä‘i muá»™n (má»—i láº§n muá»™n pháº¡t theo thiáº¿t láº­p), nhÆ°ng Æ¯U TIĂN dá»¯ liá»‡u chá»‰nh sá»­a thá»§ cĂ´ng
    const latePenaltyCount = empRecords.filter(r => (r.lateMinutes || 0) > 0).length;
    const autoDeductions = latePenaltyCount * (setObj.deductions[0]?.amount || 50000);
    const deductions = existingItem && existingItem.deductions !== undefined ? existingItem.deductions : autoDeductions;
    // á»¨ng lÆ°Æ¡ng vĂ  Ä‘Ă£ tráº£
    const paidAmount = existingItem ? existingItem.paidAmount : 0;
    const advanceAmount = periodMonthYear ? getAdvancesForEmployeeInMonth(emp.code, periodMonthYear.month, periodMonthYear.year) : (existingItem ? (existingItem.advanceAmount || 0) : 0);
    const netSalary = Math.max(0, totalIncome - deductions - advanceAmount);

    return {
      employeeId: emp.id,
      employeeCode: emp.code,
      employeeName: emp.name,
      basicSalary,
      overtimeSalary,
      nightShiftsCount: finalNightShifts,
      nightShiftAllowance,
      allowances,
      bonuses,
      totalIncome,
      deductions,
      netSalary,
      paidAmount,
      branchBreakdown,
      totalHours: Math.round(totalHours * 10) / 10,
      advanceAmount
    };
  });

  sheet.items = updatedItems;
  sheet.totalEmployees = updatedItems.length;
  sheet.totalSalary = updatedItems.reduce((acc, i) => acc + (i.totalIncome - i.deductions), 0);
  const totalAdvances = updatedItems.reduce((acc, i) => acc + (i.advanceAmount || 0), 0);
  sheet.totalPaid = updatedItems.reduce((acc, i) => acc + i.paidAmount, 0) + totalAdvances;
  sheet.totalRemaining = Math.max(0, updatedItems.reduce((acc, i) => acc + i.netSalary, 0) - (sheet.totalPaid - totalAdvances));
  sheet.updatedAt = new Date().toLocaleString("vi-VN");
  sheet.formulaVersion = PAYROLL_FORMULA_VERSION;

  sheets[idx] = sheet;
  savePayrollSheets(sheets);
  return sheet;
}

/**
 * Táº¡o má»›i 1 báº£ng tĂ­nh lÆ°Æ¡ng
 */
export function createPayrollSheet(name: string, branch: string, periodRange: string): PayrollSheet {
  const sheets = getPayrollSheets();
  
  // Find max code to prevent collisions
  let maxCodeNum = 59;
  for (const s of sheets) {
    if (!s.code) continue;
    const match = s.code.match(/^BL0*(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxCodeNum) maxCodeNum = num;
    }
  }
  const nextNum = maxCodeNum + 1;
  const code = `BL${nextNum.toString().padStart(6, '0')}`;

  const newSheet: PayrollSheet = {
    id: crypto.randomUUID(),
    code,
    name,
    periodType: "Hàng tháng",
    periodRange,
    branch,
    createdAt: new Date().toLocaleString("vi-VN"),
    updatedAt: new Date().toLocaleString("vi-VN"),
    creator: "Auto",
    status: "Tạm tính",
    totalEmployees: 0,
    totalSalary: 0,
    totalPaid: 0,
    totalRemaining: 0,
    items: [],
    payments: []
  };

  const updated = [newSheet, ...sheets];
  savePayrollSheets(updated);
  return newSheet;
}

