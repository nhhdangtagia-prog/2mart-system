import { useState, useMemo } from "react";
import { ClipboardCheck, Copy, Check, Banknote, Landmark, CreditCard, Receipt } from "lucide-react";
import { Button } from "@2mart/ui";
import type { FormattedOrderItem } from "@2mart/ui";

type MethodFilter = "all" | "cash" | "transfer" | "card";

interface ShiftClosingPanelProps {
  /** Đơn hàng đã lọc sẵn theo chi nhánh + theo nhân viên (nếu là tài khoản nhân viên) */
  orders: FormattedOrderItem[];
  branch: string;
  /** Nhân viên chỉ kết ca của chính mình — Admin được chọn xem theo từng người */
  isStaff: boolean;
  ownerLabel: string;
}

/** Date -> "YYYY-MM-DDTHH:MM" cho input datetime-local */
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const formatMoney = (n: number) => n.toLocaleString("vi-VN");

export function ShiftClosingPanel({ orders, branch, isStaff, ownerLabel }: ShiftClosingPanelProps) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [fromStr, setFromStr] = useState(toDatetimeLocal(startOfToday));
  // Mặc định lấy hết ngày hôm nay (23:59) chứ KHÔNG lấy đúng thời điểm mở trang — nếu lấy "bây giờ"
  // thì mốc này bị đứng yên, các đơn bán SAU khi mở trang sẽ rơi ngoài khoảng lọc và bị thiếu.
  const [toStr, setToStr] = useState(
    toDatetimeLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59))
  );
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [copied, setCopied] = useState(false);

  // Các khoản phải nhập tay khi kết ca (hệ thống chưa có dữ liệu tự động)
  const [openingCash, setOpeningCash] = useState<string>("");   // Tiền mặt nhận lúc vào ca
  const [karabox, setKarabox] = useState<string>("");           // Karabox (chuyển khoản)
  const [supplierPaid, setSupplierPaid] = useState<string>(""); // Trả tiền hàng (đơn cũ)
  const [handover, setHandover] = useState<string>("");         // Bàn giao (VD: 4 cục + 10 dây)

  const num = (s: string) => Number(String(s).replace(/\D/g, "")) || 0;

  // Danh sách nhân viên có phát sinh đơn — chỉ Admin dùng để đối chiếu từng người
  const employeeOptions = useMemo(() => {
    const names = new Set<string>();
    orders.forEach(o => names.add(o.employeeName));
    return Array.from(names).sort();
  }, [orders]);

  const filtered = useMemo(() => {
    const fromMs = fromStr ? new Date(fromStr).getTime() : 0;
    const toMs = toStr ? new Date(toStr).getTime() : Number.MAX_SAFE_INTEGER;

    return orders
      .filter(o => {
        // Lọc theo khoảng thời gian chính xác tới phút
        if (!o.createdAtMs || o.createdAtMs < fromMs || o.createdAtMs > toMs) return false;
        if (!isStaff && employeeFilter !== "all" && o.employeeName !== employeeFilter) return false;
        // Lọc theo hình thức: đơn kết hợp vẫn được tính nếu có phát sinh loại tiền đang lọc
        if (methodFilter === "cash") return o.cash > 0;
        if (methodFilter === "transfer") return o.transfer > 0;
        if (methodFilter === "card") return o.card > 0;
        return true;
      })
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [orders, fromStr, toStr, methodFilter, employeeFilter, isStaff]);

  const totals = useMemo(() => filtered.reduce(
    (acc, o) => ({
      total: acc.total + o.total,
      cash: acc.cash + o.cash,
      transfer: acc.transfer + o.transfer,
      card: acc.card + o.card
    }),
    { total: 0, cash: 0, transfer: 0, card: 0 }
  ), [filtered]);

  const rangeLabel = `${fromStr.replace("T", " ")} → ${toStr.replace("T", " ")}`;

  // Ngày ca làm việc + khung giờ, suy ra từ khoảng thời gian đang lọc (VD "28/7", "17h-23h")
  const shiftDayLabel = useMemo(() => {
    if (!fromStr) return "";
    const d = new Date(fromStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }, [fromStr]);

  const shiftHoursLabel = useMemo(() => {
    if (!fromStr || !toStr) return "";
    const h = (s: string) => `${new Date(s).getHours()}h`;
    return `${h(fromStr)}-${h(toStr)}`;
  }, [fromStr, toStr]);

  // Tiền mặt phải bàn giao cuối ca = tiền mặt nhận đầu ca + tiền mặt bán được − tiền đã chi trả hàng
  const cashHandover = num(openingCash) + totals.cash - num(supplierPaid);

  const handleCopy = async () => {
    const lines = [
      `KẾT CA — ${branch}`,
      `Nhân viên: ${isStaff ? ownerLabel : (employeeFilter === "all" ? "Tất cả" : employeeFilter)}`,
      `------------------------`,
      `Số đơn: ${filtered.length}`,
      ``,
      `Ngày: ${shiftDayLabel}`,
      `Kết ca: ${shiftHoursLabel}`,
      `Nhận: ${formatMoney(num(openingCash))}`,
      `Doanh thu: ${formatMoney(totals.total)}`,
      `Tiền mặt: ${formatMoney(totals.cash)}`,
      `Chuyển khoản: ${formatMoney(totals.transfer)}`
    ];
    if (totals.card > 0) lines.push(`Thẻ: ${formatMoney(totals.card)}`);
    if (num(karabox) > 0) lines.push(`Karabox: ${formatMoney(num(karabox))} (ck)`);
    lines.push(`-------------`);
    lines.push(`Trả tiền hàng: ${formatMoney(num(supplierPaid))}`);
    lines.push(
      `Tổng: ${formatMoney(num(openingCash))} + ${formatMoney(totals.cash)} - ${formatMoney(num(supplierPaid))} = ${formatMoney(cashHandover)}`
    );
    if (handover.trim()) lines.push(`Bàn giao ${handover.trim()}`);

    const text = lines.join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tiles = [
    { key: "total", label: "Tổng tiền bán", value: totals.total, icon: Receipt, color: "text-slate-900", bg: "bg-slate-50 border-slate-200" },
    { key: "cash", label: "Tiền mặt", value: totals.cash, icon: Banknote, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    { key: "transfer", label: "Chuyển khoản", value: totals.transfer, icon: Landmark, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    { key: "card", label: "Thẻ", value: totals.card, icon: CreditCard, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-lg text-slate-800 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            Kết ca
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng tiền bán trong ca, tách riêng tiền mặt và chuyển khoản — lọc chính xác tới từng phút
            {isStaff && <> · chỉ giao dịch của <strong className="text-slate-700">{ownerLabel}</strong></>}
          </p>
        </div>
        <Button
          onClick={handleCopy}
          variant="outline"
          className="gap-2 bg-white border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold h-9 shrink-0"
        >
          {copied ? <><Check className="w-4 h-4" /> Đã sao chép</> : <><Copy className="w-4 h-4" /> Sao chép số liệu</>}
        </Button>
      </div>

      {/* Bộ lọc */}
      <div className="px-5 py-4 flex flex-wrap items-end gap-4 border-b border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Từ</label>
          <input
            type="datetime-local"
            value={fromStr}
            onChange={e => setFromStr(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Đến</label>
          <input
            type="datetime-local"
            value={toStr}
            onChange={e => setToStr(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Phương thức thanh toán</label>
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value as MethodFilter)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="cash">Tiền mặt</option>
            <option value="transfer">Chuyển khoản</option>
            <option value="card">Thẻ</option>
          </select>
        </div>
        {!isStaff && (
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Nhân viên</label>
            <select
              value={employeeFilter}
              onChange={e => setEmployeeFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
            >
              <option value="all">Tất cả nhân viên</option>
              {employeeOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}
        <div className="text-xs text-slate-500 pb-2">
          Cơ sở: <strong className="text-slate-700">{branch}</strong>
        </div>
      </div>

      {/* Số tổng */}
      <div className="px-5 py-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
        {tiles.map(t => (
          <div key={t.key} className={`rounded-xl border p-3.5 ${t.bg}`}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1">
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </div>
            <div className={`text-xl font-black font-mono ${t.color}`}>{formatMoney(t.value)}</div>
          </div>
        ))}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="text-xs font-bold text-slate-500 mb-1">Số đơn</div>
          <div className="text-xl font-black font-mono text-slate-900">{filtered.length}</div>
        </div>
      </div>

      {/* Các khoản nhập tay khi kết ca — hệ thống chưa có dữ liệu tự động cho những mục này */}
      <div className="px-5 pb-4 border-t border-slate-100 pt-4">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Nhập tay khi kết ca</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nhận (tiền mặt đầu ca)</label>
            <input
              type="text"
              inputMode="numeric"
              value={openingCash ? formatMoney(num(openingCash)) : ""}
              onChange={e => setOpeningCash(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Karabox (chuyển khoản)</label>
            <input
              type="text"
              inputMode="numeric"
              value={karabox ? formatMoney(num(karabox)) : ""}
              onChange={e => setKarabox(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold font-mono text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Trả tiền hàng (đơn cũ)</label>
            <input
              type="text"
              inputMode="numeric"
              value={supplierPaid ? formatMoney(num(supplierPaid)) : ""}
              onChange={e => setSupplierPaid(e.target.value)}
              placeholder="0"
              className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm font-bold font-mono text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Bàn giao</label>
            <input
              type="text"
              value={handover}
              onChange={e => setHandover(e.target.value)}
              placeholder="VD: 4 cục + 10 dây"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Số tiền mặt thực tế phải bàn giao cuối ca */}
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-amber-800">Tiền mặt phải bàn giao cuối ca</div>
            <div className="text-[11px] text-amber-700 font-mono mt-0.5">
              {formatMoney(num(openingCash))} + {formatMoney(totals.cash)} − {formatMoney(num(supplierPaid))}
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-900">{formatMoney(cashHandover)}</div>
        </div>
      </div>

      {/* Danh sách giao dịch trong ca */}
      <div className="max-h-[320px] overflow-y-auto border-t border-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr className="text-xs font-bold text-slate-500 uppercase">
              <th className="px-4 py-2.5">Thời gian</th>
              <th className="px-4 py-2.5">Mã đơn</th>
              <th className="px-4 py-2.5">Nhân viên</th>
              <th className="px-4 py-2.5 text-right">Tổng tiền</th>
              <th className="px-4 py-2.5 text-right">Tiền mặt</th>
              <th className="px-4 py-2.5 text-right">Chuyển khoản</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400 italic">
                  Không có giao dịch nào trong khoảng thời gian đã chọn.
                </td>
              </tr>
            ) : (
              filtered.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{o.createdAt}</td>
                  <td className="px-4 py-2.5 font-bold text-blue-600">{o.code}</td>
                  <td className="px-4 py-2.5 text-slate-700">{o.employeeName}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">{formatMoney(o.total)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-700">{o.cash > 0 ? formatMoney(o.cash) : "-"}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-blue-700">{o.transfer > 0 ? formatMoney(o.transfer) : "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
