
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardNavigationService } from '@/services/navigation/dashboardNavigationService';

interface DashboardActionButtonProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  path: string;
  colorScheme: 'blue' | 'green' | 'purple' | 'amber' | 'teal' | 'red';
  badge?: number;
  disabled?: boolean;
}

export const DashboardActionButton: React.FC<DashboardActionButtonProps> = ({
  icon: Icon,
  label,
  description,
  path,
  colorScheme,
  badge,
  disabled = false
}) => {
  const navigate = useNavigate();

  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800',
    green: 'bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-800',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-800',
    amber: 'bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-800',
    teal: 'bg-teal-50 hover:bg-teal-100 text-teal-600 hover:text-teal-800',
    red: 'bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800'
  };

  const handleClick = () => {
    if (disabled) return;
    DashboardNavigationService.navigateWithTransition(navigate, path);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative p-4 rounded-lg flex flex-col items-center justify-center 
        transition-all duration-200 hover:scale-105 hover:shadow-md
        ${colorClasses[colorScheme]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        animate-fade-in
      `}
      title={description}
    >
      {badge && badge > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      
      <Icon className="h-6 w-6 mb-2" />
      <span className="text-sm font-medium text-center leading-tight">{label}</span>
      
      {description && (
        <span className="text-xs opacity-80 text-center mt-1 max-w-full truncate">
          {description}
        </span>
      )}
    </button>
  );
};
