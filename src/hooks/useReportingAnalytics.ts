
import { useState, useEffect } from 'react';

export const useReportingAnalytics = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Add missing instructorPerformance property
  const [instructorPerformance, setInstructorPerformance] = useState(null);

  useEffect(() => {
    // Mock instructor performance data
    setInstructorPerformance({
      totalInstructors: 25,
      averageRating: 4.2,
      certificatesIssued: 150,
      complianceRate: 92
    });
  }, []);

  return {
    data,
    isLoading,
    error: null,
    instructorPerformance
  };
};
