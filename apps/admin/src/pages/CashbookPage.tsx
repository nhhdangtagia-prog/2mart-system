import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search, Filter, Wallet, ArrowDownRight, ArrowUpRight, CheckCircle2, Edit2, Trash2 } from "lucide-react";
import { Button } from "@2mart/ui";
import { useSession } from "../hooks/useSession";
import { getCashbookEntries, addCashbookEntry, updateCashbookEntry, deleteCashbookEntry, syncCashbookFromLocal, type CashbookEntry } from "../utils/cashbookService";

const TABS = [
  { id: "receipts", label: "Phiếu thu", path: "/cashbook/receipts" },
  { id: "payments", label: "Phiếu chi", path: "/cashbook/payments" },
  { id: "report", label: "Sổ quỹ", path: "/cashbook/report" }
];

export function CashbookPage() {
  const { session } = useSession();
  const location = useLocation();
  const activeTab = TABS.find(t => location.pathname.includes(t.id))?.id || "report";
  
  const [entries, setEntries] = useState<CashbookEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"receipt" | "payment">("receipt");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [amount, setAmount] = useState<number | "">("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const today = new Date();
  const [monthStr, setMonthStr] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!monthStr) return;
    setLoading(true);
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(year, month - 1, 1, 0, 0, 0).toISOString();
    const end = new Date(year, month, 0, 23, 59, 59).toISOString();
    
    try {
      const data = await getCashbookEntries(start, end);
      setEntries(data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await syncCashbookFromLocal();
      loadData();
    };
    init();
    
    window.addEventListener("kiot_cashbook_change", loadData);
    return () => window.removeEventListener("kiot_cashbook_change", loadData);
  }, [monthStr]);

  const filteredEntries = useMemo(() => {
    if (activeTab === "receipts") return entries.filter(e => e.type === "receipt");
    if (activeTab === "payments") return entries.filter(e => e.type === "payment");
    return entries;
  }, [entries, activeTab]);

  const summary = useMemo(() => {
    return entries.reduce(
      (acc, e) => {
        if (e.type === "receipt") acc.totalReceipts += e.amount;
        if (e.type === "payment") acc.totalPayments += e.amount;
        return acc;
      },
      { totalReceipts: 0, totalPayments: 0 }
    );
  }, [entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return alert("Vui lòng nhập số tiền hợp lệ!");
    if (!category) return alert("Vui lòng nhập hạng mục!");
    
    try {
      if (editingId) {
        await updateCashbookEntry(editingId, {
          amount: Number(amount),
          category,
          description,
          actorName: session?.name || session?.username || "Nhân viên",
          sessionId: "Sổ quỹ ca làm việc",
        });
        alert("Đã cập nhật phiếu thành công!");
      } else {
        await addCashbookEntry({
          type: modalType,
          amount: Number(amount),
          category,
          description,
          actorName: session?.name || session?.username || "Nhân viên",
          sessionId: "Sổ quỹ ca làm việc",
        });
        alert(`Đã lập phiếu ${modalType === "receipt" ? "thu" : "chi"} thành công!`);
      }
      
      setIsModalOpen(false);
      setAmount("");
      setCategory("");
      setDescription("");
      setEditingId(null);
      loadData();
    } catch(e) {
      alert("Lỗi kết nối máy chủ");
    }
  };

  const handleEdit = (e: CashbookEntry) => {
    setEditingId(e.id);
    setModalType(e.type);
    setAmount(e.amount);
    setCategory(e.category);
    setDescription(e.description);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn hủy phiếu này không? Hành động này không thể hoàn tác.")) {
      try {
        await deleteCashbookEntry(id);
        loadData();
      } catch(e) {
        alert("Lỗi khi xóa");
      }
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col h-full relative animate-in fade-in duration-200 space-y-6">
      
      {/* HEADER TỔNG QUAN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 font-semibold mb-1">
            <Wallet className="w-5 h-5 text-blue-600" />
            Tồn quỹ hiện tại
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(summary.totalReceipts - summary.totalPayments)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold mb-1">
            <ArrowDownRight className="w-5 h-5" />
            Tổng Thu
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {formatCurrency(summary.totalReceipts)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-red-500 font-semibold mb-1">
            <ArrowUpRight className="w-5 h-5" />
            Tổng Chi
          </div>
          <div className="text-2xl font-black text-red-600">
            {formatCurrency(summary.totalPayments)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <a key={tab.id} href={tab.path}>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            </a>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <input 
            type="month" 
            value={monthStr} 
            onChange={(e) => setMonthStr(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none"
          />
          <Button onClick={() => { setEditingId(null); setModalType("receipt"); setAmount(""); setCategory(""); setDescription(""); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold">
            <Plus className="w-4 h-4 mr-1.5" /> Lập Phiếu Thu
          </Button>
          <Button onClick={() => { setEditingId(null); setModalType("payment"); setAmount(""); setCategory(""); setDescription(""); setIsModalOpen(true); }} className="bg-red-600 hover:bg-red-700 text-white shadow-sm font-bold">
            <Plus className="w-4 h-4 mr-1.5" /> Lập Phiếu Chi
          </Button>
        </div>
      </div>

      {/* DANH SÁCH */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Tìm kiếm theo mã phiếu, người lập, diễn giải..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <Button variant="outline" className="text-slate-600 font-semibold border-slate-300 hover:bg-slate-50">
            <Filter className="w-4 h-4 mr-1.5" /> Bộ lọc
          </Button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-100/80 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-black w-32">Mã Phiếu</th>
                <th className="px-4 py-3 font-black w-40">Thời Gian</th>
                <th className="px-4 py-3 font-black w-32">Loại</th>
                <th className="px-4 py-3 font-black text-right w-40">Giá Trị</th>
                <th className="px-4 py-3 font-black">Hạng Mục</th>
                <th className="px-4 py-3 font-black">Người Lập</th>
                <th className="px-4 py-3 font-black">Ghi Chú</th>
                <th className="px-4 py-3 font-black text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Chưa có giao dịch nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(e => (
                  <tr key={e.id} className={`transition-colors ${e.isManual ? 'hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100'}`}>
                    <td className="px-4 py-3 font-bold text-blue-700">
                      {e.isManual ? e.id.substring(0,8).toUpperCase() : (
                        <a href={e.referenceUrl} className="hover:underline">{e.id.substring(0,8).toUpperCase()}</a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{new Date(e.date).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${e.type === "receipt" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {e.type === "receipt" ? "Thu" : "Chi"}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-black text-right ${e.type === "receipt" ? "text-emerald-600" : "text-red-600"}`}>
                      {e.type === "receipt" ? "+" : "-"}{formatCurrency(e.amount)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{e.category}</td>
                    <td className="px-4 py-3 text-slate-600">{e.actorName || e.approvedBy || "Hệ thống"}</td>
                    <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate" title={e.description}>{e.description}</td>
                    <td className="px-4 py-3">
                      {e.isManual && (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEdit(e)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Sửa phiếu">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(e.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hủy phiếu">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL LẬP PHIẾU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-4 text-white font-bold flex items-center gap-2 ${modalType === "receipt" ? "bg-emerald-600" : "bg-red-600"}`}>
              {modalType === "receipt" ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              {modalType === "receipt" ? (editingId ? "CẬP NHẬT PHIẾU THU" : "LẬP PHIẾU THU") : (editingId ? "CẬP NHẬT PHIẾU CHI" : "LẬP PHIẾU CHI")}
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Giá trị (VNĐ) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  required
                  min="0"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value) || "")}
                  placeholder="0"
                  className={`w-full p-3 rounded-xl border border-slate-300 font-bold text-lg focus:outline-none focus:ring-2 ${modalType === "receipt" ? "focus:ring-emerald-500 text-emerald-700" : "focus:ring-red-500 text-red-700"}`}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Hạng mục <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder={modalType === "receipt" ? "VD: Bán phế liệu, Tiền lẻ..." : "VD: Mua văn phòng phẩm, Nước uống..."}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Diễn giải</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ghi chú chi tiết..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 font-bold">
                  Hủy bỏ
                </Button>
                <Button type="submit" className={`flex-1 font-bold text-white ${modalType === "receipt" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}>
                  Lưu Phiếu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
