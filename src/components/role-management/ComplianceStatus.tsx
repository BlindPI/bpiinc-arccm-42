
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ComplianceStatusProps {
  userId: string;
}

export function ComplianceStatus({ userId }: ComplianceStatusProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isCurrentUser = user?.id === userId;
  
  // Query the compliance status directly from the profiles table
  const { data: profileData, isLoading, error, isError, refetch } = useQuery({
    queryKey: ['user-compliance', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('compliance_status, role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Query document requirements and submissions to show detailed compliance information
  const { data: documentData } = useQuery({
    queryKey: ['document-compliance', userId],
    queryFn: async () => {
      if (!profileData?.role) return null;
      
      // Get document requirements based on the user's role and the next role
      const { data: requirements, error: reqError } = await supabase
        .from('document_requirements')
        .select('id, document_type')
        .eq('from_role', profileData.role);
      
      if (reqError) throw reqError;
      
      // Get user's document submissions
      const { data: submissions, error: subError } = await supabase
        .from('document_submissions')
        .select('requirement_id, status')
        .eq('instructor_id', userId);
      
      if (subError) throw subError;
      
      const totalDocuments = requirements?.length || 0;
      const submittedDocuments = submissions?.length || 0;
      const approvedDocuments = submissions?.filter(sub => sub.status === 'APPROVED')?.length || 0;
      
      return {
        requiredDocuments: totalDocuments,
        submittedDocuments: submittedDocuments,
        approvedDocuments: approvedDocuments,
      };
    },
    enabled: !!profileData?.role,
  });

  const handleRetry = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['document-compliance'] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-2 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error instanceof Error ? error.message : 'Error loading compliance status'}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRetry}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profileData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>No compliance data available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completionPercentage = documentData?.requiredDocuments
    ? (documentData.approvedDocuments / documentData.requiredDocuments) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Compliance Status
          {profileData.compliance_status ? (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              <ShieldCheck className="h-4 w-4 mr-1" />
              Compliant
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="h-4 w-4 mr-1" />
              Non-Compliant
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {documentData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Document Completion</span>
                <span className="font-medium">
                  {documentData.approvedDocuments}/{documentData.requiredDocuments}
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          )}

          <div className="space-y-4">
            <div className="grid gap-4 text-sm">
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{profileData.role || "Not available"}</span>
              </div>
              
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">
                  {profileData.compliance_status ? "Compliant" : "Non-Compliant"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
