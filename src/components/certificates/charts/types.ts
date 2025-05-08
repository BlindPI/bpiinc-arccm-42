
// Define proper types for analytics data
export interface StatusCount {
  status: string;
  count: number;
}

export interface MonthlyData {
  month: string; 
  count: number;
}

export interface CourseData {
  name: string;
  value: number;
  fullName: string;
}

export interface AnalyticsData {
  statusCounts: StatusCount[];
  monthlyData: MonthlyData[];
  topCourses: {
    course_name: string;
    count: number;
  }[];
}

export const CHART_COLORS = [
  '#3498db', // blue
  '#2ecc71', // green
  '#e74c3c', // red
  '#f39c12', // yellow
  '#9b59b6', // purple
  '#1abc9c', // teal
  '#d35400', // orange
  '#34495e', // navy
];

export interface ChartProps {
  data: any[];
  isLoading?: boolean;
  error?: string | null;
}

// More specific chart props interfaces
export interface StatusChartProps extends ChartProps {
  data: { name: string; value: number }[];
}

export interface TimelineChartProps extends ChartProps {
  data: { month: string; count: number }[];
}

export interface CourseDistributionProps extends ChartProps {
  data: { name: string; value: number; fullName: string }[];
}

export interface CoursesChartProps extends ChartProps {
  data: { name: string; value: number; fullName: string }[];
}
