
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
