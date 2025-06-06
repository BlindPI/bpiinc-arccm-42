import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Building, 
  Target, 
  ArrowRight,
  Eye,
  Settings,
  Loader2
} from 'lucide-react';
import { 
  LeadConversionService, 
  LeadConversionOptions, 
  DEFAULT_CONVERSION_OPTIONS,
  ConversionResult,
  ConversionValidation,
  ConversionPreview
} from '@/services/crm/leadConversionService';
import { Lead } from '@/services/crm/crmService';
import { toast } from 'sonner';

interface LeadConversionModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ConversionResult) => void;
}

export const LeadConversionModal: React.FC<LeadConversionModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [options, setOptions] = useState<LeadConversionOptions>(DEFAULT_CONVERSION_OPTIONS);
  const [activeTab, setActiveTab] = useState('options');

  // Validation query
  const { data: validation, isLoading: isValidating } = useQuery({
    queryKey: ['lead-conversion-validation', lead.id],
    queryFn: () => LeadConversionService.validateConversion(lead.id),
    enabled: isOpen
  });

  // Preview query
  const { data: preview, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['lead-conversion-preview', lead.id, options],
    queryFn: () => LeadConversionService.getConversionPreview(lead.id, options),
    enabled: isOpen && validation?.canProceed
  });

  // Conversion mutation
  const conversionMutation = useMutation({
    mutationFn: () => LeadConversionService.convertLead(lead.id, options),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Lead converted successfully!');
        onSuccess(result);
        onClose();
      } else {
        toast.error('Conversion failed: ' + (result.errors?.join(', ') || 'Unknown error'));
      }
    },
    onError: (error) => {
      toast.error('Conversion failed: ' + error.message);
    }
  });

  // Reset options when modal opens
  useEffect(() => {
    if (isOpen) {
      setOptions({
        ...DEFAULT_CONVERSION_OPTIONS,
        opportunityName: `${lead.company || lead.first_name + ' ' + lead.last_name} - Training Opportunity`,
        contactTitle: lead.title
      });
      setActiveTab('options');
    }
  }, [isOpen, lead]);

  const handleConvert = () => {
    conversionMutation.mutate();
  };

  const canProceed = validation?.canProceed && !isValidating && !conversionMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Convert Lead: {lead.first_name} {lead.last_name}
          </DialogTitle>
        </DialogHeader>

        {/* Validation Alerts */}
        {validation && (
          <div className="space-y-2">
            {validation.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Cannot proceed with conversion:</div>
                  <ul className="list-disc list-inside mt-1">
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {validation.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Warnings:</div>
                  <ul className="list-disc list-inside mt-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="options">Conversion Options</TabsTrigger>
            <TabsTrigger value="preview" disabled={!validation?.canProceed}>
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Settings className="h-4 w-4 mr-1" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="options" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Contact Creation */}
              <Card className={options.createContact ? 'ring-2 ring-blue-500' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <CardTitle className="text-sm">Create Contact</CardTitle>
                    </div>
                    <Checkbox
                      checked={options.createContact}
                      onCheckedChange={(checked) => 
                        setOptions(prev => ({ ...prev, createContact: !!checked }))
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="contactTitle">Title</Label>
                    <Input
                      id="contactTitle"
                      value={options.contactTitle || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, contactTitle: e.target.value }))}
                      placeholder={lead.title || 'Contact title'}
                      disabled={!options.createContact}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Email: {lead.email}<br/>
                    Phone: {lead.phone || 'Not provided'}
                  </div>
                </CardContent>
              </Card>

              {/* Account Creation */}
              <Card className={options.createAccount ? 'ring-2 ring-green-500' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <CardTitle className="text-sm">Create Account</CardTitle>
                    </div>
                    <Checkbox
                      checked={options.createAccount}
                      onCheckedChange={(checked) => 
                        setOptions(prev => ({ ...prev, createAccount: !!checked }))
                      }
                      disabled={!lead.company}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="accountType">Account Type</Label>
                    <Select
                      value={options.accountType}
                      onValueChange={(value) => setOptions(prev => ({ ...prev, accountType: value }))}
                      disabled={!options.createAccount}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="accountIndustry">Industry</Label>
                    <Input
                      id="accountIndustry"
                      value={options.accountIndustry || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, accountIndustry: e.target.value }))}
                      placeholder="Industry"
                      disabled={!options.createAccount}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Company: {lead.company || 'Not provided'}
                  </div>
                </CardContent>
              </Card>

              {/* Opportunity Creation */}
              <Card className={options.createOpportunity ? 'ring-2 ring-purple-500' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <CardTitle className="text-sm">Create Opportunity</CardTitle>
                    </div>
                    <Checkbox
                      checked={options.createOpportunity}
                      onCheckedChange={(checked) => 
                        setOptions(prev => ({ ...prev, createOpportunity: !!checked }))
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="opportunityName">Opportunity Name</Label>
                    <Input
                      id="opportunityName"
                      value={options.opportunityName || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, opportunityName: e.target.value }))}
                      disabled={!options.createOpportunity}
                    />
                  </div>
                  <div>
                    <Label htmlFor="opportunityValue">Estimated Value ($)</Label>
                    <Input
                      id="opportunityValue"
                      type="number"
                      value={options.opportunityValue || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, opportunityValue: Number(e.target.value) }))}
                      disabled={!options.createOpportunity}
                    />
                  </div>
                  <div>
                    <Label htmlFor="opportunityStage">Stage</Label>
                    <Select
                      value={options.opportunityStage}
                      onValueChange={(value) => setOptions(prev => ({ ...prev, opportunityStage: value }))}
                      disabled={!options.createOpportunity}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="conversionNotes">Conversion Notes</Label>
                <Textarea
                  id="conversionNotes"
                  value={options.conversionNotes || ''}
                  onChange={(e) => setOptions(prev => ({ ...prev, conversionNotes: e.target.value }))}
                  placeholder="Add notes about this conversion..."
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading preview...
              </div>
            ) : preview ? (
              <div className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  Preview of entities that will be created:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {preview.proposedContact && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <User className="h-4 w-4" />
                          New Contact
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>Name:</strong> {preview.proposedContact.first_name} {preview.proposedContact.last_name}</div>
                        <div><strong>Email:</strong> {preview.proposedContact.email}</div>
                        <div><strong>Title:</strong> {preview.proposedContact.title || 'Not specified'}</div>
                        <div><strong>Source:</strong> {preview.proposedContact.lead_source}</div>
                      </CardContent>
                    </Card>
                  )}

                  {preview.proposedAccount && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          New Account
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>Name:</strong> {preview.proposedAccount.account_name}</div>
                        <div><strong>Type:</strong> {preview.proposedAccount.account_type}</div>
                        <div><strong>Industry:</strong> {preview.proposedAccount.industry || 'Not specified'}</div>
                      </CardContent>
                    </Card>
                  )}

                  {preview.proposedOpportunity && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          New Opportunity
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>Name:</strong> {preview.proposedOpportunity.opportunity_name}</div>
                        <div><strong>Value:</strong> ${preview.proposedOpportunity.estimated_value?.toLocaleString()}</div>
                        <div><strong>Stage:</strong> {preview.proposedOpportunity.stage}</div>
                        <div><strong>Close Date:</strong> {preview.proposedOpportunity.expected_close_date || 'Not set'}</div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {preview.dataMapping.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Data Mapping</CardTitle>
                      <CardDescription>How lead data will be mapped to new entities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {preview.dataMapping.map((mapping, index) => (
                          <div key={index} className="flex items-center justify-between text-sm border-b pb-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-gray-100 text-gray-800">{mapping.targetEntity}</Badge>
                              <span>{mapping.sourceField}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{mapping.sourceValue}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span>{mapping.targetValue}</span>
                              {mapping.transformation && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">Transformed</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Advanced Options</CardTitle>
                <CardDescription>Additional conversion settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserveLeadData"
                    checked={options.preserveLeadData}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, preserveLeadData: !!checked }))
                    }
                  />
                  <Label htmlFor="preserveLeadData">Preserve lead data after conversion</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opportunityCloseDate">Expected Close Date</Label>
                  <Input
                    id="opportunityCloseDate"
                    type="date"
                    value={options.opportunityCloseDate || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, opportunityCloseDate: e.target.value }))}
                    disabled={!options.createOpportunity}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConvert}
            disabled={!canProceed}
            className="min-w-32"
          >
            {conversionMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Converting...
              </>
            ) : (
              'Convert Lead'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};