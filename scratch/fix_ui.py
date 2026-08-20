import os
import re

base_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src'

# 1. ProductDetailPanel.tsx
pdp_path = os.path.join(base_path, 'components', 'ProductDetailPanel.tsx')
with open(pdp_path, 'r', encoding='utf-8') as f:
    pdp = f.read()

pdp = pdp.replace('import { useState } from "react";', 'import { useState, useEffect } from "react";')
pdp = pdp.replace('const [activeTab, setActiveTab] = useState("info");', 
'''const [activeTab, setActiveTab] = useState("info");
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  useEffect(() => {
    if (activeTab === "history") {
      getPurchaseOrders().then(orders => {
        setPurchaseHistory(orders.filter(o => o.items.some((i: any) => i.sku === product.sku)));
      });
    }
  }, [activeTab, product.sku]);''')
pdp = pdp.replace('const orders = getPurchaseOrders().filter(o => o.items.some((i: any) => i.sku === product.sku));', 'const orders = purchaseHistory;')
with open(pdp_path, 'w', encoding='utf-8') as f:
    f.write(pdp)

# 2. PurchaseImportPage.tsx
pip_path = os.path.join(base_path, 'pages', 'PurchaseImportPage.tsx')
with open(pip_path, 'r', encoding='utf-8') as f:
    pip = f.read()

pip = pip.replace('const [orders, setOrders] = useState<PurchaseOrder[]>(getPurchaseOrders());', 
'''const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  useEffect(() => {
    getPurchaseOrders().then(setOrders);
  }, []);
  const reloadOrders = () => getPurchaseOrders().then(setOrders);''')
pip = pip.replace('setOrders(getPurchaseOrders());', 'reloadOrders();')
with open(pip_path, 'w', encoding='utf-8') as f:
    f.write(pip)

# 3. InventoryPage.tsx
inv_path = os.path.join(base_path, 'pages', 'InventoryPage.tsx')
with open(inv_path, 'r', encoding='utf-8') as f:
    inv = f.read()

inv = inv.replace('const [transferOrders, setTransferOrders] = useState<TransferOrder[]>(getTransferOrders());', 
'''const [transferOrders, setTransferOrders] = useState<TransferOrder[]>([]);
  useEffect(() => {
    getTransferOrders().then(setTransferOrders);
  }, []);
  const reloadTransfers = () => getTransferOrders().then(setTransferOrders);''')
inv = inv.replace('setTransferOrders(getTransferOrders());', 'reloadTransfers();')
# one more edge case in InventoryPage: 
# onClick={() => { setActiveTab("transfers"); setTransferOrders(getTransferOrders()); }}
# we already replaced setTransferOrders(getTransferOrders()); with reloadTransfers();
# Let's check
with open(inv_path, 'w', encoding='utf-8') as f:
    f.write(inv)

print("UI components updated for async branchStock.")
