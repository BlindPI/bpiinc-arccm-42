
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { BatchValidationChecklist } from "../BatchValidationChecklist";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ValidationSectionProps {
  confirmations: boolean[];
  setConfirmations: (values: boolean[]) => void;
  disabled?: boolean;
  processingStatus?: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null;
}

export function ValidationSection({
  confirmations,
  setConfirmations,
  disabled = false,
  processingStatus
}: ValidationSectionProps) {
  const [showGuidelines, setShowGuidelines] = useState(false);
  const allConfirmed = confirmations.every(Boolean);
  
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Validation Checklist</h3>
          {allConfirmed ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700">
              <AlertCircle className="h-3.5 w-3.5" />
              Required
            </Badge>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-blue-600 text-xs"
          onClick={() => setShowGuidelines(!showGuidelines)}
        >
          {showGuidelines ? "Hide Guidelines" : "Show Guidelines"}
        </Button>
      </div>

      <Collapsible open={showGuidelines} onOpenChange={setShowGuidelines}>
        <CollapsibleContent className="space-y-2 animate-slide-down">
          <Alert className="bg-blue-50 text-blue-700 border-blue-200">
            <Info className="h-4 w-4" />
            <AlertTitle>Guidelines for Batch Uploads</AlertTitle>
            <AlertDescription className="text-sm mt-2">
              <ul className="list-disc list-inside space-y-1">
                <li>Ensure your file follows the recommended template format</li>
                <li>All required fields must be filled: Name, Email, and Completion Date</li>
                <li>Verify the file has no more than 1000 rows for optimal processing</li>
                <li>Check for duplicate entries before uploading</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CollapsibleContent>
      </Collapsible>

      <div className={cn(
        "bg-white rounded-lg shadow border border-muted/70 p-4",
        disabled ? "opacity-75" : "hover:border-blue-200 transition-colors"
      )}>
        <BatchValidationChecklist
          confirmations={confirmations}
          setConfirmations={setConfirmations}
          disabled={disabled}
        />
      </div>

      {processingStatus?.errors && processingStatus.errors.length > 0 && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription className="text-sm mt-1">
            <span className="font-medium">
              Found {processingStatus.errors.length} {processingStatus.errors.length === 1 ? 'error' : 'errors'}:
            </span>
            <ul className="list-disc list-inside mt-1.5 space-y-0.5 max-h-32 overflow-y-auto">
              {processingStatus.errors.slice(0, 5).map((error, i) => (
                <li key={i} className="text-xs">{error}</li>
              ))}
              {processingStatus.errors.length > 5 && (
                <li className="text-xs font-medium">
                  ...and {processingStatus.errors.length - 5} more errors
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
