
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  Building, 
  Phone, 
  Mail, 
  Calendar, 
  Star,
  Plus,
  Edit,
  Save,
  X
} from 'lucide-react';
import { EnhancedCRMService } from '@/services/crm/enhancedCRMService';
import { CRMLeadService } from '@/services/crm/crmLeadService';
import { toast } from 'sonner';

interface LeadDetailViewProps {
  leadId: string;
  onClose: () => void;
}

export function LeadDetailView({ leadId, onClose }: LeadDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState('');
  const queryClient = useQueryClient();

  const { data: leadData, isLoading } = useQuery({
    queryKey: ['lead-detail', leadId],
    queryFn: () => EnhancedCRMService.getLeadWithActivities(leadId)
  });

  const { mutate: updateLead } = useMutation({
    mutationFn: (updates: any) => CRMLeadService.updateLead(leadId, updates),
    onSuccess: () => {
      toast.success('Lead updated successfully');
      queryClient.invalidateQueries({ queryKey: ['lead-detail', leadId] });
      setIsEditing(false);
    }
  });

  const { mutate: addActivity } = useMutation({
    mutationFn: (activity: any) => EnhancedCRMService.createActivity({
      ...activity,
      lead_id: leadId,
      activity_type: 'note',
      activity_date: new Date().toISOString(),
      completed: true
    }),
    onSuccess: () => {
      toast.success('Note added successfully');
      queryClient.invalidateQueries({ queryKey: ['lead-detail', leadId] });
      setNewNote('');
    }
  });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    addActivity({
      subject: 'Lead Note',
      description: newNote,
      priority: 'medium'
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-pulse">Loading lead details...</div>
        </div>
      </div>
    );
  }

  const lead = leadData;
  const activities = leadData?.activities || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">
                {lead?.first_name} {lead?.last_name}
              </h2>
              <p className="text-sm text-muted-foreground">{lead?.company_name}</p>
            </div>
            <Badge variant={lead?.lead_status === 'qualified' ? 'default' : 'secondary'}>
              {lead?.lead_status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="mx-6 mt-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activities">Activities & Notes</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 p-6 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{lead?.email}</span>
                    </div>
                    {lead?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{lead?.phone}</span>
                      </div>
                    )}
                    {lead?.company_name && (
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{lead?.company_name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Lead Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lead Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>Score: {lead?.lead_score || 0}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Created: {new Date(lead?.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Source</label>
                      <p className="text-sm text-muted-foreground">{lead?.lead_source}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {lead?.notes && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <div className="space-y-3">
                          <Textarea
                            defaultValue={lead.notes}
                            className="min-h-[100px]"
                            placeholder="Lead notes..."
                          />
                          <Button
                            size="sm"
                            onClick={() => updateLead({ notes: lead.notes })}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Notes
                          </Button>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{lead.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activities" className="flex-1 p-6 overflow-auto">
              <div className="space-y-4">
                {/* Add new note */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note about this lead..."
                        className="min-h-[80px]"
                      />
                      <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Activities list */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Activity History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      {activities.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No activities recorded yet
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {activities.map((activity: any) => (
                            <div key={activity.id} className="border-l-2 border-blue-200 pl-4 pb-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium">{activity.subject}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {activity.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {new Date(activity.activity_date).toLocaleString()}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {activity.activity_type}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="flex-1 p-6 overflow-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lead Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-2 border-green-200 pl-4">
                      <h4 className="font-medium">Lead Created</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(lead?.created_at).toLocaleString()}
                      </p>
                    </div>
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="border-l-2 border-blue-200 pl-4">
                        <h4 className="font-medium">{activity.subject}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.activity_date).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
