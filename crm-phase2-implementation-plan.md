# CRM Phase 2 Implementation Plan
## Complete Frontend Development with Real Data Integration

### Overview
This plan details the full implementation of all CRM modules using the existing backend services and database schema. Every component will integrate with real data sources, implement genuine business logic, and provide production-ready functionality.

---

## 1. Lead Management Module

### Backend Services Available
- [`crmLeadService.getLeads()`](src/services/crm/crmLeadService.ts:1) - Fetch leads with filtering and pagination
- [`crmLeadService.createLead()`](src/services/crm/crmLeadService.ts:1) - Create new leads
- [`crmLeadService.updateLead()`](src/services/crm/crmLeadService.ts:1) - Update lead information
- [`crmLeadService.assignLead()`](src/services/crm/crmLeadService.ts:1) - Assign leads to sales reps
- [`crmLeadService.scoreLead()`](src/services/crm/crmLeadService.ts:1) - Calculate lead scores
- [`crmLeadService.convertToOpportunity()`](src/services/crm/crmLeadService.ts:1) - Convert leads to opportunities

### Components to Implement

#### 1.1 Lead List View (`src/components/crm/leads/LeadListView.tsx`)
```typescript
// Real data integration
const { data: leads, isLoading } = useQuery({
  queryKey: ['crm', 'leads', filters, page],
  queryFn: () => crmLeadService.getLeads(filters, page, limit)
});

// Features:
- Responsive table/grid view with real lead data
- Advanced filtering (source, status, score range, urgency, company size)
- Sorting by score, date, company name
- Bulk selection and operations
- Real-time lead score display with color coding
- Lead source tracking and performance indicators
```

#### 1.2 Lead Creation Form (`src/components/crm/leads/LeadCreateForm.tsx`)
```typescript
// Real form submission
const createLead = useMutation({
  mutationFn: (leadData: CreateLeadData) => crmLeadService.createLead(leadData),
  onSuccess: () => {
    queryClient.invalidateQueries(['crm', 'leads']);
    // Trigger automatic lead scoring
    crmLeadService.scoreLead(newLeadId);
  }
});

// Features:
- Multi-step form with validation using react-hook-form + zod
- Lead type selection (individual, corporate, potential_ap)
- Contact information capture with validation
- Training needs assessment
- Automatic lead scoring upon creation
- Geographic territory assignment
```

#### 1.3 Lead Import System (`src/components/crm/leads/LeadImportWizard.tsx`)
```typescript
// Real bulk import processing
const importLeads = useMutation({
  mutationFn: (csvData: File) => crmLeadService.bulkImportLeads(csvData),
  onSuccess: (result) => {
    // Show import results: successful, failed, duplicates
    setImportResults(result);
  }
});

// Features:
- CSV/Excel file upload with validation
- Field mapping interface
- Duplicate detection and handling
- Batch processing with progress tracking
- Error reporting and correction workflow
- Automatic lead scoring for imported leads
```

#### 1.4 Lead Assignment Interface (`src/components/crm/leads/LeadAssignmentPanel.tsx`)
```typescript
// Real assignment logic
const assignLeads = useMutation({
  mutationFn: ({ leadIds, assigneeId, rules }) => 
    crmLeadService.bulkAssignLeads(leadIds, assigneeId, rules)
});

// Features:
- Territory-based automatic assignment
- Manual assignment with workload balancing
- Assignment rules configuration
- Bulk assignment operations
- Assignment history tracking
```

---

## 2. Opportunities Pipeline Module

### Backend Services Available
- [`crmOpportunityService.getOpportunities()`](src/services/crm/crmOpportunityService.ts:1) - Fetch opportunities with filtering
- [`crmOpportunityService.createOpportunity()`](src/services/crm/crmOpportunityService.ts:1) - Create new opportunities
- [`crmOpportunityService.updateStage()`](src/services/crm/crmOpportunityService.ts:1) - Move through pipeline stages
- [`crmOpportunityService.calculatePipelineValue()`](src/services/crm/crmOpportunityService.ts:1) - Calculate pipeline metrics
- [`crmOpportunityService.getPipelineMetrics()`](src/services/crm/crmOpportunityService.ts:1) - Get stage-by-stage metrics
- [`crmOpportunityService.getConversionRates()`](src/services/crm/crmOpportunityService.ts:1) - Calculate conversion rates

