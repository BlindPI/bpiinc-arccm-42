import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  BookOpen,
  Coffee,
  Clock,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Settings,
  Check,
  AlertCircle,
  Utensils,
  User
} from 'lucide-react';

interface SessionTemplate {
  id: string;
  name: string;
  code: string;
  description: string;
  templateType: string;
  totalDuration: number;
  estimatedBreakMinutes: number;
  maxParticipants: number;
  requiredInstructors: number;
  requiredRooms: number;
  requiredEquipment: string[];
  components: TemplateComponent[];
}

interface TemplateComponent {
  id: string;
  type: 'COURSE' | 'BREAK' | 'LUNCH' | 'ASSESSMENT' | 'ACTIVITY';
  courseId?: string;
  name: string;
  description?: string;
  duration: number;
  sequenceOrder: number;
  isMandatory: boolean;
  isBreak: boolean;
  hasAssessment: boolean;
  instructorRequired: boolean;
  roomRequired: boolean;
  maxParticipants?: number;
}

interface Instructor {
  id: string;
  name: string;
  email: string;
  specializations: string[];
  isAvailable: boolean;
}

interface Location {
  id: string;
  name: string;
  address: string;
  capacity: number;
  equipment: string[];
}

interface SessionData {
  title: string;
  sessionTemplateId: string;
  instructorId: string;
  locationId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  description: string;
  basePrice?: number;
  earlyBirdPrice?: number;
  earlyBirdDeadline?: string;
  registrationStatus: 'OPEN' | 'CLOSED' | 'WAITLIST';
  waitlistEnabled: boolean;
  requiresApproval: boolean;
  instructorAssignments: any;
  roomAssignments: any;
  equipmentAssignments: any;
}

interface MultiCourseSessionCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sessionData: SessionData) => void;
  templates: SessionTemplate[];
  instructors: Instructor[];
  locations: Location[];
  editSession?: SessionData;
}

