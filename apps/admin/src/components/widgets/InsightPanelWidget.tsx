import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

export function InsightPanelWidget() {
  const insights = [
    {
      id: 1,
      type: 'critical',
      title: 'Sắp hết Coca Cola 320ml',
      message: 'Tồn kho chỉ còn 12 lốc. Tốc độ bán hiện tại sẽ hết trong 2 ngày.',
      action: 'Tạo PO nhập hàng'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Doanh thu đồ uống giảm',
      message: 'Giảm 12% so với tuần trước. Đề xuất chạy chương trình mua 2 tặng 1.',
      action: 'Xem đề xuất'
    },
    {
      id: 3,
      type: 'info',
      title: 'Khách VIP quay lại',
      message: 'Anh Tuấn (090xxxx123) vừa mua hàng sau 2 tháng. Hãy gửi Voucher chăm sóc.',
      action: 'Gửi Zalo ZNS'
    },
    {
      id: 4,
      type: 'success',
      title: 'Dự phóng doanh thu',
      message: 'Đã đạt 85% mục tiêu tháng. Dự kiến vượt 15% vào cuối tháng.',
      action: 'Xem chi tiết'
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default: return null;
    }
  };

  const getBgClass = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'success': return 'bg-emerald-50 border-emerald-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto pr-1">
      <div className="space-y-3">
        {insights.map(item => (
          <div key={item.id} className={`p-3 rounded-lg border ${getBgClass(item.type)}`}>
            <div className="flex gap-3">
              <div className="mt-0.5">{getIcon(item.type)}</div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{item.message}</p>
                <div className="mt-2 text-xs">
                  <button className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                    {item.action} →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
