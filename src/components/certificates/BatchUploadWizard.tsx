
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BatchUploadForm } from "./BatchUploadForm";
import { TemplateDownloadOptions } from "./TemplateDownloadOptions";
import { Check } from "lucide-react";
import { ProcessingStatus as ProcessingStatusType } from "./types";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addMonths, parseISO } from "date-fns";
import { toast } from "sonner";

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
        onFileUpload={() => Promise.resolve()}  // Add a no-op promise
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

// Step 2: Validation checklist (placeholder, could be expanded)
function StepValidation({ 
  selectedCourseId, 
  issueDate, 
  expiryDate, 
  onNext, 
  onBack 
}: {
  selectedCourseId: string;
  issueDate: string;
  expiryDate: string;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="bg-muted p-4 rounded mb-4 text-center">
        <Check className="inline mr-2 text-green-500" />Validation checklist step (expand with real validation!)
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}

// Step 3: Review (placeholder)
function StepReview({ 
  onNext, 
  onBack 
}: { 
  onNext: () => void; 
  onBack: () => void; 
}) {
  return (
    <div>
      <div className="bg-muted p-4 rounded mb-4 text-center">
        <Check className="inline mr-2 text-blue-500" />Review roster & details (expand with preview!)
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}

// Step 4: Attestation (placeholder)
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

// Final Step: Actual file upload form
function StepUpload({
  selectedCourseId,
  setSelectedCourseId,
  issueDate,
  setIssueDate,
  expiryDate,
  isValidated,
  setIsValidated,
  isUploading,
  processingStatus,
  onFileUpload,
  onBack
}: {
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  issueDate: string;
  setIssueDate: (date: string) => void;
  expiryDate: string;
  isValidated: boolean;
  setIsValidated: (validated: boolean) => void;
  isUploading: boolean;
  processingStatus: ProcessingStatusType | null;
  onFileUpload: (file: File) => Promise<void>;
  onBack: () => void;
}) {
  return (
    <div>
      <BatchUploadForm
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={setSelectedCourseId}
        issueDate={issueDate}
        setIssueDate={setIssueDate}
        isValidated={isValidated}
        setIsValidated={setIsValidated}
        expiryDate={expiryDate}
        isUploading={isUploading}
        processingStatus={processingStatus}
        onFileUpload={onFileUpload}
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
  const [isValidated, setIsValidated] = useState(false);

  // Gather selected course data for expiry
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

  // Progress handling
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
      <StepValidation
        selectedCourseId={selectedCourseId}
        issueDate={issueDate}
        expiryDate={expiryDate}
        onNext={() => setStep(2)}
        onBack={() => setStep(0)}
      />
    ) },
    { name: "Review", component: (
      <StepReview
        onNext={() => setStep(3)}
        onBack={() => setStep(1)}
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
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={setSelectedCourseId}
        issueDate={issueDate}
        setIssueDate={setIssueDate}
        expiryDate={expiryDate}
        isValidated={isValidated}
        setIsValidated={setIsValidated}
        isUploading={isUploading}
        processingStatus={processingStatus}
        onFileUpload={processFileContents}
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

