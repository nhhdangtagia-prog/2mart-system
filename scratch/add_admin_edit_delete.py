import os
import re

base_dir = "e:/2 - TỔNG HỢP CÁC DỰ ÁN AGENT/PHẦN MỀM 2 MART CLAUDE/PHẦN MỀM BÁN HÀNG 2 MART/apps/admin/src"
branch_stock_path = os.path.join(base_dir, "utils/branchStock.ts")
purchase_page_path = os.path.join(base_dir, "pages/PurchaseImportPage.tsx")

with open(branch_stock_path, "r", encoding="utf-8") as f:
    bs_content = f.read()

new_bs_functions = """
export function deletePurchaseOrder(orderId: string): void {
  const orders = getPurchaseOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) return;
  const order = orders[index];

  if (order.status === "completed") {
    const map = getBranchStockMap();
    const isCS2 = order.branch === "379b Tôn Đức Thắng";
    order.items.forEach(item => {
      if (map[item.sku]) {
        if (isCS2) map[item.sku].cs2 = Math.max(0, map[item.sku].cs2 - item.quantity);
        else map[item.sku].cs1 = Math.max(0, map[item.sku].cs1 - item.quantity);
      }
    });
    localStorage.setItem(STORAGE_KEY_BRANCH_STOCK, JSON.stringify(map));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("rm_catalog_change"));
  }

  orders.splice(index, 1);
  localStorage.setItem(STORAGE_KEY_PURCHASE_ORDERS, JSON.stringify(orders));
}

export function updatePurchaseOrder(
  orderId: string,
  branch: string,
  supplierName: string,
  supplierCode: string,
  items: PurchaseOrderItem[],
  discount: number = 0,
  paidAmount: number = 0,
  note: string = "",
  isDraft: boolean = false,
  creator: string,
  creatorRole: string,
  importer: string,
  importDate: string,
  discountValue: number = discount,
  discountType: DiscountType = "vnd"
): PurchaseOrder | null {
  const orders = getPurchaseOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) return null;

  const oldOrder = orders[index];

  // Revert old stock if it was completed
  if (oldOrder.status === "completed") {
    const map = getBranchStockMap();
    const isOldCS2 = oldOrder.branch === "379b Tôn Đức Thắng";
    oldOrder.items.forEach(item => {
      if (map[item.sku]) {
        if (isOldCS2) map[item.sku].cs2 = Math.max(0, map[item.sku].cs2 - item.quantity);
        else map[item.sku].cs1 = Math.max(0, map[item.sku].cs1 - item.quantity);
      }
    });
    localStorage.setItem(STORAGE_KEY_BRANCH_STOCK, JSON.stringify(map));
  }

  // Apply new stock if the new state is completed (not draft)
  if (!isDraft) {
    const map = getBranchStockMap();
    const isCS2 = branch === "379b Tôn Đức Thắng";
    items.forEach(item => {
      if (!map[item.sku]) map[item.sku] = { cs1: 50, cs2: 30 };
      if (isCS2) map[item.sku].cs2 += item.quantity;
      else map[item.sku].cs1 += item.quantity;
    });
    localStorage.setItem(STORAGE_KEY_BRANCH_STOCK, JSON.stringify(map));
  }
  
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("rm_catalog_change"));

  const totalAmount = items.reduce((acc, i) => acc + i.amount, 0);
  const netPayable = Math.max(0, totalAmount - discount);

  const updatedOrder: PurchaseOrder = {
    ...oldOrder,
    branch,
    supplierName,
    supplierCode,
    items,
    totalAmount,
    discount,
    discountValue,
    discountType,
    netPayable,
    paidAmount,
    debt: Math.max(0, netPayable - paidAmount),
    note,
    status: isDraft ? "draft" : "completed",
    creator,
    importer,
    importDate,
  };

  updatedOrder.auditLogs = [...(updatedOrder.auditLogs || []), {
    timestamp: new Date().toLocaleString("vi-VN"),
    action: "ADMIN SỬA PHIẾU",
    actor: `${creator} (${creatorRole})`,
    detail: "Quản lý hệ thống đã cập nhật lại thông tin phiếu."
  }];

  orders[index] = updatedOrder;
  localStorage.setItem(STORAGE_KEY_PURCHASE_ORDERS, JSON.stringify(orders));
  return updatedOrder;
}
"""

if "export function deletePurchaseOrder" not in bs_content:
    with open(branch_stock_path, "a", encoding="utf-8") as f:
        f.write(new_bs_functions)

with open(purchase_page_path, "r", encoding="utf-8") as f:
    pp_content = f.read()

