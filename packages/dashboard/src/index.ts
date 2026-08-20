import type * as React from 'react';

export interface DashboardWidget {
  id: string;
  title: string;
  permission: string;
  queryKey: string[];
  refreshInterval: number;
  component: React.ElementType;
}

export interface WidgetLayout {
  id: string;
  position: { x: number; y: number; w: number; h: number };
}

export interface DashboardLayout {
  version: number;
  density: 'compact' | 'comfortable';
  widgets: WidgetLayout[];
}

export * from './components/WidgetContainer';
export * from './components/DashboardRenderer';
