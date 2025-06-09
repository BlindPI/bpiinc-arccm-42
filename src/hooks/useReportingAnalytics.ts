
import { useState, useEffect } from 'react';

export const useReportingAnalytics = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  return {
    data,
    isLoading,
    error: null
  };
};
