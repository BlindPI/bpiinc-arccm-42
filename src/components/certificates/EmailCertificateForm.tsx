
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCertificateOperations } from '@/hooks/useCertificateOperations';
import { sendCertificateNotification } from '@/services/notifications/certificateNotifications';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

interface EmailCertificateFormProps {
  certificate: any;
  onClose: () => void;
}

export function EmailCertificateForm({ certificate, onClose }: EmailCertificateFormProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(`Please find attached the certificate for ${certificate.course_name}, issued to ${certificate.recipient_name}.`);
  const [isSending, setIsSending] = useState(false);
  const { getDownloadUrl } = useCertificateOperations();

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsSending(true);
      
      // Get the download URL for the certificate
      const certificateUrl = certificate.certificate_url 
        ? await getDownloadUrl(certificate.certificate_url)
        : null;
      
      if (!certificateUrl) {
        toast.error('Certificate URL is not available');
        return;
      }

      // Send notification with certificate details
      await sendCertificateNotification({
        recipientEmail: email,
        title: `Certificate for ${certificate.course_name}`,
        message: message,
        actionUrl: certificateUrl,
        courseName: certificate.course_name,
        sendEmail: true,
        type: 'INFO'
      });
      
      toast.success('Certificate sent successfully');
      onClose();
      
    } catch (error) {
      console.error('Error sending certificate:', error);
      toast.error('Failed to send certificate. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSendEmail} className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Certificate Details</h4>
        <div className="bg-muted/50 p-3 rounded-md">
          <p className="text-sm font-medium">{certificate.course_name}</p>
          <p className="text-xs text-muted-foreground">Recipient: {certificate.recipient_name}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Recipient Email</Label>
        <Input 
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a personal message"
          className="min-h-[100px]"
          required
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSending}>
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Certificate
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
