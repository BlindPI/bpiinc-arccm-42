
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  UserCheck, 
  MapPin, 
  Building2, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import type { WorkflowData } from '../APProviderAssignmentWorkflow';

interface RelationshipConfirmationProps {
  workflowData: WorkflowData;
  validationErrors: string[];
}

export function RelationshipConfirmation({ 
  workflowData, 
  validationErrors 
}: RelationshipConfirmationProps) {
  const { data: apUser } = useQuery({
    queryKey: ['ap-user', workflowData.apUserId],
    queryFn: async () => {
      if (!workflowData.apUserId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', workflowData.apUserId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!workflowData.apUserId
  });

  const { data: location } = useQuery({
    queryKey: ['location', workflowData.locationId],
    queryFn: async () => {
      if (!workflowData.locationId) return null;
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', workflowData.locationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!workflowData.locationId
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Confirm Relationship Creation</h3>
        <p className="text-muted-foreground">
          Review the relationship details before creating the provider assignment.
        </p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Please resolve these issues before proceeding:</div>
              {validationErrors.map((error, index) => (
                <div key={index} className="text-sm">• {error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Relationship Flow */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-medium mb-4">Relationship Flow</h4>
          
          <div className="flex items-center justify-between gap-4">
            {/* AP User */}
            <div className="flex-1">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <UserCheck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-medium">AP User</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {apUser?.display_name || 'Loading...'}
                  </div>
                  <Badge variant="secondary" className="mt-2">Authorized Provider</Badge>
                </CardContent>
              </Card>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground" />

            {/* Location */}
            <div className="flex-1">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="font-medium">Location</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {location?.name || 'Loading...'}
                  </div>
                  {location?.city && (
                    <div className="text-xs text-muted-foreground">
                      {location.city}, {location.state}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {workflowData.createProvider && (
              <>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                
                {/* Provider */}
                <div className="flex-1">
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <Building2 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="font-medium">Provider</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {workflowData.providerName}
                      </div>
                      <Badge variant="outline" className="mt-2">New Provider</Badge>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {workflowData.createTeam && (
              <>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                
                {/* Team */}
                <div className="flex-1">
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <div className="font-medium">Team</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {workflowData.teamName || `${workflowData.providerName} Team`}
                      </div>
                      <Badge variant="outline" className="mt-2">New Team</Badge>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions Summary */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-medium mb-4">Actions to be Performed</h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Assign AP user to location</span>
            </div>
            
            {workflowData.createProvider && (
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Create authorized provider record: "{workflowData.providerName}"</span>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Link provider to location</span>
            </div>
            
            {workflowData.createTeam && (
              <>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Create provider team: "{workflowData.teamName || `${workflowData.providerName} Team`}"</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Add AP user as team admin</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium">Ready to Create Relationship</div>
          <div className="text-sm mt-1">
            This will establish a complete provider management relationship between the AP user and location.
            {validationErrors.length === 0 
              ? ' All validation checks have passed.' 
              : ' Please resolve the validation errors above before proceeding.'
            }
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
