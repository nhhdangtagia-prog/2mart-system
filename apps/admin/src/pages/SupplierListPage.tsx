import { useState, useMemo } from "react";
import { Search, Plus, Download, Upload, Filter, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@2mart/ui";
import suppliersData from "../data/suppliers.json";

export function SupplierListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 20;

  // Filter logic
  const filteredSuppliers = useMemo(() => {
    if (!searchTerm) return suppliersData;
    const lower = searchTerm.toLowerCase();
    return suppliersData.filter(s => 
      s.name.toLowerCase().includes(lower) || 
      s.code.toLowerCase().includes(lower) || 
      s.phone.includes(lower)
    );
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "0";
    return num.toLocaleString();
  };

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col h-full relative animate-in fade-in duration-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Nhà cung cấp</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border-slate-200">
            <Upload className="w-4 h-4" /> Import
          </Button>
          <Button variant="outline" className="gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border-slate-200">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Link to="/purchase/import">
            <Button className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border-transparent font-bold">
              <Truck className="w-4 h-4" /> Tạo Phiếu Nhập Hàng
            </Button>
          </Link>
          <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent font-bold">
            <Plus className="w-4 h-4" /> Thêm nhà cung cấp
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
                placeholder="Tìm kiếm theo mã, tên, SĐT..." 
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
                <th className="px-4 py-3 w-12"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></th>
                <th className="px-4 py-3">Mã NCC</th>
                <th className="px-4 py-3">Tên Nhà Cung Cấp</th>
                <th className="px-4 py-3">Điện Thoại</th>
                <th className="px-4 py-3 text-right">Nợ Cần Trả</th>
                <th className="px-4 py-3 text-right">Tổng Mua</th>
                <th className="px-4 py-3 text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {currentSuppliers.map((supp, idx) => (
                <tr 
                  key={idx}
                  className="transition-colors cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                  <td className="px-4 py-3 font-medium text-blue-600">{supp.code}</td>
                  <td className="px-4 py-3 font-semibold">{supp.name}</td>
                  <td className="px-4 py-3 font-medium text-slate-600">{supp.phone}</td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(supp.debt)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(supp.totalBought)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      supp.status === '1' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {supp.status === '1' ? 'Đang giao dịch' : 'Ngừng giao dịch'}
                    </span>
                  </td>
                </tr>
              ))}
              {currentSuppliers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Không tìm thấy nhà cung cấp nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-slate-50">
          <div>Hiển thị {Math.min(startIndex + 1, filteredSuppliers.length)}-{Math.min(startIndex + itemsPerPage, filteredSuppliers.length)} trên tổng số {filteredSuppliers.length} nhà cung cấp</div>
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
