
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { CertificateEmailParams, LocationEmailTemplate } from '@/types/certificates';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface EmailCertificateFormProps {
  certificate: any;
  onClose: () => void;
}

// Create a query client specifically for this component
const queryClient = new QueryClient();

export function EmailCertificateForm({ certificate, onClose }: EmailCertificateFormProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <EmailCertificateFormContent certificate={certificate} onClose={onClose} />
    </QueryClientProvider>
  );
}

function EmailCertificateFormContent({ certificate, onClose }: EmailCertificateFormProps) {
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const [email, setEmail] = useState(certificate.recipient_email || '');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Display profile error if present
  useEffect(() => {
    if (profileError) {
      console.error('Profile error:', profileError);
      setError('Unable to access your profile. Please try refreshing the page.');
    }
  }, [profileError]);

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
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if profile is loaded
    if (profileLoading) {
      toast.error('User profile is still loading. Please try again.');
      return;
    }
    
    if (profileError) {
      toast.error('Could not access your profile. Please refresh and try again.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Prepare email parameters
      const emailParams: CertificateEmailParams = {
        certificateId: certificate.id,
        recipientEmail: email,
        message: message || undefined,
        templateId: selectedTemplateId
      };

      // Call the improved edge function to send the certificate via email
      const { data, error } = await supabase.functions.invoke('send-certificate-email', {
        body: emailParams
      });

      if (error) throw error;

      // Update certificate email status
      await supabase
        .from('certificates')
        .update({
          email_status: 'SENT',
          last_emailed_at: new Date().toISOString()
        })
        .eq('id', certificate.id);

      toast.success('Certificate sent successfully');
      onClose();
      
      // Log this action if profile is available
      if (profile?.id) {
        try {
          await supabase
            .from('certificate_audit_logs')
            .insert({
              certificate_id: certificate.id,
              action: 'EMAILED',
              performed_by: profile.id,
              reason: `Sent to ${email}`,
              email_recipient: email,
              email_template_id: selectedTemplateId
            });
        } catch (logError) {
          console.error('Error logging certificate email:', logError);
        }
      }
    } catch (error) {
      console.error('Error sending certificate email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`Failed to send certificate: ${errorMessage}`);
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
        <div className="bg-red-50 p-3 rounded text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
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
          disabled={isSending || !email || profileLoading || !!profileError}
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