export const MultiCourseSessionCreator: React.FC<MultiCourseSessionCreatorProps> = ({
  isOpen,
  onClose,
  onSave,
  templates,
  instructors,
  locations,
  editSession
}) => {
  const [sessionData, setSessionData] = useState<SessionData>({
    title: '',
    sessionTemplateId: '',
    instructorId: '',
    locationId: '',
    sessionDate: '',
    startTime: '09:00',
    endTime: '17:00',
    maxCapacity: 12,
    description: '',
    registrationStatus: 'OPEN',
    waitlistEnabled: false,
    requiresApproval: false,
    instructorAssignments: {},
    roomAssignments: {},
    equipmentAssignments: {},
    ...editSession
  });

  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null);
  const [calculatedEndTime, setCalculatedEndTime] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (sessionData.sessionTemplateId) {
      const template = templates.find(t => t.id === sessionData.sessionTemplateId);
      setSelectedTemplate(template || null);
      
      if (template) {
        // Auto-populate session title if empty
        if (!sessionData.title) {
          setSessionData(prev => ({
            ...prev,
            title: template.name,
            maxCapacity: template.maxParticipants
          }));
        }
        
        // Calculate end time based on start time and template duration
        if (sessionData.startTime) {
          const startTime = new Date(`2000-01-01T${sessionData.startTime}:00`);
          const endTime = new Date(startTime.getTime() + template.totalDuration * 60000);
          const endTimeStr = endTime.toTimeString().slice(0, 5);
          setCalculatedEndTime(endTimeStr);
          setSessionData(prev => ({ ...prev, endTime: endTimeStr }));
        }
      }
    }
  }, [sessionData.sessionTemplateId, sessionData.startTime, templates]);

  const validateSession = (): string[] => {
    const errors: string[] = [];
    
    if (!sessionData.title.trim()) errors.push('Session title is required');
    if (!sessionData.sessionTemplateId) errors.push('Template selection is required');
    if (!sessionData.instructorId) errors.push('Instructor selection is required');
    if (!sessionData.locationId) errors.push('Location selection is required');
    if (!sessionData.sessionDate) errors.push('Session date is required');
    if (!sessionData.startTime) errors.push('Start time is required');
    if (!sessionData.endTime) errors.push('End time is required');
    if (sessionData.maxCapacity < 1) errors.push('Max capacity must be at least 1');
    
    // Check if selected location can accommodate the session
    const selectedLocation = locations.find(l => l.id === sessionData.locationId);
    if (selectedLocation && sessionData.maxCapacity > selectedLocation.capacity) {
      errors.push(`Location capacity (${selectedLocation.capacity}) is less than session capacity (${sessionData.maxCapacity})`);
    }
    
    // Check if template requirements are met
    if (selectedTemplate) {
      const selectedLocation = locations.find(l => l.id === sessionData.locationId);
      const missingEquipment = selectedTemplate.requiredEquipment.filter(
        equipment => selectedLocation && !selectedLocation.equipment.includes(equipment)
      );
      
      if (missingEquipment.length > 0) {
        errors.push(`Location missing required equipment: ${missingEquipment.join(', ')}`);
      }
    }
    
    return errors;
  };

  const handleSave = () => {
    const errors = validateSession();
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      onSave(sessionData);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getTemplatePreview = () => {
    if (!selectedTemplate) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Template Preview</h4>
          <Badge variant="outline">{selectedTemplate.templateType}</Badge>
        </div>
        
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Total Duration:</span>
            <span className="font-medium">{formatDuration(selectedTemplate.totalDuration)}</span>
          </div>
          <div className="flex justify-between">
            <span>Components:</span>
            <span className="font-medium">{selectedTemplate.components.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Required Instructors:</span>
            <span className="font-medium">{selectedTemplate.requiredInstructors}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-medium">Session Components:</Label>
          <div className="space-y-1">
            {selectedTemplate.components.map((component, index) => {
              const getIcon = () => {
                switch (component.type) {
                  case 'COURSE': return <BookOpen className="h-3 w-3" />;
                  case 'BREAK': return <Coffee className="h-3 w-3" />;
                  case 'LUNCH': return <Utensils className="h-3 w-3" />;
                  case 'ASSESSMENT': return <Settings className="h-3 w-3" />;
                  case 'ACTIVITY': return <Users className="h-3 w-3" />;
                  default: return <Clock className="h-3 w-3" />;
                }
              };
              
              return (
                <div key={component.id} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400 w-6 text-center">{index + 1}.</span>
                  {getIcon()}
                  <span className="flex-1">{component.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatDuration(component.duration)}
                  </Badge>
                  {!component.isMandatory && (
                    <Badge variant="outline" className="text-xs">Optional</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {selectedTemplate.requiredEquipment.length > 0 && (
          <div>
            <Label className="text-xs font-medium">Required Equipment:</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedTemplate.requiredEquipment.map((equipment, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {equipment}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editSession ? 'Edit Multi-Course Session' : 'Create New Multi-Course Session'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Configuration */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Session Title *</Label>
                  <Input
                    id="title"
                    value={sessionData.title}
                    onChange={(e) => setSessionData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., CPR & First Aid Certification"
                  />
                </div>

                <div>
                  <Label htmlFor="template">Session Template *</Label>
                  <Select
                    value={sessionData.sessionTemplateId}
                    onValueChange={(value) => setSessionData(prev => ({ ...prev, sessionTemplateId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a session template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{template.name}</span>
                            <div className="flex items-center gap-2 ml-2">
                              <Badge variant="outline" className="text-xs">
                                {formatDuration(template.totalDuration)}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {template.components.length} components
                              </Badge>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="instructor">Primary Instructor *</Label>
                  <Select
                    value={sessionData.instructorId}
                    onValueChange={(value) => setSessionData(prev => ({ ...prev, instructorId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select instructor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map(instructor => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{instructor.name}</span>
                            {!instructor.isAvailable && (
                              <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Select
                    value={sessionData.locationId}
                    onValueChange={(value) => setSessionData(prev => ({ ...prev, locationId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{location.name}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Cap: {location.capacity}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={sessionData.sessionDate}
                      onChange={(e) => setSessionData(prev => ({ ...prev, sessionDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={sessionData.startTime}
                      onChange={(e) => setSessionData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={sessionData.endTime}
                      onChange={(e) => setSessionData(prev => ({ ...prev, endTime: e.target.value }))}
                      placeholder={calculatedEndTime}
                    />
                    {calculatedEndTime && (
                      <p className="text-xs text-gray-500 mt-1">
                        Calculated: {calculatedEndTime}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="capacity">Max Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={sessionData.maxCapacity}
                    onChange={(e) => setSessionData(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={sessionData.description}
                    onChange={(e) => setSessionData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional session description..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Advanced Settings</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </div>
              </CardHeader>
              {showAdvanced && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="registrationStatus">Registration Status</Label>
                    <Select
                      value={sessionData.registrationStatus}
                      onValueChange={(value: any) => setSessionData(prev => ({ ...prev, registrationStatus: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                        <SelectItem value="WAITLIST">Waitlist Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="basePrice">Base Price ($)</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        value={sessionData.basePrice || ''}
                        onChange={(e) => setSessionData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) }))}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="earlyBirdPrice">Early Bird Price ($)</Label>
                      <Input
                        id="earlyBirdPrice"
                        type="number"
                        value={sessionData.earlyBirdPrice || ''}
                        onChange={(e) => setSessionData(prev => ({ ...prev, earlyBirdPrice: parseFloat(e.target.value) }))}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {sessionData.earlyBirdPrice && (
                    <div>
                      <Label htmlFor="earlyBirdDeadline">Early Bird Deadline</Label>
                      <Input
                        id="earlyBirdDeadline"
                        type="date"
                        value={sessionData.earlyBirdDeadline || ''}
                        onChange={(e) => setSessionData(prev => ({ ...prev, earlyBirdDeadline: e.target.value }))}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="waitlistEnabled" className="text-sm">Enable Waitlist</Label>
                      <Switch
                        id="waitlistEnabled"
                        checked={sessionData.waitlistEnabled}
                        onCheckedChange={(checked) => setSessionData(prev => ({ ...prev, waitlistEnabled: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requiresApproval" className="text-sm">Requires Approval</Label>
                      <Switch
                        id="requiresApproval"
                        checked={sessionData.requiresApproval}
                        onCheckedChange={(checked) => setSessionData(prev => ({ ...prev, requiresApproval: checked }))}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Template Preview and Validation */}
          <div className="space-y-4">
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Template Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getTemplatePreview()}
                </CardContent>
              </Card>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    Validation Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Session Summary */}
            {selectedTemplate && validationErrors.length === 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                    <Check className="h-5 w-5" />
                    Session Ready
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>✓ Template selected: {selectedTemplate.name}</p>
                    <p>✓ Duration: {formatDuration(selectedTemplate.totalDuration)}</p>
                    <p>✓ Components: {selectedTemplate.components.length}</p>
                    <p>✓ All required fields completed</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={validationErrors.length > 0 || !selectedTemplate}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            {editSession ? 'Update Session' : 'Create Session'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};