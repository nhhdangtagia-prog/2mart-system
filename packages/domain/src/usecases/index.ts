import { orderProjectionRepo } from "@2mart/read-model";
import { CreateOrderCommand, AdjustInventoryCommand, ReceiveGoodsCommand } from "../commands";

export class CreateOrderUseCase {
  async execute(command: CreateOrderCommand): Promise<{ orderId: string; code: string }> {
    const payload = command.payload;
    
    // Calculate total if not provided explicitly
    const subTotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subTotal * 0.015);
    const totalAmount = Math.max(0, subTotal + tax - (payload.discount || 0));

    const orderData = {
      ...payload,
      totalAmount,
      status: 'COMPLETED'
    };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (!res.ok) throw new Error('Failed to create order on server');
    const created = await res.json();
    
    // Trigger UI refresh
    await orderProjectionRepo.save(created.data);
    
    // We also need to deduct stock
    const branch = payload.branch || "379b TĂ´n Äá»©c Tháº¯ng";
    for (const item of payload.items) {
      await fetch('/api/products/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: item.sku,
          branch: branch,
          quantityDelta: -item.quantity,
          reason: `BĂ¡n hĂ ng (ÄÆ¡n ${created.data.code})`
        })
      });
    }

    return { orderId: created.data.id, code: created.data.code };
  }
}

export class AdjustInventoryUseCase {
  async execute(command: AdjustInventoryCommand): Promise<void> {
    const { sku, quantityDelta, reason } = command.payload;
    const currentBranchStr = localStorage.getItem('kiot_current_branch') || "379b TĂ´n Äá»©c Tháº¯ng";
    const branch = currentBranchStr === "Táº¥t cáº£ chi nhĂ¡nh" ? "379b TĂ´n Äá»©c Tháº¯ng" : currentBranchStr;

    await fetch('/api/products/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, branch, quantityDelta, reason })
    });
  }
}

export class ReceiveGoodsUseCase {
  async execute(command: ReceiveGoodsCommand): Promise<void> {
    const currentBranchStr = localStorage.getItem('kiot_current_branch') || "379b TĂ´n Äá»©c Tháº¯ng";
    const branch = currentBranchStr === "Táº¥t cáº£ chi nhĂ¡nh" ? "379b TĂ´n Äá»©c Tháº¯ng" : currentBranchStr;

    for (const item of command.payload.items) {
      await fetch('/api/products/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: item.sku,
          branch,
          quantityDelta: item.quantity,
          reason: 'Nháº­p hĂ ng'
        })
      });
    }
  }
}