### Components to Implement

#### 2.1 Pipeline Kanban View (`src/components/crm/opportunities/PipelineKanban.tsx`)
```typescript
// Real pipeline data
const { data: pipelineData } = useQuery({
  queryKey: ['crm', 'pipeline', pipelineType],
  queryFn: () => crmOpportunityService.getPipelineMetrics(pipelineType)
});

// Real drag-and-drop stage updates
const updateStage = useMutation({
  mutationFn: ({ opportunityId, newStage, probability }) =>
    crmOpportunityService.updateStage(opportunityId, newStage, probability)
});

// Features:
- Three-tier pipeline visualization (Individual, Corporate, AP Partnership)
- Drag-and-drop stage management with real database updates
- Opportunity cards with real financial data
- Stage-specific probability calculations
- Pipeline value aggregation by stage
- Stalled opportunity identification (14+ days without activity)
```

#### 2.2 Opportunity Detail Modal (`src/components/crm/opportunities/OpportunityDetailModal.tsx`)
```typescript
// Real opportunity data
const { data: opportunity } = useQuery({
  queryKey: ['crm', 'opportunity', opportunityId],
  queryFn: () => crmOpportunityService.getOpportunityById(opportunityId)
});

// Features:
- Complete opportunity information display
- Activity timeline with real activity data
- Document attachments and proposal tracking
- Competitor analysis section
- Revenue forecasting with probability weighting
- Stage progression history
```

#### 2.3 Forecasting Dashboard (`src/components/crm/opportunities/ForecastingDashboard.tsx`)
```typescript
// Real forecasting calculations
const { data: forecast } = useQuery({
  queryKey: ['crm', 'forecast', period, filters],
  queryFn: () => crmOpportunityService.calculateForecast(period, filters)
});

// Features:
- Weighted pipeline value calculations
- Probability-adjusted revenue projections
- Monthly/quarterly forecast views
- Confidence intervals based on historical data
- Sales rep performance forecasting
- Scenario planning (best case, worst case, most likely)
```

---

## 3. Activities & Tasks Module

### Backend Services Available
- [`crmActivityService.getActivities()`](src/services/crm/crmActivityService.ts:1) - Fetch activities with filtering
- [`crmActivityService.createActivity()`](src/services/crm/crmActivityService.ts:1) - Log new activities
- [`crmActivityService.updateActivity()`](src/services/crm/crmActivityService.ts:1) - Update activity outcomes
- [`crmActivityService.createTask()`](src/services/crm/crmActivityService.ts:1) - Create tasks and reminders
- [`crmActivityService.getUpcomingTasks()`](src/services/crm/crmActivityService.ts:1) - Get pending tasks

### Components to Implement

#### 3.1 Activity Timeline (`src/components/crm/activities/ActivityTimeline.tsx`)
```typescript
// Real activity data
const { data: activities } = useQuery({
  queryKey: ['crm', 'activities', leadId, opportunityId],
  queryFn: () => crmActivityService.getActivities({ 
    lead_id: leadId, 
    opportunity_id: opportunityId 
  })
});

// Features:
- Chronological activity display with real timestamps
- Activity type icons and outcome indicators
- Follow-up requirement tracking
- Interest level scoring (1-10 scale)
- Document attachments and meeting notes
- Activity outcome analysis and reporting
```

#### 3.2 Task Management Interface (`src/components/crm/activities/TaskManager.tsx`)
```typescript
// Real task data
const { data: tasks } = useQuery({
  queryKey: ['crm', 'tasks', filters],
  queryFn: () => crmActivityService.getTasks(filters)
});

// Real task completion
const completeTask = useMutation({
  mutationFn: ({ taskId, completionNotes }) =>
    crmActivityService.completeTask(taskId, completionNotes)
});

// Features:
- Task list with priority indicators
- Due date tracking and overdue alerts
- Task assignment and delegation
- Completion tracking with notes
- Automated task creation from stage changes
- Reminder system integration
```

