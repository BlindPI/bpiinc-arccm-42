
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EnhancedTeamMember, TeamMemberUpdate } from '@/services/team/enhancedTeamService';
import { 
  Save, 
  X, 
  Plus, 
  MapPin, 
  Clock, 
  AlertCircle,
  Phone,
  Mail,
  User,
  History
} from 'lucide-react';

interface EnhancedTeamMemberDetailsModalProps {
  member: EnhancedTeamMember;
  canEdit: boolean;
  onSave: (updates: TeamMemberUpdate) => void;
  onClose: () => void;
}

export function EnhancedTeamMemberDetailsModal({
  member,
  canEdit,
  onSave,
  onClose
}: EnhancedTeamMemberDetailsModalProps) {
  const [formData, setFormData] = useState<TeamMemberUpdate>({
    role: member.role,
    team_position: member.team_position || '',
    status: member.status,
    skills: member.skills || [],
    emergency_contact: member.emergency_contact || {},
    notes: member.notes || ''
  });

  const [newSkill, setNewSkill] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.filter(skill => skill !== skillToRemove) || []
    }));
  };

  const updateEmergencyContact = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergency_contact: {
        ...prev.emergency_contact,
        [field]: value
      }
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {member.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{member.display_name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{member.role}</Badge>
                <Badge className={getStatusColor(member.status)}>
                  {member.status}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        value={member.profile?.email || ''} 
                        disabled 
                        className="bg-gray-50"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="role">Team Role</Label>
                      <Select 
                        value={formData.role} 
                        onValueChange={(value: 'MEMBER' | 'ADMIN') => 
                          setFormData(prev => ({ ...prev, role: value }))
                        }
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={formData.team_position}
                        onChange={(e) => setFormData(prev => ({ ...prev, team_position: e.target.value }))}
                        disabled={!canEdit}
                        placeholder="e.g., Senior Developer"
                      />
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value: 'active' | 'inactive' | 'suspended' | 'pending') => 
                          setFormData(prev => ({ ...prev, status: value }))
                        }
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <Label>Skills</Label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {formData.skills?.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {skill}
                            {canEdit && (
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeSkill(skill)}
                              />
                            )}
                          </Badge>
                        ))}
                      </div>
                      {canEdit && (
                        <div className="flex gap-2">
                          <Input
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="Add a skill..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          />
                          <Button type="button" onClick={addSkill} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      disabled={!canEdit}
                      placeholder="Additional notes about this team member..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Membership Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Membership Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Joined:</span> {' '}
                      {formatDate(member.assignment_start_date)}
                    </div>
                    <div>
                      <span className="font-medium">Last Activity:</span> {' '}
                      {formatDate(member.last_activity)}
                    </div>
                    {member.assignment_end_date && (
                      <div>
                        <span className="font-medium">Assignment Ends:</span> {' '}
                        {formatDate(member.assignment_end_date)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  {canEdit ? 'Cancel' : 'Close'}
                </Button>
                {canEdit && (
                  <Button type="submit" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                )}
              </div>
            </form>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {member.assignments && member.assignments.length > 0 ? (
                  <div className="space-y-3">
                    {member.assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{assignment.location_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.assignment_type} • Started {formatDate(assignment.start_date)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No location assignments</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergency-name">Contact Name</Label>
                    <Input
                      id="emergency-name"
                      value={formData.emergency_contact?.name || ''}
                      onChange={(e) => updateEmergencyContact('name', e.target.value)}
                      disabled={!canEdit}
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency-phone">Phone Number</Label>
                    <Input
                      id="emergency-phone"
                      value={formData.emergency_contact?.phone || ''}
                      onChange={(e) => updateEmergencyContact('phone', e.target.value)}
                      disabled={!canEdit}
                      placeholder="Emergency contact phone"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="emergency-relationship">Relationship</Label>
                  <Input
                    id="emergency-relationship"
                    value={formData.emergency_contact?.relationship || ''}
                    onChange={(e) => updateEmergencyContact('relationship', e.target.value)}
                    disabled={!canEdit}
                    placeholder="Relationship to team member"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {member.status_history && member.status_history.length > 0 ? (
                  <div className="space-y-3">
                    {member.status_history.map((entry) => (
                      <div key={entry.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">
                            {entry.new_status && entry.old_status 
                              ? `${entry.old_status} → ${entry.new_status}`
                              : entry.new_role && entry.old_role
                              ? `${entry.old_role} → ${entry.new_role}`
                              : entry.new_status || entry.new_role
                            }
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(entry.effective_date)}
                          </span>
                        </div>
                        {entry.reason && (
                          <p className="text-sm text-muted-foreground">{entry.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No status history available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
