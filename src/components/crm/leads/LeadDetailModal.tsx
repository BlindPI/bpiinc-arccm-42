
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  Calendar, 
  Target,
  Edit,
  Convert,
  Star
} from 'lucide-react';
import { LeadOverviewTab } from './LeadOverviewTab';
import { LeadActivitiesTab } from './LeadActivitiesTab';
import { LeadNotesTab } from './LeadNotesTab';

interface LeadDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
}

export function LeadDetailModal({ open, onOpenChange, lead }: LeadDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!lead) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'qualified': return 'bg-green-100 text-green-800 border-green-200';
      case 'converted': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'lost': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-medium text-blue-600">
                  {lead.first_name?.charAt(0)}{lead.last_name?.charAt(0)}
                </span>
              </div>
              
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {lead.first_name} {lead.last_name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(lead.lead_status)}>
                    {lead.lead_status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Score: {lead.lead_score}/100
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button size="sm">
                <Target className="h-4 w-4 mr-2" />
                Convert
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <LeadOverviewTab lead={lead} />
            </TabsContent>
            
            <TabsContent value="activities" className="mt-6">
              <LeadActivitiesTab leadId={lead.id} />
            </TabsContent>
            
            <TabsContent value="notes" className="mt-6">
              <LeadNotesTab leadId={lead.id} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
