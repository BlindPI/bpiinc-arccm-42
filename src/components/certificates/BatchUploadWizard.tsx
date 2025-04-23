
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BatchUploadForm } from "./BatchUploadForm";
import { TemplateDownloadOptions } from "./TemplateDownloadOptions";
import { Check, AlertTriangle, Info } from "lucide-react";
import { ProcessingStatus as ProcessingStatusType, RowData } from "./types";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addMonths, parseISO } from "date-fns";
import { toast } from "sonner";
import { BatchValidationChecklist } from "./BatchValidationChecklist";
import { processExcelFile, processCSVFile } from "./utils/fileProcessing";
import { validateRowData } from "./utils/validation";
import { DataTable } from "@/components/DataTable";
import { cn } from "@/lib/utils";

// Step 1: Select Course and Issue Date
function StepCourseAndDate({ 
  selectedCourseId, 
  setSelectedCourseId, 
  issueDate, 
  setIssueDate, 
  onNext 
}: {
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  issueDate: string;
  setIssueDate: (date: string) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="mb-4">
        <TemplateDownloadOptions />
      </div>
      <BatchUploadForm
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={setSelectedCourseId}
        issueDate={issueDate}
        setIssueDate={setIssueDate}
        isValidated={true}
        setIsValidated={() => {}}
        expiryDate={""}
        isUploading={false}
        processingStatus={null}
        onFileUpload={() => Promise.resolve()}  // No-op for upload, we handle parsing in StepReview
      />
      <div className="flex justify-end mt-6">
        <Button
          onClick={onNext}
          disabled={!selectedCourseId || !issueDate}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// Step 2: Validation checklist with tooltips/context
const checklistTips = [
  "Typical duration for this course is shown in the syllabus. Confirm students attended all required hours.",
  "Check the course outline for required topics/modules. Ensure all modules were delivered.",
  "Verify participants were present and participated as required in the course policies.",
  "Confirm all teaching demonstrations/evaluations were delivered and students met expectations.",
];

function StepValidation({
  selectedCourseId,
  issueDate,
  expiryDate,
  onNext,
  onBack,
}: {
  selectedCourseId: string;
  issueDate: string;
  expiryDate: string;
  onNext: () => void;
  onBack: () => void;
}) {
  // Track which checkboxes are checked and show tooltips/context
  const [confirmations, setConfirmations] = useState([false, false, false, false]);
  const [isValidated, setIsValidated] = useState(false);
  const [helpOpen, setHelpOpen] = useState<{ [key: number]: boolean }>({});

  return (
    <div>
      <div className="bg-muted/40 border border-muted rounded-lg p-4 mb-6 text-center">
        <span className="font-semibold flex items-center justify-center gap-2">
          <Info className="text-blue-500 w-5 h-5" />
          Before proceeding, please confirm each requirement below:
        </span>
      </div>
      <div className="mb-6">
        {/* Custom checklist rendering with tooltips */}
        <div className="space-y-3">
          {checklistTips.map((tip, idx) => (
            <div className="flex items-start gap-2" key={idx}>
              <BatchValidationChecklist
                confirmations={confirmations}
                setConfirmations={setConfirmations}
                setIsValidated={setIsValidated}
                disabled={false}
              />
              <button
                type="button"
                aria-label="More info"
                onClick={() =>
                  setHelpOpen((prev) => ({ ...prev, [idx]: !prev[idx] }))
                }
                className="text-blue-600 ml-2 mt-0.5 hover:text-blue-400"
                tabIndex={-1}
              >
                <Info className="w-4 h-4" />
              </button>
              {helpOpen[idx] && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg shadow absolute z-20 ml-8 mt-[-2px]">{tip}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValidated}
          className={!isValidated ? "opacity-50 pointer-events-none" : ""}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// Helper for table columns
function getRosterTableColumns(hasErrors: boolean) {
  const columns = [
    { header: "Student Name", accessorKey: "Student Name" },
    { header: "Email", accessorKey: "Email" },
    { header: "Phone", accessorKey: "Phone" },
    { header: "Company", accessorKey: "Company" },
    { header: "First Aid Level", accessorKey: "First Aid Level" },
    { header: "CPR Level", accessorKey: "CPR Level" },
    { header: "Pass/Fail", accessorKey: "Pass/Fail" },
  ];
  // In the DataTable, we will highlight the entire row if there are errors for that row
  return columns;
}

function RosterPreviewTable({
  rows,
  rowErrors,
  onRemoveRow
}: {
  rows: RowData[];
  rowErrors: Record<number, string[]>;
  onRemoveRow?: (idx: number) => void; // optional
}) {
  if (!rows.length) return <div className="italic text-center text-muted-foreground">No records to preview.</div>;
  const columns = getRosterTableColumns(true);
  // Data for rendering
  return (
    <div className="max-h-72 overflow-auto border rounded bg-background shadow">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1">#</th>
            {columns.map(col => (
              <th key={col.header} className="px-2 py-1 text-left">{col.header}</th>
            ))}
            {onRemoveRow && <th className="px-2 py-1 text-center">Remove</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const errors = rowErrors[idx] || [];
            return (
              <tr
                key={idx}
                className={cn(
                  errors.length > 0 ? "bg-red-50 border-l-4 border-red-400" : "",
                  "align-top"
                )}
              >
                <td className="px-2 py-1 font-semibold">{idx + 1}</td>
                {columns.map(col => (
                  <td className="px-2 py-1" key={col.accessorKey}>
                    {row[col.accessorKey] || ""}
                  </td>
                ))}
                {onRemoveRow && (
                  <td className="px-2 py-1 text-center">
                    <button
                      className="text-red-500 hover:text-red-700"
                      type="button"
                      onClick={() => onRemoveRow(idx)}
                      aria-label="Remove row"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Step 3: Review Roster & Details (actual preview step)
function StepReview({ 
  parsedRows,
  rowErrors,
  courseMeta,
  issueDate,
  onNext,
  onBack,
  onRemoveRow
}: { 
  parsedRows: RowData[];
  rowErrors: Record<number, string[]>;
  courseMeta: { name: string; expiration_months: number } | null;
  issueDate: string;
  onNext: () => void;
  onBack: () => void;
  onRemoveRow: (idx: number) => void;
}) {
  // Disable "Next" if there are any rows with errors
  const total = parsedRows.length;
  const errored = Object.values(rowErrors).filter(arr => arr.length > 0).length;
  const canProceed = errored === 0 && total > 0;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Course meta and upload info */}
        <div className="md:col-span-1 flex flex-col gap-2 border rounded-lg p-4 bg-muted/40 shadow">
          <strong className="mb-1">Course Info</strong>
          <div>
            <div>
              <span className="font-medium">Name:</span>{" "}
              {courseMeta?.name || <span className="text-muted-foreground">N/A</span>}
            </div>
            <div>
              <span className="font-medium">Expiration (months):</span>{" "}
              {courseMeta?.expiration_months ?? <span className="text-muted-foreground">N/A</span>}
            </div>
            <div>
              <span className="font-medium">Issue Date:</span> {issueDate}
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            <AlertTriangle className="inline w-4 h-4 text-red-400" />{" "}
            Records must appear correct. Remove/fix errored rows before continuing.
          </div>
        </div>
        {/* Table preview & summary */}
        <div className="md:col-span-2 flex flex-col gap-2">
          <RosterPreviewTable
            rows={parsedRows}
            rowErrors={rowErrors}
            onRemoveRow={onRemoveRow}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs font-medium">
              Records: {total} | <span className={errored ? "text-red-500" : "text-green-600"}>{errored ? `${errored} row(s) with errors` : "No errors detected"}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!canProceed}
          className={!canProceed ? "opacity-50 pointer-events-none" : ""}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// Step 4: Attestation
function StepAttestation({ 
  onNext, 
  onBack 
}: { 
  onNext: () => void; 
  onBack: () => void; 
}) {
  return (
    <div>
      <div className="bg-muted p-4 rounded mb-4 text-center">
        <Check className="inline mr-2 text-purple-500" />Confirmation & Attestation (expand as needed)
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Begin Upload</Button>
      </div>
    </div>
  );
}

// Step 5: Actual file upload to backend
function StepUpload({
  rowsToUpload,
  courseMeta,
  issueDate,
  expiryDate,
  isUploading,
  processingStatus,
  onFileUpload,
  onBack
}: {
  rowsToUpload: RowData[];
  courseMeta: { name: string; expiration_months: number } | null;
  issueDate: string;
  expiryDate: string;
  isUploading: boolean;
  processingStatus: ProcessingStatusType | null;
  onFileUpload: (file: File, rows: RowData[]) => Promise<void>;
  onBack: () => void;
}) {
  // Only allow upload if there's at least one row
  return (
    <div>
      <div className="mb-4 text-center">
        <span className="font-medium">Ready to submit {rowsToUpload.length} record(s) for processing.</span>
      </div>
      <BatchUploadForm
        selectedCourseId={""}
        setSelectedCourseId={() => {}}
        issueDate={issueDate}
        setIssueDate={() => {}}
        isValidated={true}
        setIsValidated={() => {}}
        expiryDate={expiryDate}
        isUploading={isUploading}
        processingStatus={processingStatus}
        // Adapter: onFileUpload is a custom function now, batch over validated rows only
        onFileUpload={(file) => onFileUpload(file, rowsToUpload)}
      />
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>Back</Button>
      </div>
    </div>
  );
}

export function BatchUploadWizard({
  processFileContents,
  isUploading,
  processingStatus
}: {
  // Careful: We will supply this our own wrapped handler to receive rows as well.
  processFileContents: (file: File) => Promise<void>;
  isUploading: boolean;
  processingStatus: ProcessingStatusType | null;
}) {
  // Steps:
  // 0: Course and date selection
  // 1: Validation
  // 2: Review
  // 3: Attestation
  // 4: File upload
  const [step, setStep] = useState(0);

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [parsedRows, setParsedRows] = useState<RowData[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<number, string[]>>({});
  const [lastParsedFile, setLastParsedFile] = useState<File | null>(null);

  // Gather selected course data for expiry and validation
  const { data: selectedCourse } = useQuery({
    queryKey: ['courses', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return null;
      const { data, error } = await supabase
        .from('courses')
        .select('name, expiration_months')
        .eq('id', selectedCourseId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourseId
  });

  const expiryDate = selectedCourse && issueDate
    ? format(addMonths(parseISO(issueDate), selectedCourse.expiration_months), 'yyyy-MM-dd')
    : '';

  // "File" upload handler for preview - parses and validates before review
  const handleRosterFileParsed = async (file: File) => {
    if (!file.name.toLowerCase().match(/\.(csv|xlsx)$/)) {
      toast.error("Please upload a CSV or XLSX file");
      return;
    }
    // Parse data rows
    let rows: RowData[] = [];
    try {
      rows = file.name.toLowerCase().endsWith('.xlsx')
        ? await processExcelFile(file)
        : await processCSVFile(file);
      // Validate each row for preview
      const errors: Record<number, string[]> = {};
      rows.forEach((row, idx) => {
        const errs = validateRowData(row, idx, selectedCourse);
        if (errs.length) errors[idx] = errs;
      });
      setParsedRows(rows);
      setRowErrors(errors);
      setLastParsedFile(file);
      toast.success("Parsed " + rows.length + " row(s)");
      // Jump to Review step
      setStep(2);
    } catch (error: any) {
      toast.error(error?.message || "Failed to parse file");
    }
  };

  // Allow removal of a row (optional/nice to have)
  const handleRemoveRow = (idx: number) => {
    setParsedRows((oldRows) => oldRows.filter((_, i) => i !== idx));
    setRowErrors((oldErrors) => {
      const newErrs = { ...oldErrors };
      delete newErrs[idx];
      // But row indices now change: remap all error keys!
      const reIndexed: Record<number, string[]> = {};
      let i = 0;
      for (const key of Object.keys(newErrs).sort((a, b) => +a - +b)) {
        reIndexed[i++] = newErrs[+key];
      }
      return reIndexed;
    });
  };

  // When continuing to upload, wrap processFileContents to upload only valid rows
  const handleValidatedUpload = async (_file: File, rows: RowData[]) => {
    if (!selectedCourse || !issueDate) {
      toast.error("Course and issue date required");
      return;
    }
    // Just upload the rows (don't reparse the file here!)
    // You may wish to pass meta if needed, or implement logic to do this.
    // Here, just let your backend logic handle validate/upload.
    // Note: you could add a real batching logic here if needed.
    // For now, we pass each row as a "file" to existing logic.
    // If `processFileContents` expects a File, you need to update backend accordingly for batch.
    // But for now, only handle client validation and let backend process.
    toast.success("Uploading " + rows.length + " row(s)... (simulated batch)");

    // NOTE: You may want to refactor backend upload logic for actual use.
    // Here, just a placeholder simulation since actual logic will depend on your use-case.
    // You might just pass the parsedRows, courseMeta, etc., to backend.
    // Trigger server process/upload logic here.
  };

  // Steps configuration
  const steps = [
    { name: "Course & Date", component: (
      <StepCourseAndDate
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={setSelectedCourseId}
        issueDate={issueDate}
        setIssueDate={setIssueDate}
        onNext={() => setStep(1)}
      />
    ) },
    { name: "Validation", component: (
      <div>
        <StepValidation
          selectedCourseId={selectedCourseId}
          issueDate={issueDate}
          expiryDate={expiryDate}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
        <div className="mt-6">
          <BatchUploadForm
            selectedCourseId={selectedCourseId}
            setSelectedCourseId={setSelectedCourseId}
            issueDate={issueDate}
            setIssueDate={setIssueDate}
            isValidated={true}
            setIsValidated={() => {}}
            expiryDate={expiryDate}
            isUploading={false}
            processingStatus={null}
            onFileUpload={handleRosterFileParsed}
          />
          <div className="text-xs text-muted-foreground mt-2">
            After uploading your roster file, a preview will appear on the next step.
          </div>
        </div>
      </div>
    ) },
    { name: "Review", component: (
      <StepReview
        parsedRows={parsedRows}
        rowErrors={rowErrors}
        courseMeta={selectedCourse}
        issueDate={issueDate}
        onNext={() => setStep(3)}
        onBack={() => setStep(1)}
        onRemoveRow={handleRemoveRow}
      />
    ) },
    { name: "Attestation", component: (
      <StepAttestation
        onNext={() => setStep(4)}
        onBack={() => setStep(2)}
      />
    ) },
    { name: "Upload", component: (
      <StepUpload
        rowsToUpload={parsedRows}
        courseMeta={selectedCourse}
        issueDate={issueDate}
        expiryDate={expiryDate}
        isUploading={isUploading}
        processingStatus={processingStatus}
        onFileUpload={handleValidatedUpload}
        onBack={() => setStep(3)}
      />
    ) }
  ];

  // Progress bar (simple)
  return (
    <div>
      <div className="flex items-center my-6 space-x-2">
        {steps.map((s, idx) => (
          <div className="flex items-center" key={s.name}>
            <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 ${idx === step ? "border-primary bg-primary/10" : "border-muted bg-muted"}`}>
              {(idx < step) ? <Check className="text-green-500" /> : idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-12 h-1 mx-1 ${idx < step ? "bg-primary" : "bg-muted"}`}></div>
            )}
          </div>
        ))}
      </div>
      <Card className="shadow-xl border-2 border-card card-gradient animate-fade-in">
        <CardHeader>
          <CardTitle>
            <span className="text-gradient-primary">
              Roster Submission - Batch
            </span>
          </CardTitle>
          <CardDescription>
            Follow the steps to upload a course roster and register certificates in bulk.<br />
            <span className="font-medium">Each step will guide you through the process.</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {steps[step].component}
        </CardContent>
      </Card>
    </div>
  );
}

// ... end file
