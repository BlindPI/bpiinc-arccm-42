import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Certificate = {
  id: string;
  recipient_name: string;
  email?: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  verification_code: string;
};

export function BatchCertificateEmailForm() {
  const { user } = useAuth();
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState('Your Certificate is Ready');
  const [emailTemplate, setEmailTemplate] = useState(
    'Dear {{recipient_name}},\n\nYour certificate for {{course_name}} is now available. ' +
    'You can download it using the link below.\n\nCertificate Link: {{certificate_url}}\n\n' +
    'This certificate is valid until {{expiry_date}}.\n\nThank you,\nThe Certification Team'
  );
  const [sendingEmails, setSendingEmails] = useState(false);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);

  // Properly typed query to avoid status property errors
  const certificatesQuery = useQuery<Certificate[]>({
    queryKey: ['certificates', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return [];
      
      // Use a more direct approach to avoid deep type instantiation issues
      const fetchCertificates = async (): Promise<Certificate[]> => {
        // Use any to bypass the deep type instantiation issue
        const client: any = supabase;
        const result = await client
          .from('certificates')
          .select('*')
          .eq('batch_id', selectedBatchId);
        
        if (result.error) throw result.error;
        return (result.data || []) as Certificate[];
      };
      
      return fetchCertificates();
    },
    enabled: !!selectedBatchId
  });

  // Correctly access the query state properties
  const isLoading = certificatesQuery.isPending;
  const isError = certificatesQuery.isError;
  const certificates = certificatesQuery.data || [];

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBatchId(e.target.value);
    setSelectedCertificates([]);
  };

  const toggleCertificateSelection = (id: string) => {
    setSelectedCertificates(prev => 
      prev.includes(id) 
        ? prev.filter(certId => certId !== id) 
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (certificates.length === selectedCertificates.length) {
      setSelectedCertificates([]);
    } else {
      setSelectedCertificates(certificates.map(cert => cert.id));
    }
  };

  const sendEmails = async () => {
    if (!user) {
      toast.error("You must be logged in to send emails");
      return;
    }

    if (selectedCertificates.length === 0) {
      toast.error("Please select at least one certificate");
      return;
    }

    setSendingEmails(true);
    try {
      // Filter certificates to only those selected
      const certificatesToEmail = certificates.filter(cert => 
        selectedCertificates.includes(cert.id)
      );

      // Send emails in batches to avoid overwhelming the server
      for (const cert of certificatesToEmail) {
        if (!cert.email) {
          console.warn(`No email for certificate ${cert.id} (${cert.recipient_name})`);
          continue;
        }

        const certificateUrl = `${window.location.origin}/verify/${cert.verification_code}`;
        
        // Replace template variables
        const emailContent = emailTemplate
          .replace(/{{recipient_name}}/g, cert.recipient_name)
          .replace(/{{course_name}}/g, cert.course_name)
          .replace(/{{certificate_url}}/g, certificateUrl)
          .replace(/{{expiry_date}}/g, new Date(cert.expiry_date).toLocaleDateString());

        // Send email via Supabase Edge Function
        const { error } = await supabase.functions.invoke('send-certificate-email', {
          body: {
            to: cert.email,
            subject: emailSubject,
            content: emailContent,
            certificateId: cert.id,
            userId: user.id
          }
        });

        if (error) {
          console.error(`Error sending email for certificate ${cert.id}:`, error);
          toast.error(`Failed to send email to ${cert.recipient_name}`);
        }
      }

      toast.success(`Emails sent to ${certificatesToEmail.length} recipients`);
    } catch (error) {
      console.error("Error sending batch emails:", error);
      toast.error("Failed to send batch emails");
    } finally {
      setSendingEmails(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Certificate Email</CardTitle>
        <CardDescription>
          Send certificate emails to multiple recipients at once
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="batch">Select Certificate Batch</Label>
            <select 
              id="batch"
              className="w-full p-2 border rounded"
              value={selectedBatchId}
              onChange={handleBatchChange}
              disabled={isLoading}
            >
              <option value="">Select a batch</option>
              {/* Batch options would be populated here */}
              <option value="recent">Most Recent Batch</option>
              <option value="custom">Custom Selection</option>
            </select>
          </div>

          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {isError && (
            <div className="text-red-500 py-2">
              Error loading certificates. Please try again.
            </div>
          )}

          {!isLoading && !isError && certificates.length > 0 && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Recipients ({selectedCertificates.length} selected)</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAll}
                  >
                    {certificates.length === selectedCertificates.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="border rounded max-h-60 overflow-y-auto p-2">
                  {certificates.map(cert => (
                    <div key={cert.id} className="flex items-center space-x-2 py-1">
                      <Checkbox 
                        id={`cert-${cert.id}`}
                        checked={selectedCertificates.includes(cert.id)}
                        onCheckedChange={() => toggleCertificateSelection(cert.id)}
                      />
                      <Label htmlFor={`cert-${cert.id}`} className="cursor-pointer">
                        {cert.recipient_name} - {cert.email || 'No email'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Email Template</Label>
                <Textarea
                  id="template"
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  placeholder="Email template"
                  rows={8}
                />
                <p className="text-sm text-muted-foreground">
                  Available variables: {'{'}{'{'} recipient_name {'}'}{'}'},  {'{'}{'{'} course_name {'}'}{'}'},  {'{'}{'{'} certificate_url {'}'}{'}'},  {'{'}{'{'} expiry_date {'}'}{'}'}
                </p>
              </div>

              <Button
                className="w-full"
                onClick={sendEmails}
                disabled={sendingEmails || selectedCertificates.length === 0}
              >
                {sendingEmails ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Emails...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Emails
                  </>
                )}
              </Button>
            </>
          )}

          {!isLoading && !isError && certificates.length === 0 && selectedBatchId && (
            <div className="text-center py-4">
              No certificates found for this batch.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}