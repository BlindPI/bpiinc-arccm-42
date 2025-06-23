
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Mail, AlertCircle, MapPin, User, Edit3, CheckCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmailService } from '@/services/emailService';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface EmailCertificateFormProps {
  certificate: any;
  onClose: () => void;
}

export function EmailCertificateForm({ certificate, onClose }: EmailCertificateFormProps) {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [emailMode, setEmailMode] = useState<'original' | 'custom'>('original');
  const [customEmail, setCustomEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  const originalEmail = certificate.recipient_email;
  const recipientName = certificate.recipient_name;
  
  // AP users can only use original recipient email
  const isAPUser = profile?.role === 'AP';
  const canCustomizeEmail = !isAPUser && profile?.role && ['SA', 'AD'].includes(profile.role);

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

    // Additional validation for custom emails
    if (emailMode === 'custom') {
      if (!customEmail.trim()) {
        setError('Please enter a custom email address');
        return false;
      }
      
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customEmail)) {
        setError('Please enter a valid email address format');
        return false;
      }
    }

    return true;
  };

  const handleSendEmail = async () => {
    if (!validateEmail()) return;

    setIsSending(true);
    setIsSuccess(false);
    setError(null);
    setProgress(0);

    try {
      const emailToSend = getEmailToSend();
      
      // Step 1: Validating
      setCurrentStep('Validating email address...');
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Preparing
      setCurrentStep('Preparing certificate email...');
      setProgress(40);
      
      console.log('Sending certificate email using unified service...', {
        certificateId: certificate.id,
        recipientEmail: emailToSend,
        emailMode
      });

      // Step 3: Sending
      setCurrentStep('Sending email...');
      setProgress(60);

      await EmailService.sendSingleCertificateEmail({
        certificateId: certificate.id,
        recipientEmail: emailToSend,
        message: message || undefined,
        allowEmailOverride: emailMode === 'custom'
      });

      // Step 4: Logging
      setCurrentStep('Updating records...');
      setProgress(80);

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

      // Step 5: Complete
      setCurrentStep('Email sent successfully!');
      setProgress(100);
      setIsSuccess(true);

      console.log('Email sent successfully via unified service');
      toast.success(`Certificate sent successfully to ${emailToSend}`, {
        duration: 4000,
        description: `The certificate for ${certificate.recipient_name} has been delivered.`
      });

      // Invalidate queries to update counts and status
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['certificate-stats'] });
      queryClient.invalidateQueries({ queryKey: ['roster-email-status'] });
      
      // Close after showing success animation
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error sending certificate email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send certificate. Please try again.';
      setError(errorMessage);
      setCurrentStep('');
      setProgress(0);
      toast.error(errorMessage, {
        description: 'Please check the email address and try again.'
      });
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

      {/* Progress Indicator */}
      {isSending && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Send className="h-5 w-5 text-blue-600 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Sending Certificate Email</p>
                <p className="text-xs text-blue-700">{currentStep}</p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Success Animation */}
      {isSuccess && (
        <Card className="bg-green-50 border-green-200 animate-in slide-in-from-top-2 duration-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 animate-in zoom-in-50 duration-300" />
              <div>
                <p className="text-sm font-medium text-green-900">Email Sent Successfully!</p>
                <p className="text-xs text-green-700">Certificate delivered to {getEmailToSend()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

          {/* Custom Email Option - Only for SA/AD users */}
          {canCustomizeEmail && (
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
                  {customEmail && customEmail !== originalEmail && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <p className="text-yellow-800 font-medium">⚠️ Email Override Warning</p>
                      <p className="text-yellow-700 mt-1">
                        This will send the certificate to <strong>{customEmail}</strong> instead of the registered recipient email.
                        Make sure this is the correct recipient to avoid sending certificates to wrong people.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}
          
          {/* AP User Notice */}
          {isAPUser && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Provider Access:</strong> You can only send certificates to the original recipient email address for security and compliance purposes.
                </div>
              </div>
            </div>
          )}
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
          disabled={isSending && !isSuccess}
        >
          {isSuccess ? 'Close' : 'Cancel'}
        </Button>
        <Button
          onClick={handleSendEmail}
          disabled={isSending || !isFormValid() || isSuccess}
          className="flex items-center gap-2"
        >
          {isSuccess ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              Email Sent
            </>
          ) : isSending ? (
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