#### 3.3 Calendar Integration (`src/components/crm/activities/CRMCalendar.tsx`)
```typescript
// Real calendar data
const { data: calendarEvents } = useQuery({
  queryKey: ['crm', 'calendar', startDate, endDate],
  queryFn: () => crmActivityService.getCalendarEvents(startDate, endDate)
});

// Features:
- Monthly/weekly/daily calendar views
- Meeting scheduling with lead/opportunity context
- Follow-up reminder scheduling
- Activity outcome logging directly from calendar
- Integration with external calendar systems
- Availability checking and conflict resolution
```

---

## 4. Email Campaigns Module

### Backend Services Available
- [`crmEmailCampaignService.getCampaigns()`](src/services/crm/crmEmailCampaignService.ts:1) - Fetch campaigns
- [`crmEmailCampaignService.createCampaign()`](src/services/crm/crmEmailCampaignService.ts:1) - Create new campaigns
- [`crmEmailCampaignService.sendCampaign()`](src/services/crm/crmEmailCampaignService.ts:1) - Execute campaigns
- [`crmEmailCampaignService.getCampaignMetrics()`](src/services/crm/crmEmailCampaignService.ts:1) - Get performance data
- [`crmEmailCampaignService.getTemplates()`](src/services/crm/crmEmailCampaignService.ts:1) - Manage templates

### Components to Implement

#### 4.1 Campaign Creation Wizard (`src/components/crm/campaigns/CampaignWizard.tsx`)
```typescript
// Real campaign creation
const createCampaign = useMutation({
  mutationFn: (campaignData: CreateCampaignData) =>
    crmEmailCampaignService.createCampaign(campaignData)
});

// Real audience segmentation
const { data: segments } = useQuery({
  queryKey: ['crm', 'segments', criteria],
  queryFn: () => crmLeadService.getSegmentedAudience(criteria)
});

// Features:
- Multi-step campaign creation workflow
- Template selection and customization
- Audience segmentation with real lead data
- Personalization field mapping
- A/B testing setup
- Scheduling and automation rules
```

#### 4.2 Template Management (`src/components/crm/campaigns/TemplateManager.tsx`)
```typescript
// Real template operations
const { data: templates } = useQuery({
  queryKey: ['crm', 'templates'],
  queryFn: () => crmEmailCampaignService.getTemplates()
});

// Features:
- Template library with categorization
- WYSIWYG email editor
- Personalization token system
- Template performance analytics
- Version control and approval workflow
- Mobile preview and testing
```

#### 4.3 Campaign Analytics (`src/components/crm/campaigns/CampaignAnalytics.tsx`)
```typescript
// Real campaign metrics
const { data: metrics } = useQuery({
  queryKey: ['crm', 'campaign-metrics', campaignId],
  queryFn: () => crmEmailCampaignService.getCampaignMetrics(campaignId)
});

// Features:
- Open rates, click rates, conversion tracking
- Lead generation attribution
- Revenue attribution from campaigns
- Geographic and demographic performance
- Unsubscribe and bounce rate monitoring
- ROI calculations with real revenue data
```

---

## 5. Revenue Tracking Module

### Backend Services Available
- [`crmRevenueService.getRevenueRecords()`](src/services/crm/crmRevenueService.ts:1) - Fetch revenue data
- [`crmRevenueService.createRevenueRecord()`](src/services/crm/crmRevenueService.ts:1) - Record revenue
- [`crmRevenueService.getCommissionSummary()`](src/services/crm/crmRevenueService.ts:1) - Calculate commissions
- [`crmRevenueService.getRevenueByAP()`](src/services/crm/crmRevenueService.ts:1) - AP performance data
- [`crmRevenueService.attributeCertificateRevenue()`](src/services/crm/crmRevenueService.ts:1) - Revenue attribution

### Components to Implement

#### 5.1 Revenue Dashboard (`src/components/crm/revenue/RevenueDashboard.tsx`)
```typescript
// Real revenue metrics
const { data: revenueMetrics } = useQuery({
  queryKey: ['crm', 'revenue-metrics', period],
  queryFn: () => crmRevenueService.getRevenueMetrics(startDate, endDate)
});

// Features:
- Revenue breakdown by type (certificate, corporate, AP setup)
- Monthly/quarterly revenue trends
- Commission tracking and calculations
- Revenue attribution to sales activities
- AP performance rankings
- Revenue forecasting based on pipeline
```

