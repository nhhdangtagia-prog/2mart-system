import type { DashboardLayout, DashboardWidget } from "../index";
import { WidgetContainer } from "./WidgetContainer";

interface Props {
  layout: DashboardLayout;
  registry: Record<string, DashboardWidget>;
}

export function DashboardRenderer({ layout, registry }: Props) {
  return (
    <>
      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
        }
        .dashboard-widget {
          /* Mobile: 100% width cho TẤT CẢ các thẻ để không bị bóp méo chữ */
          grid-column: span 12;
          grid-row: span var(--h-desktop);
          min-height: calc(var(--h-desktop) * 100px);
        }
        @media (min-width: 768px) {
          .dashboard-widget {
            grid-column: span var(--w-tablet, 12);
          }
        }
        @media (min-width: 1024px) {
          .dashboard-widget {
            grid-column: span var(--w-desktop);
          }
        }
      `}</style>
      
      <div className={`dashboard-grid gap-4 ${layout.density === 'compact' ? 'p-2' : 'p-2 sm:p-4 lg:p-6'}`}>
        {layout.widgets.map(wLayout => {
          const widgetConfig = registry[wLayout.id];
          if (!widgetConfig) return null;

          // Tablet: KPI chiếm 50% (span 6), các biểu đồ chiếm 100% (span 12)
          const isKpi = wLayout.id.startsWith('kpi.');
          const tabletW = isKpi ? 6 : 12;

          return (
            <div 
              key={wLayout.id} 
              className="dashboard-widget"
              style={{ 
                '--w-desktop': wLayout.position.w,
                '--w-tablet': tabletW,
                '--h-desktop': wLayout.position.h,
              } as React.CSSProperties}>
              <WidgetContainer widget={widgetConfig} />
            </div>
          );
        })}
      </div>
    </>
  );
}
