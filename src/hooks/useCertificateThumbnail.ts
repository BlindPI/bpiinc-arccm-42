
import { useState, useEffect } from 'react';
import { CertificateThumbnailService } from '@/services/certificates/thumbnailService';

export function useCertificateThumbnail(certificateId: string | undefined) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateThumbnail = async () => {
    if (!certificateId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await CertificateThumbnailService.generateThumbnail(certificateId);
      
      if (result.success) {
        setThumbnailUrl(result.thumbnailUrl || null);
      } else {
        setError(result.error || 'Failed to generate thumbnail');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (certificateId) {
      generateThumbnail();
    }
  }, [certificateId]);

  return {
    thumbnailUrl,
    isLoading,
    error,
    regenerate: generateThumbnail
  };
}
