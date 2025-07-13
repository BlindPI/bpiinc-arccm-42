import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Shield, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TooltipInfo } from "@/components/ui/tooltip-info";

const DATA_CATEGORIES = [
  {
    id: "certificate_data",
    label: "Certificate Data",
    description: "Certificate requests, recipient names, scores, completion dates, instructor details",
    estimatedRecords: 1200,
  },
  {
    id: "batch_processing",
    label: "Batch Processing",
    description: "Batch IDs, batch names, bulk upload records, processing logs",
    estimatedRecords: 85,
  },
  {
    id: "assessment_data",
    label: "Assessment Data",
    description: "Practical/written scores, completion dates, pass/fail status",
    estimatedRecords: 950,
  },
  {
    id: "personal_data",
    label: "Personal Data",
    description: "Recipient emails, phone numbers, addresses, employment information",
    estimatedRecords: 800,
  },
  {
    id: "communication_records",
    label: "Communication Records",
    description: "Email notifications, batch communications, status updates",
    estimatedRecords: 2400,
  },
  {
    id: "audit_trail",
    label: "Audit Trail",
    description: "System access logs, setting changes, administrative actions",
    estimatedRecords: 340,
  },
];

const PREDEFINED_JUSTIFICATIONS = [
  "Data portability request under GDPR Article 20",
  "Audit compliance requirement",
  "Internal data analysis and reporting",
  "Backup for system migration",
  "Legal proceeding documentation",
  "Regulatory compliance verification",
  "Custom reason (specify below)",
];

export function DataExportRequest() {
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date }>({});
  const [justification, setJustification] = React.useState("");
  const [customJustification, setCustomJustification] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSelectedCategories(prev => 
      checked ? [...prev, categoryId] : prev.filter(id => id !== categoryId)
    );
  };

  const getEstimatedTotalRecords = () => {
    return DATA_CATEGORIES
      .filter(cat => selectedCategories.includes(cat.id))
      .reduce((total, cat) => total + cat.estimatedRecords, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Implement data export request submission
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    
    setIsSubmitting(false);
    // Reset form or show success message
  };

  const isFormValid = selectedCategories.length > 0 && 
                     (justification && justification !== "Custom reason (specify below)" || customJustification);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Export & Privacy Rights
        </CardTitle>
        <CardDescription>
          Request a copy of your data for compliance, auditing, or data portability purposes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data Categories Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">Data Categories to Export</Label>
              <TooltipInfo content="Select the types of data you need exported. Each category includes different types of records and information." />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DATA_CATEGORIES.map((category) => (
                <div key={category.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                    />
                    <Label htmlFor={category.id} className="font-medium cursor-pointer">
                      {category.label}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {category.description}
                  </p>
                  <div className="text-xs text-muted-foreground ml-6 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Est. {category.estimatedRecords.toLocaleString()} records
                  </div>
                </div>
              ))}
            </div>

            {selectedCategories.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Export Summary</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Selected {selectedCategories.length} categories containing approximately{" "}
                  <strong>{getEstimatedTotalRecords().toLocaleString()} records</strong>
                </p>
              </div>
            )}
          </div>

          {/* Date Range Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">Date Range</Label>
              <TooltipInfo content="Specify the time period for data export. Leave blank to export all historical data." />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Quick Select</Label>
                <Select onValueChange={(value) => {
                  const now = new Date();
                  switch (value) {
                    case "30":
                      setDateRange({ from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), to: now });
                      break;
                    case "90":
                      setDateRange({ from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), to: now });
                      break;
                    case "365":
                      setDateRange({ from: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), to: now });
                      break;
                    case "all":
                      setDateRange({});
                      break;
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 3 months</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Justification */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">Justification</Label>
              <TooltipInfo content="Required: Specify the purpose for this data export request. This helps with compliance tracking and approval." />
            </div>
            
            <div className="space-y-3">
              <Select value={justification} onValueChange={setJustification}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason for data export" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_JUSTIFICATIONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {justification === "Custom reason (specify below)" && (
                <Textarea
                  value={customJustification}
                  onChange={(e) => setCustomJustification(e.target.value)}
                  placeholder="Please provide detailed justification for this data export request..."
                  className="min-h-[100px]"
                />
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Admin Approval Required</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Data export requests require administrative approval for security and compliance reasons. 
                You will be notified when your request is processed (typically within 2-5 business days).
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={!isFormValid || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Submitting Request...' : 'Submit Data Export Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}