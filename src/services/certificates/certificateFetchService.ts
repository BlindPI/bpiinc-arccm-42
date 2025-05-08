// certificateFetchService.ts

import axios from 'axios';

const API_URL = 'https://api.example.com/certificate-analytics'; // Replace with the actual API endpoint

export const fetchCertificateAnalytics = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching certificate analytics:', error);
        throw error;
    }
};