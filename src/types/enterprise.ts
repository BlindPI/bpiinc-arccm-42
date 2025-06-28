
import { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'list';
  data?: any;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  refreshInterval?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  displayName?: string;
  avatar?: string;
  permissions?: string[];
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'boolean';
  options?: { value: string; label: string }[];
}

export interface BulkAction {
  key: string;
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'destructive';
  confirm?: boolean;
}
