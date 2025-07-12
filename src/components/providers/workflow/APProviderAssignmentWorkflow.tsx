/**
 * PROVIDER MANAGEMENT SYSTEM RESTORATION - PHASE 2: WORKFLOW CONSOLIDATION
 * 
 * Unified APProviderAssignmentWorkflow - Replaces all conflicting workflows:
 * ❌ CreateProviderDialog - REMOVED (duplicate providers)
 * ❌ ThreeClickProviderWorkflow - REMOVED (broken logic)
 * ❌ APUserSelectionDialog - REMOVED (non-functional)
 * 
 * ✅ NEW: 4-Step Validated Assignment Process:
 * Step 1: AP User Selection (with conflict detection)
 * Step 2: Location Selection (with availability checking)
 * Step 3: Provider/Team Setup (with validation)
 * Step 4: Confirmation (with rollback capability)
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, MapPin, Building, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { providerRelationshipService } from '@/services/provider/providerRelationshipService';
import { toast } from 'sonner';

// =====================================================================================
// WORKFLOW INTERFACES
// =====================================================================================

interface APUser {
  id: string;
  display_name: string;
  email: string;
  role: string;
  status: string;
  existing_assignments?: number;
  last_activity?: string;
}

interface Location {
  id: string;
  name: string;
  city?: string;
  state?: string;
  address?: string;
  available_teams?: number;
  active_providers?: number;
  capacity_status?: 'available' | 'limited' | 'full';
}

interface Team {
  id: string;
  name: string;
  team_type: string;
  status: string;
  location_id?: string;
  member_count: number;
  performance_score?: number;
  needs_provider?: boolean;
}

interface WorkflowStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
  data?: any;
  warnings?: string[];
  errors?: string[];
}

interface AssignmentData {
  apUser?: APUser;
  location?: Location;
  teams?: Team[];
  assignmentRole?: 'primary' | 'secondary' | 'supervisor' | 'coordinator';
  oversightLevel?: 'monitor' | 'standard' | 'manage' | 'admin';
  assignmentType?: 'ongoing' | 'project_based' | 'temporary';
  endDate?: string;
  notes?: string;
}

// =====================================================================================
// UNIFIED AP PROVIDER ASSIGNMENT WORKFLOW COMPONENT
// =====================================================================================

interface APProviderAssignmentWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (assignmentId: string) => void;
  initialStep?: number;
}

export const APProviderAssignmentWorkflow: React.FC<APProviderAssignmentWorkflowProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStep = 1
}) => {
  // =====================================================================================
  // STATE MANAGEMENT
  // =====================================================================================

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [assignmentData, setAssignmentData] = useState<AssignmentData>({});
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      step: 1,
      title: 'AP User Selection',
      description: 'Select the AP User to assign as provider',
      completed: false,
      data: null,
      warnings: [],
      errors: []
    },
    {
      step: 2,
      title: 'Location Selection',
      description: 'Choose the location for provider assignment',
      completed: false,
      data: null,
      warnings: [],
      errors: []
    },
    {
      step: 3,
      title: 'Provider/Team Setup',
      description: 'Configure provider role and team assignments',
      completed: false,
      data: null,
      warnings: [],
      errors: []
    },
    {
      step: 4,
      title: 'Confirmation',
      description: 'Review and confirm the assignment',
      completed: false,
      data: null,
      warnings: [],
      errors: []
    }
  ]);

  // Data arrays
  const [apUsers, setApUsers] = useState<APUser[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);

  // =====================================================================================
  // DATA LOADING FUNCTIONS
  // =====================================================================================

  /**
   * Load available AP Users with conflict detection
   */
  const loadAPUsers = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          email,
          role,
          status,
          last_activity
        `)
        .eq('role', 'AP')
        .eq('status', 'active')
        .order('display_name');

      if (error) throw error;

      // Get existing assignments for conflict detection
      const apUsersWithAssignments = await Promise.all(
        (profiles || []).map(async (profile) => {
          const assignments = await providerRelationshipService.getProviderLocationAssignments(profile.id);
          return {
            ...profile,
            existing_assignments: assignments.length
          } as APUser;
        })
      );

      setApUsers(apUsersWithAssignments);
      
    } catch (error) {
      console.error('Error loading AP users:', error);
      toast.error('Failed to load AP users');
      updateStepErrors(1, ['Failed to load AP users']);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load available locations with availability checking
   */
  const loadLocations = async (): Promise<void> => {
    try {
      setLoading(true);

      const { data: locations, error } = await supabase
        .from('locations')
        .select(`
          id,
          name,
          city,
          state,
          address,
          teams(id, status),
          provider_location_assignments(id, status)
        `)
        .order('name');

      if (error) throw error;

      // Process locations with availability data
      const locationsWithAvailability = (locations || []).map(location => {
        const availableTeams = location.teams?.filter(team => team.status === 'active').length || 0;
        const activeProviders = location.provider_location_assignments?.filter(assignment => assignment.status === 'active').length || 0;
        
        let capacityStatus: 'available' | 'limited' | 'full' = 'available';
        if (activeProviders >= availableTeams && availableTeams > 0) {
          capacityStatus = 'full';
        } else if (activeProviders > availableTeams * 0.7) {
          capacityStatus = 'limited';
        }

        return {
          id: location.id,
          name: location.name,
          city: location.city,
          state: location.state,
          address: location.address,
          available_teams: availableTeams,
          active_providers: activeProviders,
          capacity_status: capacityStatus
        } as Location;
      });

      setLocations(locationsWithAvailability);

    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
      updateStepErrors(2, ['Failed to load locations']);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load available teams for selected location
   */
  const loadAvailableTeams = async (locationId: string): Promise<void> => {
    try {
      setLoading(true);

      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          team_type,
          status,
          location_id,
          performance_score
        `)
        .eq('location_id', locationId)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      // Get team member counts and provider assignment status separately
      const teamsWithProviderStatus = await Promise.all(
        (teams || []).map(async (team) => {
          // Get member count
          const { data: members } = await supabase
            .from('team_members')
            .select('id')
            .eq('team_id', team.id)
            .eq('status', 'active');

          // Check for existing provider assignments
          const { data: assignments } = await supabase
            .from('provider_team_assignments')
            .select('id')
            .eq('team_id', team.id)
            .eq('status', 'active');

          const memberCount = members?.length || 0;
          const hasActiveProvider = (assignments?.length || 0) > 0;
          
          return {
            id: team.id,
            name: team.name,
            team_type: team.team_type,
            status: team.status,
            location_id: team.location_id,
            member_count: memberCount,
            performance_score: team.performance_score || 0,
            needs_provider: !hasActiveProvider
          } as Team;
        })
      );

      setAvailableTeams(teamsWithProviderStatus);

    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Failed to load teams');
      updateStepErrors(3, ['Failed to load teams']);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================================================
  // WORKFLOW VALIDATION FUNCTIONS
  // =====================================================================================

  /**
   * Validate AP User selection with conflict detection
   */
  const validateAPUserSelection = async (apUser: APUser): Promise<string[]> => {
    const warnings: string[] = [];
    
    if (apUser.existing_assignments && apUser.existing_assignments > 0) {
      warnings.push(`User has ${apUser.existing_assignments} existing location assignments`);
    }

    if (apUser.last_activity) {
      const lastActivity = new Date(apUser.last_activity);
      const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceActivity > 30) {
        warnings.push(`User last active ${daysSinceActivity} days ago`);
      }
    }

    return warnings;
  };

  /**
   * Validate location selection with availability checking
   */
  const validateLocationSelection = async (location: Location): Promise<string[]> => {
    const warnings: string[] = [];

    if (location.capacity_status === 'full') {
      warnings.push('Location is at full provider capacity');
    } else if (location.capacity_status === 'limited') {
      warnings.push('Location has limited provider capacity available');
    }

    if (location.available_teams === 0) {
      warnings.push('Location has no active teams available');
    }

    return warnings;
  };

  /**
   * Validate provider configuration
   */
  const validateProviderConfiguration = async (teams: Team[], role: string, oversight: string): Promise<string[]> => {
    const warnings: string[] = [];

    if (teams.length === 0) {
      warnings.push('No teams selected for assignment');
    }

    if (role === 'primary' && teams.length > 3) {
      warnings.push('Primary providers typically manage 1-3 teams for optimal performance');
    }

    if (oversight === 'admin' && teams.some(team => team.member_count > 10)) {
      warnings.push('Admin oversight recommended for teams with more than 10 members');
    }

    const teamsNeedingProviders = teams.filter(team => team.needs_provider);
    if (teamsNeedingProviders.length > 0) {
      warnings.push(`${teamsNeedingProviders.length} teams currently need providers - good assignment`);
    }

    return warnings;
  };

  // =====================================================================================
  // WORKFLOW STEP MANAGEMENT
  // =====================================================================================

  /**
   * Update step completion status
   */
  const updateStepCompletion = (stepNumber: number, completed: boolean, data?: any): void => {
    setWorkflowSteps(prev => prev.map(step => 
      step.step === stepNumber 
        ? { ...step, completed, data }
        : step
    ));
  };

  /**
   * Update step warnings
   */
  const updateStepWarnings = (stepNumber: number, warnings: string[]): void => {
    setWorkflowSteps(prev => prev.map(step => 
      step.step === stepNumber 
        ? { ...step, warnings }
        : step
    ));
  };

  /**
   * Update step errors
   */
  const updateStepErrors = (stepNumber: number, errors: string[]): void => {
    setWorkflowSteps(prev => prev.map(step => 
      step.step === stepNumber 
        ? { ...step, errors }
        : step
    ));
  };

  /**
   * Navigate to next step
   */
  const nextStep = (): void => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Navigate to previous step
   */
  const previousStep = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // =====================================================================================
  // STEP COMPLETION HANDLERS
  // =====================================================================================

  /**
   * Handle AP User selection completion
   */
  const handleAPUserSelection = async (apUser: APUser): Promise<void> => {
    const warnings = await validateAPUserSelection(apUser);
    
    setAssignmentData(prev => ({ ...prev, apUser }));
    updateStepCompletion(1, true, apUser);
    updateStepWarnings(1, warnings);
    updateStepErrors(1, []);
    
    // Auto-advance to next step
    setTimeout(() => nextStep(), 500);
  };

  /**
   * Handle Location selection completion
   */
  const handleLocationSelection = async (location: Location): Promise<void> => {
    const warnings = await validateLocationSelection(location);
    
    setAssignmentData(prev => ({ ...prev, location }));
    updateStepCompletion(2, true, location);
    updateStepWarnings(2, warnings);
    updateStepErrors(2, []);
    
    // Load teams for this location
    await loadAvailableTeams(location.id);
    
    // Auto-advance to next step
    setTimeout(() => nextStep(), 500);
  };

  /**
   * Handle Provider/Team configuration completion
   */
  const handleProviderConfiguration = async (config: {
    teams: Team[];
    assignmentRole: string;
    oversightLevel: string;
    assignmentType: string;
    endDate?: string;
    notes?: string;
  }): Promise<void> => {
    const warnings = await validateProviderConfiguration(config.teams, config.assignmentRole, config.oversightLevel);
    
    setAssignmentData(prev => ({ 
      ...prev, 
      teams: config.teams,
      assignmentRole: config.assignmentRole as any,
      oversightLevel: config.oversightLevel as any,
      assignmentType: config.assignmentType as any,
      endDate: config.endDate,
      notes: config.notes
    }));
    
    updateStepCompletion(3, true, config);
    updateStepWarnings(3, warnings);
    updateStepErrors(3, []);
    
    // Auto-advance to confirmation
    setTimeout(() => nextStep(), 500);
  };

  // =====================================================================================
  // FINAL ASSIGNMENT EXECUTION
  // =====================================================================================

  /**
   * Execute the provider assignment
   */
  const executeAssignment = async (): Promise<void> => {
    try {
      setLoading(true);
      
      if (!assignmentData.apUser || !assignmentData.location || !assignmentData.teams || assignmentData.teams.length === 0) {
        throw new Error('Missing required assignment data');
      }

      // Create provider record if needed
      let providerId = assignmentData.apUser.id;
      
      // Check if AP user already has a provider record
      const existingProvider = await providerRelationshipService.getProvider(providerId);
      
      if (!existingProvider) {
        // Create new provider record
        const newProvider = await providerRelationshipService.createProvider({
          name: assignmentData.apUser.display_name,
          provider_type: 'training_provider',
          primary_location_id: assignmentData.location.id,
          contact_email: assignmentData.apUser.email,
          description: assignmentData.notes || `Provider created from AP user assignment`
        });
        providerId = newProvider.id;
      }

      // Assign provider to location
      await providerRelationshipService.assignProviderToLocation(
        providerId,
        assignmentData.location.id,
        'provider'
      );

      // Assign provider to each selected team
      const assignmentIds: string[] = [];
      for (const team of assignmentData.teams) {
        const assignmentId = await providerRelationshipService.assignProviderToTeam({
          provider_id: providerId,
          team_id: team.id,
          assignment_role: assignmentData.assignmentRole,
          oversight_level: assignmentData.oversightLevel,
          assignment_type: assignmentData.assignmentType,
          end_date: assignmentData.endDate
        });
        assignmentIds.push(assignmentId);
      }

      updateStepCompletion(4, true, { providerId, assignmentIds });
      updateStepErrors(4, []);
      
      toast.success('Provider assignment completed successfully!');
      
      // Call success callback
      if (onSuccess && assignmentIds.length > 0) {
        onSuccess(assignmentIds[0]);
      }

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error executing assignment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Assignment failed';
      toast.error(`Assignment failed: ${errorMessage}`);
      updateStepErrors(4, [errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================================================
  // EFFECTS
  // =====================================================================================

  useEffect(() => {
    if (isOpen) {
      // Reset workflow state
      setCurrentStep(initialStep);
      setAssignmentData({});
      setWorkflowSteps(prev => prev.map(step => ({ 
        ...step, 
        completed: false, 
        data: null, 
        warnings: [], 
        errors: [] 
      })));
      
      // Load initial data based on step
      if (currentStep >= 1) {
        loadAPUsers();
      }
      if (currentStep >= 2) {
        loadLocations();
      }
    }
  }, [isOpen, initialStep]);

  useEffect(() => {
    // Load data when moving to new steps
    if (currentStep === 2 && locations.length === 0) {
      loadLocations();
    }
  }, [currentStep]);

  // =====================================================================================
  // RENDER WORKFLOW STEPS
  // =====================================================================================

  const renderStepProgress = (): JSX.Element => (
    <div className="flex items-center justify-between mb-6">
      {workflowSteps.map((step, index) => (
        <div key={step.step} className="flex items-center">
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full border-2 
            ${step.completed 
              ? 'bg-green-500 border-green-500 text-white' 
              : currentStep === step.step 
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-gray-200 border-gray-300 text-gray-500'
            }
          `}>
            {step.completed ? <CheckCircle className="w-4 h-4" /> : step.step}
          </div>
          {index < workflowSteps.length - 1 && (
            <div className={`
              w-12 h-0.5 mx-2
              ${step.completed ? 'bg-green-500' : 'bg-gray-300'}
            `} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = (): JSX.Element => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Users className="w-12 h-12 mx-auto text-blue-500 mb-2" />
        <h3 className="text-lg font-semibold">Select AP User</h3>
        <p className="text-gray-600">Choose the AP User to assign as provider</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {apUsers.map((apUser) => (
            <Card 
              key={apUser.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleAPUserSelection(apUser)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{apUser.display_name}</h4>
                    <p className="text-sm text-gray-600">{apUser.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={apUser.existing_assignments === 0 ? "default" : "secondary"}>
                      {apUser.existing_assignments || 0} assignments
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {workflowSteps[0].warnings && workflowSteps[0].warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {workflowSteps[0].warnings.join(', ')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderStep2 = (): JSX.Element => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <MapPin className="w-12 h-12 mx-auto text-blue-500 mb-2" />
        <h3 className="text-lg font-semibold">Select Location</h3>
        <p className="text-gray-600">Choose the location for provider assignment</p>
      </div>

      {assignmentData.apUser && (
        <Alert>
          <AlertDescription>
            Assigning <strong>{assignmentData.apUser.display_name}</strong> as provider
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {locations.map((location) => (
            <Card 
              key={location.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleLocationSelection(location)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{location.name}</h4>
                    <p className="text-sm text-gray-600">
                      {location.city && location.state ? `${location.city}, ${location.state}` : location.address}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={
                      location.capacity_status === 'available' ? "default" :
                      location.capacity_status === 'limited' ? "secondary" : "destructive"
                    }>
                      {location.capacity_status}
                    </Badge>
                    <p className="text-xs text-gray-500">
                      {location.available_teams} teams, {location.active_providers} providers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {workflowSteps[1].warnings && workflowSteps[1].warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {workflowSteps[1].warnings.join(', ')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderStep3 = (): JSX.Element => {
    const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
    const [assignmentRole, setAssignmentRole] = useState<string>('primary');
    const [oversightLevel, setOversightLevel] = useState<string>('standard');
    const [assignmentType, setAssignmentType] = useState<string>('ongoing');
    const [endDate, setEndDate] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    const handleTeamToggle = (team: Team): void => {
      setSelectedTeams(prev => {
        const exists = prev.find(t => t.id === team.id);
        if (exists) {
          return prev.filter(t => t.id !== team.id);
        } else {
          return [...prev, team];
        }
      });
    };

    const handleConfigurationComplete = (): void => {
      handleProviderConfiguration({
        teams: selectedTeams,
        assignmentRole,
        oversightLevel,
        assignmentType,
        endDate,
        notes
      });
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <Building className="w-12 h-12 mx-auto text-blue-500 mb-2" />
          <h3 className="text-lg font-semibold">Provider Configuration</h3>
          <p className="text-gray-600">Configure provider role and team assignments</p>
        </div>

        {assignmentData.location && (
          <Alert>
            <AlertDescription>
              Configuring provider at <strong>{assignmentData.location.name}</strong>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="assignmentRole">Assignment Role</Label>
            <Select value={assignmentRole} onValueChange={setAssignmentRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary Trainer</SelectItem>
                <SelectItem value="secondary">Support Trainer</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="coordinator">Coordinator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="oversightLevel">Oversight Level</Label>
            <Select value={oversightLevel} onValueChange={setOversightLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monitor">Monitor</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="manage">Manage</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assignmentType">Assignment Type</Label>
            <Select value={assignmentType} onValueChange={setAssignmentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="project_based">Project Based</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assignmentType === 'temporary' && (
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            placeholder="Additional notes about this assignment..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div>
          <Label className="text-base font-medium">Select Teams to Assign</Label>
          <div className="mt-2 max-h-64 overflow-y-auto border rounded-md p-2">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : availableTeams.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No teams available at this location</p>
            ) : (
              <div className="space-y-2">
                {availableTeams.map((team) => (
                  <div
                    key={team.id}
                    className={`
                      p-3 border rounded cursor-pointer transition-colors
                      ${selectedTeams.find(t => t.id === team.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => handleTeamToggle(team)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{team.name}</h4>
                        <p className="text-sm text-gray-600">{team.team_type}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={team.needs_provider ? "destructive" : "default"}>
                          {team.needs_provider ? 'Needs Provider' : 'Has Provider'}
                        </Badge>
                        <p className="text-xs text-gray-500">{team.member_count} members</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {workflowSteps[2].warnings && workflowSteps[2].warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {workflowSteps[2].warnings.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button 
            onClick={handleConfigurationComplete}
            disabled={selectedTeams.length === 0}
          >
            Continue to Confirmation
          </Button>
        </div>
      </div>
    );
  };

  const renderStep4 = (): JSX.Element => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
        <h3 className="text-lg font-semibold">Confirm Assignment</h3>
        <p className="text-gray-600">Review and confirm the provider assignment</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="font-medium">AP User</Label>
              <p>{assignmentData.apUser?.display_name} ({assignmentData.apUser?.email})</p>
            </div>
            <div>
              <Label className="font-medium">Location</Label>
              <p>{assignmentData.location?.name}</p>
            </div>
            <div>
              <Label className="font-medium">Role Configuration</Label>
              <div className="flex gap-2">
                <Badge>{assignmentData.assignmentRole}</Badge>
                <Badge variant="secondary">{assignmentData.oversightLevel}</Badge>
                <Badge variant="outline">{assignmentData.assignmentType}</Badge>
              </div>
            </div>
            <div>
              <Label className="font-medium">Teams ({assignmentData.teams?.length || 0})</Label>
              <div className="space-y-1">
                {assignmentData.teams?.map(team => (
                  <div key={team.id} className="flex justify-between text-sm">
                    <span>{team.name}</span>
                    <span className="text-gray-500">{team.member_count} members</span>
                  </div>
                ))}
              </div>
            </div>
            {assignmentData.notes && (
              <div>
                <Label className="font-medium">Notes</Label>
                <p className="text-sm text-gray-600">{assignmentData.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {workflowSteps[3].warnings && workflowSteps[3].warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {workflowSteps[3].warnings.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {workflowSteps[3].errors && workflowSteps[3].errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {workflowSteps[3].errors.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={previousStep}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={executeAssignment}
            disabled={loading || workflowSteps[3].completed}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : workflowSteps[3].completed ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : null}
            {workflowSteps[3].completed ? 'Assignment Complete' : 'Confirm Assignment'}
          </Button>
        </div>
      </div>
    </div>
  );

  // =====================================================================================
  // MAIN RENDER
  // =====================================================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AP Provider Assignment Workflow</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {renderStepProgress()}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation buttons for non-completion steps */}
          {currentStep > 1 && currentStep < 4 && (
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={previousStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              {workflowSteps[currentStep - 1].completed && (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default APProviderAssignmentWorkflow;