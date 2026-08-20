import { X, User, Lock, Landmark, Briefcase, Building2, Phone, Mail, Calendar, ShieldCheck } from "lucide-react";
import { Button } from "@2mart/ui";
import { useEmployees } from "../hooks/useEmployees";
import type { Session } from "../hooks/useSession";

interface MyProfileModalProps {
  session: Session;
  onClose: () => void;
}

function Row({ icon: Icon, label, value, mono }: { icon: any; label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-slate-500">{label}</div>
        <div className={`text-sm font-semibold text-slate-800 mt-0.5 break-words ${mono ? "font-mono" : ""}`}>
          {value && value.trim() ? value : <span className="text-slate-400 font-normal italic">Chưa có thông tin</span>}
        </div>
      </div>
    </div>
  );
}

/**
 * Hồ sơ cá nhân — CHỈ XEM. Nhân viên không được tự sửa thông tin của mình (kể cả số tài khoản
 * ngân hàng nhận lương); mọi thay đổi phải do Admin thực hiện ở màn hình Danh sách nhân viên.
 */
export function MyProfileModal({ session, onClose }: MyProfileModalProps) {
  const { employees } = useEmployees();
  const me = employees.find(e => e.code === session.code);
  const isAdmin = session.accessLevel === "admin";

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-lg truncate">{session.name}</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                {me?.role || (isAdmin ? "Quản trị hệ thống" : "Nhân viên")} · {session.code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Thông báo chỉ xem */}
          <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Đây là thông tin <strong>chỉ để xem</strong>. Nếu có sai sót (kể cả số tài khoản ngân
              hàng), vui lòng <strong>báo Quản lý</strong> để được cập nhật — bạn không tự sửa được.
            </p>
          </div>

          {/* Thông tin công việc */}
          <div className="px-5 pt-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Thông tin làm việc</div>
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
              <Row icon={Briefcase} label="Chức vụ" value={me?.role || (isAdmin ? "Quản trị hệ thống" : undefined)} />
              <Row icon={Building2} label="Cơ sở làm việc" value={me?.branch || session.branch} />
              <Row icon={ShieldCheck} label="Trạng thái" value={me?.status || (isAdmin ? "Đang làm việc" : undefined)} />
              <Row icon={Calendar} label="Ngày vào làm" value={me?.joinDate} />
            </div>
          </div>

          {/* Thông tin liên hệ */}
          <div className="px-5 pt-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Thông tin liên hệ</div>
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
              <Row icon={User} label="Tên đăng nhập" value={session.username} mono />
              <Row icon={Phone} label="Số điện thoại" value={me?.phone} mono />
              <Row icon={Mail} label="Email" value={me?.email} />
            </div>
          </div>

          {/* Tài khoản ngân hàng nhận lương */}
          <div className="px-5 pt-4 pb-5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tài khoản ngân hàng nhận lương</div>
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 bg-blue-50/30">
              <Row icon={Landmark} label="Ngân hàng" value={me?.bankName} />
              <Row icon={Landmark} label="Số tài khoản" value={me?.bankAccountNumber} mono />
              <Row icon={User} label="Chủ tài khoản" value={me?.bankAccountHolder} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <Button variant="outline" onClick={onClose} className="px-5 font-medium bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
