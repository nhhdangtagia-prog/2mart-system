import * as React from "react";
import type { DashboardWidget } from "../index";

interface Props {
  widget: DashboardWidget;
}

// ErrorBoundary hiển thị chi tiết lỗi để dễ dàng debug
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error?: Error}> {
  state = { hasError: false, error: undefined as Error | undefined };
  
  static getDerivedStateFromError(error: Error) { 
    return { hasError: true, error }; 
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Widget Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border-2 border-red-500 bg-red-950/10 text-red-600 rounded-xl h-full flex flex-col items-center justify-center text-sm space-y-2">
          <span className="text-2xl">⚠️</span>
          <strong className="font-bold text-base">Lỗi tải Widget</strong>
          <div className="bg-white/80 p-2 rounded border border-red-200 text-xs font-mono text-red-700 max-w-md text-center overflow-auto max-h-32">
            {this.state.error?.message || String(this.state.error) || "Lỗi không xác định"}
          </div>
          <button 
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-2xs"
          >
            🔄 Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function WidgetContainer({ widget }: Props) {
  const Component = widget.component;
  
  // Giả lập Role permission (Owner luôn xem được)
  const hasPermission = true; 

  if (!hasPermission) {
    return (
      <div className="p-4 border border-slate-800 bg-slate-900 text-slate-500 rounded-xl h-full flex flex-col items-center justify-center text-sm">
        <span className="text-2xl mb-2">🔒</span>
        Không có quyền truy cập
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div className="animate-pulse bg-slate-100 rounded-xl w-full h-full min-h-[250px] flex items-center justify-center text-slate-400 font-bold text-xs">Đang tải biểu đồ...</div>}>
        <div className="relative h-full w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm">{widget.title}</h3>
            <button className="text-slate-400 hover:text-slate-600 text-xs font-bold">•••</button>
          </div>
          {/* Body */}
          <div className="flex-1 p-4 overflow-hidden text-slate-800 flex flex-col">
             <Component />
          </div>
        </div>
      </React.Suspense>
    </ErrorBoundary>
  );
}
