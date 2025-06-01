
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Mail, AlertCircle, MapPin, User, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmailService } from '@/services/emailService';
import { Card, CardContent } from '@/components/ui/card';

interface EmailCertificateFormProps {
  certificate: any;
  onClose: () => void;
}

export function EmailCertificateForm({ certificate, onClose }: EmailCertificateFormProps) {
  const { data: profile } = useProfile();
  const [emailMode, setEmailMode] = useState<'original' | 'custom'>('original');
  const [customEmail, setCustomEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalEmail = certificate.recipient_email;
  const recipientName = certificate.recipient_name;

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

  const getEmailToSend = () => {
    return emailMode === 'original' ? originalEmail : customEmail;
  };

  const validateEmail = () => {
    const emailToSend = getEmailToSend();
    
    if (!emailToSend || !emailToSend.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (emailMode === 'custom' && customEmail === originalEmail) {
      setError('Custom email is the same as the original recipient email');
      return false;
    }

    return true;
  };

  const handleSendEmail = async () => {
    if (!validateEmail()) return;

    setIsSending(true);
    setError(null);

    try {
      const emailToSend = getEmailToSend();
      
      console.log('Sending certificate email using unified service...', {
        certificateId: certificate.id,
        recipientEmail: emailToSend,
        emailMode
      });

      await EmailService.sendSingleCertificateEmail({
        certificateId: certificate.id,
        recipientEmail: emailToSend,
        message: message || undefined
      });

      console.log('Email sent successfully via unified service');
      toast.success(`Certificate sent successfully to ${emailToSend}`);
      onClose();
      
      // Log this action
      try {
        await supabase
          .from('certificate_audit_logs')
          .insert({
            certificate_id: certificate.id,
            action: 'EMAILED',
            performed_by: profile?.id,
            reason: `Sent to ${emailToSend} (${emailMode === 'original' ? 'original' : 'custom'} email)`,
            email_recipient: emailToSend
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

  const handleEmailModeChange = (value: string) => {
    setEmailMode(value as 'original' | 'custom');
    setError(null);
    if (value === 'original') {
      setCustomEmail('');
    }
  };

  const isFormValid = () => {
    if (emailMode === 'original') {
      return !!originalEmail;
    } else {
      return !!customEmail && customEmail.includes('@') && customEmail !== originalEmail;
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Send the certificate to the recipient. Choose whether to use the email on file or send to a different address.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Recipient Information */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium">Certificate Recipient</span>
          </div>
          <p className="text-sm font-semibold">{recipientName}</p>
          {originalEmail && (
            <p className="text-xs text-muted-foreground">Email on file: {originalEmail}</p>
          )}
        </CardContent>
      </Card>

      {/* Email Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Email Delivery Options</Label>
        
        <RadioGroup value={emailMode} onValueChange={handleEmailModeChange} className="space-y-3">
          {/* Original Email Option */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="original" id="original" className="mt-1" disabled={!originalEmail} />
            <div className="flex-1">
              <Label htmlFor="original" className="flex items-center gap-2 cursor-pointer">
                <Mail className="h-4 w-4" />
                Send to original recipient
              </Label>
              <div className="mt-1">
                {originalEmail ? (
                  <p className="text-sm text-muted-foreground">
                    Will send to: <span className="font-medium">{originalEmail}</span>
                  </p>
                ) : (
                  <p className="text-sm text-destructive">No email address on file for this recipient</p>
                )}
              </div>
            </div>
          </div>

          {/* Custom Email Option */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="custom" id="custom" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="custom" className="flex items-center gap-2 cursor-pointer">
                <Edit3 className="h-4 w-4" />
                Send to a different email address
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Use this option if the recipient's email has changed or for forwarding
              </p>
              
              {emailMode === 'custom' && (
                <div className="mt-3">
                  <Input
                    type="email"
                    value={customEmail}
                    onChange={(e) => {
                      setCustomEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter email address..."
                    className="w-full"
                  />
                  {customEmail === originalEmail && (
                    <p className="text-xs text-orange-600 mt-1">
                      This is the same as the original email address
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </RadioGroup>
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
      
      <div className="flex justify-end gap-2 mt-6">
        <Button 
          variant="outline" 
          onClick={onClose}
          disabled={isSending}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSendEmail}
          disabled={isSending || !isFormValid()}
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
