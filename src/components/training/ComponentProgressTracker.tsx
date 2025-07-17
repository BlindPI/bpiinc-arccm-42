import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  BookOpen,
  Coffee,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  SkipForward,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  Calendar,
  Utensils,
  Settings,
  FileText,
  Award,
  Timer
} from 'lucide-react';

interface StudentProgress {
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrollmentId: string;
  overallStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PASSED' | 'FAILED';
  overallScore?: number;
  overallPassed?: boolean;
  attendancePercentage?: number;
  participationScore?: number;
  componentProgress: ComponentProgress[];
}

interface ComponentProgress {
  id: string;
  componentId: string;
  componentName: string;
  componentType: 'COURSE' | 'BREAK' | 'LUNCH' | 'ASSESSMENT' | 'ACTIVITY';
  sequenceOrder: number;
  duration: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PASSED' | 'FAILED' | 'SKIPPED' | 'EXCUSED';
  startTime?: string;
  endTime?: string;
  actualDuration?: number;
  score?: number;
  passed?: boolean;
  attempts: number;
  maxAttempts: number;
  attendanceStatus: 'REGISTERED' | 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_DEPARTURE' | 'EXCUSED';
  attendancePercentage?: number;
  participationScore?: number;
  instructorNotes?: string;
  participantFeedback?: string;
  isMandatory: boolean;
  hasAssessment: boolean;
}

interface SessionData {
  id: string;
  title: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  instructorName: string;
  locationName: string;
  templateName: string;
  status: string;
}

interface ComponentProgressTrackerProps {
  sessionId: string;
  sessionData: SessionData;
  studentProgress: StudentProgress[];
  onUpdateProgress: (enrollmentId: string, componentId: string, updates: Partial<ComponentProgress>) => void;
  onBulkUpdate: (updates: any) => void;
  isInstructor?: boolean;
}

