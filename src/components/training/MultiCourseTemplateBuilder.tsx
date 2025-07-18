import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Coffee,
  Clock,
  Users,
  MapPin,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Settings,
  Utensils
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  breakType?: 'SHORT' | 'LUNCH' | 'EXTENDED';
  hasAssessment: boolean;
  assessmentType?: 'WRITTEN' | 'PRACTICAL' | 'BOTH';
  minScore?: number;
  instructorRequired: boolean;
  roomRequired: boolean;
  maxParticipants?: number;
  notes?: string;
}

interface SessionTemplate {
  id?: string;
  name: string;
  code: string;
  description: string;
  templateType: 'SINGLE_COURSE' | 'MULTI_COURSE' | 'WORKSHOP_SERIES' | 'CERTIFICATION_TRACK';
  totalDuration: number;
  estimatedBreakMinutes: number;
  maxParticipants?: number;
  isActive: boolean;
  isPublic: boolean;
  requiresApproval: boolean;
  requiredInstructors: number;
  requiredRooms: number;
  requiredEquipment: string[];
  components: TemplateComponent[];
}

interface Course {
  id: string;
  name: string;
  code: string;
  duration: number;
}

interface MultiCourseTemplateBuilderProps {
  courses: Course[];
  template?: SessionTemplate;
  onSave: (template: SessionTemplate) => void;
  onCancel: () => void;
}

