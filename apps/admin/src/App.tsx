import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { DashboardPage } from "./pages/DashboardPage";
import { InventoryPage } from "./pages/InventoryPage";
import { PosPage } from "./pages/PosPage";
import { InvoiceListPage } from "./pages/InvoiceListPage";
import { SupplierListPage } from "./pages/SupplierListPage";
import { EmployeeListPage } from "./pages/EmployeeListPage";
import { SchedulePage } from "./pages/SchedulePage";
import { TimesheetPage } from "./pages/TimesheetPage";
import { PayrollPage } from "./pages/PayrollPage";
import { SalaryAdvancePage } from "./pages/SalaryAdvancePage";
import { EmployeeSettingsPage } from "./pages/EmployeeSettingsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PurchaseImportPage } from "./pages/PurchaseImportPage";
import { CashbookPage } from "./pages/CashbookPage";
import { LoginPage } from "./pages/LoginPage";
import KaraboxPage from "./pages/KaraboxPage";
import { useSession } from "./hooks/useSession";
import { registerCommandHandlers, registerEventListeners } from "@2mart/domain";
import { initAndSyncRealData } from "./utils/seeder";
import { migrateOrders } from "./utils/orderMigration";

function AdminLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--color-background)] text-slate-800 font-sans">
      <Header />
      <main className="flex-1 overflow-y-auto bg-[#f0f2f5]">
          <Routes>
            {/* Nhân viên cũng xem được Tổng quan — DashboardPage tự lọc chỉ hiện giao dịch của chính họ */}
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inventory/audit" element={<InventoryPage />} />
            <Route path="/employees/list" element={<EmployeeListPage />} />
            <Route path="/employees/schedule" element={<SchedulePage />} />
            <Route path="/employees/timesheet" element={<TimesheetPage />} />
            <Route path="/employees/payroll" element={<PayrollPage />} />
            <Route path="/employees/salary-advances" element={<SalaryAdvancePage />} />
            <Route path="/employees/settings" element={<EmployeeSettingsPage />} />
            <Route path="/suppliers" element={<SupplierListPage />} />
            <Route path="/orders/invoices" element={<InvoiceListPage />} />
            <Route path="/purchase/import" element={<PurchaseImportPage />} />
            <Route path="/cashbook/receipts" element={<CashbookPage />} />
            <Route path="/cashbook/payments" element={<CashbookPage />} />
            <Route path="/cashbook/report" element={<CashbookPage />} />
            <Route path="/karabox" element={<KaraboxPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
    </div>
  );
}

function App() {
  const { session } = useSession();

  useEffect(() => {
    registerCommandHandlers();
    registerEventListeners();

    // Tự động đồng bộ & liên kết dữ liệu chuẩn KiotViet giữa Hàng hóa, Bán hàng, Báo cáo (v2 migration)
    const isSynced = localStorage.getItem("kiot_sync_v7");
    
    // Xóa bỏ dữ liệu chấm công & lịch làm việc demo (nếu có) để hệ thống chạy với dữ liệu thực
    if (!localStorage.getItem("kiot_mock_timesheet_purged")) {
      localStorage.removeItem("kiot_rm_timesheet_v2");
      localStorage.removeItem("kiot_rm_schedule_v2");
      localStorage.setItem("kiot_mock_timesheet_purged", "true");
      console.log("✅ PURGED MOCK TIMESHEET DATA!");
    }

    initAndSyncRealData(!isSynced).then(() => {
      if (!isSynced) {
        localStorage.setItem("kiot_sync_v7", "true");
        window.dispatchEvent(new Event("rm_catalog_change"));
        window.dispatchEvent(new Event("rm_orders_change"));
        window.dispatchEvent(new Event("rm_analytics_change"));
      }
      // Bổ sung mốc thời gian dạng số + số tiền tách theo hình thức cho các đơn cũ (cần cho Kết ca)
      migrateOrders();
    });
  }, []);

  if (!session) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/pos/*" element={<PosPage />} />
        <Route path="/*" element={<AdminLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
