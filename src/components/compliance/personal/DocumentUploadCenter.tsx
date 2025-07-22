import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  X,
  Calendar,
  Download,
  Eye
} from 'lucide-react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { ComplianceService } from '@/services/compliance/complianceService';

export function DocumentUploadCenter() {
  const { state, uploadDocument, dispatch } = useComplianceDashboard();
  const { complianceRecords, complianceDocuments } = state.data;

  const [dragActive, setDragActive] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');

  // Get metrics that need documents
  const documentMetrics = complianceRecords.filter(record => 
    record.compliance_metrics?.measurement_type === 'boolean' && 
    record.compliance_status !== 'compliant'
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (selectedMetric) {
        await uploadDocument(file, selectedMetric, expiryDate || undefined);
        setExpiryDate('');
      } else {
        dispatch({ type: 'OPEN_UPLOAD_MODAL', payload: '' });
      }
    }
  }, [selectedMetric, expiryDate, uploadDocument, dispatch]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (selectedMetric) {
        await uploadDocument(file, selectedMetric, expiryDate || undefined);
        setExpiryDate('');
      } else {
        dispatch({ type: 'OPEN_UPLOAD_MODAL', payload: '' });
      }
      e.target.value = '';
    }
  };

  const getDocumentStatus = (metricId: string) => {
    const docs = complianceDocuments.filter(doc => doc.metric_id === metricId);
    if (docs.length === 0) return { status: 'missing', text: 'No document uploaded', color: 'text-red-600' };
    
    const latestDoc = docs.sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime())[0];
    
    switch (latestDoc.verification_status) {
      case 'approved':
        return { status: 'approved', text: 'Approved', color: 'text-green-600' };
      case 'rejected':
        return { status: 'rejected', text: 'Rejected', color: 'text-red-600' };
      case 'pending':
        return { status: 'pending', text: 'Under Review', color: 'text-yellow-600' };
      default:
        return { status: 'uploaded', text: 'Uploaded', color: 'text-blue-600' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const url = await ComplianceService.getDocumentDownloadUrl(filePath);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Compliance Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Metric Selection */}
          <div className="space-y-2">
            <Label htmlFor="metric-select">Select Requirement</Label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a requirement...</option>
              {documentMetrics.map((record) => (
                <option key={record.metric_id} value={record.metric_id}>
                  {record.compliance_metrics?.name}
                </option>
              ))}
            </select>
          </div>

          {/* Expiry Date (optional) */}
          {selectedMetric && (
            <div className="space-y-2">
              <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : selectedMetric
                ? 'border-gray-300 hover:border-blue-400'
                : 'border-gray-200 bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className={`mx-auto h-12 w-12 mb-4 ${selectedMetric ? 'text-blue-500' : 'text-gray-400'}`} />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {selectedMetric ? 'Drop your file here' : 'Select a requirement first'}
              </p>
              <p className="text-sm text-gray-500">
                or click to browse files
              </p>
              <input
                type="file"
                className="hidden"
                id="file-upload"
                onChange={handleFileSelect}
                disabled={!selectedMetric}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <Button
                asChild
                variant={selectedMetric ? "default" : "secondary"}
                disabled={!selectedMetric}
              >
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
            </div>
          </div>

          {!selectedMetric && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please select a compliance requirement before uploading a document.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Document Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documentMetrics.map((record) => {
              const status = getDocumentStatus(record.metric_id);
              const documents = complianceDocuments.filter(doc => doc.metric_id === record.metric_id);
              
              return (
                <div key={record.metric_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(status.status)}
                      <span className="font-medium">
                        {record.compliance_metrics?.name}
                      </span>
                      <Badge 
                        variant="outline"
                        className={status.color}
                      >
                        {status.text}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {record.compliance_metrics?.description}
                    </div>
                    {documents.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-2 text-xs bg-gray-100 rounded px-2 py-1">
                            <span>{doc.file_name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0"
                              onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setSelectedMetric(record.metric_id)}
                    variant={status.status === 'missing' ? 'default' : 'outline'}
                  >
                    {status.status === 'missing' ? 'Upload' : 'Replace'}
                  </Button>
                </div>
              );
            })}

            {documentMetrics.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
                <p className="text-lg font-medium">All documents are up to date!</p>
                <p className="text-sm">You don't have any document requirements at this time.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}