export const ComponentProgressTracker: React.FC<ComponentProgressTrackerProps> = ({
  sessionId,
  sessionData,
  studentProgress,
  onUpdateProgress,
  onBulkUpdate,
  isInstructor = false
}) => {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const [bulkAction, setBulkAction] = useState<string>('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'student' | 'component'>('student');

  const getStatusIcon = (status: ComponentProgress['status']) => {
    switch (status) {
      case 'COMPLETED':
      case 'PASSED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'IN_PROGRESS':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'SKIPPED':
        return <SkipForward className="h-4 w-4 text-yellow-600" />;
      case 'EXCUSED':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return <Pause className="h-4 w-4 text-gray-400" />;
    }
  };

  const getComponentIcon = (type: ComponentProgress['componentType']) => {
    switch (type) {
      case 'COURSE':
        return <BookOpen className="h-4 w-4 text-blue-600" />;
      case 'BREAK':
        return <Coffee className="h-4 w-4 text-amber-600" />;
      case 'LUNCH':
        return <Utensils className="h-4 w-4 text-orange-600" />;
      case 'ASSESSMENT':
        return <Settings className="h-4 w-4 text-purple-600" />;
      case 'ACTIVITY':
        return <Users className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAttendanceIcon = (status: ComponentProgress['attendanceStatus']) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'ABSENT':
        return <XCircle className="h-3 w-3 text-red-600" />;
      case 'LATE':
        return <AlertCircle className="h-3 w-3 text-yellow-600" />;
      case 'EARLY_DEPARTURE':
        return <TrendingDown className="h-3 w-3 text-orange-600" />;
      case 'EXCUSED':
        return <Minus className="h-3 w-3 text-gray-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const calculateOverallProgress = (student: StudentProgress) => {
    const totalComponents = student.componentProgress.filter(c => c.isMandatory).length;
    const completedComponents = student.componentProgress.filter(
      c => c.isMandatory && ['COMPLETED', 'PASSED'].includes(c.status)
    ).length;
    return totalComponents > 0 ? (completedComponents / totalComponents) * 100 : 0;
  };

  const getComponentsBySequence = () => {
    if (studentProgress.length === 0) return [];
    return studentProgress[0].componentProgress.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const updateComponentProgress = (
    enrollmentId: string,
    componentId: string,
    field: keyof ComponentProgress,
    value: any
  ) => {
    const updates = { [field]: value };
    
    // Auto-update related fields
    if (field === 'status' && ['COMPLETED', 'PASSED', 'FAILED'].includes(value)) {
      updates.endTime = new Date().toISOString();
      if (!updates.startTime) {
        updates.startTime = new Date().toISOString();
      }
    }
    
    if (field === 'score' && typeof value === 'number') {
      const student = studentProgress.find(s => s.enrollmentId === enrollmentId);
      const component = student?.componentProgress.find(c => c.componentId === componentId);
      if (component?.hasAssessment) {
        updates.passed = value >= 80; // Default passing score
        updates.status = value >= 80 ? 'PASSED' : 'FAILED';
      }
    }
    
    onUpdateProgress(enrollmentId, componentId, updates);
  };

  const StudentProgressView = () => (
    <div className="space-y-4">
      {studentProgress
        .filter(student => 
          filterStatus === 'all' || student.overallStatus === filterStatus
        )
        .map(student => (
          <Card key={student.studentId} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-600" />
                  <div>
                    <CardTitle className="text-lg">{student.studentName}</CardTitle>
                    <p className="text-sm text-gray-600">{student.studentEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    student.overallStatus === 'PASSED' ? 'default' :
                    student.overallStatus === 'FAILED' ? 'destructive' :
                    student.overallStatus === 'IN_PROGRESS' ? 'secondary' : 'outline'
                  }>
                    {student.overallStatus}
                  </Badge>
                  {student.overallScore !== undefined && (
                    <Badge variant="outline">
                      Score: {student.overallScore}%
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{Math.round(calculateOverallProgress(student))}%</span>
                </div>
                <Progress value={calculateOverallProgress(student)} className="h-2" />
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {student.componentProgress
                  .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                  .map(component => (
                    <div key={component.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getComponentIcon(component.componentType)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{component.componentName}</span>
                            {component.isMandatory && <Badge variant="outline" className="text-xs">Required</Badge>}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span>{formatDuration(component.duration)}</span>
                            {component.startTime && (
                              <span>Started: {formatTime(component.startTime)}</span>
                            )}
                            {component.endTime && (
                              <span>Ended: {formatTime(component.endTime)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getAttendanceIcon(component.attendanceStatus)}
                        {getStatusIcon(component.status)}
                        
                        {component.hasAssessment && component.score !== undefined && (
                          <Badge variant={component.passed ? 'default' : 'destructive'} className="text-xs">
                            {component.score}%
                          </Badge>
                        )}
                      </div>
                      
                      {isInstructor && (
                        <div className="flex items-center gap-1">
                          <Select
                            value={component.status}
                            onValueChange={(value: any) => 
                              updateComponentProgress(student.enrollmentId, component.componentId, 'status', value)
                            }
                          >
                            <SelectTrigger className="w-24 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="PASSED">Passed</SelectItem>
                              <SelectItem value="FAILED">Failed</SelectItem>
                              <SelectItem value="SKIPPED">Skipped</SelectItem>
                              <SelectItem value="EXCUSED">Excused</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {component.hasAssessment && (
                            <Input
                              type="number"
                              value={component.score || ''}
                              onChange={(e) => 
                                updateComponentProgress(
                                  student.enrollmentId,
                                  component.componentId,
                                  'score',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-16 h-8 text-xs"
                              placeholder="Score"
                              min="0"
                              max="100"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
              
              {isInstructor && (
                <div className="mt-4 pt-3 border-t">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Attendance %</Label>
                      <Input
                        type="number"
                        value={student.attendancePercentage || ''}
                        onChange={(e) => {
                          // Update overall attendance - would need to implement this
                        }}
                        className="h-8 text-xs"
                        placeholder="100"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Participation</Label>
                      <Input
                        type="number"
                        value={student.participationScore || ''}
                        onChange={(e) => {
                          // Update participation score - would need to implement this
                        }}
                        className="h-8 text-xs"
                        placeholder="100"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Overall Score</Label>
                      <Input
                        type="number"
                        value={student.overallScore || ''}
                        onChange={(e) => {
                          // Update overall score - would need to implement this
                        }}
                        className="h-8 text-xs"
                        placeholder="Auto"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
    </div>
  );

  const ComponentProgressView = () => {
    const components = getComponentsBySequence();
    
    return (
      <div className="space-y-4">
        {components.map(component => (
          <Card key={component.componentId} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getComponentIcon(component.componentType)}
                  <div>
                    <CardTitle className="text-lg">{component.componentName}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {component.componentType} • {formatDuration(component.duration)}
                      {component.isMandatory && ' • Required'}
                      {component.hasAssessment && ' • Assessed'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {component.sequenceOrder}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                {studentProgress.map(student => {
                  const studentComponent = student.componentProgress.find(
                    c => c.componentId === component.componentId
                  );
                  
                  if (!studentComponent) return null;
                  
                  return (
                    <div key={student.studentId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2 flex-1">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">{student.studentName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getAttendanceIcon(studentComponent.attendanceStatus)}
                        {getStatusIcon(studentComponent.status)}
                        
                        {studentComponent.hasAssessment && studentComponent.score !== undefined && (
                          <Badge variant={studentComponent.passed ? 'default' : 'destructive'} className="text-xs">
                            {studentComponent.score}%
                          </Badge>
                        )}
                        
                        <Badge variant="outline" className="text-xs">
                          {studentComponent.status}
                        </Badge>
                      </div>
                      
                      {isInstructor && (
                        <div className="flex items-center gap-1 ml-2">
                          <Select
                            value={studentComponent.status}
                            onValueChange={(value: any) => 
                              updateComponentProgress(student.enrollmentId, component.componentId, 'status', value)
                            }
                          >
                            <SelectTrigger className="w-24 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="PASSED">Passed</SelectItem>
                              <SelectItem value="FAILED">Failed</SelectItem>
                              <SelectItem value="SKIPPED">Skipped</SelectItem>
                              <SelectItem value="EXCUSED">Excused</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Component Progress Tracker</h2>
            <p className="text-gray-600">
              {sessionData.title} • {sessionData.sessionDate} • {studentProgress.length} students
            </p>
          </div>
          
          {isInstructor && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowBulkDialog(true)}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Bulk Actions
              </Button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-6">
          <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="w-auto">
            <TabsList>
              <TabsTrigger value="student">By Student</TabsTrigger>
              <TabsTrigger value="component">By Component</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PASSED">Passed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Progress Content */}
      {viewMode === 'student' ? <StudentProgressView /> : <ComponentProgressView />}
    </div>
  );
};