#### 5.2 Commission Tracking (`src/components/crm/revenue/CommissionTracker.tsx`)
```typescript
// Real commission data
const { data: commissions } = useQuery({
  queryKey: ['crm', 'commissions', salesRepId, period],
  queryFn: () => crmRevenueService.getCommissionSummary(salesRepId, startDate, endDate)
});

// Features:
- Individual sales rep commission tracking
- Commission rate configuration by revenue type
- Automated commission calculations
- Commission payment tracking
- Performance-based commission adjustments
- Commission dispute resolution workflow
```

#### 5.3 AP Performance Analytics (`src/components/crm/revenue/APPerformanceAnalytics.tsx`)
```typescript
// Real AP performance data
const { data: apPerformance } = useQuery({
  queryKey: ['crm', 'ap-performance', period],
  queryFn: () => crmRevenueService.getRevenueByAP(startDate, endDate)
});

// Features:
- AP revenue generation tracking
- Certificate volume and participant counts
- Referral conversion rates
- Geographic performance analysis
- AP partnership ROI calculations
- Performance improvement recommendations
```

---

## 6. CRM Settings Module (SA Only)

### Backend Services Available
- [`crmDashboardService.getPipelineHealth()`](src/services/crm/crmDashboardService.ts:1) - System analytics
- Database functions for lead scoring configuration
- Pipeline stage management functions
- User role and permission management

### Components to Implement

#### 6.1 Pipeline Configuration (`src/components/crm/settings/PipelineConfig.tsx`)
```typescript
// Real pipeline stage management
const { data: stages } = useQuery({
  queryKey: ['crm', 'pipeline-stages'],
  queryFn: () => crmDashboardService.getPipelineStages()
});

// Features:
- Pipeline stage creation and modification
- Stage probability defaults configuration
- Automation rule setup for stage transitions
- Stage-specific field requirements
- Pipeline performance optimization
- Stage conversion rate analysis
```

#### 6.2 Lead Scoring Configuration (`src/components/crm/settings/LeadScoringConfig.tsx`)
```typescript
// Real scoring rule management
const updateScoringRules = useMutation({
  mutationFn: (rules: LeadScoringConfig) =>
    crmLeadService.updateScoringConfiguration(rules)
});

// Features:
- Scoring criteria weight adjustment
- Industry-specific scoring rules
- Urgency and company size multipliers
- Contact quality scoring parameters
- Volume-based scoring adjustments
- Scoring algorithm testing and validation
```

#### 6.3 Assignment Rules (`src/components/crm/settings/AssignmentRules.tsx`)
```typescript
// Real assignment rule configuration
const { data: assignmentRules } = useQuery({
  queryKey: ['crm', 'assignment-rules'],
  queryFn: () => crmLeadService.getAssignmentRules()
});

// Features:
- Territory-based assignment configuration
- Workload balancing algorithms
- Round-robin assignment setup
- Skill-based assignment rules
- Assignment escalation procedures
- Assignment performance monitoring
```

---

## Implementation Timeline

### Week 1-2: Lead Management
- Lead list view with real data integration
- Lead creation and import functionality
- Lead assignment and scoring systems

### Week 3-4: Opportunities Pipeline
- Kanban pipeline visualization
- Opportunity detail management
- Forecasting dashboard

### Week 5-6: Activities & Tasks
- Activity timeline and logging
- Task management system
- Calendar integration

### Week 7-8: Email Campaigns
- Campaign creation wizard
- Template management
- Campaign analytics

### Week 9-10: Revenue Tracking
- Revenue dashboard
- Commission tracking
- AP performance analytics

### Week 11-12: CRM Settings
- Pipeline configuration
- Lead scoring setup
- Assignment rules management

## Technical Requirements

### Data Integration Standards
- All components must use existing CRM service layer
- No mock data or hardcoded values
- Real-time data updates with React Query
- Proper error handling and loading states
- Optimistic updates for better UX

### Performance Requirements
- Pagination for large datasets
- Virtual scrolling for tables with 1000+ records
- Debounced search and filtering
- Efficient caching strategies
- Background data refresh

### Security Requirements
- Role-based component rendering
- Data validation on all forms
- Secure API integration
- Audit trail for all CRM actions
- PIPEDA compliance for Canadian data

This plan ensures every CRM module will be implemented with real backend integration, authentic business logic, and production-ready functionality without any mock data or placeholder content.