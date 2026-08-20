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
  basicSalary: number;         // Lương chính (tính từ chấm công hoặc định mức)
  overtimeSalary: number;      // Làm thêm (OT)
  nightShiftsCount?: number;   // Số buổi làm đêm
  nightShiftAllowance?: number;// Hỗ trợ ca đêm (15,000 đ / ca đêm hoàn thành)
  allowances: number;          // Phụ cấp (Ăn trưa, gửi xe...)
  bonuses: number;             // Thưởng
  totalIncome: number;         // Tổng thu nhập
  deductions: number;          // Giảm trừ (Phạt đi muộn, nghỉ không phép...)
  netSalary: number;           // Lương thực nhận (Tổng thu nhập - Giảm trừ)
  paidAmount: number;          // Đã thanh toán
  branchBreakdown?: BranchShiftBreakdown[]; // Số ca làm việc tổng hợp theo từng chi nhánh (cho NV làm nhiều cơ sở)
  totalHours?: number;         // Tổng số giờ làm (từ giờ vào/ra chấm công + giờ OT)
  advanceAmount?: number;      // Số tiền đã ứng lương
  note?: string;
}

export interface PayrollPaymentHistory {
  id: string;
  timestamp: string;
  amount: number;
  paymentMethod: string; // Tiền mặt, Chuyển khoản
  payer: string;
  note?: string;
}

