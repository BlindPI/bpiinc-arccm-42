
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Mail, 
  Building, 
  Target, 
  Upload, 
  Download,
  Play,
  Pause,
  X,
  CheckCircle
} from 'lucide-react';
import { ContactBulkOperations } from './ContactBulkOperations';
import { CampaignBulkOperations } from './CampaignBulkOperations';
import { toast } from 'sonner';

interface BulkOperation {
  id: string;
  type: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  totalItems: number;
  processedItems: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export function BulkCRMOperations() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([
    {
      id: '1',
      type: 'export',
      name: 'Export Contact List',
      status: 'completed',
      progress: 100,
      totalItems: 1250,
      processedItems: 1250,
      startedAt: new Date(Date.now() - 300000),
      completedAt: new Date(Date.now() - 60000)
    },
    {
      id: '2',
      type: 'update',
      name: 'Update Lead Scores',
      status: 'running',
      progress: 65,
      totalItems: 450,
      processedItems: 293,
      startedAt: new Date(Date.now() - 120000)
    }
  ]);

  const handleBulkExport = (type: string) => {
    const selectedItems = type === 'contacts' ? selectedContacts : selectedCampaigns;
    
    if (selectedItems.length === 0) {
      toast.error('Please select items to export');
      return;
    }

    const newOperation: BulkOperation = {
      id: Date.now().toString(),
      type: 'export',
      name: `Export ${selectedItems.length} ${type}`,
      status: 'running',
      progress: 0,
      totalItems: selectedItems.length,
      processedItems: 0,
      startedAt: new Date()
    };

    setBulkOperations(prev => [newOperation, ...prev]);
    toast.success(`Started exporting ${selectedItems.length} ${type}`);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setBulkOperations(prev => prev.map(op => 
          op.id === newOperation.id 
            ? { ...op, status: 'completed', progress: 100, processedItems: op.totalItems, completedAt: new Date() }
            : op
        ));
        toast.success('Export completed successfully');
      } else {
        setBulkOperations(prev => prev.map(op => 
          op.id === newOperation.id 
            ? { ...op, progress, processedItems: Math.floor((progress / 100) * op.totalItems) }
            : op
        ));
      }
    }, 1000);
  };

  const handleBulkUpdate = (type: string, updateType: string) => {
    const selectedItems = type === 'contacts' ? selectedContacts : selectedCampaigns;
    
    if (selectedItems.length === 0) {
      toast.error('Please select items to update');
      return;
    }

    const newOperation: BulkOperation = {
      id: Date.now().toString(),
      type: 'update',
      name: `${updateType} ${selectedItems.length} ${type}`,
      status: 'running',
      progress: 0,
      totalItems: selectedItems.length,
      processedItems: 0,
      startedAt: new Date()
    };

    setBulkOperations(prev => [newOperation, ...prev]);
    toast.success(`Started updating ${selectedItems.length} ${type}`);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setBulkOperations(prev => prev.map(op => 
          op.id === newOperation.id 
            ? { ...op, status: 'completed', progress: 100, processedItems: op.totalItems, completedAt: new Date() }
            : op
        ));
        toast.success('Bulk update completed successfully');
      } else {
        setBulkOperations(prev => prev.map(op => 
          op.id === newOperation.id 
            ? { ...op, progress, processedItems: Math.floor((progress / 100) * op.totalItems) }
            : op
        ));
      }
    }, 1500);
  };

  const handleBulkDelete = (type: string) => {
    const selectedItems = type === 'contacts' ? selectedContacts : selectedCampaigns;
    
    if (selectedItems.length === 0) {
      toast.error('Please select items to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedItems.length} ${type}? This action cannot be undone.`)) {
      return;
    }

    const newOperation: BulkOperation = {
      id: Date.now().toString(),
      type: 'delete',
      name: `Delete ${selectedItems.length} ${type}`,
      status: 'running',
      progress: 0,
      totalItems: selectedItems.length,
      processedItems: 0,
      startedAt: new Date()
    };

    setBulkOperations(prev => [newOperation, ...prev]);
    toast.success(`Started deleting ${selectedItems.length} ${type}`);

    // Clear selections
    if (type === 'contacts') {
      setSelectedContacts([]);
    } else {
      setSelectedCampaigns([]);
    }
  };

  const pauseOperation = (operationId: string) => {
    setBulkOperations(prev => prev.map(op => 
      op.id === operationId ? { ...op, status: 'paused' } : op
    ));
    toast.info('Operation paused');
  };

  const resumeOperation = (operationId: string) => {
    setBulkOperations(prev => prev.map(op => 
      op.id === operationId ? { ...op, status: 'running' } : op
    ));
    toast.info('Operation resumed');
  };

  const cancelOperation = (operationId: string) => {
    setBulkOperations(prev => prev.filter(op => op.id !== operationId));
    toast.info('Operation cancelled');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running': return <Play className="h-4 w-4 text-blue-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <X className="h-4 w-4 text-red-600" />;
      default: return <Play className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Operations</h1>
          <p className="text-muted-foreground">
            Perform bulk operations on your CRM data efficiently
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Active Operations */}
      {bulkOperations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bulkOperations.map((operation) => (
                <div key={operation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(operation.status)}
                    <div>
                      <h4 className="font-medium">{operation.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {operation.processedItems} of {operation.totalItems} items processed
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <Progress value={operation.progress} className="h-2" />
                    </div>
                    <Badge className={getStatusColor(operation.status)}>
                      {operation.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {operation.status === 'running' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => pauseOperation(operation.id)}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {operation.status === 'paused' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resumeOperation(operation.id)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelOperation(operation.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contacts">
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Mail className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <Building className="h-4 w-4 mr-2" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="opportunities">
            <Target className="h-4 w-4 mr-2" />
            Opportunities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <ContactBulkOperations
                selectedItems={selectedContacts}
                onSelectionChange={setSelectedContacts}
              />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleBulkExport('contacts')}
                    disabled={selectedContacts.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </Button>
                  <Button 
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleBulkUpdate('contacts', 'Update Status')}
                    disabled={selectedContacts.length === 0}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Update Status
                  </Button>
                  <Button 
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleBulkUpdate('contacts', 'Assign Owner')}
                    disabled={selectedContacts.length === 0}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Assign Owner
                  </Button>
                  <Button 
                    className="w-full justify-start"
                    variant="destructive"
                    onClick={() => handleBulkDelete('contacts')}
                    disabled={selectedContacts.length === 0}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <CampaignBulkOperations
                selectedItems={selectedCampaigns}
                onSelectionChange={setSelectedCampaigns}
              />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleBulkExport('campaigns')}
                    disabled={selectedCampaigns.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Reports
                  </Button>
                  <Button 
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleBulkUpdate('campaigns', 'Pause')}
                    disabled={selectedCampaigns.length === 0}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Campaigns
                  </Button>
                  <Button 
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleBulkUpdate('campaigns', 'Resume')}
                    disabled={selectedCampaigns.length === 0}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume Campaigns
                  </Button>
                  <Button 
                    className="w-full justify-start"
                    variant="destructive"
                    onClick={() => handleBulkDelete('campaigns')}
                    disabled={selectedCampaigns.length === 0}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardContent className="p-12 text-center">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Account Bulk Operations</h3>
              <p className="text-muted-foreground">
                Bulk operations for accounts will be available here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities">
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Opportunity Bulk Operations</h3>
              <p className="text-muted-foreground">
                Bulk operations for opportunities will be available here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
