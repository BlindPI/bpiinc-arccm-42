
// certificateFetchService.ts

import axios from 'axios';

const API_URL = 'https://api.example.com/certificate-analytics'; // Replace with the actual API endpoint

// Sample mock data to ensure consistent structure while API is in development
const MOCK_DATA = {
  statusCounts: [
    { status: 'ACTIVE', count: 45 },
    { status: 'EXPIRED', count: 12 },
    { status: 'REVOKED', count: 3 },
    { status: 'PENDING', count: 8 }
  ],
  monthlyData: [
    { month: 'Jan', count: 10 },
    { month: 'Feb', count: 12 },
    { month: 'Mar', count: 8 },
    { month: 'Apr', count: 15 },
    { month: 'May', count: 20 },
    { month: 'Jun', count: 18 }
  ],
  topCourses: [
    { course_name: 'Standard First Aid', count: 25 },
    { course_name: 'Emergency First Aid', count: 18 },
    { course_name: 'CPR BLS', count: 15 },
    { course_name: 'First Responder', count: 10 },
    { course_name: 'Wilderness First Aid', count: 8 }
  ]
};

export const fetchCertificateAnalytics = async () => {
    try {
        // For development, return mock data to ensure consistent format
        // In production, uncomment the actual API call
        // const response = await axios.get(API_URL);
        // return response.data;
        
        console.log('Returning certificate analytics mock data');
        return MOCK_DATA;
    } catch (error) {
        console.error('Error fetching certificate analytics:', error);
        throw error;
    }
};
