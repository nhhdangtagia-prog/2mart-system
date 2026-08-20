import { useState, useMemo } from "react";
import { Search, Plus, Download, Upload, Filter, Edit, Trash2, UserPlus, X, CheckCircle2, AlertCircle, Phone, Mail, MapPin, Building2, Briefcase } from "lucide-react";
import { Button } from "@2mart/ui";
import { useEmployees, type Employee, removeVietnameseTones } from "../hooks/useEmployees";
import { useCurrentBranch } from "../hooks/useCurrentBranch";

export function EmployeeListPage() {
  const { currentBranch } = useCurrentBranch();
  const { employees, isLoading, addEmployee, updateEmployee, deleteEmployee, deleteEmployees } = useEmployees();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    phone: "",
    email: "",
    role: "Nhân viên bán hàng",
    accessLevel: "staff" as "admin" | "staff",
    department: "CS1",
    branch: "285 Nguyễn Lương Bằng",
    status: "Đang làm việc",
    joinDate: new Date().toISOString().split("T")[0],
    bankName: "",
    bankAccountNumber: "",
    bankAccountHolder: ""
  });

  const itemsPerPage = 20;

  // Lọc dữ liệu theo chi nhánh VÀ từ khóa tìm kiếm
  const filteredEmployees = useMemo(() => {
    let list = employees;
    if (currentBranch !== "Tất cả chi nhánh") {
      list = list.filter(e => e.branch === currentBranch || (!e.branch && currentBranch === "285 Nguyễn Lương Bằng"));
    }
    if (!searchTerm) return list;
    const lower = searchTerm.toLowerCase();
    return list.filter(e => 
      e.name.toLowerCase().includes(lower) || 
      e.code.toLowerCase().includes(lower) || 
      e.phone.includes(lower) ||
      e.branch.toLowerCase().includes(lower) ||
      e.role.toLowerCase().includes(lower)
    );
  }, [searchTerm, employees, currentBranch]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(currentEmployees.map(emp => emp.code));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (code: string) => {
    setSelectedIds(prev => 
      prev.includes(code) ? prev.filter(id => id !== code) : [...prev, code]
    );
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} nhân viên đã chọn?`)) {
      deleteEmployees(selectedIds);
      setSelectedIds([]);
    }
  };

  // Open Modal Add
  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      name: "",
      username: "",
      password: "",
      phone: "",
      email: "",
      role: "Nhân viên bán hàng",
      accessLevel: "staff",
      department: currentBranch === "379b Tôn Đức Thắng" ? "Chi nhánh 2" : "Chi nhánh 1",
      branch: currentBranch === "Tất cả chi nhánh" ? "285 Nguyễn Lương Bằng" : currentBranch,
      status: "Đang làm việc",
      joinDate: new Date().toISOString().split("T")[0],
      bankName: "",
      bankAccountNumber: "",
      bankAccountHolder: ""
    });
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (emp: Employee, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEmployee(emp);
    setFormData({
      name: emp.name || "",
      username: emp.username || "",
      password: "",
      phone: emp.phone || "",
      email: emp.email || "",
      role: emp.role || "Nhân viên bán hàng",
      accessLevel: emp.accessLevel || "staff",
      department: emp.department || "CS1",
      branch: emp.branch || "285 Nguyễn Lương Bằng",
      status: emp.status || "Đang làm việc",
      joinDate: emp.joinDate || new Date().toISOString().split("T")[0],
      bankName: emp.bankName || "",
      bankAccountNumber: emp.bankAccountNumber || "",
      bankAccountHolder: emp.bankAccountHolder || ""
    });
    setIsModalOpen(true);
  };

  // Save Employee
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên nhân viên!");
      return;
    }
    if (!formData.phone.trim()) {
      alert("Vui lòng nhập số điện thoại!");
      return;
    }

    if (editingEmployee) {
      await updateEmployee(editingEmployee.code, formData);
    } else {
      await addEmployee(formData);
    }
    setIsModalOpen(false);
  };

  // Delete single employee
  const handleDeleteSingle = (emp: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc muốn xóa nhân viên "${emp.name} (${emp.code})"?`)) {
      deleteEmployee(emp.code);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 flex flex-col h-full relative animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Nhân viên</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Building2 className="w-3.5 h-3.5" />
              Cơ sở đang chọn: {currentBranch}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Quản lý danh sách, phân quyền và thông tin làm việc tách biệt theo từng chi nhánh</p>
        </div>
        <div className="flex gap-2.5">
          {selectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBatchDelete}
              className="gap-2 bg-red-600 text-white hover:bg-red-700 shadow-sm font-medium animate-in fade-in"
            >
              <Trash2 className="w-4 h-4" /> Xóa ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" className="gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border-slate-200">
            <Upload className="w-4 h-4" /> Import
          </Button>
          <Button variant="outline" className="gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-sm border-slate-200">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button 
            onClick={handleOpenAdd}
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent font-medium"
          >
            <UserPlus className="w-4 h-4" /> Thêm nhân viên
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-1 gap-2.5">
            <div className="relative w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo mã, tên, SĐT, chi nhánh..." 
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
              />
            </div>
            <Button variant="outline" className="gap-2 bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm font-medium">
              <Filter className="w-4 h-4 text-slate-500" /> Lọc nâng cao
            </Button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Hiển thị <strong className="text-slate-800">{currentEmployees.length}</strong> / <strong className="text-slate-800">{filteredEmployees.length}</strong> nhân viên
          </div>
        </div>

        {/* DataGrid */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <th className="px-4 py-3.5 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={currentEmployees.length > 0 && selectedIds.length === currentEmployees.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4" 
                  />
                </th>
                <th className="px-4 py-3.5">Mã NV</th>
                <th className="px-4 py-3.5">Tên Nhân Viên</th>
                <th className="px-4 py-3.5">Liên Hệ</th>
                <th className="px-4 py-3.5">Chi Nhánh & Bộ Phận</th>
                <th className="px-4 py-3.5">Vai Trò / Vị Trí</th>
                <th className="px-4 py-3.5">Quyền</th>
                <th className="px-4 py-3.5">Trạng Thái</th>
                <th className="px-4 py-3.5 text-right w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Đang tải danh sách nhân viên...
                  </td>
                </tr>
              ) : currentEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    Không tìm thấy nhân viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                currentEmployees.map((emp) => {
                  const isSelected = selectedIds.includes(emp.code);
                  const isWorking = emp.status === "Đang làm việc" || emp.status === "ACTIVE";
                  
                  return (
                    <tr 
                      key={emp.code}
                      onClick={() => handleOpenEdit(emp)}
                      className={`transition-colors cursor-pointer group ${isSelected ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-slate-50/80"}`}
                    >
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleSelectOne(emp.code)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4" 
                        />
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-blue-600">{emp.code}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{emp.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-blue-700 font-mono font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            @{emp.username}
                          </span>
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1" title="Mật khẩu đã được mã hóa, không thể xem lại — bấm Sửa để đặt mật khẩu mới">
                            <span>🔒</span> <span>Đã đặt mật khẩu</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{emp.phone}</span>
                        </div>
                        {emp.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{emp.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{emp.branch}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Bộ phận: {emp.department || 'CS1'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <Briefcase className="w-3 h-3 text-slate-500" />
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${emp.accessLevel === "admin" ? "bg-purple-100 text-purple-800 border border-purple-200" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                          {emp.accessLevel === "admin" ? "Admin" : "Nhân viên"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isWorking ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-rose-100 text-rose-800 border border-rose-200"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isWorking ? "bg-emerald-600" : "bg-rose-600"}`}></span>
                          {isWorking ? "Đang làm việc" : "Ngừng làm việc"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => handleOpenEdit(emp, e)}
                            className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
                            title="Sửa thông tin"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteSingle(emp, e)}
                            className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-md transition-colors"
                            title="Xóa nhân viên"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white">
            <div className="text-xs text-slate-500">
              Trang <strong className="text-slate-800">{currentPage}</strong> / <strong className="text-slate-800">{totalPages}</strong>
            </div>
            <div className="flex gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="h-8 px-3 bg-white"
              >
                Trước
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 p-0 ${currentPage === pageNum ? "bg-blue-600 text-white" : "bg-white"}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="h-8 px-3 bg-white"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Thêm / Sửa Nhân Viên */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  {editingEmployee ? <Edit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    {editingEmployee ? `Cập nhật nhân viên (${editingEmployee.code})` : "Thêm nhân viên mới"}
                  </h3>
                  <p className="text-xs text-slate-500">Điền thông tin và thiết lập tài khoản làm việc trên hệ thống</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Form) */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tên nhân viên */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tên nhân viên <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="VD: Nguyễn Văn A"
                    value={formData.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!editingEmployee) {
                        const cleanUser = removeVietnameseTones(val);
                        setFormData({ 
                          ...formData, 
                          name: val, 
                          username: cleanUser,
                          password: cleanUser ? `${cleanUser}123` : ""
                        });
                      } else {
                        setFormData({ ...formData, name: val });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition-all"
                  />
                </div>

                {/* SĐT */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="tel" 
                    required
                    placeholder="VD: 0905123456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition-all"
                  />
                </div>

                {/* Username & Password Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tài khoản (Username)
                    </label>
                    <input 
                      type="text" 
                      placeholder="VD: diemquynh"
                      value={formData.username}
                      onChange={(e) => {
                        const val = removeVietnameseTones(e.target.value);
                        setFormData({ 
                          ...formData, 
                          username: val,
                          password: !editingEmployee ? `${val}123` : formData.password
                        });
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition-all font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">💡 Không dấu, viết liền</p>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      {editingEmployee ? "Đặt mật khẩu mới" : "Mật khẩu (Password)"}
                    </label>
                    <input
                      type="text"
                      placeholder={editingEmployee ? "Để trống nếu giữ nguyên mật khẩu cũ" : "VD: diemquynh123"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition-all font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      {editingEmployee ? "🔒 Mật khẩu được mã hóa trước khi lưu, không thể xem lại." : "💡 Mặc định: user + 123"}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email liên hệ
                  </label>
                  <input 
                    type="email" 
                    placeholder="VD: anguyen@2mart.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition-all"
                  />
                </div>

                {/* Vai trò */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Vai trò / Vị trí
                  </label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition-all"
                  >
                    <option value="Nhân viên bán hàng">Nhân viên bán hàng</option>
                    <option value="Thu ngân">Thu ngân</option>
                    <option value="Trưởng cửa hàng">Trưởng cửa hàng</option>
                    <option value="Quản lý kho">Quản lý kho</option>
                    <option value="Nhân viên kiểm kho">Nhân viên kiểm kho</option>
                  </select>
                </div>

                {/* Quyền truy cập */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quyền truy cập hệ thống <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.accessLevel}
                    onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value as "admin" | "staff" })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition-all"
                  >
                    <option value="staff">Nhân viên bán hàng (chỉ thấy dữ liệu của mình)</option>
                    <option value="admin">Admin (thấy toàn bộ hệ thống)</option>
                  </select>
                </div>

                {/* Chi nhánh */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Chi nhánh
                  </label>
                  <select 
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition-all"
                  >
                    <option value="285 Nguyễn Lương Bằng">285 Nguyễn Lương Bằng</option>
                    <option value="Chi nhánh 2">Chi nhánh 2</option>
                    <option value="Chi nhánh 3">Chi nhánh 3</option>
                    <option value="Kho trung tâm">Kho trung tâm</option>
                  </select>
                </div>

                {/* Phòng ban / Bộ phận */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bộ phận / Ca sở trường
                  </label>
                  <select 
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition-all"
                  >
                    <option value="CS1">CS1 (Ca sáng)</option>
                    <option value="CS2">CS2 (Ca chiều)</option>
                    <option value="CS3">CS3 (Ca tối/đêm)</option>
                    <option value="Văn phòng">Văn phòng</option>
                  </select>
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Trạng thái làm việc
                  </label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition-all"
                  >
                    <option value="Đang làm việc">Đang làm việc (Active)</option>
                    <option value="Ngừng làm việc">Ngừng làm việc (Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Ngày vào làm */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ngày tham gia làm việc
                </label>
                <input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  className="w-full md:w-1/2 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition-all"
                />
              </div>

              {/* Tài khoản ngân hàng nhận lương — chỉ Admin được sửa, nhân viên chỉ xem trong hồ sơ */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tài khoản ngân hàng nhận lương
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Tên ngân hàng (VD: Vietcombank)"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition-all"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Số tài khoản"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Tên chủ tài khoản"
                    value={formData.bankAccountHolder}
                    onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition-all"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-5 border-t border-slate-200 flex items-center justify-between shrink-0">
                <div>
                  {editingEmployee && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa nhân viên ${editingEmployee.name}?`)) {
                          deleteEmployee(editingEmployee.code);
                          setIsModalOpen(false);
                        }
                      }}
                      className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium"
                    >
                      <Trash2 className="w-4 h-4" /> Xóa nhân viên này
                    </Button>
                  )}
                </div>
                <div className="flex gap-2.5">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 font-medium bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit"
                    className="px-6 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                  >
                    {editingEmployee ? "Lưu thay đổi" : "Thêm nhân viên"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
