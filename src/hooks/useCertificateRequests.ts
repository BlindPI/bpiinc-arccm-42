
// useCertificateRequests.ts

import { useEffect, useState } from 'react';
import { fetchCertificateAnalytics } from '../services/certificates/certificateFetchService';
import { AnalyticsData } from '../components/certificates/charts/types';

const useCertificateRequests = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await fetchCertificateAnalytics();
                setData(result);
            } catch (err: any) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
};

export default useCertificateRequests;
