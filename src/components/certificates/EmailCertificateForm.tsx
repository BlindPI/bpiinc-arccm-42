
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { CertificateEmailParams } from '@/types/certificates';

interface EmailCertificateFormProps {
  certificate: any;
  onClose: () => void;
}

export function EmailCertificateForm({ certificate, onClose }: EmailCertificateFormProps) {
  const { data: profile } = useProfile();
  const [email, setEmail] = useState(certificate.recipient_email || '');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);

    try {
      // Prepare email parameters
      const emailParams: CertificateEmailParams = {
        certificateId: certificate.id,
        recipientEmail: email,
        message: message || undefined
      };

      // Call a function to send the certificate via email
      const { error } = await supabase.functions.invoke('send-certificate-email', {
        body: emailParams
      });

      if (error) throw error;

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
            reason: `Sent to ${email}`
          });
      } catch (logError) {
        console.error('Error logging certificate email:', logError);
      }
    } catch (error) {
      console.error('Error sending certificate email:', error);
      toast.error('Failed to send certificate. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Send the certificate to the recipient or another email address.
      </p>
      
      <div className="space-y-2">
        <Label htmlFor="recipient-email">Recipient Email</Label>
        <Input
          id="recipient-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="recipient@example.com"
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email-message">Message (Optional)</Label>
        <Textarea
          id="email-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a personal message to accompany the certificate..."
          className="w-full min-h-[100px]"
        />
      </div>
      
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
