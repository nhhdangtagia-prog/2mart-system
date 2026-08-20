import { useState, useMemo, Fragment } from "react";
import { Search, Filter, ChevronDown, ChevronUp, FileText, Download, Printer, Building2, Trash2 } from "lucide-react";
import { Button, useOrderPresenter } from "@2mart/ui";
import { useSession } from "../hooks/useSession";
import { useCurrentBranch } from "../hooks/useCurrentBranch";
import { orderMatchesBranch, deleteOrderAndRestoreStock } from "../utils/orderMigration";
import { restoreStockAfterVoid } from "../utils/branchStock";
import invoicesData from "../data/invoices.json";

export function InvoiceListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const itemsPerPage = 20;

  const { session } = useSession();
  const { currentBranch } = useCurrentBranch();
  const isStaff = session?.accessLevel === "staff";

  // Search logic via Presenter (CQRS UI-03.5)
  const { invoices } = useOrderPresenter();
  const filteredInvoices = useMemo(() => {
    let list: any[] = invoices.length > 0 ? invoices : invoicesData;
    // Lọc theo cơ sở đang chọn — dùng chung quy ước với Tổng quan/Kết ca để 2 màn hình luôn khớp
    // nhau (trước đây trang này không lọc chi nhánh nên hiện nhiều đơn hơn phần Kết ca).
    list = list.filter((inv: any) => orderMatchesBranch(inv.branch, currentBranch));
    // Nhân viên bán hàng chỉ thấy hóa đơn do chính mình thực hiện — không thấy giao dịch của nhân viên khác
    if (isStaff && session) {
      list = list.filter((inv: any) =>
        inv.employeeCode ? inv.employeeCode === session.code : inv.employee === session.name
      );
    }
    if (!searchTerm) return list;
    const lower = searchTerm.toLowerCase();
    return list.filter(inv =>
      inv.id.toLowerCase().includes(lower) ||
      inv.customer.toLowerCase().includes(lower) ||
      inv.employee.toLowerCase().includes(lower)
    );
  }, [searchTerm, invoices, isStaff, session, currentBranch]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  const toggleRow = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
  };

  // Admin xóa hóa đơn bán nhầm — hàng hóa được hoàn lại đúng tồn kho của cơ sở đã bán,
  // sau đó nhân viên lập lại hóa đơn mới cho đúng.
  const handleDeleteInvoice = (inv: any) => {
    const itemLines = (inv.items || [])
      .filter((it: any) => it.sku !== "POS-ITEM")
      .map((it: any) => `• ${it.name} × ${it.quantity}`)
      .join("\n");

    const confirmed = window.confirm(
      `XÓA HÓA ĐƠN ${inv.id}?\n\n` +
      `Tổng tiền: ${formatCurrency(inv.total)}\n` +
      `Người bán: ${inv.employee}\n` +
      `Cơ sở: ${inv.branch || "285 Nguyễn Lương Bằng"}\n\n` +
      (itemLines
        ? `Hàng hóa sau sẽ được HOÀN LẠI vào tồn kho của cơ sở trên:\n${itemLines}\n\n`
        : `Hóa đơn cũ này không lưu chi tiết mặt hàng nên tồn kho sẽ KHÔNG được điều chỉnh.\n\n`) +
      `Thao tác này không thể hoàn tác.`
    );
    if (!confirmed) return;

    const removed = deleteOrderAndRestoreStock(inv.id, restoreStockAfterVoid);
    if (!removed) {
      alert("Không tìm thấy hóa đơn này để xóa.");
      return;
    }
    setExpandedRow(null);
    alert(
      `Đã xóa hóa đơn ${inv.id}.` +
      (removed.items && removed.items.length > 0
        ? `\nĐã hoàn ${removed.items.length} mặt hàng về tồn kho ${removed.branch}.`
        : `\nKhông có chi tiết mặt hàng nên tồn kho giữ nguyên.`)
    );
  };

  const formatCurrency = (val: number) => val.toLocaleString() + ' đ';

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 flex flex-col h-full relative animate-in fade-in duration-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            {isStaff ? "Hóa đơn của tôi" : "Danh sách Hóa đơn"}
          </h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Building2 className="w-3.5 h-3.5" />
            Cơ sở: {currentBranch}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border-slate-200">
            <Download className="w-4 h-4" /> Xuất file
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex flex-1 gap-2">
            <div className="relative w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm theo mã hóa đơn, khách hàng, nhân viên..." 
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
            <Button variant="outline" className="gap-2 bg-white text-slate-700 border-slate-200 hover:bg-slate-50">
              <Filter className="w-4 h-4" /> Lọc
            </Button>
          </div>
        </div>

        {/* DataGrid */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 sticky top-0 z-10">
                <th className="px-4 py-3 w-12"></th>
                <th className="px-4 py-3">Mã Hóa Đơn</th>
                <th className="px-4 py-3">Thời Gian</th>
                <th className="px-4 py-3">Khách Hàng</th>
                <th className="px-4 py-3">Người Bán</th>
                <th className="px-4 py-3 text-right">Tổng Tiền</th>
                <th className="px-4 py-3 text-right">Khách Trả</th>
                <th className="px-4 py-3">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {currentInvoices.map((inv) => (
                <Fragment key={inv.id}>
                  <tr 
                    onClick={() => toggleRow(inv.id)}
                    className={`transition-colors cursor-pointer group ${expandedRow === inv.id ? 'bg-blue-50/60 shadow-sm z-10 relative' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-3 text-slate-400">
                      {expandedRow === inv.id ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 group-hover:text-blue-600" />}
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-600">{inv.id}</td>
                    <td className="px-4 py-3">{inv.date}</td>
                    <td className="px-4 py-3 font-medium">{inv.customer}</td>
                    <td className="px-4 py-3 text-slate-500">{inv.employee}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(inv.finalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        inv.status === 'Hoàn thành' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                  {expandedRow === inv.id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={8} className="p-0 border-b-2 border-blue-100 shadow-inner">
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-slate-800 mb-1">Chi tiết Hóa đơn {inv.id}</h3>
                              <p className="text-sm text-slate-500">Thanh toán: Tiền mặt ({formatCurrency(inv.cash)}), Chuyển khoản ({formatCurrency(inv.transfer)}), Thẻ ({formatCurrency(inv.card)})</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="gap-2 bg-white hover:bg-slate-50">
                                <Printer className="w-4 h-4" /> In lại
                              </Button>
                              {/* Chỉ Admin được xóa hóa đơn bán nhầm — hàng hóa sẽ được hoàn lại kho */}
                              {!isStaff && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(inv); }}
                                  className="gap-2 bg-white text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" /> Xóa hóa đơn
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <table className="w-full text-sm text-left border border-slate-200 rounded overflow-hidden">
                            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="px-4 py-2">Mã Hàng</th>
                                <th className="px-4 py-2">Tên Hàng</th>
                                <th className="px-4 py-2 text-center">SL</th>
                                <th className="px-4 py-2 text-right">Đơn Giá</th>
                                <th className="px-4 py-2 text-right">Thành Tiền</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {inv.items.map((item: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="px-4 py-2 font-mono text-slate-500">{item.sku}</td>
                                  <td className="px-4 py-2 font-medium">{item.name}</td>
                                  <td className="px-4 py-2 text-center">{item.quantity}</td>
                                  <td className="px-4 py-2 text-right">{formatCurrency(item.price)}</td>
                                  <td className="px-4 py-2 text-right font-semibold">{formatCurrency(item.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="mt-4 flex justify-end">
                            <div className="w-64 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Tổng tiền hàng:</span>
                                <span className="font-medium">{formatCurrency(inv.total)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Giảm giá:</span>
                                <span>{formatCurrency(inv.discount)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-1 mt-1">
                                <span>Khách cần trả:</span>
                                <span className="text-blue-600">{formatCurrency(inv.finalAmount)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {currentInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Không tìm thấy hóa đơn nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-slate-50">
          <div>Hiển thị {Math.min(startIndex + 1, filteredInvoices.length)}-{Math.min(startIndex + itemsPerPage, filteredInvoices.length)} trên tổng số {filteredInvoices.length} hóa đơn</div>
          <div className="flex gap-1">
            <Button 
              variant="outline" size="sm" 
              className="bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Trước
            </Button>
            
            <Button 
              variant="outline" size="sm" 
              className="bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
