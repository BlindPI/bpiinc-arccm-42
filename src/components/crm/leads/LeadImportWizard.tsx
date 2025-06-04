import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  ArrowRight,
  ArrowLeft,
  X,
  MapPin,
  Users,
  AlertTriangle
} from 'lucide-react';
import { crmLeadService } from '@/services/crm/crmLeadService';

interface ImportResult {
  imported: number;
  failed: number;
  errors: string[];
}

interface FieldMapping {
  csvField: string;
  crmField: string;
}

interface LeadImportWizardProps {
  onComplete?: (result: ImportResult) => void;
  onCancel?: () => void;
}

export function LeadImportWizard({ onComplete, onCancel }: LeadImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'create'>('skip');

  const queryClient = useQueryClient();

  // Available CRM fields for mapping
  const crmFields = [
    { value: 'email', label: 'Email Address *', required: true },
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'company_name', label: 'Company Name' },
    { value: 'job_title', label: 'Job Title' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'lead_type', label: 'Lead Type *', required: true },
    { value: 'lead_source', label: 'Lead Source *', required: true },
    { value: 'industry', label: 'Industry' },
    { value: 'city', label: 'City' },
    { value: 'province', label: 'Province' },
    { value: 'postal_code', label: 'Postal Code' },
    { value: 'company_size', label: 'Company Size' },
    { value: 'training_urgency', label: 'Training Urgency' },
    { value: 'estimated_participant_count', label: 'Estimated Participants' },
    { value: 'budget_range', label: 'Budget Range' },
    { value: 'preferred_location', label: 'Preferred Location' }
  ];

  // Real bulk import processing
  const importMutation = useMutation({
    mutationFn: async (csvData: string) => {
      const result = await crmLeadService.bulkImportLeads(csvData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['crm', 'leads'] });
      setCurrentStep(4);
    },
  });

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
      
      // Parse CSV headers and preview data
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        setCsvHeaders(headers);
        
        // Initialize field mappings
        const mappings: FieldMapping[] = headers.map(header => ({
          csvField: header,
          crmField: autoMapField(header)
        }));
        setFieldMappings(mappings);
        
        // Preview first 5 rows
        const preview = lines.slice(1, 6).map(line => 
          line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        );
        setPreviewData(preview);
        
        setCurrentStep(2);
      }
    };
    reader.readAsText(uploadedFile);
  }, []);

  const autoMapField = (csvHeader: string): string => {
    const header = csvHeader.toLowerCase();
    
    if (header.includes('email')) return 'email';
    if (header.includes('first') && header.includes('name')) return 'first_name';
    if (header.includes('last') && header.includes('name')) return 'last_name';
    if (header.includes('company')) return 'company_name';
    if (header.includes('job') || header.includes('title')) return 'job_title';
    if (header.includes('phone')) return 'phone';
    if (header.includes('city')) return 'city';
    if (header.includes('province') || header.includes('state')) return 'province';
    if (header.includes('postal') || header.includes('zip')) return 'postal_code';
    if (header.includes('industry')) return 'industry';
    if (header.includes('source')) return 'lead_source';
    if (header.includes('type')) return 'lead_type';
    
    return '';
  };

  const updateFieldMapping = (csvField: string, crmField: string) => {
    setFieldMappings(prev => 
      prev.map(mapping => 
        mapping.csvField === csvField 
          ? { ...mapping, crmField }
          : mapping
      )
    );
  };

  const validateMappings = (): boolean => {
    const requiredFields = ['email', 'lead_type', 'lead_source'];
    const mappedFields = fieldMappings
      .filter(m => m.crmField)
      .map(m => m.crmField);
    
    return requiredFields.every(field => mappedFields.includes(field));
  };

  const processImport = () => {
    if (!validateMappings()) {
      alert('Please map all required fields (Email, Lead Type, Lead Source)');
      return;
    }

    // Transform CSV data based on field mappings
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Create mapped CSV with CRM field names
    const mappedHeaders = fieldMappings
      .filter(m => m.crmField)
      .map(m => m.crmField);
    
    const mappedData = [mappedHeaders.join(',')];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const mappedValues = fieldMappings
        .filter(m => m.crmField)
        .map(m => {
          const csvIndex = headers.indexOf(m.csvField);
          return csvIndex >= 0 ? values[csvIndex] || '' : '';
        });
      
      mappedData.push(mappedValues.join(','));
    }

    const transformedCsv = mappedData.join('\n');
    importMutation.mutate(transformedCsv);
  };

  const downloadTemplate = () => {
    const templateHeaders = [
      'email', 'first_name', 'last_name', 'company_name', 'job_title', 
      'phone', 'lead_type', 'lead_source', 'industry', 'city', 'province'
    ];
    
    const sampleData = [
      'john.doe@example.com,John,Doe,ABC Construction,Safety Manager,555-1234,corporate,website,construction,Toronto,ON',
      'jane.smith@example.com,Jane,Smith,XYZ Healthcare,HR Director,555-5678,corporate,referral,healthcare,Vancouver,BC'
    ];
    
    const csvContent = [templateHeaders.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const steps = [
    { number: 1, title: 'Upload File', icon: Upload },
    { number: 2, title: 'Map Fields', icon: MapPin },
    { number: 3, title: 'Review & Import', icon: Users },
    { number: 4, title: 'Results', icon: CheckCircle }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'border-gray-300 text-gray-400'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`mx-4 h-0.5 w-16 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: File Upload */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Upload a CSV file containing your lead data. Make sure your file includes email addresses and lead classification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Choose a CSV file</h3>
                <p className="text-gray-600">
                  Select a CSV file from your computer to import leads
                </p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="max-w-xs mx-auto"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">CSV Requirements:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• File must be in CSV format</li>
                <li>• First row should contain column headers</li>
                <li>• Email address is required for each lead</li>
                <li>• Lead type and source must be specified</li>
                <li>• Maximum file size: 10MB</li>
              </ul>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Field Mapping */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Map CSV Fields to CRM Fields
            </CardTitle>
            <CardDescription>
              Map your CSV columns to the appropriate CRM fields. Required fields are marked with *.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {fieldMappings.map((mapping, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{mapping.csvField}</Label>
                    <div className="text-xs text-gray-500 mt-1">
                      Sample: {previewData[0]?.[index] || 'No data'}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <Select
                      value={mapping.crmField}
                      onValueChange={(value) => updateFieldMapping(mapping.csvField, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select CRM field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Skip this field</SelectItem>
                        {crmFields.map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            {/* Validation Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Mapping Status:</h4>
              <div className="space-y-2">
                {['email', 'lead_type', 'lead_source'].map(field => {
                  const isMapped = fieldMappings.some(m => m.crmField === field);
                  return (
                    <div key={field} className="flex items-center gap-2">
                      {isMapped ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm ${isMapped ? 'text-green-800' : 'text-red-800'}`}>
                        {field.replace('_', ' ').toUpperCase()} {isMapped ? 'mapped' : 'required'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Import */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Review Import Data
            </CardTitle>
            <CardDescription>
              Review the mapped data before importing. You can configure duplicate handling options.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Duplicate Handling */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Duplicate Handling</Label>
              <Select value={duplicateHandling} onValueChange={(value: any) => setDuplicateHandling(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Skip duplicates (recommended)</SelectItem>
                  <SelectItem value="update">Update existing leads</SelectItem>
                  <SelectItem value="create">Create duplicate entries</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {fieldMappings
                      .filter(m => m.crmField)
                      .map(mapping => (
                        <TableHead key={mapping.crmField}>
                          {crmFields.find(f => f.value === mapping.crmField)?.label || mapping.crmField}
                        </TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 5).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {fieldMappings
                        .filter(m => m.crmField)
                        .map((mapping, colIndex) => {
                          const csvIndex = csvHeaders.indexOf(mapping.csvField);
                          return (
                            <TableCell key={colIndex}>
                              {csvIndex >= 0 ? row[csvIndex] || '-' : '-'}
                            </TableCell>
                          );
                        })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Import Summary</span>
              </div>
              <div className="text-sm text-yellow-700">
                <p>Total rows to import: {previewData.length}</p>
                <p>Mapped fields: {fieldMappings.filter(m => m.crmField).length}</p>
                <p>Duplicate handling: {duplicateHandling}</p>
              </div>
            </div>

            {importMutation.isPending && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing leads...</span>
                  <span>Processing</span>
                </div>
                <Progress value={50} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {currentStep === 4 && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import Complete
            </CardTitle>
            <CardDescription>
              Your lead import has been processed. Review the results below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                <div className="text-sm text-green-800">Successfully Imported</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                <div className="text-sm text-red-800">Failed to Import</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {((importResult.imported / (importResult.imported + importResult.failed)) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-blue-800">Success Rate</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-red-900">Import Errors:</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-800 mb-1">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Imported leads have been automatically scored</li>
                <li>• High-priority leads have follow-up tasks created</li>
                <li>• Leads have been assigned based on territory rules</li>
                <li>• Email notifications sent to assigned sales reps</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : () => setCurrentStep(prev => prev - 1)}
          disabled={importMutation.isPending}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>

        {currentStep < 3 && (
          <Button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={currentStep === 2 && !validateMappings()}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {currentStep === 3 && (
          <Button
            onClick={processImport}
            disabled={!validateMappings() || importMutation.isPending}
          >
            {importMutation.isPending ? 'Importing...' : 'Start Import'}
          </Button>
        )}

        {currentStep === 4 && (
          <Button onClick={() => onComplete?.(importResult)}>
            Complete
          </Button>
        )}
      </div>
    </div>
  );
}