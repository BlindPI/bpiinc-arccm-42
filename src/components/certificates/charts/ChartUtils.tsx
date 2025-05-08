
import React from 'react';

export const renderNoDataMessage = () => (
  <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
    No data available
  </div>
);

// Safely convert values to strings for chart formatting
export const safeToString = (value: any): string => {
  if (value === null || value === undefined) return 'Unknown';
  return String(value);
};

// Type-specific formatters
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  return value.toString();
};

export const formatDateTime = (value: string | number | Date | null | undefined): string => {
  if (value === null || value === undefined) return 'Unknown';
  if (value instanceof Date) return value.toLocaleString();
  return String(value);
};

// Chart tick formatters - add explicit typing to ensure correct usage
export const stringTickFormatter = (value: any): string => safeToString(value);
export const numberTickFormatter = (value: any): string => formatNumber(Number(value));
