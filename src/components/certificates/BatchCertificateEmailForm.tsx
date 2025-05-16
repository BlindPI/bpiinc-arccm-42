import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LocationEmailTemplate } from '@/types/certificates';

interface BatchCertificateEmailFormProps {
  certificateIds: string[];
  certificates: any[];
  onClose: () => void;
}

// Define the batch operation type
interface BatchOperation {
  batch_name: string;
  completed_at: string;
  created_at: string;
  error_message: string;
  failed_emails: number;
  id: string;
  processed_certificates: number;
  status: string;
  successful_emails: number;
  total_certificates: number;
  user_id: string;
}

export function BatchCertificateEmailForm({
  certificateIds,
  certificates,
  onClose
}: BatchCertificateEmailFormProps) {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [batchName, setBatchName] = useState(`Batch Email ${new Date().toLocaleString()}`);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [sendingStatus, setSendingStatus] = useState<'idle' | 'preparing' | 'sending' | 'completed' | 'failed'>('idle');

  // Group certificates by location
  const locationIds = [...new Set(certificates
    .filter(cert => cert.location_id)
    .map(cert => cert.location_id))];

  // Get locations data
  const { data: locations, isLoading: loadingLocations } = useQuery({
    queryKey: ['batch-email-locations', locationIds],
    queryFn: async () => {
      if (locationIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .in('id', locationIds);
        
      if (error) throw error;
      return data || [];
    },
    enabled: locationIds.length > 0
  });

  // Get templates for selected location
  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ['email-templates', selectedLocationId],
    queryFn: async () => {
      if (!selectedLocationId) return [];
      
      const { data, error } = await supabase
        .from('location_email_templates')
        .select('*')
        .eq('location_id', selectedLocationId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedLocationId
  });

  // Query to monitor batch email operation
  const { data: batchOperation, isLoading: loadingBatchStatus } = useQuery<BatchOperation | null>({
    queryKey: ['batch-operation', currentBatchId],
    queryFn: async () => {
      if (!currentBatchId) return null;
      
      const { data, error } = await supabase
        .from('email_batch_operations')
        .select('*')
        .eq('id', currentBatchId)
        .single();
        
      if (error) throw error;
      return data as BatchOperation;
    },
    enabled: !!currentBatchId,
    refetchInterval: (data) => {
      // Keep polling until the operation is completed
      return data && ['PENDING', 'PROCESSING'].includes(data.status) ? 1000 : false;
    }
  });

  // Find a default template when location changes
  useEffect(() => {
    if (templates && templates.length > 0) {
      // Find default template
      const defaultTemplate = templates.find((t: LocationEmailTemplate) => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      } else if (templates[0]) {
        // If no default template, use the first one
        setSelectedTemplateId(templates[0].id);
      }
    }
  }, [templates]);

  // Send batch email mutation
  const batchEmailMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) {
        throw new Error('User profile not found');
      }
      
      setSendingStatus('preparing');
      
      // Create a batch operation record
      const { data: batchOp, error: batchError } = await supabase
        .from('email_batch_operations')
        .insert({
          user_id: profile.id,
          batch_name: batchName,
          total_certificates: certificateIds.length,
          status: 'PENDING'
        })
        .select()
        .single();
        
      if (batchError) throw batchError;
      
      setCurrentBatchId(batchOp.id);
      setSendingStatus('sending');
      
      // Call edge function to start the batch email process
      const { data, error } = await supabase.functions.invoke('send-batch-certificate-emails', {
        body: {
          certificateIds,
          batchId: batchOp.id,
          templateId: selectedTemplateId,
          userId: profile.id
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('Batch email process started successfully');
    },
    onError: (error) => {
      console.error('Error starting batch email process:', error);
      toast.error('Failed to start batch email process');
      setSendingStatus('failed');
    }
  });

  // Update UI based on batch operation status
  useEffect(() => {
    if (batchOperation) {
      if (batchOperation.status === 'COMPLETED') {
        setSendingStatus('completed');
        queryClient.invalidateQueries({ queryKey: ['certificates'] });
      } else if (batchOperation.status === 'FAILED') {
        setSendingStatus('failed');
      }
    }
  }, [batchOperation, queryClient]);
  
  // Get formatted status message
  const getStatusMessage = () => {
    if (!batchOperation) return 'Preparing to send emails...';
    
    if (batchOperation.status === 'COMPLETED') {
      return `Email batch completed. ${batchOperation.successful_emails} sent, ${batchOperation.failed_emails} failed.`;
    }
    
    if (batchOperation.status === 'FAILED') {
      return `Email batch failed: ${batchOperation.error_message || 'Unknown error'}`;
    }
    
    return `Processing: ${batchOperation.processed_certificates} of ${batchOperation.total_certificates} certificates`;
  };
  
  // Calculate progress percentage
  const getProgressPercent = () => {
    if (!batchOperation || batchOperation.total_certificates === 0) return 0;
    return Math.round((batchOperation.processed_certificates / batchOperation.total_certificates) * 100);
  };

  const handleSendBatchEmail = () => {
    if (certificateIds.length === 0) {
      toast.error('No certificates selected');
      return;
    }
    
    if (!selectedTemplateId && !batchEmailMutation.isPending) {
      toast.error('Please select an email template');
      return;
    }
    
    // Confirm before sending
    if (window.confirm(`Are you sure you want to send ${certificateIds.length} certificate emails?`)) {
      batchEmailMutation.mutate();
    }
  };

  // Count of certificates for each location
  const locationCertificateCounts: Record<string, number> = {};
  certificates.forEach(cert => {
    if (cert.location_id) {
      locationCertificateCounts[cert.location_id] = (locationCertificateCounts[cert.location_id] || 0) + 1;
    }
  });

  // Helper to get location name by ID
  const getLocationName = (locId: string): string => {
    if (!locations) return 'Loading...';
    const location = locations.find(loc => loc.id === locId);
    return location ? location.name : 'Unknown Location';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">Send Batch Certificate Emails</h3>
          <p className="text-sm text-muted-foreground">
            Send {certificateIds.length} certificate{certificateIds.length !== 1 ? 's' : ''} via email
          </p>
        </div>
      </div>

      {/* Batch email form */}
      {sendingStatus === 'idle' && (
        <>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-name">Batch Name</Label>
              <Input
                id="batch-name"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Enter a name for this email batch"
              />
            </div>
            
            {locationIds.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="location-select">Select Location</Label>
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a location for templates" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations && locations.map((location) => (
                      <SelectItem 
                        key={location.id} 
                        value={location.id}
                      >
                        {location.name} ({locationCertificateCounts[location.id] || 0} certificates)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select a location to choose from its email templates.
                </p>
              </div>
            )}
            
            {/* Template selection */}
            {selectedLocationId && (
              <div className="space-y-2">
                <Label htmlFor="template-select">Email Template</Label>
                {loadingTemplates ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading templates...
                  </div>
                ) : templates && templates.length > 0 ? (
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template: LocationEmailTemplate) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} {template.is_default && "(Default)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                    <AlertDescription>
                      No email templates found for this location. A default template will be used.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            {/* Summary of emails to be sent */}
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Email Summary</CardTitle>
                <CardDescription>Selected certificates to send</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <strong>Total Certificates:</strong> {certificateIds.length}
                </div>
                {locationIds.length > 0 && (
                  <div className="text-sm">
                    <strong>Locations:</strong>
                    <ul className="mt-1 list-disc list-inside">
                      {locationIds.map(locId => (
                        <li key={locId}>
                          {getLocationName(locId)}: {locationCertificateCounts[locId]} certificates
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSendBatchEmail}
                  disabled={!selectedTemplateId && locationIds.length > 0}
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send {certificateIds.length} Certificate Emails
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}

      {/* Processing status */}
      {['preparing', 'sending'].includes(sendingStatus) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="font-medium">
              {sendingStatus === 'preparing' ? 
                'Preparing to send emails...' : 
                'Sending certificate emails...'}
            </span>
          </div>
          
          {batchOperation && (
            <>
              <Progress value={getProgressPercent()} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                {getStatusMessage()}
              </p>
              
              <div className="grid grid-cols-3 gap-3 my-4">
                <Card className="p-3 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold">{batchOperation.processed_certificates}</p>
                  <p className="text-xs text-muted-foreground">Processed</p>
                </Card>
                <Card className="p-3 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-green-600">{batchOperation.successful_emails}</p>
                  <p className="text-xs text-muted-foreground">Successful</p>
                </Card>
                <Card className="p-3 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-red-500">{batchOperation.failed_emails}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </Card>
              </div>
            </>
          )}
          
          <p className="text-xs text-muted-foreground">
            This process may take some time depending on the number of certificates.
            You can close this dialog and the process will continue in the background.
          </p>
          
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      )}

      {/* Completed status */}
      {sendingStatus === 'completed' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center gap-2 my-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <span className="font-medium text-lg">Batch Email Complete</span>
          </div>
          
          {batchOperation && (
            <div className="grid grid-cols-3 gap-3 my-4">
              <Card className="p-3 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold">{batchOperation.total_certificates}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </Card>
              <Card className="p-3 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-green-600">{batchOperation.successful_emails}</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </Card>
              <Card className="p-3 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-red-500">{batchOperation.failed_emails}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </Card>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        </div>
      )}

      {/* Failed status */}
      {sendingStatus === 'failed' && (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to process batch email operation. Please try again later.
              {batchOperation?.error_message && (
                <p className="mt-2 font-mono text-xs">Error: {batchOperation.error_message}</p>
              )}
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
