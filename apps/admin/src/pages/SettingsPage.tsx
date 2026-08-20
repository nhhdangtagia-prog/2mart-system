import { useState, useEffect } from "react";
import { Button } from "@2mart/ui";
import { Printer, Settings as SettingsIcon, Save, Play, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { runAllCqrsTests, type TestResult } from "@2mart/domain";
import { useAdminAccount } from "../hooks/useAdminAccount";

export function SettingsPage() {
  const [paperSize, setPaperSize] = useState("K80");
  const [autoPrint, setAutoPrint] = useState(true);
  const [storeName, setStoreName] = useState("2Mart Supermarket");
  const [storeAddress, setStoreAddress] = useState("285 Nguyễn Lương Bằng, Đống Đa, Hà Nội");
  const [storePhone, setStorePhone] = useState("1900 6522");
  const [receiptFooter, setReceiptFooter] = useState("Cảm ơn Quý khách & Hẹn gặp lại!");
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const { account: adminAccount, updateAccount: updateAdminAccount } = useAdminAccount();
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminSaveMsg, setAdminSaveMsg] = useState("");

  // Đồng bộ username hiện tại khi tài khoản Admin tải xong (mật khẩu không thể hiển thị lại vì đã băm)
  useEffect(() => {
    if (adminAccount) setAdminUsername(adminAccount.username);
  }, [adminAccount]);

  const handleSaveAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim()) return;
    await updateAdminAccount({
      username: adminUsername.trim(),
      password: adminPassword.trim() || undefined
    });
    setAdminPassword("");
    setAdminSaveMsg("Đã cập nhật tài khoản Admin!");
    setTimeout(() => setAdminSaveMsg(""), 3000);
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    const res = await runAllCqrsTests();
    setTestResults(res);
    setIsRunningTests(false);
  };

  // Load existing settings from DB and localStorage
  useEffect(() => {
    // 1. Fetch from DB
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          if (data.paperSize) setPaperSize(data.paperSize);
          if (data.autoPrint !== undefined) setAutoPrint(data.autoPrint === 'true' || data.autoPrint === true);
          if (data.storeName) setStoreName(data.storeName);
          if (data.storeAddress) setStoreAddress(data.storeAddress);
          if (data.storePhone) setStorePhone(data.storePhone);
          if (data.receiptFooter) setReceiptFooter(data.receiptFooter);
        } else {
          // 2. Fallback to localStorage if DB empty
          const saved = localStorage.getItem("pos_settings");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.paperSize) setPaperSize(parsed.paperSize);
              if (parsed.autoPrint !== undefined) setAutoPrint(parsed.autoPrint);
              if (parsed.storeName) setStoreName(parsed.storeName);
              if (parsed.storeAddress) setStoreAddress(parsed.storeAddress);
              if (parsed.storePhone) setStorePhone(parsed.storePhone);
              if (parsed.receiptFooter) setReceiptFooter(parsed.receiptFooter);
            } catch (e) {}
          }
        }
      })
      .catch(console.error);
  }, []);

  const saveSettings = async () => {
    const settings = { paperSize, autoPrint, storeName, storeAddress, storePhone, receiptFooter };
    // Save to DB
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
    } catch (e) {
      console.error(e);
    }
    // Also save to localStorage for fallback
    localStorage.setItem("pos_settings", JSON.stringify(settings));
    alert("Lưu thiết lập thành công!");
  };

  return (
    <div className="w-full p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          Thiết lập hệ thống
        </h1>
        <Button onClick={saveSettings} className="gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
          <Save className="w-4 h-4" /> Lưu thay đổi
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Print Settings */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-500" /> Tài khoản Admin
            </div>
            <form onSubmit={handleSaveAdminAccount} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Tài khoản Admin cao nhất, tách biệt khỏi danh sách Nhân viên — dùng để đăng nhập vào toàn bộ hệ thống quản trị.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Tài khoản (Username)</label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Mật khẩu</label>
                  <input
                    type="text"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" className="gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                  <Save className="w-4 h-4" /> Lưu tài khoản Admin
                </Button>
                {adminSaveMsg && <span className="text-sm text-emerald-600 font-medium">{adminSaveMsg}</span>}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-slate-700 flex items-center gap-2">
              <Printer className="w-5 h-5 text-slate-500" /> Thiết lập Máy in & Mẫu In
            </div>
            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Khổ giấy in (Paper Size)</label>
                  <select 
                    value={paperSize} 
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="K80">K80 (80mm - Dành cho siêu thị)</option>
                    <option value="K58">K58 (58mm - Dành cho máy POS mini)</option>
                    <option value="A4">A4 (In laser)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tự động in sau khi thanh toán</label>
                  <div className="flex items-center h-10">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoPrint} 
                        onChange={(e) => setAutoPrint(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative"></div>
                      <span className="ml-3 text-sm font-medium text-slate-700">Kích hoạt</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-4">Thông tin Hóa đơn (Header & Footer)</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Tên cửa hàng</label>
                    <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Địa chỉ</label>
                      <input type="text" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Điện thoại</label>
                      <input type="text" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Lời chào cuối trang (Footer)</label>
                    <input type="text" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>

              {/* CQRS Verification Suite */}
              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">Kiểm thử & Xác nhận Kiến trúc CQRS (CTO Verification Suite)</h4>
                    <p className="text-xs text-slate-500">Kiểm tra Replay 1000 sự kiện, Idempotency, Out of Order & Offline Sync Queue</p>
                  </div>
                  <Button 
                    onClick={handleRunTests} 
                    disabled={isRunningTests}
                    className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                  >
                    <Play className="w-4 h-4" /> {isRunningTests ? "Đang chạy kiểm thử..." : "Chạy Kiểm Thử CQRS"}
                  </Button>
                </div>

                {testResults && (
                  <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="text-xs font-semibold text-slate-600 uppercase mb-2">Kết quả kiểm thử tự động</div>
                    {testResults.map((r, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded border border-slate-200 text-xs">
                        {r.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-semibold text-slate-800">{r.name}: </span>
                          <span className={r.passed ? "text-emerald-700" : "text-red-700"}>{r.details}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="col-span-1">
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 h-full flex flex-col">
            <div className="text-sm font-semibold text-slate-500 mb-4 text-center uppercase">Bản xem trước Hóa đơn ({paperSize})</div>
            <div className="bg-white mx-auto shadow-md overflow-hidden text-black font-mono text-xs p-4" style={{ width: paperSize === 'K80' ? '300px' : paperSize === 'K58' ? '220px' : '100%' }}>
              <div className="text-center mb-4 border-b border-dashed border-gray-400 pb-2">
                <h2 className="font-bold text-base">{storeName}</h2>
                <p>{storeAddress}</p>
                <p>ĐT: {storePhone}</p>
              </div>
              <h3 className="text-center font-bold text-sm mb-2">HÓA ĐƠN BÁN LẺ</h3>
              <div className="flex justify-between mb-4">
                <span>Số: HD0001</span>
                <span>{new Date().toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
                <div className="flex justify-between font-bold">
                  <span>Sản phẩm</span>
                  <span>TT</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Trà xanh Wonderfarm x2</span>
                  <span>30,000</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-sm mt-4">
                <span>TỔNG TIỀN</span>
                <span>30,000</span>
              </div>
              <div className="text-center mt-6 border-t border-dashed border-gray-400 pt-2">
                <p>{receiptFooter}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
