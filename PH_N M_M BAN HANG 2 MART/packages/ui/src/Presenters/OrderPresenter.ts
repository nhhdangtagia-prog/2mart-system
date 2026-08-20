import { useState, useEffect } from "react";
import { orderQueryService, type OrderReadModelDTO } from "@2mart/read-model";

export interface FormattedOrderItem {
  id: string;
  code: string;
  createdAt: string;
  date: string;
  customerName: string;
  customer: string;
  employeeName: string;
  employee: string;
  employeeCode?: string;
  totalStr: string;
  total: number;
  discount: number;
  finalAmount: number;
  paid: number;
  paymentMethodText: string;
  statusText: string;
  status: string;
  statusBadge: string;
  itemsCount: number;
  cash: number;
  transfer: number;
  card: number;
  /** Mốc thời gian dạng số — dùng để lọc chính xác tới phút khi kết ca */
  createdAtMs: number;
  paymentMethod: OrderReadModelDTO["paymentMethod"];
  branch?: string;
  items: { sku: string; name: string; quantity: number; price: number; total: number }[];
}

export class OrderPresenter {
  static formatItem(dto: OrderReadModelDTO): FormattedOrderItem {
    let methodText = "Tiền mặt";
    if (dto.paymentMethod === "TRANSFER") methodText = "Chuyển khoản";
    if (dto.paymentMethod === "CARD") methodText = "Thẻ tín dụng";
    if (dto.paymentMethod === "MIXED") methodText = "Kết hợp";

    const statusText = dto.status === "COMPLETED" ? "Hoàn thành" : "Đã hủy";

    // Ưu tiên số tiền tách thật lưu trên đơn; chỉ suy diễn cho đơn cũ chưa được nâng cấp dữ liệu.
    const hasSplit = dto.cashAmount !== undefined || dto.transferAmount !== undefined || dto.cardAmount !== undefined;
    const cash = hasSplit ? (dto.cashAmount || 0) : (dto.paymentMethod === "CASH" ? dto.totalAmount : 0);
    const transfer = hasSplit ? (dto.transferAmount || 0) : (dto.paymentMethod === "TRANSFER" ? dto.totalAmount : 0);
    const card = hasSplit ? (dto.cardAmount || 0) : (dto.paymentMethod === "CARD" ? dto.totalAmount : 0);

    return {
      id: dto.code || dto.id,
      code: dto.code || dto.id,
      createdAt: dto.createdAt,
      date: dto.createdAt,
      customerName: dto.customerName,
      customer: dto.customerName,
      employeeName: dto.employeeName,
      employee: dto.employeeName,
      employeeCode: dto.employeeCode,
      totalStr: dto.totalAmount.toLocaleString("vi-VN") + " đ",
      total: dto.totalAmount,
      discount: 0,
      finalAmount: dto.totalAmount,
      paid: dto.totalAmount,
      paymentMethodText: methodText,
      statusText,
      status: statusText,
      statusBadge: dto.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800",
      itemsCount: dto.itemsCount,
      cash,
      transfer,
      card,
      createdAtMs: dto.createdAtMs || 0,
      paymentMethod: dto.paymentMethod,
      branch: dto.branch,
      // Ưu tiên chi tiết mặt hàng thật lưu trên đơn; chỉ dựng dòng gộp cho đơn cũ chưa có dữ liệu
      items: dto.items && dto.items.length > 0
        ? dto.items.map(i => ({
            sku: i.sku,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            total: i.price * i.quantity
          }))
        : [
            {
              sku: "POS-ITEM",
              name: "Hàng hóa thanh toán tại quầy",
              quantity: dto.itemsCount,
              price: Math.round(dto.totalAmount / (dto.itemsCount || 1)),
              total: dto.totalAmount
            }
          ]
    };
  }
}

export function useOrderPresenter() {
  const [invoices, setInvoices] = useState<FormattedOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const load = async () => {
    setIsLoading(true);
    const dtos = await orderQueryService.getInvoices();
    setInvoices(dtos.map(OrderPresenter.formatItem));
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    const handleUpdate = () => load();
    window.addEventListener("rm_orders_change", handleUpdate);
    return () => window.removeEventListener("rm_orders_change", handleUpdate);
  }, []);

  return { invoices, isLoading, reload: load };
}