# Import the new functions
pp_content = pp_content.replace(
    "import { addStockAfterImport, approvePurchaseOrder, getPurchaseOrders", 
    "import { addStockAfterImport, approvePurchaseOrder, getPurchaseOrders, deletePurchaseOrder, updatePurchaseOrder"
)

# Add editingOrderId state
if "const [editingOrderId, setEditingOrderId]" not in pp_content:
    pp_content = pp_content.replace(
        'const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);',
        'const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);\n  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);'
    )

# Modify handleCreateOrder to handle edit
old_save_code = """const newOrder = addStockAfterImport(
        importBranch,
        currentSupplier.name,
        currentSupplier.code,
        cartItems,
        discount,
        paidAmount,
        note,
        actualIsDraft,
        currentEmployee.name || currentEmployee.username,
        currentEmployee.role || "Nhân viên",
        selectedImporter.name || selectedImporter.username,
        formattedDate,
        catalogProducts.map(p => ({ sku: p.sku, stock: p.stock })),
        discountValue,
        discountType
      );"""

new_save_code = """let newOrder;
      if (editingOrderId) {
        newOrder = updatePurchaseOrder(
          editingOrderId,
          importBranch,
          currentSupplier.name,
          currentSupplier.code,
          cartItems,
          discount,
          paidAmount,
          note,
          actualIsDraft,
          currentEmployee.name || currentEmployee.username,
          currentEmployee.role || "Nhân viên",
          selectedImporter.name || selectedImporter.username,
          formattedDate,
          discountValue,
          discountType
        );
      } else {
        newOrder = addStockAfterImport(
          importBranch,
          currentSupplier.name,
          currentSupplier.code,
          cartItems,
          discount,
          paidAmount,
          note,
          actualIsDraft,
          currentEmployee.name || currentEmployee.username,
          currentEmployee.role || "Nhân viên",
          selectedImporter.name || selectedImporter.username,
          formattedDate,
          catalogProducts.map(p => ({ sku: p.sku, stock: p.stock })),
          discountValue,
          discountType
        );
      }"""
pp_content = pp_content.replace(old_save_code, new_save_code)

# Reset editingOrderId on modal close
pp_content = pp_content.replace(
    'setCartItems([]);',
    'setCartItems([]);\n      setEditingOrderId(null);'
)
pp_content = pp_content.replace(
    'onClick={() => setIsCreateModalOpen(false)}',
    'onClick={() => { setIsCreateModalOpen(false); setEditingOrderId(null); }}'
)

# Add Edit and Delete buttons to Expanded Detail Panel
edit_delete_buttons = """{/* ACTION BUTTONS */}
                                <div className="flex gap-2">
                                  {isManager && (
                                    <>
                                      <Button 
                                        variant="outline"
                                        onClick={() => {
                                          setEditingOrderId(order.id);
                                          setImportBranch(order.branch);
                                          setSelectedSupplierCode(order.supplierCode);
                                          setImporterUsername(employees.find(e => e.name === order.importer)?.username || "");
                                          setImportDateStr(order.importDate.replace(" ", "T").substring(0, 16));
                                          setCartItems(order.items);
                                          setDiscountValue(order.discountValue || 0);
                                          setDiscountType(order.discountType || "vnd");
                                          setPaidAmount(order.paidAmount || 0);
                                          setNote(order.note || "");
                                          setIsCreateModalOpen(true);
                                        }}
                                        className="h-9 px-4 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-semibold"
                                      >
                                        ✏️ Sửa phiếu
                                      </Button>
                                      <Button 
                                        variant="outline"
                                        onClick={() => {
                                          if (confirm("Bạn có chắc chắn muốn xóa phiếu nhập này? Mọi thay đổi tồn kho sẽ được hoàn tác.")) {
                                            deletePurchaseOrder(order.id);
                                            setOrders(getPurchaseOrders());
                                            setExpandedRow(null);
                                            alert("Đã xóa phiếu nhập hàng thành công.");
                                          }
                                        }}
                                        className="h-9 px-4 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold"
                                      >
                                        🗑️ Xóa phiếu
                                      </Button>
                                    </>
                                  )}
                                  {order.status === 'draft' && isManager && (
                                    <Button 
                                      onClick={() => handleApproveOrder(order.id, order.code)}
                                      className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                      Duyệt phiếu & Nhập kho
                                    </Button>
                                  )}
                                </div>"""

old_buttons = """{/* ACTION BUTTONS */}
                                {order.status === 'draft' && isManager && (
                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={() => handleApproveOrder(order.id, order.code)}
                                      className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                      Duyệt phiếu & Nhập kho
                                    </Button>
                                  </div>
                                )}"""

pp_content = pp_content.replace(old_buttons, edit_delete_buttons)

with open(purchase_page_path, "w", encoding="utf-8") as f:
    f.write(pp_content)

print("Done")
