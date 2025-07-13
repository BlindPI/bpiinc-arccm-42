import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataExportService, type ExportRequestData } from "@/services/provider/dataExportService";
import { useToast } from "@/hooks/use-toast";

export function useDataExport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: exportRequests,
    isLoading,
    error
  } = useQuery({
    queryKey: ['data-export-requests', user?.id],
    queryFn: () => user?.id ? DataExportService.getUserExportRequests(user.id) : null,
    enabled: !!user?.id,
  });

  const submitRequestMutation = useMutation({
    mutationFn: (requestData: ExportRequestData) => {
      if (!user?.id) throw new Error('User not authenticated');
      return DataExportService.submitExportRequest(user.id, null, requestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-export-requests', user?.id] });
      toast({
        title: "Export Request Submitted",
        description: "Your data export request has been submitted for admin review.",
      });
    },
    onError: (error) => {
      console.error('Error submitting export request:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit export request. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    exportRequests,
    isLoading,
    error,
    submitRequest: submitRequestMutation.mutate,
    isSubmitting: submitRequestMutation.isPending,
  };
}