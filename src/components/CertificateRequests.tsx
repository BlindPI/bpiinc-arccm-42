// CertificateRequests.tsx

import React from 'react';
import useCertificateRequests from '../hooks/useCertificateRequests';

const CertificateRequests = () => {
    const { data, loading, error } = useCertificateRequests();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error fetching data: {error.message}</div>;
    }

    return (
        <div>
            <h1>Certificate Analytics</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
};

export default CertificateRequests;