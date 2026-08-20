import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";

// Export standard recharts components as our UI building blocks
export const ChartContainer = ResponsiveContainer;
export const UIBarChart = BarChart;
export const UILineChart = LineChart;
export const UIBar = Bar;
export const UILine = Line;
export const UIXAxis = XAxis;
export const UIYAxis = YAxis;
export const UITooltip = Tooltip;
export { CartesianGrid, Legend };
