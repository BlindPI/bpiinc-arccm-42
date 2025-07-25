import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  X 
} from 'lucide-react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { ComplianceService } from '@/services/compliance/complianceService';

export function ComplianceUploadModal() {
  const { state, uploadDocument, dispatch } = useComplianceDashboard();
  const { uploadModalOpen, selectedMetricId, userRole } = state;
  const { complianceRecords, tierInfo } = state.data;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metricId, setMetricId] = useState<string>(selectedMetricId || '');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [requiresExpiry, setRequiresExpiry] = useState<boolean>(false);

  // Get available metrics for upload - filter by BOTH role AND tier for non-admin users
  const uploadableMetrics = React.useMemo(() => {
    if (!complianceRecords) return [];
    
    // SA/AD admins can upload to any requirement
    if (['SA', 'AD'].includes(userRole)) {
      return complianceRecords;
    }
    
    // CRITICAL FIX: Correct role filtering logic
    const userTier = tierInfo?.tier || 'basic';
    
    return complianceRecords.filter(record => {
      // FIXED LOGIC: Empty required_for_roles means NOT role-specific
      const requiredRoles = record.compliance_metrics?.required_for_roles || [];
      const roleMatches = requiredRoles.length > 0 && requiredRoles.includes(userRole);
      
      // Then filter by TIER
      let tierMatches = false;
      if (record.compliance_metrics?.applicable_tiers) {
        // Database contains simple values like 'basic', 'robust', 'basic,robust'
        const applicableTiers = record.compliance_metrics.applicable_tiers.split(',').map(t => t.trim());
        tierMatches = applicableTiers.includes(userTier) || applicableTiers.includes('basic,robust');
      } else if (record.tier) {
        // Legacy fallback: if record has a simple tier field, check that
        tierMatches = record.tier === userTier;
      } else {
        // If no tier specified on record, default to basic tier only
        tierMatches = userTier === 'basic';
      }
      
      return roleMatches && tierMatches;
    });
  }, [complianceRecords, tierInfo, userRole]);

  const selectedMetric = uploadableMetrics.find(record => record.metric_id === metricId);

  // Check if expiry date is required when metric changes
  React.useEffect(() => {
    const checkExpiryRequirement = async () => {
      if (metricId) {
        try {
          const requirements = await ComplianceService.getDocumentRequirements(metricId);
          setRequiresExpiry(requirements?.requires_expiry_date || false);
        } catch (error) {
          console.error('Error checking document requirements:', error);
          // Default to requiring expiry for safety
          setRequiresExpiry(true);
        }
      } else {
        setRequiresExpiry(false);
      }
    };
    
    checkExpiryRequirement();
  }, [metricId]);

  const handleClose = () => {
    dispatch({ type: 'CLOSE_UPLOAD_MODAL' });
    setSelectedFile(null);
    setMetricId('');
    setExpiryDate('');
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !metricId) return;
    if (requiresExpiry && !expiryDate) return;

    try {
      setUploading(true);
      await uploadDocument(selectedFile, metricId, expiryDate || undefined);
      handleClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  React.useEffect(() => {
    if (selectedMetricId) {
      setMetricId(selectedMetricId);
    }
  }, [selectedMetricId]);

  return (
    <Dialog open={uploadModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Compliance Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metric Selection */}
          <div className="space-y-2">
            <Label htmlFor="metric-select">Compliance Requirement *</Label>
            <select
              id="metric-select"
              value={metricId}
              onChange={(e) => setMetricId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!!selectedMetricId} // Disable if pre-selected
            >
              <option value="">Choose a requirement...</option>
              {uploadableMetrics.map((record) => (
                <option key={record.metric_id} value={record.metric_id}>
                  {record.compliance_metrics?.name || `Requirement ${record.metric_id.slice(0, 8)}`}
                </option>
              ))}
            </select>
            {selectedMetric && (
              <p className="text-sm text-gray-600">
                {selectedMetric.compliance_metrics?.description || 'No description available'}
              </p>
            )}
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <Label>Document File *</Label>
            
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium">Drop your file here</p>
                <p className="text-xs text-gray-500 mb-3">
                  or click to browse
                </p>
                <input
                  type="file"
                  className="hidden"
                  id="file-upload-modal"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <Button asChild variant="outline" size="sm">
                  <label htmlFor="file-upload-modal" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiry-date">
              Expiry Date {requiresExpiry ? '*' : '(Optional)'}
            </Label>
            <Input
              id="expiry-date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className={requiresExpiry && !expiryDate ? 'border-red-300' : ''}
            />
            <p className="text-xs text-gray-500">
              {requiresExpiry
                ? 'This document type requires an expiry date'
                : 'Set if this document has an expiration date'}
            </p>
          </div>

          {/* Validation */}
          {(!metricId || !selectedFile || (requiresExpiry && !expiryDate)) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {!metricId || !selectedFile
                  ? 'Please select both a compliance requirement and upload a file.'
                  : 'Expiry date is required for this document type.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpload}
              disabled={!metricId || !selectedFile || uploading || (requiresExpiry && !expiryDate)}
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}