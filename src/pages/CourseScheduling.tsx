
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Calendar, Clock, AlertTriangle, Zap, Users, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CourseScheduler } from '@/components/courses/CourseScheduler';
import { ScheduleCalendarView } from '@/components/scheduling/ScheduleCalendarView';
import { ConflictDetector } from '@/components/scheduling/ConflictDetector';
import { SchedulingRecommendations } from '@/components/scheduling/SchedulingRecommendations';
import { ResourceAvailability } from '@/components/scheduling/ResourceAvailability';
import { useProfile } from '@/hooks/useProfile';
import { useCourseScheduling } from '@/hooks/useCourseScheduling';
import { useKeyboardShortcuts, useGlobalKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAccessibility, useScreenReaderAnnouncements } from '@/hooks/useAccessibility';
import { ProgressiveLoader } from '@/components/ui/progressive-loader';
import { DashboardSkeleton } from '@/components/ui/skeleton-variants';
import { HelpTooltip, OnboardingTour, ContextualHelpPanel } from '@/components/ui/contextual-help';
import { KeyboardShortcutsDialog } from '@/components/ui/keyboard-shortcuts-dialog';

export default function CourseScheduling() {
  const { data: profile } = useProfile();
  const { getCourseSchedules } = useCourseScheduling();
  const { data: schedules, isLoading } = getCourseSchedules();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showScheduler, setShowScheduler] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { announce } = useScreenReaderAnnouncements();
  const { announceToScreenReader } = useAccessibility();

  // Global keyboard shortcuts
  useGlobalKeyboardShortcuts();

  // Page-specific keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrlKey: true,
      action: () => {
        setShowScheduler(true);
        announceToScreenReader('Opening new schedule form');
      },
      description: 'Create new schedule'
    },
    {
      key: 'h',
      action: () => {
        setShowOnboarding(true);
        announceToScreenReader('Opening help tour');
      },
      description: 'Show help tour'
    }
  ]);

  const canSchedule = profile?.role && ['SA', 'AD', 'AP'].includes(profile.role);

  const onboardingSteps = [
    {
      title: 'Welcome to Course Scheduling',
      content: 'This tool helps you create and manage course schedules with automatic conflict detection.',
    },
    {
      title: 'Create New Schedules',
      content: 'Click the "New Schedule" button or press Ctrl+N to create a new course schedule.',
      action: {
        label: 'Try it now',
        onClick: () => setShowScheduler(true)
      }
    },
    {
      title: 'View Calendar',
      content: 'Use the Calendar tab to see all your scheduled courses in a visual timeline.',
    },
    {
      title: 'Conflict Detection',
      content: 'The system automatically detects scheduling conflicts and suggests alternatives.',
    }
  ];

  const helpSections = [
    {
      title: 'Getting Started',
      content: 'Learn how to create your first course schedule and avoid common conflicts.',
      links: [
        { label: 'Scheduling Best Practices', href: '#' },
        { label: 'Video Tutorial', href: '#' }
      ]
    },
    {
      title: 'Conflict Resolution',
      content: 'Understand how the system detects conflicts and how to resolve them.',
      links: [
        { label: 'Conflict Types Guide', href: '#' }
      ]
    },
    {
      title: 'Keyboard Shortcuts',
      content: 'Speed up your workflow with keyboard shortcuts.',
    }
  ];

  if (!canSchedule) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<Calendar className="h-7 w-7 text-primary" />}
          title="Course Scheduling"
          subtitle="Access denied - insufficient permissions"
        />
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              Only System Administrators, Administrators, and Authorized Providers can access course scheduling.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProgressiveLoader
      fallback={<DashboardSkeleton />}
      loadingMessage="Loading course scheduling interface..."
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <PageHeader
            icon={<Calendar className="h-7 w-7 text-primary" />}
            title="Course Scheduling"
            subtitle="Advanced scheduling with conflict detection and recommendations"
            actions={
              <div className="flex items-center gap-2">
                <ContextualHelpPanel 
                  title="Course Scheduling Help" 
                  sections={helpSections} 
                />
                <KeyboardShortcutsDialog />
                <Button 
                  onClick={() => setShowOnboarding(true)} 
                  variant="outline" 
                  size="sm"
                >
                  Tour
                </Button>
                <Button 
                  onClick={() => {
                    setShowScheduler(true);
                    announce('Opening new schedule form');
                  }} 
                  className="gap-2"
                  data-shortcut="Ctrl+N"
                >
                  <Clock className="h-4 w-4" />
                  New Schedule
                </Button>
              </div>
            }
          />
          <HelpTooltip content="Create and manage course schedules with automatic conflict detection and resource management.">
            <p className="text-sm text-muted-foreground">
              Manage course schedules with intelligent conflict detection
            </p>
          </HelpTooltip>
        </div>

        {showScheduler && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Course Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <CourseScheduler 
                onScheduleCreated={() => {
                  setShowScheduler(false);
                  announce('Course schedule created successfully');
                }}
              />
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setShowScheduler(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar View</span>
              <span className="sm:hidden">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Conflicts</span>
              <span className="sm:hidden">Issues</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Recommendations</span>
              <span className="sm:hidden">Suggest</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Resources</span>
              <span className="sm:hidden">People</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <ProgressiveLoader fallback={<DashboardSkeleton />}>
              <ScheduleCalendarView 
                schedules={schedules || []}
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  announce(`Selected date: ${date.toLocaleDateString()}`);
                }}
                onScheduleClick={(schedule) => {
                  console.log('Schedule clicked:', schedule);
                  announce(`Selected schedule: ${schedule.id}`);
                }}
              />
            </ProgressiveLoader>
          </TabsContent>

          <TabsContent value="conflicts" className="space-y-4">
            <ProgressiveLoader fallback={<DashboardSkeleton />}>
              <ConflictDetector schedules={schedules || []} />
            </ProgressiveLoader>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <ProgressiveLoader fallback={<DashboardSkeleton />}>
              <SchedulingRecommendations 
                schedules={schedules || []}
                selectedDate={selectedDate}
              />
            </ProgressiveLoader>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <ProgressiveLoader fallback={<DashboardSkeleton />}>
              <ResourceAvailability 
                schedules={schedules || []}
                selectedDate={selectedDate}
              />
            </ProgressiveLoader>
          </TabsContent>
        </Tabs>

        <OnboardingTour
          steps={onboardingSteps}
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => {
            setShowOnboarding(false);
            announce('Onboarding tour completed');
          }}
        />
      </div>
    </ProgressiveLoader>
  );
}
