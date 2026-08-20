import { useState } from "react";
import { X, Moon, Building2, Clock, Wallet } from "lucide-react";
import { Button } from "@2mart/ui";
import { type PayrollSheetItem } from "../utils/payrollService";

interface PayslipSheetInfo {
  id: string;
  code: string;
  name: string;
  periodRange: string;
  branch: string;
}

interface PayslipDetailModalProps {
  item: PayrollSheetItem;
  sheet: PayslipSheetInfo;
  isEditable: boolean;
  onClose: () => void;
  onSave?: (updates: { advanceAmount: number; deductions: number }) => void;
}

export function PayslipDetailModal({ item, sheet, isEditable, onClose, onSave }: PayslipDetailModalProps) {
  const [advanceAmount, setAdvanceAmount] = useState(item.advanceAmount || 0);
  const [deductions, setDeductions] = useState(item.deductions || 0);
  const [isSending, setIsSending] = useState(false);

  const formatCurrency = (val: number | undefined) => (val || 0).toLocaleString("vi-VN");

  const remaining = Math.max(0, item.netSalary - item.paidAmount - advanceAmount);

  const handleSave = () => {
    onSave?.({ advanceAmount, deductions });
    onClose();
  };

  const handleSendNotification = async () => {
    try {
      setIsSending(true);
      const res = await fetch(`/api/payrolls/${sheet.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: item.employeeId })
      });
      if (res.ok) {
        alert("Gửi phiếu lương qua Telegram thành công!");
      } else {
        alert("Gửi thất bại, vui lòng thử lại.");
      }
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi gửi.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" /> Phiếu lương
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {sheet.name} ({sheet.periodRange}) — {sheet.code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
          {/* Employee identity */}
          <div className="flex items-center justify-between bg-blue-50/60 border border-blue-200 rounded-xl px-4 py-3">
            <div>
              <div className="font-bold text-blue-900 text-base">{item.employeeName}</div>
              <div className="text-xs text-blue-700 font-mono mt-0.5">{item.employeeCode}</div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>Chi nhánh trả lương</div>
              <div className="font-semibold text-slate-700">{sheet.branch}</div>
            </div>
          </div>

          {/* Branch breakdown */}
          <div>
            <div className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-500" /> Số ca làm việc theo từng cơ sở
            </div>
            {item.branchBreakdown && item.branchBreakdown.length > 0 ? (
              <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="p-2.5 text-left">Chi nhánh</th>
                    <th className="p-2.5 text-center">Số ca</th>
                    <th className="p-2.5 text-center">Ca đêm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {item.branchBreakdown.map((b) => (
                    <tr key={b.branch}>
                      <td className="p-2.5 font-semibold text-slate-700">{b.branch}</td>
                      <td className="p-2.5 text-center font-mono">{b.shifts}</td>
                      <td className="p-2.5 text-center font-mono text-purple-700">{b.nightShifts || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-xs text-slate-400 italic p-3 border border-dashed border-slate-200 rounded-xl">Chưa có dữ liệu chấm công theo chi nhánh — hãy đồng bộ lại từ chấm công.</div>
            )}
          </div>

          {/* Hours / night shifts summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <div className="text-xs text-slate-500">Tổng số giờ làm</div>
                <div className="font-bold text-slate-800">{item.totalHours ?? 0} giờ</div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-center gap-3">
              <Moon className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <div className="text-xs text-purple-700">Tổng số ca đêm</div>
                <div className="font-bold text-purple-900">{item.nightShiftsCount || 0} ca</div>
              </div>
            </div>
          </div>

          {/* Income breakdown */}
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-sm">
            <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Lương chính</span><span className="font-mono font-semibold">{formatCurrency(item.basicSalary)} đ</span></div>
            <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Làm thêm (OT)</span><span className="font-mono font-semibold">{formatCurrency(item.overtimeSalary)} đ</span></div>
            <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Hỗ trợ ca đêm</span><span className="font-mono font-semibold text-purple-700">{formatCurrency(item.nightShiftAllowance)} đ</span></div>
            <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Phụ cấp khác</span><span className="font-mono font-semibold">{formatCurrency(item.allowances)} đ</span></div>
            <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Thưởng</span><span className="font-mono font-semibold">{formatCurrency(item.bonuses)} đ</span></div>
            <div className="flex justify-between px-4 py-2.5 bg-slate-50 font-bold"><span className="text-slate-800">Tổng thu nhập</span><span className="font-mono">{formatCurrency(item.totalIncome)} đ</span></div>
          </div>

          {/* Advance & deductions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số tiền đã ứng</label>
              {isEditable ? (
                <input
                  type="number"
                  step="50000"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full border border-amber-300 rounded-lg p-2 text-sm font-mono font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              ) : (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 font-mono font-bold text-amber-700 text-sm">{formatCurrency(advanceAmount)} đ</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giảm trừ</label>
              {isEditable ? (
                <input
                  type="number"
                  step="1"
                  value={deductions}
                  onChange={(e) => setDeductions(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full border border-red-300 rounded-lg p-2 text-sm font-mono font-bold text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              ) : (
                <div className="p-2 rounded-lg bg-red-50 border border-red-200 font-mono font-bold text-red-600 text-sm">{formatCurrency(deductions)} đ</div>
              )}
            </div>
          </div>

          {/* Final totals */}
          <div className="border border-blue-200 bg-blue-50/60 rounded-xl divide-y divide-blue-100 text-sm">
            <div className="flex justify-between px-4 py-2.5 font-bold"><span className="text-blue-900">Lương thực nhận</span><span className="font-mono text-blue-800">{formatCurrency(item.netSalary)} đ</span></div>
            <div className="flex justify-between px-4 py-2.5"><span className="text-slate-600">Đã trả</span><span className="font-mono text-emerald-700 font-semibold">{formatCurrency(item.paidAmount)} đ</span></div>
            <div className="flex justify-between px-4 py-2.5"><span className="text-slate-600">Đã ứng</span><span className="font-mono text-amber-700 font-semibold">{formatCurrency(advanceAmount)} đ</span></div>
            <div className="flex justify-between px-4 py-2.5 font-black text-base"><span className="text-red-700">Còn lại phải trả</span><span className="font-mono text-red-700">{formatCurrency(remaining)} đ</span></div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <Button 
            variant="outline" 
            onClick={handleSendNotification} 
            disabled={isSending}
            className="px-5 font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 shadow-sm"
          >
            {isSending ? "Đang gửi..." : "Gửi phiếu lương (Telegram)"}
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} className="px-5 font-medium bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
              Đóng
            </Button>
            {isEditable && (
              <Button onClick={handleSave} className="px-6 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
                Lưu
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
