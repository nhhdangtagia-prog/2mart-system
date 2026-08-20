import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
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
import { EmployeeSettingsPage } from "./pages/EmployeeSettingsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PurchaseImportPage } from "./pages/PurchaseImportPage";
import { LoginPage } from "./pages/LoginPage";
import { useSession } from "./hooks/useSession";
import { registerCommandHandlers, registerEventListeners } from "@2mart/domain";
import { initAndSyncRealData } from "./utils/seeder";
import { migrateOrders } from "./utils/orderMigration";

function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-background)] text-slate-800 font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-[#f0f2f5]">
          <Routes>
            {/* Nhân viên cũng xem được Tổng quan — DashboardPage tự lọc chỉ hiện giao dịch của chính họ */}
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/employees/list" element={<EmployeeListPage />} />
            <Route path="/employees/schedule" element={<SchedulePage />} />
            <Route path="/employees/timesheet" element={<TimesheetPage />} />
            <Route path="/employees/payroll" element={<PayrollPage />} />
            <Route path="/employees/settings" element={<EmployeeSettingsPage />} />
            <Route path="/suppliers" element={<SupplierListPage />} />
            <Route path="/orders/invoices" element={<InvoiceListPage />} />
            <Route path="/purchase/import" element={<PurchaseImportPage />} />
            <Route path="/customers" element={<div className="p-6">Đối tác (To be built)</div>} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const { session } = useSession();

  useEffect(() => {
    registerCommandHandlers();
    registerEventListeners();

    // Tự động đồng bộ & liên kết dữ liệu chuẩn KiotViet giữa Hàng hóa, Bán hàng, Báo cáo (v2 migration)
    const isSynced = localStorage.getItem("kiot_sync_v2");
    initAndSyncRealData(!isSynced).then(() => {
      if (!isSynced) {
        localStorage.setItem("kiot_sync_v2", "true");
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