export interface PayrollSheet {
  id: string;
  code: string;           // VD: BL000059
  name: string;           // VD: Bảng lương tháng 7/2026
  periodType: string;     // VD: Hàng tháng
  periodRange: string;    // VD: 01/07/2026 - 31/07/2026
  branch: string;         // VD: 285 Nguyễn Lương Bằng
  createdAt: string;      // VD: 01/07/2026 00:26:07
  updatedAt: string;
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

// Tăng số này mỗi khi thay đổi công thức tính lương (đơn giá/giờ, phụ cấp, ngày lễ...) — các bảng
// lương đang giữ formulaVersion cũ hơn sẽ được tự động đồng bộ lại theo công thức mới nhất.
export const PAYROLL_FORMULA_VERSION = 4;

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

// Chính sách lương theo ca: NV mới (làm dưới N tháng, tính từ ngày vào làm) hưởng mức thấp hơn NV
// chính thức. Các mức này cấu hình được ở Thiết lập nhân viên > Tính lương (theo từng chi nhánh);
// đây chỉ là giá trị mặc định khi admin chưa cấu hình gì. Chưa tính phụ cấp ca đêm (cộng riêng bên dưới).
export interface ShiftRateTier { day: number; night: number; }
export const DEFAULT_NEW_HIRE_RATES: ShiftRateTier = { day: 18000, night: 20000 };
export const DEFAULT_REGULAR_RATES: ShiftRateTier = { day: 20000, night: 22000 };
export const DEFAULT_REGULAR_TENURE_MONTHS = 3;
export const DEFAULT_NIGHT_SHIFT_ALLOWANCE = 15000;

function isRegularEmployee(joinDate: string | undefined, tenureMonths: number): boolean {
  if (!joinDate) return true; // không rõ ngày vào làm — mặc định coi là chính thức
  const join = new Date(joinDate);
  if (Number.isNaN(join.getTime())) return true;
  const threshold = new Date(join);
  threshold.setMonth(threshold.getMonth() + tenureMonths);
  return new Date() >= threshold;
}

// ===================== NGÀY LỄ & HỆ SỐ LƯƠNG NGÀY LỄ (áp dụng chung toàn hệ thống) =====================
export interface HolidayItem { id: string; date: string; name: string; } // date dạng "DD/MM/YYYY"
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

// Suy ra tháng/năm của kỳ lương từ periodRange (VD "01/07/2026 - 31/07/2026") để ghép với "date"
// (chỉ là số ngày trong tháng) của bản ghi chấm công, từ đó biết ngày đó có phải ngày lễ hay không.
function parsePeriodMonthYear(periodRange: string): { month: number; year: number } | null {
  const m = periodRange.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return { month: parseInt(m[2], 10), year: parseInt(m[3], 10) };
}

/**
 * Suy ra khoảng ngày của kỳ lương dưới dạng khóa "YYYYMMDD" để lọc bản ghi chấm công.
 * periodRange có dạng "01/07/2026 - 31/07/2026".
 */
function parsePeriodKeyRange(periodRange: string): { fromKey: string; toKey: string } | null {
  const m = periodRange.match(/^(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return {
    fromKey: `${m[3]}${m[2]}${m[1]}`,
    toKey: `${m[6]}${m[5]}${m[4]}`
  };
}

/**
 * Bản ghi chấm công có nằm trong kỳ lương đang tính không.
 * Bắt buộc phải lọc — nếu không, 1 buổi chấm công sẽ bị tính lặp vào MỌI kỳ lương của nhân viên đó.
 * Bản ghi cũ không có dateKey thì không xác định được tháng nên không đưa vào kỳ nào cả
 * (thà thiếu còn hơn tính sai lặp cho tất cả các tháng).
 */
function recordInPeriod(dateKey: string | undefined, range: { fromKey: string; toKey: string } | null): boolean {
  if (!range) return true;              // không đọc được kỳ lương -> giữ nguyên hành vi cũ
  if (!dateKey || dateKey.length !== 8) return false;
  return dateKey >= range.fromKey && dateKey <= range.toKey;
}

// Ưu tiên dateKey ("YYYYMMDD") lưu trên chính bản ghi chấm công — chính xác kể cả khi dữ liệu trải
// nhiều tháng; chỉ suy luận tháng/năm từ kỳ lương cho các bản ghi cũ chưa có dateKey.
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

// Tính số giờ của 1 ca từ giờ vào/ra dạng "HH:MM", có xử lý ca qua đêm (giờ ra < giờ vào)
function calcShiftHours(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 0;
  const [inH, inM] = checkIn.split(":").map(Number);
  const [outH, outM] = checkOut.split(":").map(Number);
  if (Number.isNaN(inH) || Number.isNaN(outH)) return 0;
  let minutes = (outH * 60 + outM) - (inH * 60 + inM);
  if (minutes < 0) minutes += 24 * 60;
  return minutes / 60;
}

/**
 * Lấy danh sách các bảng tính lương từ localStorage (hoặc dữ liệu mẫu chuẩn KiotViet)
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

  // Dữ liệu mẫu khởi tạo chuẩn đúng con số trong Screenshot 1 & 2 của KiotViet
  const defaultSheets: PayrollSheet[] = [
    {
      id: "mock-bl-059",
      code: "BL000059",
      name: "Bảng lương tháng 7/2026",
      periodType: "Hàng tháng",
      periodRange: "01/07/2026 - 31/07/2026",
      branch: "285 Nguyễn Lương Bằng",
      createdAt: "01/07/2026 00:26:07",
      updatedAt: "25/07/2026 03:13:13",
      creator: "Auto",
      status: "Tạm tính",
      totalEmployees: 5,
      totalSalary: 5521666,
      totalPaid: 0,
      totalRemaining: 5521666,
      items: [
        { employeeId: "NV041", employeeCode: "NV000041", employeeName: "Minh Trúc", basicSalary: 120000, overtimeSalary: 0, nightShiftsCount: 0, nightShiftAllowance: 0, allowances: 0, bonuses: 0, totalIncome: 120000, deductions: 0, netSalary: 120000, paidAmount: 0 },
        { employeeId: "NV051", employeeCode: "NV000051", employeeName: "Nguyễn Uyên", basicSalary: 1620333, overtimeSalary: 0, nightShiftsCount: 0, nightShiftAllowance: 0, allowances: 0, bonuses: 0, totalIncome: 1620333, deductions: 0, netSalary: 1620333, paidAmount: 0 },
        { employeeId: "NV043", employeeCode: "NV000043", employeeName: "Thanh Tâm", basicSalary: 2404333, overtimeSalary: 0, nightShiftsCount: 0, nightShiftAllowance: 0, allowances: 0, bonuses: 0, totalIncome: 2404333, deductions: 0, netSalary: 2404333, paidAmount: 0 },
        { employeeId: "NV049", employeeCode: "NV000049", employeeName: "Trọng Khánh", basicSalary: 993000, overtimeSalary: 0, nightShiftsCount: 0, nightShiftAllowance: 0, allowances: 0, bonuses: 0, totalIncome: 993000, deductions: 0, netSalary: 993000, paidAmount: 0 },
        { employeeId: "NV046", employeeCode: "NV000046", employeeName: "Trung Thành", basicSalary: 384000, overtimeSalary: 0, nightShiftsCount: 0, nightShiftAllowance: 0, allowances: 0, bonuses: 0, totalIncome: 384000, deductions: 0, netSalary: 384000, paidAmount: 0 }
      ],
      payments: []
    },
    {
      id: "mock-bl-057",
      code: "BL000057",
      name: "Bảng lương tháng 7/2026",
      periodType: "Hàng tháng",
      periodRange: "01/07/2026 - 31/07/2026",
      branch: "379b Tôn Đức Thắng",
      createdAt: "01/07/2026 00:25:12",
      updatedAt: "25/07/2026 02:45:00",
      creator: "Auto",
      status: "Tạm tính",
      totalEmployees: 2,
      totalSalary: 6641666,
      totalPaid: 0,
      totalRemaining: 6641666,
      items: [
        { employeeId: "NV001", employeeCode: "NV001", employeeName: "Quốc Anh", basicSalary: 2500000, overtimeSalary: 150000, nightShiftsCount: 3, nightShiftAllowance: 45000, allowances: 500000, bonuses: 155000, totalIncome: 3350000, deductions: 50000, netSalary: 3300000, paidAmount: 0 },
        { employeeId: "NV002", employeeCode: "NV002", employeeName: "Diễm Quỳnh", basicSalary: 2800000, overtimeSalary: 0, nightShiftsCount: 2, nightShiftAllowance: 30000, allowances: 511666, bonuses: 0, totalIncome: 3341666, deductions: 0, netSalary: 3341666, paidAmount: 0 }
      ],
      payments: []
    },
    {
      id: "mock-bl-056",
      code: "BL000056",
      name: "Bảng lương tháng 6/2026",
      periodType: "Hàng tháng",
      periodRange: "01/06/2026 - 30/06/2026",
      branch: "285 Nguyễn Lương Bằng",
      createdAt: "01/06/2026 00:10:00",
      updatedAt: "30/06/2026 18:00:00",
      creator: "Auto",
      status: "Tạm tính",
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
      name: "Bảng lương tháng 6/2026",
      periodType: "Hàng tháng",
      periodRange: "01/06/2026 - 30/06/2026",
      branch: "379b Tôn Đức Thắng",
      createdAt: "01/06/2026 00:15:00",
      updatedAt: "30/06/2026 19:30:00",
      creator: "Auto",
      status: "Tạm tính",
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
      name: "Bảng lương tháng 5/2026",
      periodType: "Hàng tháng",
      periodRange: "01/05/2026 - 31/05/2026",
      branch: "285 Nguyễn Lương Bằng",
      createdAt: "01/05/2026 00:10:00",
      updatedAt: "31/05/2026 17:45:00",
      creator: "Auto",
      status: "Tạm tính",
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
 * Lưu toàn bộ danh sách bảng tính lương
 */
export function savePayrollSheets(sheets: PayrollSheet[]) {
  localStorage.setItem(STORAGE_KEY_PAYROLL_SHEETS, JSON.stringify(sheets));
  window.dispatchEvent(new Event("storage"));
}

/**
 * TỰ ĐỘNG LẤY DỮ LIỆU TỪ BẢNG CHẤM CÔNG & THIẾT LẬP LƯƠNG ĐỂ TÍNH TOÁN BẢNG LƯƠNG
 * CÓ CƠ CHẾ HỖ TRỢ CA ĐÊM (15,000đ / CA ĐÊM HOÀN THÀNH)
 */
export function syncPayrollFromTimesheet(sheetId: string, employees: Employee[]): PayrollSheet | null {
  const sheets = getPayrollSheets();
  const idx = sheets.findIndex(s => s.id === sheetId);
  if (idx === -1) return null;

  const sheet = sheets[idx];
  const branch = sheet.branch;
  const isCS2 = branch.includes("379b");

  // Lấy dữ liệu chấm công từ localStorage
  const rawTime = localStorage.getItem("kiot_rm_timesheet_v2");
  let recMap: Record<string, any> = {};
  if (rawTime) { try { recMap = JSON.parse(rawTime); } catch (e) {} }

  // Lấy thiết lập phụ cấp / định mức lương — KHÔNG có phụ cấp mặc định, admin phải tự cấu hình ở
  // Thiết lập nhân viên > Tính lương nếu muốn có phụ cấp.
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
      { name: 'Phạt đi muộn', amount: 50000 }
    ],
    newHireRates: DEFAULT_NEW_HIRE_RATES,
    regularRates: DEFAULT_REGULAR_RATES,
    regularTenureMonths: DEFAULT_REGULAR_TENURE_MONTHS,
    nightShiftAllowanceAmount: DEFAULT_NIGHT_SHIFT_ALLOWANCE
  };
  if (rawSet) { try { setObj = { ...setObj, ...JSON.parse(rawSet) }; } catch (e) {} }

  // Ngày lễ áp dụng chung cho cả hệ thống — ca làm vào đúng ngày lễ được nhân hệ số (mặc định x2).
  const holidaySettings = getHolidaySettings();
  const periodMonthYear = parsePeriodMonthYear(sheet.periodRange);
  const periodKeyRange = parsePeriodKeyRange(sheet.periodRange);

  // Lọc các nhân viên thuộc chi nhánh này
  const branchEmps = employees.filter(e =>
    e.branch === branch || (!e.branch && branch.includes("285"))
  );

  const baseMonthlySalary = 8500000;
  const dailyRate = Math.round(baseMonthlySalary / 26);
  const hourlyRate = Math.round(dailyRate / setObj.standardHours);

  const updatedItems: PayrollSheetItem[] = branchEmps.map(emp => {
    // Tìm các bản ghi chấm công của nhân viên
    // Chỉ lấy chấm công NẰM TRONG kỳ lương này — không lọc thì 1 buổi công sẽ bị tính lặp
    // vào mọi kỳ lương (tháng 5, 6, 7... đều ăn chung 1 bản ghi).
    const empRecords = Object.values(recMap).filter(
      r => r.employeeCode === emp.code && recordInPeriod(r.dateKey, periodKeyRange)
    );
    const shiftRates = isRegularEmployee(emp.joinDate, setObj.regularTenureMonths) ? setObj.regularRates : setObj.newHireRates;

    let workDays = 0;
    let totalLateMins = 0;
    let totalOtMins = 0;
    let nightShiftsCount = 0;
    let totalHours = 0;
    let shiftWageTotal = 0;
    const branchTally: Record<string, { shifts: number; nightShifts: number }> = {};

    empRecords.forEach(r => {
      // Nhận diện ca đêm hoàn thành (shiftId chứa "dem" hoặc "đêm" hoặc giờ làm đêm từ 22h-05h)
      const isNightShift = r.shiftId && (
        r.shiftId.toLowerCase().includes("dem") ||
        r.shiftId.toLowerCase().includes("đêm") ||
        r.shiftId === "ca-dem-3" ||
        (r.note && r.note.toLowerCase().includes("đêm"))
      );
      const validShift = r.status === "dung_gio" || r.status === "di_muon" || (r.checkIn && r.checkOut);

      if (validShift) {
        // Lương chính tính theo SỐ GIỜ THỰC TẾ đã chấm công vào/ra (kể cả phút lẻ đi sớm/về muộn
        // ngoài giờ ca chuẩn), nhân với đơn giá/giờ theo loại ca (ngày/đêm) và thâm niên nhân viên.
        const hoursWorked = calcShiftHours(r.checkIn, r.checkOut);
        workDays += 1;
        totalHours += hoursWorked;
        const rate = isNightShift ? shiftRates.night : shiftRates.day;
        const isHoliday = isHolidayDate(r.date, r.dateKey, periodMonthYear, holidaySettings.holidays);
        shiftWageTotal += hoursWorked * rate * (isHoliday ? holidaySettings.multiplier : 1);
        // Tổng hợp số ca theo từng chi nhánh — cho phép 1 NV làm nhiều cơ sở vẫn ra 1 bảng lương chính thức
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

    // Nếu là nhân viên có sẵn trong items cũ, giữ nguyên thưởng / ghi chú / số đã ứng nếu có
    const existingItem = sheet.items.find(i => i.employeeCode === emp.code);

    // Lương chính = số giờ thực tế đã làm × đơn giá/giờ theo loại ca & thâm niên (nhân đôi nếu rơi
    // vào ngày lễ), CỘNG THÊM hỗ trợ ca đêm riêng ở dưới. LUÔN tính lại từ chấm công thật — chưa có
    // chấm công thì lương chính phải là 0, không giữ lại số liệu cũ từ lần đồng bộ trước.
    const basicSalary = Math.round(shiftWageTotal);
    const overtimeSalary = Math.round((totalOtMins / 60) * hourlyRate * 1.5);
    const finalNightShifts = nightShiftsCount;
    const nightShiftAllowance = finalNightShifts * setObj.nightShiftAllowanceAmount;

    const allowances = setObj.allowances.reduce((sum, a) => sum + (a.amount || 0), 0);
    const bonuses = existingItem ? existingItem.bonuses : 0;
    const totalIncome = basicSalary + overtimeSalary + nightShiftAllowance + allowances + bonuses;
    
    // Giảm trừ: Phạt đi muộn (mỗi lần muộn phạt theo thiết lập)
    const latePenaltyCount = empRecords.filter(r => (r.lateMinutes || 0) > 0).length;
    const deductions = latePenaltyCount * (setObj.deductions[0]?.amount || 50000);
    const netSalary = Math.max(0, totalIncome - deductions);
    const paidAmount = existingItem ? existingItem.paidAmount : 0;
    const advanceAmount = existingItem ? (existingItem.advanceAmount || 0) : 0;

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
  sheet.totalSalary = updatedItems.reduce((acc, i) => acc + i.netSalary, 0);
  sheet.totalPaid = updatedItems.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalAdvances = updatedItems.reduce((acc, i) => acc + (i.advanceAmount || 0), 0);
  sheet.totalRemaining = Math.max(0, sheet.totalSalary - sheet.totalPaid - totalAdvances);
  sheet.updatedAt = new Date().toLocaleString("vi-VN");
  sheet.formulaVersion = PAYROLL_FORMULA_VERSION;

  sheets[idx] = sheet;
  savePayrollSheets(sheets);
  return sheet;
}

/**
 * Tạo mới 1 bảng tính lương
 */
export function createPayrollSheet(name: string, branch: string, periodRange: string): PayrollSheet {
  const sheets = getPayrollSheets();
  const code = `BL0000${Math.floor(60 + Math.random() * 40)}`;
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