// Sortable component for individual template components
const SortableComponent: React.FC<{
  component: TemplateComponent;
  index: number;
  componentTypeIcons: any;
  formatDuration: (minutes: number) => string;
  updateComponent: (componentId: string, updates: Partial<TemplateComponent>) => void;
  removeComponent: (componentId: string) => void;
}> = ({ component, index, componentTypeIcons, formatDuration, updateComponent, removeComponent }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = componentTypeIcons[component.type];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="border-l-4 border-l-blue-500"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab text-gray-400"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <IconComponent className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium">{component.name}</h4>
                  <p className="text-sm text-gray-600">
                    {component.type} • {formatDuration(component.duration)}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeComponent(component.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`duration-${component.id}`} className="text-xs">Duration (minutes)</Label>
                <Input
                  id={`duration-${component.id}`}
                  type="number"
                  value={component.duration}
                  onChange={(e) => updateComponent(component.id, { duration: parseInt(e.target.value) })}
                  className="h-8"
                />
              </div>
              {!component.isBreak && (
                <div>
                  <Label htmlFor={`participants-${component.id}`} className="text-xs">Max Participants</Label>
                  <Input
                    id={`participants-${component.id}`}
                    type="number"
                    value={component.maxParticipants || ''}
                    onChange={(e) => updateComponent(component.id, { maxParticipants: parseInt(e.target.value) })}
                    className="h-8"
                    placeholder="Inherit"
                  />
                </div>
              )}
            </div>

            {component.hasAssessment && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Assessment Type</Label>
                  <Select
                    value={component.assessmentType}
                    onValueChange={(value: any) => updateComponent(component.id, { assessmentType: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WRITTEN">Written</SelectItem>
                      <SelectItem value="PRACTICAL">Practical</SelectItem>
                      <SelectItem value="BOTH">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Minimum Score (%)</Label>
                  <Input
                    type="number"
                    value={component.minScore || ''}
                    onChange={(e) => updateComponent(component.id, { minScore: parseInt(e.target.value) })}
                    className="h-8"
                    placeholder="80"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Switch
                  checked={component.isMandatory}
                  onCheckedChange={(checked) => updateComponent(component.id, { isMandatory: checked })}
                  disabled={component.isBreak}
                />
                <Label>Mandatory</Label>
              </div>
              <div className="flex items-center gap-1">
                <Switch
                  checked={component.instructorRequired}
                  onCheckedChange={(checked) => updateComponent(component.id, { instructorRequired: checked })}
                />
                <Label>Instructor</Label>
              </div>
              <div className="flex items-center gap-1">
                <Switch
                  checked={component.roomRequired}
                  onCheckedChange={(checked) => updateComponent(component.id, { roomRequired: checked })}
                />
                <Label>Room</Label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MultiCourseTemplateBuilder: React.FC<MultiCourseTemplateBuilderProps> = ({
  courses,
  template,
  onSave,
  onCancel
}) => {
  const [sessionTemplate, setSessionTemplate] = useState<SessionTemplate>({
    name: '',
    code: '',
    description: '',
    templateType: 'MULTI_COURSE',
    totalDuration: 0,
    estimatedBreakMinutes: 0,
    maxParticipants: 12,
    isActive: true,
    isPublic: false,
    requiresApproval: false,
    requiredInstructors: 1,
    requiredRooms: 1,
    requiredEquipment: [],
    components: [],
    ...template
  });

  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [newEquipment, setNewEquipment] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const componentTypeIcons = {
    COURSE: BookOpen,
    BREAK: Coffee,
    LUNCH: Utensils,
    ASSESSMENT: Settings,
    ACTIVITY: Users
  };

  const addComponent = (type: TemplateComponent['type']) => {
    const newComponent: TemplateComponent = {
      id: `comp_${Date.now()}`,
      type,
      name: type === 'BREAK' ? 'Break' : type === 'LUNCH' ? 'Lunch Break' : 'New Component',
      duration: type === 'BREAK' ? 15 : type === 'LUNCH' ? 60 : 120,
      sequenceOrder: sessionTemplate.components.length + 1,
      isMandatory: type !== 'BREAK',
      isBreak: type === 'BREAK' || type === 'LUNCH',
      breakType: type === 'BREAK' ? 'SHORT' : type === 'LUNCH' ? 'LUNCH' : undefined,
      hasAssessment: type === 'ASSESSMENT',
      assessmentType: type === 'ASSESSMENT' ? 'WRITTEN' : undefined,
      instructorRequired: type !== 'BREAK' && type !== 'LUNCH',
      roomRequired: true
    };

    setSessionTemplate(prev => ({
      ...prev,
      components: [...prev.components, newComponent],
      totalDuration: prev.totalDuration + newComponent.duration,
      estimatedBreakMinutes: prev.estimatedBreakMinutes + (newComponent.isBreak ? newComponent.duration : 0)
    }));
  };

  const addCourseComponent = () => {
    if (!selectedCourse) return;
    
    const course = courses.find(c => c.id === selectedCourse);
    if (!course) return;

    const newComponent: TemplateComponent = {
      id: `comp_${Date.now()}`,
      type: 'COURSE',
      courseId: course.id,
      name: course.name,
      duration: course.duration,
      sequenceOrder: sessionTemplate.components.length + 1,
      isMandatory: true,
      isBreak: false,
      hasAssessment: false,
      instructorRequired: true,
      roomRequired: true
    };

    setSessionTemplate(prev => ({
      ...prev,
      components: [...prev.components, newComponent],
      totalDuration: prev.totalDuration + newComponent.duration
    }));

    setSelectedCourse('');
  };

  const updateComponent = (componentId: string, updates: Partial<TemplateComponent>) => {
    setSessionTemplate(prev => {
      const updatedComponents = prev.components.map(comp => 
        comp.id === componentId ? { ...comp, ...updates } : comp
      );
      
      const totalDuration = updatedComponents.reduce((sum, comp) => sum + comp.duration, 0);
      const estimatedBreakMinutes = updatedComponents
        .filter(comp => comp.isBreak)
        .reduce((sum, comp) => sum + comp.duration, 0);

      return {
        ...prev,
        components: updatedComponents,
        totalDuration,
        estimatedBreakMinutes
      };
    });
  };

  const removeComponent = (componentId: string) => {
    setSessionTemplate(prev => {
      const component = prev.components.find(c => c.id === componentId);
      const updatedComponents = prev.components.filter(c => c.id !== componentId);
      
      return {
        ...prev,
        components: updatedComponents,
        totalDuration: prev.totalDuration - (component?.duration || 0),
        estimatedBreakMinutes: prev.estimatedBreakMinutes - (component?.isBreak ? component.duration : 0)
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = sessionTemplate.components.findIndex((item) => item.id === active.id);
      const newIndex = sessionTemplate.components.findIndex((item) => item.id === over?.id);

      const updatedItems = arrayMove(sessionTemplate.components, oldIndex, newIndex).map((item, index) => ({
        ...item,
        sequenceOrder: index + 1
      }));

      setSessionTemplate(prev => ({
        ...prev,
        components: updatedItems
      }));
    }
  };

  const addEquipment = () => {
    if (!newEquipment.trim()) return;
    
    setSessionTemplate(prev => ({
      ...prev,
      requiredEquipment: [...prev.requiredEquipment, newEquipment.trim()]
    }));
    setNewEquipment('');
  };

  const removeEquipment = (index: number) => {
    setSessionTemplate(prev => ({
      ...prev,
      requiredEquipment: prev.requiredEquipment.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!sessionTemplate.name || !sessionTemplate.code || sessionTemplate.components.length === 0) {
      alert('Please fill in all required fields and add at least one component');
      return;
    }
    
    onSave(sessionTemplate);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Multi-Course Session Template Builder</h1>
          <p className="text-gray-600">Create reusable templates for complex training itineraries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Template Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={sessionTemplate.name}
                onChange={(e) => setSessionTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Full Day CPR & First Aid"
              />
            </div>

            <div>
              <Label htmlFor="code">Template Code *</Label>
              <Input
                id="code"
                value={sessionTemplate.code}
                onChange={(e) => setSessionTemplate(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="e.g., CPR-FA-FULL"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={sessionTemplate.description}
                onChange={(e) => setSessionTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this training template..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="templateType">Template Type</Label>
              <Select
                value={sessionTemplate.templateType}
                onValueChange={(value: any) => setSessionTemplate(prev => ({ ...prev, templateType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MULTI_COURSE">Multi-Course</SelectItem>
                  <SelectItem value="WORKSHOP_SERIES">Workshop Series</SelectItem>
                  <SelectItem value="CERTIFICATION_TRACK">Certification Track</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={sessionTemplate.maxParticipants}
                  onChange={(e) => setSessionTemplate(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="requiredInstructors">Instructors Required</Label>
                <Input
                  id="requiredInstructors"
                  type="number"
                  value={sessionTemplate.requiredInstructors}
                  onChange={(e) => setSessionTemplate(prev => ({ ...prev, requiredInstructors: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Template Options</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive" className="text-sm">Active Template</Label>
                  <Switch
                    id="isActive"
                    checked={sessionTemplate.isActive}
                    onCheckedChange={(checked) => setSessionTemplate(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isPublic" className="text-sm">Public Template</Label>
                  <Switch
                    id="isPublic"
                    checked={sessionTemplate.isPublic}
                    onCheckedChange={(checked) => setSessionTemplate(prev => ({ ...prev, isPublic: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requiresApproval" className="text-sm">Requires Approval</Label>
                  <Switch
                    id="requiresApproval"
                    checked={sessionTemplate.requiresApproval}
                    onCheckedChange={(checked) => setSessionTemplate(prev => ({ ...prev, requiresApproval: checked }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Required Equipment</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  placeholder="Add equipment..."
                  onKeyPress={(e) => e.key === 'Enter' && addEquipment()}
                />
                <Button size="sm" onClick={addEquipment}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {sessionTemplate.requiredEquipment.map((equipment, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {equipment}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0"
                      onClick={() => removeEquipment(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Template Summary */}
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">Template Summary</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Total Duration:</span>
                  <span className="font-medium">{formatDuration(sessionTemplate.totalDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Break Time:</span>
                  <span className="font-medium">{formatDuration(sessionTemplate.estimatedBreakMinutes)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Components:</span>
                  <span className="font-medium">{sessionTemplate.components.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Component Builder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Session Components
              <Badge variant="outline">{sessionTemplate.components.length} components</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add Component Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <h4 className="font-medium">Add Components</h4>
              
              {/* Add Course */}
              <div className="flex gap-2">
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a course to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} ({course.code}) - {formatDuration(course.duration)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addCourseComponent} disabled={!selectedCourse}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Course
                </Button>
              </div>

              {/* Add Other Components */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => addComponent('BREAK')}>
                  <Coffee className="h-4 w-4 mr-1" />
                  Break
                </Button>
                <Button size="sm" variant="outline" onClick={() => addComponent('LUNCH')}>
                  <Utensils className="h-4 w-4 mr-1" />
                  Lunch
                </Button>
                <Button size="sm" variant="outline" onClick={() => addComponent('ASSESSMENT')}>
                  <Settings className="h-4 w-4 mr-1" />
                  Assessment
                </Button>
                <Button size="sm" variant="outline" onClick={() => addComponent('ACTIVITY')}>
                  <Users className="h-4 w-4 mr-1" />
                  Activity
                </Button>
              </div>
            </div>

            {/* Components List */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sessionTemplate.components.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sessionTemplate.components.map((component, index) => (
                    <SortableComponent
                      key={component.id}
                      component={component}
                      index={index}
                      componentTypeIcons={componentTypeIcons}
                      formatDuration={formatDuration}
                      updateComponent={updateComponent}
                      removeComponent={removeComponent}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {sessionTemplate.components.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No components added yet</p>
                <p className="text-sm">Add courses, breaks, or activities above to build your template</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};