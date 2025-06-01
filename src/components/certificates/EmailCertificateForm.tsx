
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, AlertCircle, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmailService } from '@/services/emailService';

interface EmailCertificateFormProps {
  certificate: any;
  onClose: () => void;
}

export function EmailCertificateForm({ certificate, onClose }: EmailCertificateFormProps) {
  const { data: profile } = useProfile();
  const [email, setEmail] = useState(certificate.recipient_email || '');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get location details if certificate has location_id
  const locationQuery = useQuery({
    queryKey: ['location', certificate.location_id],
    queryFn: async () => {
      if (!certificate.location_id) return null;
      
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', certificate.location_id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!certificate.location_id
  });

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      console.log('Sending certificate email using unified service...', {
        certificateId: certificate.id,
        recipientEmail: email
      });

      await EmailService.sendSingleCertificateEmail({
        certificateId: certificate.id,
        recipientEmail: email,
        message: message || undefined
      });

      console.log('Email sent successfully via unified service');
      toast.success('Certificate sent successfully');
      onClose();
      
      // Log this action
      try {
        await supabase
          .from('certificate_audit_logs')
          .insert({
            certificate_id: certificate.id,
            action: 'EMAILED',
            performed_by: profile?.id,
            reason: `Sent to ${email}`,
            email_recipient: email
          });
      } catch (logError) {
        console.error('Error logging certificate email:', logError);
      }
    } catch (error) {
      console.error('Error sending certificate email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send certificate. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Send the certificate to the recipient or another email address. The system will automatically use the appropriate email template based on the certificate's location.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="recipient-email">Recipient Email</Label>
        <Input
          id="recipient-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          placeholder="recipient@example.com"
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email-message">Additional Message (Optional)</Label>
        <Textarea
          id="email-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a personal message to accompany the certificate..."
          className="w-full min-h-[100px]"
        />
      </div>

      {/* Location information (if available) */}
      {locationQuery.data && (
        <div className="bg-muted/50 rounded p-3 space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Email will be sent using this location's template:</p>
          </div>
          <p className="text-sm font-semibold">{locationQuery.data.name}</p>
          {locationQuery.data.email && <p className="text-xs">Contact: {locationQuery.data.email}</p>}
          {locationQuery.data.phone && <p className="text-xs">Phone: {locationQuery.data.phone}</p>}
          {locationQuery.data.website && (
            <p className="text-xs">Website: <a href={locationQuery.data.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{locationQuery.data.website}</a></p>
          )}
        </div>
      )}

      {!certificate.location_id && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This certificate has no associated location. The system will use the default email template.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-end gap-2 mt-4">
        <Button 
          variant="outline" 
          onClick={onClose}
          disabled={isSending}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSendEmail}
          disabled={isSending || !email}
          className="flex items-center gap-2"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              Send Certificate
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
