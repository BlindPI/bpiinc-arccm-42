
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface DashboardActionButtonProps {
  icon: LucideIcon;
  label: string;
  description: string;
  path: string;
  colorScheme: 'blue' | 'green' | 'purple' | 'amber' | 'red';
}

const colorSchemes = {
  blue: {
    bg: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-900'
  },
  green: {
    bg: 'bg-green-50 hover:bg-green-100',
    border: 'border-green-200',
    icon: 'text-green-600',
    text: 'text-green-900'
  },
  purple: {
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200',
    icon: 'text-purple-600',
    text: 'text-purple-900'
  },
  amber: {
    bg: 'bg-amber-50 hover:bg-amber-100',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    text: 'text-amber-900'
  },
  red: {
    bg: 'bg-red-50 hover:bg-red-100',
    border: 'border-red-200',
    icon: 'text-red-600',
    text: 'text-red-900'
  }
};

export function DashboardActionButton({ 
  icon: Icon, 
  label, 
  description, 
  path, 
  colorScheme 
}: DashboardActionButtonProps) {
  const navigate = useNavigate();
  const colors = colorSchemes[colorScheme];

  const handleClick = () => {
    navigate(path);
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className={`
        h-auto p-4 flex flex-col items-center text-center space-y-2 
        ${colors.bg} ${colors.border} border transition-all duration-200 
        hover:shadow-md hover:scale-105
      `}
    >
      <Icon className={`h-8 w-8 ${colors.icon}`} />
      <div className="space-y-1">
        <div className={`font-semibold ${colors.text}`}>{label}</div>
        <div className="text-xs text-gray-600 leading-tight">{description}</div>
      </div>
    </Button>
  );
}
