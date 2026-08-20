import { useState, useMemo, useEffect } from "react";
import {
  Banknote, Clock, CheckCircle2, XCircle, AlertCircle,
  Plus, X, ChevronDown, ChevronUp, RefreshCw, Edit2, Trash2
} from "lucide-react";
import { useSession } from "../hooks/useSession";
import { useEmployees } from "../hooks/useEmployees";
import {
  getSalaryAdvances, addSalaryAdvance, approveSalaryAdvance, rejectSalaryAdvance,
  getPayrollSheets, savePayrollSheets, fetchSalaryAdvancesFromServer,
  updateSalaryAdvance, removeSalaryAdvance,
  type SalaryAdvanceRequest
} from "../utils/payrollService";

const fmtCurrency = (n: number) =>
  Math.round(n).toLocaleString("vi-VN") + " đ";

function genId(): string {
  return "ADV-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function calcEarnedSalary(empCode: string): { earned: number; sheetId: string | null; month: number; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const sheets = getPayrollSheets();
  const sheet = sheets.find(s =>
    (s.status === "Đang tạo" || s.status === "Tạm tính") &&
    s.name.includes(`${month}/${year}`)
  );
  if (!sheet) return { earned: 0, sheetId: null, month, year };
  const item = sheet.items.find(i => i.employeeCode === empCode);
  return { earned: item?.totalIncome ?? 0, sheetId: sheet.id, month, year };
}

const STATUS_CFG = {
  pending:  { bg: "bg-amber-50 border-amber-200",   text: "text-amber-700",   label: "Chờ duyệt" },
  approved: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Đã duyệt" },
  rejected: { bg: "bg-red-50 border-red-200",        text: "text-red-700",     label: "Từ chối" },
} as const;

