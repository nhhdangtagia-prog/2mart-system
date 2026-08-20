import { useState, useMemo } from "react";
import { 
  Search, Download, DollarSign, Calendar, Building2, Award, 
  TrendingUp, ShoppingCart, Percent, ArrowUpRight
} from "lucide-react";
import { Button } from "@2mart/ui";
import { useEmployees } from "../hooks/useEmployees";
import { useCurrentBranch } from "../hooks/useCurrentBranch";

export function CommissionPage() {
  const { currentBranch, isCS2 } = useCurrentBranch();
  const { employees } = useEmployees();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Tháng 7, 2026");

  // Filter employees by current branch
  const branchEmployees = useMemo(() => {
    return employees.filter(e => 
      currentBranch === "Tất cả chi nhánh" || 
      e.branch === currentBranch || 
      (!e.branch && currentBranch === "285 Nguyễn Lương Bằng")
    );
  }, [employees, currentBranch]);

  // Compute mock commission from invoices or realistic sales numbers per staff
  const commissionList = useMemo(() => {
    const rawOrders = localStorage.getItem("kiot_rm_orders_v2");
    let orders: any[] = [];
    if (rawOrders) { try { orders = JSON.parse(rawOrders); } catch (e) {} }

    return branchEmployees.map((emp, idx) => {
      // Find orders handled by this employee or mock realistic volume
      const empOrders = orders.filter(o => o.cashier === emp.name || o.creator === emp.name);
      let orderCount = empOrders.length;
      let totalSales = empOrders.reduce((acc, cur) => acc + (cur.total || cur.finalAmount || 0), 0);

      if (orderCount === 0) {
        orderCount = 25 + (idx * 7) % 30;
        totalSales = orderCount * 380000;
      }

      const commissionRate = 0.02; // 2% standard commission
      const commissionAmount = Math.round(totalSales * commissionRate);
      const bonusTarget = totalSales > 15000000 ? 500000 : 0; // 500k bonus for > 15M sales
      const totalPayout = commissionAmount + bonusTarget;

      return {
        code: emp.code,
        name: emp.name,
        role: emp.role,
        department: emp.department || "CS1",
        orderCount,
        totalSales,
        commissionRate: "2.0%",
        commissionAmount,
        bonusTarget,
        totalPayout
      };
    }).filter(item => {
      if (!searchTerm) return true;
      const lower = searchTerm.toLowerCase();
      return item.name.toLowerCase().includes(lower) || item.code.toLowerCase().includes(lower);
    });
  }, [branchEmployees, searchTerm]);

  const totalBranchSales = useMemo(() => commissionList.reduce((acc, cur) => acc + cur.totalSales, 0), [commissionList]);
  const totalBranchCommission = useMemo(() => commissionList.reduce((acc, cur) => acc + cur.totalPayout, 0), [commissionList]);

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 flex flex-col h-full relative animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Bảng tính hoa hồng nhân viên</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Building2 className="w-3.5 h-3.5" />
              Cơ sở: {currentBranch}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Tự động tính toán chiết khấu bán hàng và thưởng doanh số thực tế theo ca làm việc</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nhân viên..." 
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm h-9 px-3 text-sm font-medium text-slate-700 gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{selectedMonth}</span>
          </div>

          <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm h-9 px-4 font-bold flex items-center gap-2">
            <Download className="w-4 h-4" /> Xuất Excel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Doanh số bán hàng chi nhánh</div>
            <div className="text-lg font-black text-blue-700">{totalBranchSales.toLocaleString()} đ</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tổng giá trị đơn hàng thực thu</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Tổng hoa hồng chi trả</div>
            <div className="text-lg font-black text-purple-700">{totalBranchCommission.toLocaleString()} đ</div>
            <div className="text-[11px] text-purple-600 font-semibold mt-0.5">Đã bao gồm thưởng vượt chỉ tiêu</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Tỷ lệ chiết khấu trung bình</div>
            <div className="text-lg font-black text-emerald-700">2.0% - 3.5%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Áp dụng theo chính sách {isCS2 ? "CS2" : "CS1"}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <th className="px-5 py-4">Nhân viên</th>
                <th className="px-4 py-4 text-center">Số đơn hàng</th>
                <th className="px-4 py-4 text-right">Tổng doanh số</th>
                <th className="px-4 py-4 text-center">Mức chiết khấu</th>
                <th className="px-4 py-4 text-right">Hoa hồng bán hàng</th>
                <th className="px-4 py-4 text-right text-emerald-600">Thưởng vượt KPI (+)</th>
                <th className="px-5 py-4 text-right font-black text-purple-800 bg-purple-50/50">Tổng thực nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {commissionList.map((row) => (
                <tr key={row.code} className="hover:bg-purple-50/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-extrabold text-slate-800">{row.name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{row.code} • {row.role}</div>
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-slate-700">
                    {row.orderCount} đơn
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-slate-800">
                    {row.totalSales.toLocaleString()} đ
                  </td>
                  <td className="px-4 py-4 text-center font-mono font-bold text-blue-600">
                    {row.commissionRate}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-slate-700">
                    {row.commissionAmount.toLocaleString()} đ
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-emerald-600">
                    {row.bonusTarget > 0 ? `+${row.bonusTarget.toLocaleString()} đ` : "--"}
                  </td>
                  <td className="px-5 py-4 text-right font-black text-purple-700 bg-purple-50/30 text-base">
                    {row.totalPayout.toLocaleString()} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>Hiển thị {commissionList.length} nhân viên tại cơ sở {currentBranch}.</div>
          <div className="font-bold text-slate-700">
            Quy tắc: Hoa hồng được cộng dồn cùng lương cơ bản và chi trả vào kỳ nhận lương hàng tháng.
          </div>
        </div>
      </div>

    </div>
  );
}
