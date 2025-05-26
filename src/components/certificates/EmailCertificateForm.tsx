
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { CertificateEmailParams, LocationEmailTemplate } from '@/types/certificates';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmailCertificateFormProps {
  certificate: any;
  onClose: () => void;
}

export function EmailCertificateForm({ certificate, onClose }: EmailCertificateFormProps) {
  const { data: profile } = useProfile();
  const [email, setEmail] = useState(certificate.recipient_email || '');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
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

  // Get available email templates for this location
  const templatesQuery = useQuery({
    queryKey: ['email-templates', certificate.location_id],
    queryFn: async () => {
      if (!certificate.location_id) {
        // Get default templates not tied to a specific location
        const { data, error } = await supabase
          .from('location_email_templates')
          .select('*')
          .is('location_id', null)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        return data || [];
      }
      
      // Get templates for this specific location
      const { data, error } = await supabase
        .from('location_email_templates')
        .select('*')
        .eq('location_id', certificate.location_id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: true
  });

  // Set default template when templates are loaded
  useEffect(() => {
    if (templatesQuery.data && templatesQuery.data.length > 0) {
      // Find default template
      const defaultTemplate = templatesQuery.data.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      } else if (templatesQuery.data[0]) {
        // If no default, use first template
        setSelectedTemplateId(templatesQuery.data[0].id);
      }
    }
  }, [templatesQuery.data]);

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      console.log('Sending certificate email...', {
        certificateId: certificate.id,
        recipientEmail: email,
        templateId: selectedTemplateId
      });

      // Prepare email parameters
      const emailParams: CertificateEmailParams = {
        certificateId: certificate.id,
        recipientEmail: email,
        message: message || undefined,
        templateId: selectedTemplateId
      };

      // Call the edge function to send the certificate via email
      const { data, error } = await supabase.functions.invoke('send-certificate-email', {
        body: emailParams
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to send email');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Email sending failed');
      }

      console.log('Email sent successfully:', data);

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
            email_recipient: email,
            email_template_id: selectedTemplateId
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
        Send the certificate to the recipient or another email address.
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

      {/* Email Template Selection */}
      {templatesQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading email templates...
        </div>
      ) : templatesQuery.data && templatesQuery.data.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="email-template">Email Template</Label>
          <Select 
            value={selectedTemplateId} 
            onValueChange={setSelectedTemplateId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templatesQuery.data.map((template: LocationEmailTemplate) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} {template.is_default && "(Default)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="text-amber-500 text-sm">
          No email templates found. System will use the default template.
        </div>
      )}
      
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
          <p className="text-sm font-medium">Certificate will be sent with the following location details:</p>
          <p className="text-xs">{locationQuery.data.name}</p>
          {locationQuery.data.email && <p className="text-xs">Email: {locationQuery.data.email}</p>}
          {locationQuery.data.phone && <p className="text-xs">Phone: {locationQuery.data.phone}</p>}
          {locationQuery.data.website && (
            <p className="text-xs">Website: <a href={locationQuery.data.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{locationQuery.data.website}</a></p>
          )}
        </div>
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
