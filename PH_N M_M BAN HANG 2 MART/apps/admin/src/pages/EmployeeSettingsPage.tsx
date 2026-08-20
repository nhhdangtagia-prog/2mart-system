import { useState, useEffect } from "react";
import { Button } from "@2mart/ui";
import { 
  Settings, Clock, DollarSign, Calendar, Smartphone, Radio as RadioIcon, 
  ChevronRight, X, Save, Info, AlertCircle, Building2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentBranch } from "../hooks/useCurrentBranch";
import {
  DEFAULT_NEW_HIRE_RATES, DEFAULT_REGULAR_RATES, DEFAULT_REGULAR_TENURE_MONTHS, DEFAULT_NIGHT_SHIFT_ALLOWANCE,
  DEFAULT_HOLIDAY_MULTIPLIER, getHolidaySettings, saveHolidaySettings,
  type ShiftRateTier, type HolidayItem
} from "../utils/payrollService";

type TabKey = 'init' | 'attendance' | 'payroll' | 'holidays' | 'zalo' | 'machine';

interface AllowanceItem {
  id: string;
  name: string;
  amount: number;
  type: 'monthly' | 'daily';
}

interface DeductionItem {
  id: string;
  name: string;
  amount: number;
  reason: string;
}

export function EmployeeSettingsPage() {
  const { currentBranch, isCS2 } = useCurrentBranch();
  const [activeTab, setActiveTab] = useState<TabKey>('attendance');

  // Attendance states (Tab 1)
  const [standardHours, setStandardHours] = useState<number>(8);
  const [halfDayEnabled, setHalfDayEnabled] = useState<boolean>(false);
  const [halfDayFrom, setHalfDayFrom] = useState<string>("0:00");
  const [halfDayTo, setHalfDayTo] = useState<string>("4:00");
  const [lateCheckEnabled, setLateCheckEnabled] = useState<boolean>(true);
  const [lateMinutes, setLateMinutes] = useState<number>(0);
  const [earlyCheckEnabled, setEarlyCheckEnabled] = useState<boolean>(true);
  const [earlyMinutes, setEarlyMinutes] = useState<number>(0);
  const [otBeforeEnabled, setOtBeforeEnabled] = useState<boolean>(true);
  const [otBeforeMinutes, setOtBeforeMinutes] = useState<number>(0);
  const [otAfterEnabled, setOtAfterEnabled] = useState<boolean>(true);
  const [otAfterMinutes, setOtAfterMinutes] = useState<number>(0);
  const [multiShiftToggle, setMultiShiftToggle] = useState<boolean>(false);
  const [autoAttendanceToggle, setAutoAttendanceToggle] = useState<boolean>(false);
  const [noScheduleAttendanceToggle, setNoScheduleAttendanceToggle] = useState<boolean>(true);

  // Payroll states (Tab 2)
  const [payDay, setPayDay] = useState<string>("Ngày 1");
  const [autoCreatePayroll, setAutoCreatePayroll] = useState<boolean>(true);
  const [autoUpdatePayroll, setAutoUpdatePayroll] = useState<boolean>(true);
  const [allowances, setAllowances] = useState<AllowanceItem[]>([
    { id: '1', name: 'Phụ cấp ăn trưa', amount: 730000, type: 'monthly' },
    { id: '2', name: 'Phụ cấp gửi xe', amount: 200000, type: 'monthly' }
  ]);
  const [deductions, setDeductions] = useState<DeductionItem[]>([
    { id: '1', name: 'Đi muộn quá 15 phút', amount: 50000, reason: 'Vi phạm nội quy thời gian' }
  ]);
  const [taxEnabled, setTaxEnabled] = useState<boolean>(false);
  const [insuranceEnabled, setInsuranceEnabled] = useState<boolean>(false);
  const [commissionType, setCommissionType] = useState<'after_discount' | 'actual_collected'>('after_discount');

  // Chính sách lương theo ca (đơn giá / giờ làm việc) — theo từng chi nhánh
  const [newHireRates, setNewHireRates] = useState<ShiftRateTier>(DEFAULT_NEW_HIRE_RATES);
  const [regularRates, setRegularRates] = useState<ShiftRateTier>(DEFAULT_REGULAR_RATES);
  const [regularTenureMonths, setRegularTenureMonths] = useState<number>(DEFAULT_REGULAR_TENURE_MONTHS);
  const [nightShiftAllowanceAmount, setNightShiftAllowanceAmount] = useState<number>(DEFAULT_NIGHT_SHIFT_ALLOWANCE);

  // Ngày lễ & hệ số lương ngày lễ — dùng chung cho toàn bộ hệ thống (không tách theo chi nhánh)
  const [holidayMultiplier, setHolidayMultiplier] = useState<number>(DEFAULT_HOLIDAY_MULTIPLIER);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState<boolean>(false);
  const [newHoliday, setNewHoliday] = useState<{ date: string; name: string }>({ date: "", name: "" });

  // Modals
  const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState<boolean>(false);
  const [newAllowance, setNewAllowance] = useState<{name: string, amount: number, type: 'monthly' | 'daily'}>({
    name: "", amount: 500000, type: 'monthly'
  });

  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState<boolean>(false);
  const [newDeduction, setNewDeduction] = useState<{name: string, amount: number, reason: string}>({
    name: "", amount: 50000, reason: ""
  });

  // Load saved settings per branch — KHÔNG có phụ cấp mặc định, admin phải tự thêm nếu muốn có phụ cấp.
  useEffect(() => {
    const saved = localStorage.getItem("kiot_emp_settings_" + currentBranch);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.standardHours !== undefined) setStandardHours(data.standardHours);
        if (data.halfDayEnabled !== undefined) setHalfDayEnabled(data.halfDayEnabled);
        if (data.lateMinutes !== undefined) setLateMinutes(data.lateMinutes);
        if (data.earlyMinutes !== undefined) setEarlyMinutes(data.earlyMinutes);
        if (data.otBeforeMinutes !== undefined) setOtBeforeMinutes(data.otBeforeMinutes);
        if (data.otAfterMinutes !== undefined) setOtAfterMinutes(data.otAfterMinutes);
        if (data.multiShiftToggle !== undefined) setMultiShiftToggle(data.multiShiftToggle);
        if (data.autoAttendanceToggle !== undefined) setAutoAttendanceToggle(data.autoAttendanceToggle);
        if (data.noScheduleAttendanceToggle !== undefined) setNoScheduleAttendanceToggle(data.noScheduleAttendanceToggle);
        if (data.payDay) setPayDay(data.payDay);
        if (data.autoCreatePayroll !== undefined) setAutoCreatePayroll(data.autoCreatePayroll);
        if (data.autoUpdatePayroll !== undefined) setAutoUpdatePayroll(data.autoUpdatePayroll);
        setAllowances(data.allowances || []);
        setDeductions(data.deductions || []);
        if (data.taxEnabled !== undefined) setTaxEnabled(data.taxEnabled);
        if (data.insuranceEnabled !== undefined) setInsuranceEnabled(data.insuranceEnabled);
        if (data.commissionType) setCommissionType(data.commissionType);
        setNewHireRates(data.newHireRates || DEFAULT_NEW_HIRE_RATES);
        setRegularRates(data.regularRates || DEFAULT_REGULAR_RATES);
        setRegularTenureMonths(data.regularTenureMonths ?? DEFAULT_REGULAR_TENURE_MONTHS);
        setNightShiftAllowanceAmount(data.nightShiftAllowanceAmount ?? DEFAULT_NIGHT_SHIFT_ALLOWANCE);
      } catch (e) {}
    } else {
      // Chưa từng lưu thiết lập cho chi nhánh này — dùng mặc định hệ thống, KHÔNG có phụ cấp sẵn.
      setStandardHours(isCS2 ? 7.5 : 8);
      setAllowances([]);
      setDeductions([{ id: '1', name: 'Đi muộn quá 15 phút', amount: 50000, reason: 'Vi phạm nội quy thời gian' }]);
      setNewHireRates(DEFAULT_NEW_HIRE_RATES);
      setRegularRates(DEFAULT_REGULAR_RATES);
      setRegularTenureMonths(DEFAULT_REGULAR_TENURE_MONTHS);
      setNightShiftAllowanceAmount(DEFAULT_NIGHT_SHIFT_ALLOWANCE);
    }
  }, [currentBranch, isCS2]);

  // Ngày lễ dùng chung cho toàn hệ thống — không phụ thuộc chi nhánh đang chọn
  useEffect(() => {
    const hs = getHolidaySettings();
    setHolidayMultiplier(hs.multiplier);
    setHolidays(hs.holidays);
  }, []);

  const saveSettings = () => {
    const data = {
      standardHours, halfDayEnabled, lateMinutes, earlyMinutes,
      otBeforeMinutes, otAfterMinutes, multiShiftToggle, autoAttendanceToggle,
      noScheduleAttendanceToggle, payDay, autoCreatePayroll, autoUpdatePayroll,
      allowances, deductions, taxEnabled, insuranceEnabled, commissionType,
      newHireRates, regularRates, regularTenureMonths, nightShiftAllowanceAmount
    };
    saveHolidaySettings({ multiplier: holidayMultiplier, holidays });
    localStorage.setItem("kiot_emp_settings_" + currentBranch, JSON.stringify(data));
    alert(`Đã lưu thiết lập chấm công và tính lương cho cơ sở: ${currentBranch} thành công!`);
  };

  const formatCurrency = (val: number) => val.toLocaleString() + ' đ';

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 flex flex-col h-full animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              Thiết lập nhân viên
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Building2 className="w-3.5 h-3.5" />
              Cơ sở: {currentBranch}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Các quy tắc chấm công, giờ làm chuẩn và chính sách lương/phụ cấp được lưu tách biệt cho từng chi nhánh</p>
        </div>
        <Button onClick={saveSettings} className="gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
          <Save className="w-4 h-4" /> Lưu thiết lập ({isCS2 ? "CS2" : "CS1"})
        </Button>
      </div>

      {/* Main Layout: Left Sidebar Menu + Right Content Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 items-start">
        
        {/* Left Nav Menu */}
        <div className="col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-3 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Thiết lập</div>
          
          <button 
            onClick={() => setActiveTab('init')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'init' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Settings className="w-4 h-4" /> Khởi tạo
          </button>

          <button 
            onClick={() => setActiveTab('attendance')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'attendance' ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Clock className="w-4 h-4" /> Chấm công
          </button>

          <button 
            onClick={() => setActiveTab('payroll')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'payroll' ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <DollarSign className="w-4 h-4" /> Tính lương
          </button>

          <button 
            onClick={() => setActiveTab('holidays')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'holidays' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Calendar className="w-4 h-4" /> Ngày làm & Nghỉ
          </button>

          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 pt-4 pb-2">Tiện ích</div>

          <button 
            onClick={() => setActiveTab('zalo')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'zalo' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Smartphone className="w-4 h-4 text-blue-500" /> Zalo mini app
          </button>

          <button 
            onClick={() => setActiveTab('machine')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'machine' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <RadioIcon className="w-4 h-4 text-slate-500" /> Máy chấm công
          </button>
        </div>

        {/* Right Content Panel */}
        <div className="col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* TAB 1: CHẤM CÔNG */}
          {activeTab === 'attendance' && (
            <div className="divide-y divide-slate-100">
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg text-slate-800">Thiết lập chấm công</h2>
                  <p className="text-xs text-slate-500">Cấu hình quy tắc ca làm việc và ghi nhận giờ công cho cửa hàng</p>
                </div>
              </div>

              {/* Shift link */}
              <div className="p-6 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="font-semibold text-slate-800 text-base">Thiết lập ca làm việc</div>
                  <div className="text-sm text-slate-500">Quản lý các ca làm việc của cửa hàng</div>
                </div>
                <Link to="/employees/schedule" className="flex items-center gap-1 text-blue-600 font-semibold text-sm hover:underline">
                  16 ca làm việc <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Standard work hours */}
              <div className="p-6 space-y-4">
                <div>
                  <div className="font-semibold text-slate-800 text-base">Số giờ của ngày công chuẩn</div>
                  <div className="text-sm text-slate-500">Thiết lập số giờ tính 1 công hay 0,5 công của loại lương Theo ngày công chuẩn</div>
                </div>
                
                <div className="flex items-center gap-3 pl-4">
                  <span className="text-sm text-slate-700 font-medium">Số giờ của 1 ngày công chuẩn là</span>
                  <input 
                    type="number" 
                    value={standardHours} 
                    onChange={(e) => setStandardHours(Number(e.target.value))}
                    className="w-20 px-3 py-1.5 border border-slate-300 rounded text-center font-bold text-slate-800 focus:outline-none focus:border-blue-500" 
                  />
                  <span className="text-sm text-slate-700">giờ</span>
                  <Info className="w-4 h-4 text-slate-400" />
                </div>

                <div className="pl-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={halfDayEnabled} 
                      onChange={(e) => setHalfDayEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 font-medium">Tính nửa công khi thời gian làm việc</span>
                    <Info className="w-4 h-4 text-slate-400" />
                  </label>

                  {halfDayEnabled && (
                    <div className="flex items-center gap-2 pl-6 text-sm">
                      <span>Từ</span>
                      <input type="text" value={halfDayFrom} onChange={(e) => setHalfDayFrom(e.target.value)} className="w-20 px-2 py-1 border border-slate-300 rounded text-center" />
                      <span>Đến</span>
                      <input type="text" value={halfDayTo} onChange={(e) => setHalfDayTo(e.target.value)} className="w-24 px-2 py-1 border border-slate-300 rounded text-center" />
                    </div>
                  )}
                </div>
              </div>

              {/* Late / Early check */}
              <div className="p-6 space-y-4">
                <div>
                  <div className="font-semibold text-slate-800 text-base">Cài đặt đi muộn - về sớm</div>
                  <div className="text-sm text-slate-500">Cài đặt thời gian tối đa được đi muộn hoặc về sớm</div>
                </div>
                
                <div className="pl-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer w-44">
                      <input type="checkbox" checked={lateCheckEnabled} onChange={(e) => setLateCheckEnabled(e.target.checked)} className="rounded text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">Tính đi muộn sau</span>
                    </label>
                    <input type="number" value={lateMinutes} onChange={(e) => setLateMinutes(Number(e.target.value))} className="w-20 px-3 py-1 border border-slate-300 rounded text-center" />
                    <span className="text-sm text-slate-600">phút</span>
                    <Info className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer w-44">
                      <input type="checkbox" checked={earlyCheckEnabled} onChange={(e) => setEarlyCheckEnabled(e.target.checked)} className="rounded text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">Tính về sớm trước</span>
                    </label>
                    <input type="number" value={earlyMinutes} onChange={(e) => setEarlyMinutes(Number(e.target.value))} className="w-20 px-3 py-1 border border-slate-300 rounded text-center" />
                    <span className="text-sm text-slate-600">phút</span>
                    <Info className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Overtime (OT) */}
              <div className="p-6 space-y-4">
                <div>
                  <div className="font-semibold text-slate-800 text-base">Cài đặt làm thêm giờ</div>
                  <div className="text-sm text-slate-500">Tính làm thêm giờ cho nhân viên khi vào ca sớm hoặc tan ca muộn</div>
                </div>
                
                <div className="pl-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer w-44">
                      <input type="checkbox" checked={otBeforeEnabled} onChange={(e) => setOtBeforeEnabled(e.target.checked)} className="rounded text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">Tính làm thêm giờ trước ca</span>
                    </label>
                    <input type="number" value={otBeforeMinutes} onChange={(e) => setOtBeforeMinutes(Number(e.target.value))} className="w-20 px-3 py-1 border border-slate-300 rounded text-center" />
                    <span className="text-sm text-slate-600">phút</span>
                    <Info className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer w-44">
                      <input type="checkbox" checked={otAfterEnabled} onChange={(e) => setOtAfterEnabled(e.target.checked)} className="rounded text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">Tính làm thêm giờ sau ca</span>
                    </label>
                    <input type="number" value={otAfterMinutes} onChange={(e) => setOtAfterMinutes(Number(e.target.value))} className="w-20 px-3 py-1 border border-slate-300 rounded text-center" />
                    <span className="text-sm text-slate-600">phút</span>
                    <Info className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Multi-shift Toggle */}
              <div className="p-6 flex items-center justify-between">
                <div className="max-w-xl">
                  <div className="font-semibold text-slate-800 text-base">Cho phép chấm 1 lượt Vào - Ra khi làm nhiều ca liên tục</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Ví dụ: Ca 1 (7:00 - 12:00), Ca 2 (13:00 - 18:00). Bạn chỉ cần chấm công Vào ca 1, chấm công Ra ca 2, hệ thống sẽ tự động ghi nhận Ra ca 1 lúc 12:00, Vào ca 2 lúc 13:00
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={multiShiftToggle} onChange={(e) => setMultiShiftToggle(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Auto Attendance Toggle */}
              <div className="p-6 flex items-center justify-between">
                <div className="max-w-xl">
                  <div className="font-semibold text-slate-800 text-base">Tự động chấm công</div>
                  <div className="text-xs text-slate-500 mt-1">Nhân viên không phải chủ động chấm công. Hệ thống sẽ tự động chấm công thay nhân viên</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={autoAttendanceToggle} onChange={(e) => setAutoAttendanceToggle(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* No Schedule Attendance Toggle */}
              <div className="p-6 flex items-center justify-between">
                <div className="max-w-xl">
                  <div className="font-semibold text-slate-800 text-base">Chấm công không cần xếp lịch</div>
                  <div className="text-xs text-slate-500 mt-1">Ngoài các ca làm việc đã được xếp lịch, nhân viên được phép chấm công vào ca làm việc chưa được xếp lịch.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={noScheduleAttendanceToggle} onChange={(e) => setNoScheduleAttendanceToggle(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

            </div>
          )}

          {/* TAB 2: TÍNH LƯƠNG */}
          {activeTab === 'payroll' && (
            <div className="divide-y divide-slate-100">
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg text-slate-800">Thiết lập tính lương</h2>
                  <p className="text-xs text-slate-500">Cấu hình chu kỳ trả lương, các khoản phụ cấp cố định, giảm trừ và hoa hồng</p>
                </div>
              </div>

              {/* Pay day */}
              <div className="p-6 space-y-3">
                <div className="font-semibold text-slate-800 text-base">Ngày tính lương</div>
                <div className="text-sm text-slate-500">Ngày bắt đầu tính công cho nhân viên có kỳ lương hàng tháng</div>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-sm text-slate-700">Chọn ngày bắt đầu kỳ lương hàng tháng</span>
                  <select 
                    value={payDay} 
                    onChange={(e) => setPayDay(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    {[...Array(31)].map((_, i) => (
                      <option key={i} value={`Ngày ${i+1}`}>Ngày {i+1}</option>
                    ))}
                  </select>
                  <Info className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Chính sách lương theo ca (đơn giá/giờ) */}
              <div className="p-6 space-y-4 bg-slate-50/50">
                <div>
                  <div className="font-semibold text-slate-800 text-base">Chính sách lương theo ca (đơn giá / giờ làm việc)</div>
                  <div className="text-sm text-slate-500">Lương chính = số giờ thực tế đã chấm công vào/ra × đơn giá dưới đây, tách riêng theo nhân viên mới và nhân viên chính thức</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-amber-200">
                    <div className="font-bold text-amber-700 text-sm mb-3">Nhân viên mới (dưới {regularTenureMonths} tháng)</div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-600">Ca sáng/chiều/tối</span>
                        <div className="flex items-center gap-1.5">
                          <input type="number" value={newHireRates.day} onChange={(e) => setNewHireRates(r => ({ ...r, day: Number(e.target.value) }))} className="w-24 px-2 py-1.5 border border-slate-300 rounded text-right font-semibold text-slate-800 focus:outline-none focus:border-blue-500" />
                          <span className="text-xs text-slate-500">đ/giờ</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-600">Ca đêm</span>
                        <div className="flex items-center gap-1.5">
                          <input type="number" value={newHireRates.night} onChange={(e) => setNewHireRates(r => ({ ...r, night: Number(e.target.value) }))} className="w-24 px-2 py-1.5 border border-slate-300 rounded text-right font-semibold text-slate-800 focus:outline-none focus:border-blue-500" />
                          <span className="text-xs text-slate-500">đ/giờ</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-emerald-200">
                    <div className="font-bold text-emerald-700 text-sm mb-3">Nhân viên chính thức (từ {regularTenureMonths} tháng)</div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-600">Ca sáng/chiều/tối</span>
                        <div className="flex items-center gap-1.5">
                          <input type="number" value={regularRates.day} onChange={(e) => setRegularRates(r => ({ ...r, day: Number(e.target.value) }))} className="w-24 px-2 py-1.5 border border-slate-300 rounded text-right font-semibold text-slate-800 focus:outline-none focus:border-blue-500" />
                          <span className="text-xs text-slate-500">đ/giờ</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-600">Ca đêm</span>
                        <div className="flex items-center gap-1.5">
                          <input type="number" value={regularRates.night} onChange={(e) => setRegularRates(r => ({ ...r, night: Number(e.target.value) }))} className="w-24 px-2 py-1.5 border border-slate-300 rounded text-right font-semibold text-slate-800 focus:outline-none focus:border-blue-500" />
                          <span className="text-xs text-slate-500">đ/giờ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-1">
                  <span className="text-sm text-slate-700">Số tháng làm việc để tính "chính thức"</span>
                  <input type="number" min="0" value={regularTenureMonths} onChange={(e) => setRegularTenureMonths(Number(e.target.value))} className="w-20 px-3 py-1.5 border border-slate-300 rounded text-center font-bold text-slate-800 focus:outline-none focus:border-blue-500" />
                  <span className="text-sm text-slate-700">tháng, tính từ ngày vào làm</span>
                </div>

                <div className="flex items-center gap-3 pl-1 pt-2 border-t border-slate-200">
                  <span className="text-sm text-slate-700 font-medium">Hỗ trợ thêm mỗi ca đêm hoàn thành</span>
                  <input type="number" value={nightShiftAllowanceAmount} onChange={(e) => setNightShiftAllowanceAmount(Number(e.target.value))} className="w-28 px-3 py-1.5 border border-slate-300 rounded text-center font-bold text-purple-700 focus:outline-none focus:border-blue-500" />
                  <span className="text-sm text-slate-700">đ/ca (cộng thêm ngoài đơn giá/giờ ở trên)</span>
                </div>
              </div>

              {/* Auto payroll toggles */}
              <div className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 text-base">Tự động tạo bảng tính lương</div>
                  <div className="text-xs text-slate-500 mt-1">Bảng tính lương sẽ được tự động tạo mới vào mỗi kỳ lương</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={autoCreatePayroll} onChange={(e) => setAutoCreatePayroll(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 text-base">Tự động cập nhật bảng tính lương</div>
                  <div className="text-xs text-slate-500 mt-1">Bảng tính lương sẽ được tự động cập nhật mỗi ngày</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={autoUpdatePayroll} onChange={(e) => setAutoUpdatePayroll(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Salary template link */}
              <div className="p-6 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="font-semibold text-slate-800 text-base">Thiết lập Mẫu lương</div>
                  <div className="text-sm text-slate-500">Thưởng, Hoa hồng, Phụ cấp, Giảm trừ</div>
                </div>
                <Link to="/employees/payroll" className="flex items-center gap-1 text-slate-700 font-semibold text-sm hover:text-blue-600">
                  0 mẫu lương <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Allowances list */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-slate-800 text-base">Danh mục phụ cấp</div>
                    <div className="text-sm text-slate-500">Danh sách phụ cấp khoản tiền hỗ trợ nhân viên như ăn trưa, đi lại, điện thoại,...</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsAllowanceModalOpen(true)}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 font-medium gap-1"
                  >
                    Thêm phụ cấp
                  </Button>
                </div>

                {allowances.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {allowances.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                        <div>
                          <div className="font-semibold text-slate-800">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.type === 'monthly' ? 'Theo tháng' : 'Theo ngày công'}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-600">+{formatCurrency(item.amount)}</span>
                          <button 
                            onClick={() => setAllowances(prev => prev.filter(x => x.id !== item.id))}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deductions list */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-slate-800 text-base">Danh mục giảm trừ</div>
                    <div className="text-sm text-slate-500">Thiết lập khoản giảm trừ như đi muộn, về sớm, vi phạm nội quy,...</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsDeductionModalOpen(true)}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 font-medium gap-1"
                  >
                    Thêm giảm trừ
                  </Button>
                </div>

                {deductions.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {deductions.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                        <div>
                          <div className="font-semibold text-slate-800">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.reason}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-red-600">-{formatCurrency(item.amount)}</span>
                          <button 
                            onClick={() => setDeductions(prev => prev.filter(x => x.id !== item.id))}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tax Toggle */}
              <div className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 text-base">Thuế TNCN cho nhân viên</div>
                  <div className="text-xs text-slate-500 mt-1">Thiết lập quy định tính thuế TNCN cho nhân viên</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={taxEnabled} onChange={(e) => setTaxEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Social Insurance Toggle */}
              <div className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 text-base">Bảo hiểm xã hội nhân viên</div>
                  <div className="text-xs text-slate-500 mt-1">Thiết lập quy định đóng bảo hiểm xã hội</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={insuranceEnabled} onChange={(e) => setInsuranceEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Commission and Bonus */}
              <div className="p-6 space-y-4 bg-slate-50/50">
                <div className="font-semibold text-slate-800 text-base">Thiết lập hoa hồng và thưởng</div>
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-3">Cách ghi nhận doanh thu để tính hoa hồng và thưởng</div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input 
                        type="radio" 
                        name="commissionType" 
                        checked={commissionType === 'after_discount'} 
                        onChange={() => setCommissionType('after_discount')}
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      Doanh thu sau giảm
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input 
                        type="radio" 
                        name="commissionType" 
                        checked={commissionType === 'actual_collected'} 
                        onChange={() => setCommissionType('actual_collected')}
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      Thực thu
                    </label>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: NGÀY LỄ (áp dụng chung toàn hệ thống, không tách theo chi nhánh) */}
          {activeTab === 'holidays' && (
            <div className="divide-y divide-slate-100">
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg text-slate-800">Ngày lễ trong năm</h2>
                  <p className="text-xs text-slate-500">Áp dụng chung cho tất cả chi nhánh — ca làm việc rơi vào đúng ngày lễ sẽ được nhân hệ số lương</p>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="font-semibold text-slate-800 text-base">Hệ số lương ngày lễ</div>
                <div className="flex items-center gap-3 pl-1">
                  <span className="text-sm text-slate-700">Đi làm vào ngày lễ được tính</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={holidayMultiplier * 100}
                    onChange={(e) => setHolidayMultiplier(Math.max(1, Number(e.target.value)) / 100)}
                    className="w-24 px-3 py-1.5 border border-slate-300 rounded text-center font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-sm text-slate-700">% lương của ca đó (mặc định 200%)</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-slate-800 text-base">Danh sách ngày lễ</div>
                    <div className="text-sm text-slate-500">Thêm từng ngày lễ cụ thể trong năm — ca làm đúng ngày này sẽ tự động nhân hệ số ở trên khi tính lương</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsHolidayModalOpen(true)}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 font-medium gap-1 shrink-0"
                  >
                    Thêm ngày lễ
                  </Button>
                </div>

                {holidays.length === 0 ? (
                  <div className="text-sm text-slate-400 italic p-4 border border-dashed border-slate-200 rounded-xl text-center">Chưa có ngày lễ nào được thiết lập.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {holidays.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                        <div>
                          <div className="font-semibold text-slate-800">{item.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{item.date}</div>
                        </div>
                        <button
                          onClick={() => setHolidays(prev => prev.filter(x => x.id !== item.id))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OTHER TABS PLACEHOLDERS */}
          {activeTab !== 'attendance' && activeTab !== 'payroll' && activeTab !== 'holidays' && (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
              <AlertCircle className="w-12 h-12 opacity-30" />
              <h3 className="font-bold text-lg text-slate-600">Tính năng đang phát triển</h3>
              <p className="text-sm max-w-md">Mô-đun thiết lập <b>{activeTab === 'init' ? 'Khởi tạo' : activeTab === 'zalo' ? 'Zalo Mini App' : 'Máy chấm công'}</b> sẽ sớm được hoàn thiện trong các bản cập nhật tiếp theo để đồng bộ toàn bộ hệ sinh thái KiotViet.</p>
            </div>
          )}

        </div>
      </div>

      {/* Modal Add Allowance */}
      {isAllowanceModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-96 max-w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 font-bold text-lg text-slate-800">
              Thêm phụ cấp
              <button onClick={() => setIsAllowanceModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Tên phụ cấp</label>
                <input 
                  type="text" 
                  placeholder="VD: Phụ cấp trang phục, điện thoại..."
                  value={newAllowance.name}
                  onChange={(e) => setNewAllowance({...newAllowance, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Số tiền phụ cấp (VNĐ)</label>
                <input 
                  type="number" 
                  value={newAllowance.amount}
                  onChange={(e) => setNewAllowance({...newAllowance, amount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Loại phụ cấp</label>
                <select 
                  value={newAllowance.type}
                  onChange={(e: any) => setNewAllowance({...newAllowance, type: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="monthly">Cố định theo tháng</option>
                  <option value="daily">Theo ngày công thực tế</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <Button variant="outline" onClick={() => setIsAllowanceModalOpen(false)} className="bg-white">Hủy</Button>
              <Button 
                onClick={() => {
                  if (newAllowance.name && newAllowance.amount) {
                    setAllowances([...allowances, { id: Date.now().toString(), ...newAllowance }]);
                    setNewAllowance({ name: "", amount: 500000, type: 'monthly' });
                    setIsAllowanceModalOpen(false);
                  }
                }}
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={!newAllowance.name}
              >
                Thêm phụ cấp
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Deduction */}
      {isDeductionModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-96 max-w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 font-bold text-lg text-slate-800">
              Thêm giảm trừ
              <button onClick={() => setIsDeductionModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Tên khoản giảm trừ</label>
                <input 
                  type="text" 
                  placeholder="VD: Đi muộn quá 30 phút..."
                  value={newDeduction.name}
                  onChange={(e) => setNewDeduction({...newDeduction, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Số tiền trừ (VNĐ)</label>
                <input 
                  type="number" 
                  value={newDeduction.amount}
                  onChange={(e) => setNewDeduction({...newDeduction, amount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500 font-semibold text-red-600"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Lý do vi phạm</label>
                <input 
                  type="text" 
                  placeholder="VD: Vi phạm nội quy công ty..."
                  value={newDeduction.reason}
                  onChange={(e) => setNewDeduction({...newDeduction, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <Button variant="outline" onClick={() => setIsDeductionModalOpen(false)} className="bg-white">Hủy</Button>
              <Button 
                onClick={() => {
                  if (newDeduction.name && newDeduction.amount) {
                    setDeductions([...deductions, { id: Date.now().toString(), ...newDeduction }]);
                    setNewDeduction({ name: "", amount: 50000, reason: "" });
                    setIsDeductionModalOpen(false);
                  }
                }}
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={!newDeduction.name}
              >
                Thêm giảm trừ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Holiday */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-96 max-w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 font-bold text-lg text-slate-800">
              Thêm ngày lễ
              <button onClick={() => setIsHolidayModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Ngày</label>
                <input
                  type="date"
                  value={newHoliday.date ? newHoliday.date.split("/").reverse().join("-") : ""}
                  onChange={(e) => {
                    const iso = e.target.value; // YYYY-MM-DD
                    const display = iso ? iso.split("-").reverse().join("/") : ""; // DD/MM/YYYY
                    setNewHoliday({ ...newHoliday, date: display });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Tên ngày lễ</label>
                <input
                  type="text"
                  placeholder="VD: Quốc khánh, Tết Dương lịch..."
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <Button variant="outline" onClick={() => setIsHolidayModalOpen(false)} className="bg-white">Hủy</Button>
              <Button
                onClick={() => {
                  if (newHoliday.date && newHoliday.name) {
                    setHolidays(prev => [...prev, { id: Date.now().toString(), ...newHoliday }]);
                    setNewHoliday({ date: "", name: "" });
                    setIsHolidayModalOpen(false);
                  }
                }}
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={!newHoliday.date || !newHoliday.name}
              >
                Thêm ngày lễ
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
