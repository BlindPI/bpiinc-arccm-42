// useCertificateRequests.ts

import { useEffect, useState } from 'react';
import { fetchCertificateAnalytics } from '../services/certificates/certificateFetchService';

const useCertificateRequests = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await fetchCertificateAnalytics();
                setData(result);
            } catch (err) {
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