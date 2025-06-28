
import React from 'react';
import { designTokens } from '../../tokens';

interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'critical' | 'neutral' | 'info';
  size?: 'sm' | 'base' | 'lg';
  showText?: boolean;
  text?: string;
  pulse?: boolean;
}

export function StatusIndicator({
  status,
  size = 'base',
  showText = false,
  text,
  pulse = false,
}: StatusIndicatorProps) {
  const statusConfig = {
    success: {
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      label: 'Success',
    },
    warning: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700', 
      bgColor: 'bg-yellow-50',
      label: 'Warning',
    },
    critical: {
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      label: 'Critical',
    },
    neutral: {
      color: 'bg-gray-500',
      textColor: 'text-gray-700',
      bgColor: 'bg-gray-50',
      label: 'Neutral',
    },
    info: {
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      label: 'Info',
    },
  };

  const sizeConfig = {
    sm: {
      dot: 'h-2 w-2',
      text: 'text-xs',
      padding: 'px-2 py-1',
    },
    base: {
      dot: 'h-3 w-3',
      text: 'text-sm',
      padding: 'px-3 py-1',
    },
    lg: {
      dot: 'h-4 w-4',
      text: 'text-base',
      padding: 'px-4 py-2',
    },
  };

  const config = statusConfig[status];
  const sizing = sizeConfig[size];
  const displayText = text || config.label;

  if (showText) {
    return (
      <span className={`
        inline-flex items-center gap-2 rounded-full
        ${config.bgColor} ${config.textColor}
        ${sizing.padding} ${sizing.text}
        font-medium
      `}>
        <span className={`
          ${sizing.dot} ${config.color} rounded-full
          ${pulse ? 'animate-pulse' : ''}
        `} />
        {displayText}
      </span>
    );
  }

  return (
    <span 
      className={`
        ${sizing.dot} ${config.color} rounded-full inline-block
        ${pulse ? 'animate-pulse' : ''}
      `}
      title={displayText}
    />
  );
}
