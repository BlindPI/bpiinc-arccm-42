
import { supabase } from '@/integrations/supabase/client';

export interface ThumbnailResult {
  success: boolean;
  thumbnailUrl?: string;
  cached?: boolean;
  error?: string;
}

export class CertificateThumbnailService {
  static async generateThumbnail(certificateId: string): Promise<ThumbnailResult> {
    try {
      console.log('Calling edge function for certificate:', certificateId);
      
      const { data, error } = await supabase.functions.invoke('generate-certificate-thumbnail', {
        body: { certificateId }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      return data as ThumbnailResult;
    } catch (error: any) {
      console.error('Error generating thumbnail:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate thumbnail'
      };
    }
  }

  static async getThumbnailUrl(certificateId: string): Promise<string | null> {
    try {
      const { data: certificate, error } = await supabase
        .from('certificates')
        .select('thumbnail_url, thumbnail_status')
        .eq('id', certificateId)
        .single();

      if (error || !certificate) {
        console.error('Error fetching certificate:', error);
        return null;
      }

      if (certificate.thumbnail_url && certificate.thumbnail_status === 'completed') {
        return certificate.thumbnail_url;
      }

      // If no thumbnail exists, generate one
      const result = await this.generateThumbnail(certificateId);
      return result.success ? result.thumbnailUrl || null : null;
    } catch (error) {
      console.error('Error getting thumbnail URL:', error);
      return null;
    }
  }

  static async preloadThumbnails(certificateIds: string[]): Promise<void> {
    // Batch generate thumbnails for multiple certificates
    const promises = certificateIds.map(id => this.generateThumbnail(id));
    
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error preloading thumbnails:', error);
    }
  }
}
