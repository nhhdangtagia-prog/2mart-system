import type { DashboardLayout, DashboardWidget } from "../index";
import { WidgetContainer } from "./WidgetContainer";

interface Props {
  layout: DashboardLayout;
  registry: Record<string, DashboardWidget>;
}

export function DashboardRenderer({ layout, registry }: Props) {
  // Demo Layout Engine đơn giản bằng CSS Grid (Chưa tích hợp dnd-kit grid engine phức tạp)
  return (
    <div className={`grid gap-4 ${layout.density === 'compact' ? 'p-2' : 'p-6'}`} 
         style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}>
      
      {layout.widgets.map(wLayout => {
        const widgetConfig = registry[wLayout.id];
        if (!widgetConfig) return null; // Widget không tồn tại trong registry

        return (
          <div 
            key={wLayout.id} 
            style={{ 
              gridColumn: `span ${wLayout.position.w}`,
              gridRow: `span ${wLayout.position.h}`,
              minHeight: `${wLayout.position.h * 100}px`
            }}>
            <WidgetContainer widget={widgetConfig} />
          </div>
        );
      })}
    </div>
  );
}
