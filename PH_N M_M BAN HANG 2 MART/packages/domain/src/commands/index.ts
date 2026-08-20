import type { ICommand } from "@2mart/core";

export interface CartLineItemInput {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export interface CreateOrderPayload {
  customerName?: string;
  employeeName: string;
  employeeCode?: string;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD' | 'MIXED';
  /** Số tiền theo từng hình thức. Bỏ trống thì toàn bộ tiền đơn dồn vào đúng ô theo paymentMethod. */
  cashAmount?: number;
  transferAmount?: number;
  cardAmount?: number;
  branch?: string;
  items: CartLineItemInput[];
  discount: number;
}

export class CreateOrderCommand implements ICommand<{ orderId: string; code: string }> {
  readonly type = "CreateOrderCommand";
  readonly payload: CreateOrderPayload;

  constructor(payload: CreateOrderPayload) {
    this.payload = payload;
  }
}

export class AdjustInventoryCommand implements ICommand<void> {
  readonly type = "AdjustInventoryCommand";
  readonly payload: {
    sku: string;
    quantityDelta: number;
    reason: string;
  };

  constructor(payload: {
    sku: string;
    quantityDelta: number;
    reason: string;
  }) {
    this.payload = payload;
  }
}

export class ReceiveGoodsCommand implements ICommand<void> {
  readonly type = "ReceiveGoodsCommand";
  readonly payload: {
    supplierId: string;
    items: { sku: string; quantity: number; costPrice: number }[];
  };

  constructor(payload: {
    supplierId: string;
    items: { sku: string; quantity: number; costPrice: number }[];
  }) {
    this.payload = payload;
  }
}
