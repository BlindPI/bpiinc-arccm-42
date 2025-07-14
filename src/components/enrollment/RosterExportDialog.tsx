import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  FileText, 
  Database,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Users,
  FileSpreadsheet,
  Send,
  Eye
} from "lucide-react";
import { useMutation } from '@tanstack/react-query';
import { RosterExportService, type ExportOptions } from '@/services/roster/rosterExportService';
import { toast } from 'sonner';

interface StudentRoster {
  id: string;
  roster_name: string;
  course_name: string;
  current_enrollment: number;
  roster_status: string;
  roster_type?: string;
  scheduled_start_date?: string;
}

interface RosterExportDialogProps {
  roster: StudentRoster;
  onClose: () => void;
}

export function RosterExportDialog({ roster, onClose }: RosterExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'batch_upload' | 'certificate_requests'>('csv');
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [includePending, setIncludePending] = useState(true);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Validation mutation
  const validateMutation = useMutation({
    mutationFn: () => RosterExportService.validateRosterForExport(roster.id),
    onSuccess: (result) => {
      setValidationResult(result);
      setShowValidation(true);
    },
    onError: (error: Error) => {
      toast.error(`Validation failed: ${error.message}`);
    }
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const options: Partial<ExportOptions> = {
        format: exportFormat,
        includeCompleted,
        includePending
      };

      return RosterExportService.exportRoster(roster.id, exportFormat, options);
    },
    onSuccess: (result) => {
      // Download file
      const blob = new Blob([result.csvContent || ''], { 
        type: exportFormat === 'certificate_requests' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${result.recordCount} records successfully`);
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Export failed: ${error.message}`);
    }
  });

  // Create certificate requests mutation
  const createCertificatesMutation = useMutation({
    mutationFn: async () => {
      const options: Partial<ExportOptions> = {
        includeCompleted,
        includePending
      };

      return RosterExportService.createCertificateRequestsFromRoster(roster.id, options);
    },
    onSuccess: (result) => {
      if (result.success > 0) {
        toast.success(`Created ${result.success} certificate requests successfully`);
      }
      if (result.errors.length > 0) {
        toast.error(`Errors: ${result.errors.join(', ')}`);
      }
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create certificate requests: ${error.message}`);
    }
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleCreateCertificates = () => {
    createCertificatesMutation.mutate();
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'csv':
        return 'Standard CSV export with all student and roster information';
      case 'batch_upload':
        return 'CSV format ready for batch certificate upload system';
      case 'certificate_requests':
        return 'JSON format for direct certificate request creation';
      default:
        return '';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return <FileSpreadsheet className="h-4 w-4" />;
      case 'batch_upload': return <FileText className="h-4 w-4" />;
      case 'certificate_requests': return <Database className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Roster: {roster.roster_name}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {roster.current_enrollment} students
          </span>
          <span>{roster.course_name}</span>
          <Badge variant="outline">{roster.roster_status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Export Format Selection */}
        <div className="space-y-3">
          <h4 className="font-medium">Export Format</h4>
          <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <div>
                    <div>Standard CSV</div>
                    <div className="text-xs text-muted-foreground">
                      General purpose export
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="batch_upload">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <div>
                    <div>Batch Upload Format</div>
                    <div className="text-xs text-muted-foreground">
                      Ready for certificate system
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="certificate_requests">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <div>
                    <div>Certificate Requests</div>
                    <div className="text-xs text-muted-foreground">
                      Direct database format
                    </div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {getFormatDescription(exportFormat)}
          </p>
        </div>

        <Separator />

        {/* Filter Options */}
        <div className="space-y-3">
          <h4 className="font-medium">Filter Options</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-completed"
                checked={includeCompleted}
                onCheckedChange={(checked) => setIncludeCompleted(checked === true)}
              />
              <label htmlFor="include-completed" className="text-sm">
                Include completed students
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-pending"
                checked={includePending}
                onCheckedChange={(checked) => setIncludePending(checked === true)}
              />
              <label htmlFor="include-pending" className="text-sm">
                Include pending/in-progress students
              </label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Validation Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Data Validation</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => validateMutation.mutate()}
              disabled={validateMutation.isPending}
            >
              {validateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Validate Data
            </Button>
          </div>

          {showValidation && validationResult && (
            <Alert variant={validationResult.isValid ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                )}
                <div className="space-y-2 flex-1">
                  <AlertDescription>
                    <div className="font-medium">
                      {validationResult.isValid 
                        ? `Ready to export ${validationResult.studentCount} students`
                        : `Found ${validationResult.errors.length} errors`
                      }
                    </div>
                    
                    {validationResult.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="font-medium text-destructive">Errors:</div>
                        <ul className="text-sm space-y-0.5">
                          {validationResult.errors.map((error: string, index: number) => (
                            <li key={index} className="text-destructive">• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {validationResult.warnings.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="font-medium text-yellow-600">Warnings:</div>
                        <ul className="text-sm space-y-0.5">
                          {validationResult.warnings.map((warning: string, index: number) => (
                            <li key={index} className="text-yellow-600">• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex justify-between items-center gap-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {exportFormat === 'certificate_requests' && (
              <Button
                onClick={handleCreateCertificates}
                disabled={createCertificatesMutation.isPending || (!includeCompleted && !includePending)}
                className="gap-2"
              >
                {createCertificatesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Create Certificates
              </Button>
            )}
            
            <Button
              onClick={handleExport}
              disabled={exportMutation.isPending || (!includeCompleted && !includePending)}
              className="gap-2"
            >
              {exportMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                getFormatIcon(exportFormat)
              )}
              Export {exportFormat === 'csv' ? 'CSV' : exportFormat === 'batch_upload' ? 'Batch' : 'JSON'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}