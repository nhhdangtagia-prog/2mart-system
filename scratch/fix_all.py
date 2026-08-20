import os
import re

base_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART'

# 1. Update CatalogPresenter to include branchStocks
cp_path = os.path.join(base_path, 'packages', 'ui', 'src', 'Presenters', 'CatalogPresenter.ts')
with open(cp_path, 'r', encoding='utf-8') as f:
    cp = f.read()

cp = cp.replace('imageUrl: string | null;', 'imageUrl: string | null;\n  branchStocks?: { branch: string; stock: number }[];')
cp = cp.replace('imageUrl: dto.imageUrl', 'imageUrl: dto.imageUrl,\n      branchStocks: (dto as any).branchStocks')
cp = cp.replace('CatalogPresenter.formatItem({ ...dto, stock: branchStock })', 'CatalogPresenter.formatItem({ ...dto, stock: branchStock, branchStocks: dto.branchStocks })')
with open(cp_path, 'w', encoding='utf-8') as f:
    f.write(cp)

# 2. Fix InventoryPage
ip_path = os.path.join(base_path, 'apps', 'admin', 'src', 'pages', 'InventoryPage.tsx')
with open(ip_path, 'r', encoding='utf-8') as f:
    ip = f.read()

# handleApproveAlert
ip = ip.replace('const handleApproveAlert = (alert: StockAlert) => {', 'const handleApproveAlert = async (alert: StockAlert) => {')
ip = ip.replace('const currentStock = getProductStockAtBranch(alert.sku, 0, alert.branch);', 'const currentStock = await getProductStockAtBranch(alert.sku, 0, alert.branch);')

# handleCreateTransfer
ip = ip.replace('const handleCreateTransfer = () => {', 'const handleCreateTransfer = async () => {')
ip = ip.replace('const avail = getProductStockAtBranch(item.sku, p?.stock, transferFromBranch);', 'const avail = await getProductStockAtBranch(item.sku, p?.stock || 0, transferFromBranch);')

# render alerts
ip = ip.replace('const currentStock = getProductStockAtBranch(alert.sku, 0, alert.branch);', 'const currentStock = catalogProducts.find(p => p.sku === alert.sku)?.stock ?? 0;')
# wait, replaced above using string replace might hit both if not careful. Let's do regex
with open(ip_path, 'r', encoding='utf-8') as f:
    ip = f.read()

ip = re.sub(r'const handleApproveAlert = \(alert: StockAlert\) => \{', 'const handleApproveAlert = async (alert: StockAlert) => {', ip)
ip = re.sub(r'const currentStock = getProductStockAtBranch\(alert\.sku, 0, alert\.branch\);', 'const currentStock = await getProductStockAtBranch(alert.sku, 0, alert.branch);', ip, count=1)
ip = re.sub(r'const handleCreateTransfer = \(\) => \{', 'const handleCreateTransfer = async () => {', ip)
ip = re.sub(r'const avail = getProductStockAtBranch\(item\.sku, p\?\.stock, transferFromBranch\);', 'const avail = await getProductStockAtBranch(item.sku, p?.stock || 0, transferFromBranch);', ip)

# now the render ones
ip = re.sub(r'const currentStock = getProductStockAtBranch\(alert\.sku, 0, alert\.branch\);', 'const currentStock = catalogProducts.find(x => x.sku === alert.sku)?.stock ?? 0;', ip)
ip = re.sub(r'const branchStock = getProductStockAtBranch\(product\.sku, product\.stock, currentBranch\);', 'const branchStock = product.stock;', ip)
ip = re.sub(r'getProductStockAtBranch\(product\.sku, product\.stock, currentBranch\)', 'product.stock', ip)
ip = re.sub(r'const stock = getProductStockAtBranch\(p\.sku, p\.stock, transferFromBranch\);', 'const stock = p.branchStocks?.find(b => b.branch === transferFromBranch)?.stock ?? p.stock;', ip)
ip = re.sub(r'const maxStock = getProductStockAtBranch\(item\.sku, 50, transferFromBranch\);', 'const pObj = catalogProducts.find(x => x.sku === item.sku); const maxStock = pObj?.branchStocks?.find(b => b.branch === transferFromBranch)?.stock ?? (pObj?.stock ?? 0);', ip)

with open(ip_path, 'w', encoding='utf-8') as f:
    f.write(ip)

# 3. Fix PurchaseImportPage
pip_path = os.path.join(base_path, 'apps', 'admin', 'src', 'pages', 'PurchaseImportPage.tsx')
with open(pip_path, 'r', encoding='utf-8') as f:
    pip = f.read()

# remove deleted utils imports like getProductStockAtBranch if any, but they are not used synchronously here anyway.
# but we had errors like `Property 'netPayable' does not exist on type 'Promise<void>'`
# ah! `updatePurchaseOrder(order.id, {...}).then(() => reloadOrders())` probably?
# If `updatePurchaseOrder` is async, `const res = updatePurchaseOrder(...)`, then `res.netPayable` is wrong.
# Let's fix updatePurchaseOrder usages.
pip = re.sub(r'setOrders\(getPurchaseOrders\(\)\);', 'reloadOrders();', pip)

# In line 210, 212:
# wait, in PurchaseImportPage, did we do `const order = approvePurchaseOrder(...)`?
# approvePurchaseOrder returns void now!
# "alert(`🎉 Đã nhập kho thành công phiếu [${newOrder.code}] (${formatCurrency(newOrder.netPayable)}) vào [${importBranch}]!"
# Here newOrder is returned from savePurchaseOrder. But savePurchaseOrder returns Promise<void>!
# So we need savePurchaseOrder to return Promise<PurchaseOrder>.
bs_path = os.path.join(base_path, 'apps', 'admin', 'src', 'utils', 'branchStock.ts')
with open(bs_path, 'r', encoding='utf-8') as f:
    bs = f.read()
bs = bs.replace('export async function savePurchaseOrder(order: PurchaseOrder): Promise<void> {', 'export async function savePurchaseOrder(order: PurchaseOrder): Promise<PurchaseOrder> {')
bs = bs.replace('window.dispatchEvent(new Event("storage"));\n}', 'window.dispatchEvent(new Event("storage"));\n  return order;\n}')
with open(bs_path, 'w', encoding='utf-8') as f:
    f.write(bs)

# And in PurchaseImportPage.tsx
pip = pip.replace('savePurchaseOrder(newOrder);', 'await savePurchaseOrder(newOrder);')

# the error `Argument of type 'string' is not assignable to parameter of type 'SetStateAction<"379b Tôn Đức Thắng" | "285 Nguyễn Lương Bằng" | "Tất cả chi nhánh">'.`
# at src/pages/PurchaseImportPage.tsx(675,58)
pip = pip.replace('setImportBranch(e.target.value)', 'setImportBranch(e.target.value as any)')

with open(pip_path, 'w', encoding='utf-8') as f:
    f.write(pip)

print("Fixed UI components!")
