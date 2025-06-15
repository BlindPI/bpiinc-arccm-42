
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Building, User, Target } from 'lucide-react';
import { toast } from 'sonner';

interface LeadConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onSuccess: () => void;
}

export function LeadConversionModal({ isOpen, onClose, lead, onSuccess }: LeadConversionModalProps) {
  const [conversionStep, setConversionStep] = useState<'select' | 'contact' | 'account' | 'opportunity'>('select');
  const [contactData, setContactData] = useState({
    first_name: lead?.first_name || '',
    last_name: lead?.last_name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    title: lead?.title || '',
    department: lead?.department || ''
  });

  const [accountData, setAccountData] = useState({
    name: lead?.company || '',
    industry: lead?.industry || '',
    website: lead?.website || '',
    phone: lead?.phone || '',
    billing_address: lead?.address || '',
    description: ''
  });

  const [opportunityData, setOpportunityData] = useState({
    name: `${lead?.company || 'Opportunity'} - ${new Date().getFullYear()}`,
    stage: 'qualification',
    amount: '',
    probability: 25,
    close_date: '',
    description: lead?.notes || ''
  });

  const handleConversion = async () => {
    try {
      // Here you would implement the actual conversion logic
      console.log('Converting lead:', {
        lead,
        contactData,
        accountData,
        opportunityData
      });
      
      toast.success('Lead converted successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to convert lead');
    }
  };

  const renderConversionOptions = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Convert Lead To:</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setConversionStep('contact')}>
          <CardHeader className="text-center">
            <User className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <CardTitle className="text-base">Contact Only</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Create a contact record without an account or opportunity
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setConversionStep('account')}>
          <CardHeader className="text-center">
            <Building className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <CardTitle className="text-base">Contact + Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Create both a contact and account record
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setConversionStep('opportunity')}>
          <CardHeader className="text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <CardTitle className="text-base">Full Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Create contact, account, and opportunity records
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContactForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold">Contact Information</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={contactData.first_name}
            onChange={(e) => setContactData({ ...contactData, first_name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={contactData.last_name}
            onChange={(e) => setContactData({ ...contactData, last_name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={contactData.email}
            onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={contactData.phone}
            onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={contactData.title}
            onChange={(e) => setContactData({ ...contactData, title: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={contactData.department}
            onChange={(e) => setContactData({ ...contactData, department: e.target.value })}
          />
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={() => setConversionStep('select')}>
          Back
        </Button>
        <Button onClick={handleConversion}>
          Convert to Contact
        </Button>
      </div>
    </div>
  );

  const renderAccountForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold">Account Information</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="accountName">Account Name</Label>
          <Input
            id="accountName"
            value={accountData.name}
            onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            value={accountData.industry}
            onChange={(e) => setAccountData({ ...accountData, industry: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={accountData.website}
            onChange={(e) => setAccountData({ ...accountData, website: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="accountPhone">Phone</Label>
          <Input
            id="accountPhone"
            value={accountData.phone}
            onChange={(e) => setAccountData({ ...accountData, phone: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="billingAddress">Billing Address</Label>
        <Textarea
          id="billingAddress"
          value={accountData.billing_address}
          onChange={(e) => setAccountData({ ...accountData, billing_address: e.target.value })}
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={() => setConversionStep('select')}>
          Back
        </Button>
        <Button onClick={handleConversion}>
          Convert to Contact + Account
        </Button>
      </div>
    </div>
  );

  const renderOpportunityForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold">Opportunity Information</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="opportunityName">Opportunity Name</Label>
          <Input
            id="opportunityName"
            value={opportunityData.name}
            onChange={(e) => setOpportunityData({ ...opportunityData, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="stage">Stage</Label>
          <Select
            value={opportunityData.stage}
            onValueChange={(value) => setOpportunityData({ ...opportunityData, stage: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="qualification">Qualification</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="closed_won">Closed Won</SelectItem>
              <SelectItem value="closed_lost">Closed Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="amount">Amount ($)</Label>
          <Input
            id="amount"
            type="number"
            value={opportunityData.amount}
            onChange={(e) => setOpportunityData({ ...opportunityData, amount: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="probability">Probability (%)</Label>
          <Input
            id="probability"
            type="number"
            min="0"
            max="100"
            value={opportunityData.probability}
            onChange={(e) => setOpportunityData({ ...opportunityData, probability: parseInt(e.target.value) })}
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="closeDate">Expected Close Date</Label>
          <Input
            id="closeDate"
            type="date"
            value={opportunityData.close_date}
            onChange={(e) => setOpportunityData({ ...opportunityData, close_date: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={opportunityData.description}
          onChange={(e) => setOpportunityData({ ...opportunityData, description: e.target.value })}
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={() => setConversionStep('select')}>
          Back
        </Button>
        <Button onClick={handleConversion}>
          Full Conversion
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Lead: {lead?.first_name} {lead?.last_name}</DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {conversionStep === 'select' && renderConversionOptions()}
          {conversionStep === 'contact' && renderContactForm()}
          {conversionStep === 'account' && renderAccountForm()}
          {conversionStep === 'opportunity' && renderOpportunityForm()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