// ========== REQUEST MODAL ==========
function RequestAdvanceModal({ empCode, empName, branch, initialData, onClose, onSubmit }: {
  empCode: string; empName: string; branch: string;
  initialData?: SalaryAdvanceRequest;
  onClose: () => void; onSubmit: (req: SalaryAdvanceRequest) => void;
}) {
  const { earned, sheetId, month, year } = useMemo(() => calcEarnedSalary(empCode), [empCode]);
  const maxAllowed = Math.floor(earned * 0.5);
  const [amount, setAmount] = useState<number>(initialData?.amount || 0);
  const [note, setNote] = useState(initialData?.note || "");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (amount <= 0) { setErr("Vui lòng nhập số tiền ứng."); return; }
    if (amount > maxAllowed) { setErr(`Vượt quá mức tối đa ${fmtCurrency(maxAllowed)}.`); return; }
    if (!sheetId && !initialData) { setErr("Chưa có bảng lương tháng này. Liên hệ quản lý."); return; }
    setErr(""); setSubmitting(true);
    
    const req: SalaryAdvanceRequest = initialData ? {
      ...initialData,
      amount,
      note: note.trim() || undefined,
      requestDate: new Date().toISOString(), // Update date when edited
    } : {
      id: genId(), employeeCode: empCode, employeeName: empName, branch,
      month, year, requestDate: new Date().toISOString(),
      amount, earnedSalary: earned, maxAllowed,
      note: note.trim() || undefined, status: "pending",
    };

    if (initialData) {
      updateSalaryAdvance(req);
    } else {
      addSalaryAdvance(req);
    }
    
    try { await fetch("/api/salary-advances/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req) }); }
    catch (e) { console.warn("Telegram offline", e); }
    setSubmitting(false); onSubmit(req);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Banknote className="w-6 h-6 text-blue-200" />
            <div><h3 className="font-black text-lg">Đề xuất Ứng Lương</h3><p className="text-xs text-blue-100">Tháng {month}/{year}</p></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-blue-700 hover:bg-blue-800 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Nhân viên:</span><strong>{empName}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">Chi nhánh:</span><span>{branch}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500">Lương đã làm được:</span>
              <strong className="text-blue-700">{fmtCurrency(earned)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ứng tối đa (50%):</span>
              <strong className="text-emerald-600 text-base">{fmtCurrency(maxAllowed)}</strong>
            </div>
          </div>
          {earned === 0 && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              Chưa có dữ liệu chấm công tháng này. Liên hệ quản lý để kiểm tra.
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Số tiền muốn ứng <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type="number" min={0} max={maxAllowed} step={50000} value={amount || ""} onChange={e => setAmount(Math.max(0, Number(e.target.value) || 0))}
                placeholder="Nhập số tiền..."
                className="w-full border-2 border-slate-300 rounded-xl p-3 text-right text-lg font-bold focus:outline-none focus:border-blue-500 pr-10" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">đ</span>
            </div>
            {amount > 0 && amount <= maxAllowed && <p className="text-xs text-emerald-600 mt-1">✅ Hợp lệ</p>}
            {amount > maxAllowed && maxAllowed > 0 && <p className="text-xs text-red-500 mt-1">❌ Vượt mức tối đa {fmtCurrency(maxAllowed)}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Ghi chú</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Lý do ứng lương..."
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          {err && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{err}</div>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Hủy</button>
            <button onClick={handleSubmit} disabled={submitting || amount <= 0 || amount > maxAllowed || earned === 0}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2">
              {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" />Đang gửi...</> : <><Banknote className="w-4 h-4" />Gửi đề xuất</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== APPROVE MODAL ==========
function ApproveModal({ req, onConfirm, onCancel }: { req: SalaryAdvanceRequest; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden">
        <div className="bg-emerald-600 p-5 text-white text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-200" />
          <h3 className="font-black text-lg">Xác nhận duyệt ứng lương</h3>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="bg-slate-50 rounded-xl p-4 border space-y-2">
            <div className="flex justify-between"><span className="text-slate-500">Nhân viên:</span><strong>{req.employeeName}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">Tháng:</span><span>{req.month}/{req.year}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Số tiền:</span><strong className="text-blue-700 text-base">{fmtCurrency(req.amount)}</strong></div>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            Sau khi duyệt: Số tiền sẽ tự động vào cột <strong>Ứng lương</strong> trong bảng lương và tạo <strong>phiếu chi</strong> trong Sổ quỹ.
          </p>
          <div className="flex gap-3 pt-1">
            <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Hủy</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">✅ Duyệt</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== REJECT MODAL ==========
function RejectModal({ req, onConfirm, onCancel }: { req: SalaryAdvanceRequest; onConfirm: (r: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden">
        <div className="bg-red-600 p-5 text-white text-center">
          <XCircle className="w-10 h-10 mx-auto mb-2 text-red-200" />
          <h3 className="font-black text-lg">Từ chối đề xuất ứng lương</h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">Lý do từ chối (hiển thị cho nhân viên):</p>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Vd: Quỹ không đủ, lương chưa đủ điều kiện..."
            className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500 resize-none" />
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 text-sm">Hủy</button>
            <button onClick={() => onConfirm(reason.trim() || "Admin từ chối")} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm">❌ Từ chối</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== MAIN PAGE ==========
export function SalaryAdvancePage() {
  const { session } = useSession();
  const { employees } = useEmployees();
  const isAdmin = session?.accessLevel === "admin" || session?.accessLevel === "manager";

  const [advances, setAdvances] = useState<SalaryAdvanceRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingReq, setEditingReq] = useState<SalaryAdvanceRequest | null>(null);
  const [approvingReq, setApprovingReq] = useState<SalaryAdvanceRequest | null>(null);
  const [rejectingReq, setRejectingReq] = useState<SalaryAdvanceRequest | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [successMsg, setSuccessMsg] = useState("");

  const reload = () => setAdvances(getSalaryAdvances());
  useEffect(() => {
    reload();
    fetchSalaryAdvancesFromServer();
    const h = () => reload();
    window.addEventListener("kiot_advances_change", h);
    return () => window.removeEventListener("kiot_advances_change", h);
  }, []);

  const filteredAdvances = useMemo(() => {
    let list = advances;
    if (!isAdmin) list = list.filter(a => a.employeeCode === session?.code);
    if (filterStatus !== "all") list = list.filter(a => a.status === filterStatus);
    return list;
  }, [advances, filterStatus, isAdmin, session]);

  const stats = useMemo(() => ({
    pending: advances.filter(a => a.status === "pending").length,
    approved: advances.filter(a => a.status === "approved").length,
    totalApprovedAmount: advances.filter(a => a.status === "approved").reduce((s, a) => s + a.amount, 0),
  }), [advances]);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 5000); };

  const handleApprove = (req: SalaryAdvanceRequest) => {
    if (!session) return;
    approveSalaryAdvance(req.id, session.name);
    // Cập nhật bảng lương
    const sheets = getPayrollSheets();
    const si = sheets.findIndex(s => (s.status === "Đang tạo" || s.status === "Tạm tính") && s.name.includes(`${req.month}/${req.year}`));
    if (si !== -1) {
      const sheet = sheets[si];
      const ii = sheet.items.findIndex(i => i.employeeCode === req.employeeCode);
      if (ii !== -1) {
        const oldItem = sheet.items[ii];
        const newAdv = (oldItem.advanceAmount || 0) + req.amount;
        sheet.items[ii] = { ...oldItem, advanceAmount: newAdv, netSalary: Math.max(0, oldItem.totalIncome - (oldItem.deductions || 0) - newAdv) };
        const totalAdv = sheet.items.reduce((s, i) => s + (i.advanceAmount || 0), 0);
        sheet.totalPaid = sheet.items.reduce((s, i) => s + (i.paidAmount || 0), 0) + totalAdv;
        sheet.totalRemaining = Math.max(0, sheet.items.reduce((s, i) => s + i.netSalary, 0) - sheet.items.reduce((s, i) => s + (i.paidAmount || 0), 0));
        sheet.updatedAt = new Date().toLocaleString("vi-VN");
        sheets[si] = sheet;
        savePayrollSheets(sheets);
      }
    }
    // Tạo phiếu chi sổ quỹ
    const cashbookKey = "kiot_cashbook_payments_v1";
    const existing = JSON.parse(localStorage.getItem(cashbookKey) || "[]");
    existing.unshift({
      id: "PC-" + Date.now().toString(36).toUpperCase(),
      type: "payment",
      date: new Date().toLocaleString("vi-VN"),
      amount: req.amount,
      description: `${req.employeeName} Ứng Lương Tháng ${req.month}/${req.year}`,
      category: "Ứng lương nhân viên",
      approvedBy: session.name,
      employeeCode: req.employeeCode,
      advanceRequestId: req.id,
    });
    localStorage.setItem(cashbookKey, JSON.stringify(existing));
    window.dispatchEvent(new Event("kiot_cashbook_change"));
    reload(); setApprovingReq(null);
    showSuccess(`✅ Đã duyệt & tạo phiếu chi ${fmtCurrency(req.amount)} cho ${req.employeeName}.`);
  };

  const handleReject = (req: SalaryAdvanceRequest, reason: string) => {
    rejectSalaryAdvance(req.id, reason);
    reload(); setRejectingReq(null);
    showSuccess(`❌ Đã từ chối đề xuất của ${req.employeeName}.`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Banknote className="w-7 h-7 text-blue-600" /> Ứng Lương
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin ? "Quản lý đề xuất ứng lương của nhân viên" : "Gửi đề xuất ứng lương tháng hiện tại"}
          </p>
        </div>
        {!isAdmin && (
          <button onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all">
            <Plus className="w-5 h-5" /> Đề xuất Ứng Lương
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 font-medium text-sm">
          {successMsg}
        </div>
      )}

      {/* Admin Stats */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-amber-700">{stats.pending}</div>
            <div className="text-xs font-bold text-amber-600 mt-1">Chờ duyệt</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-emerald-700">{stats.approved}</div>
            <div className="text-xs font-bold text-emerald-600 mt-1">Đã duyệt</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-sm font-black text-blue-700 leading-tight">{fmtCurrency(stats.totalApprovedAmount)}</div>
            <div className="text-xs font-bold text-blue-600 mt-1">Tổng đã chi</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "pending", "approved", "rejected"] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filterStatus === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"}`}>
            {s === "all" ? "Tất cả" : STATUS_CFG[s].label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredAdvances.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <Banknote className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Chưa có đề xuất ứng lương nào</p>
            {!isAdmin && <p className="text-sm mt-1">Bấm "Đề xuất Ứng Lương" để gửi yêu cầu</p>}
          </div>
        )}
        {filteredAdvances.map(adv => {
          const cfg = STATUS_CFG[adv.status];
          const expanded = expandedId === adv.id;
          return (
            <div key={adv.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${adv.status === "pending" ? "border-amber-200" : "border-slate-200"}`}>
              <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(expanded ? null : adv.id)}>
                <div className={`p-2 rounded-xl border text-sm font-bold ${cfg.bg} ${cfg.text}`}>{cfg.label}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-slate-800 truncate">
                    {isAdmin ? adv.employeeName : `Đề xuất tháng ${adv.month}/${adv.year}`}
                    {isAdmin && <span className="ml-2 text-xs font-normal text-slate-400">tháng {adv.month}/{adv.year}</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{new Date(adv.requestDate).toLocaleString("vi-VN")} · {adv.branch}</div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div className="font-black text-blue-700">{fmtCurrency(adv.amount)}</div>
                  {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>
              {expanded && (
                <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between col-span-2 sm:col-span-1"><span className="text-slate-500">Lương đã có:</span><strong className="text-slate-700">{fmtCurrency(adv.earnedSalary)}</strong></div>
                    <div className="flex justify-between col-span-2 sm:col-span-1"><span className="text-slate-500">Tối đa (50%):</span><strong className="text-slate-700">{fmtCurrency(adv.maxAllowed)}</strong></div>
                    {adv.note && <div className="col-span-2 bg-white border border-slate-200 rounded-lg p-2 text-slate-500"><span className="font-medium">Ghi chú:</span> {adv.note}</div>}
                    {adv.approvedBy && <div className="col-span-2 flex justify-between"><span className="text-slate-500">Duyệt bởi:</span><strong>{adv.approvedBy} · {adv.approvedAt}</strong></div>}
                    {adv.rejectedReason && <div className="col-span-2 bg-red-50 border border-red-200 rounded-lg p-2 text-red-600"><strong>Lý do từ chối:</strong> {adv.rejectedReason}</div>}
                    <div className="col-span-2 text-xs text-slate-400 font-mono">ID: {adv.id}</div>
                  </div>
                  {isAdmin && adv.status === "pending" && (
                    <div className="flex gap-3 pt-1">
                      <button onClick={() => setRejectingReq(adv)} className="flex-1 py-2.5 border border-red-300 text-red-600 rounded-xl font-bold hover:bg-red-50 text-sm flex items-center justify-center gap-1">
                        <XCircle className="w-4 h-4" /> Từ chối
                      </button>
                      <button onClick={() => setApprovingReq(adv)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Duyệt & Chi tiền
                      </button>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="flex gap-3 pt-2 mt-2 border-t border-slate-200">
                      <button onClick={() => {
                        if (confirm("Bạn có chắc chắn muốn xóa/hủy phiếu này?\nLưu ý: Nếu phiếu đã duyệt, bạn cần tự tay xóa phiếu chi tương ứng trong Sổ quỹ.")) {
                          removeSalaryAdvance(adv.id);
                          reload();
                        }
                      }} className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 text-sm flex items-center justify-center gap-1">
                        <Trash2 className="w-4 h-4" /> Xóa phiếu
                      </button>
                    </div>
                  )}
                  {!isAdmin && adv.status === "pending" && (
                    <div className="flex gap-3 pt-1 border-t border-slate-200 mt-2">
                      <button onClick={() => {
                        if (confirm("Bạn có chắc chắn muốn hủy đề xuất này?")) {
                          removeSalaryAdvance(adv.id);
                          reload();
                        }
                      }} className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 text-sm flex items-center justify-center gap-1">
                        <Trash2 className="w-4 h-4" /> Hủy phiếu
                      </button>
                      <button onClick={() => setEditingReq(adv)} className="flex-1 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-bold text-sm flex items-center justify-center gap-1">
                        <Edit2 className="w-4 h-4" /> Chỉnh sửa
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showRequestModal && session && (
        <RequestAdvanceModal empCode={session.code} empName={session.name} branch={session.branch}
          onClose={() => setShowRequestModal(false)}
          onSubmit={req => { reload(); setShowRequestModal(false); showSuccess(`✅ Đã gửi đề xuất ứng ${fmtCurrency(req.amount)} — Chờ admin xác nhận qua Telegram.`); }} />
      )}
      {editingReq && session && (
        <RequestAdvanceModal empCode={session.code} empName={session.name} branch={session.branch}
          initialData={editingReq}
          onClose={() => setEditingReq(null)}
          onSubmit={req => { reload(); setEditingReq(null); showSuccess(`✅ Đã cập nhật đề xuất ứng ${fmtCurrency(req.amount)} — Chờ admin xác nhận.`); }} />
      )}
      {approvingReq && session && (
        <ApproveModal req={approvingReq} onConfirm={() => handleApprove(approvingReq)} onCancel={() => setApprovingReq(null)} />
      )}
      {rejectingReq && (
        <RejectModal req={rejectingReq} onConfirm={r => handleReject(rejectingReq, r)} onCancel={() => setRejectingReq(null)} />
      )}
    </div>
  );
}
