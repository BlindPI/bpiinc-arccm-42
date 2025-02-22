
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuditFormUploadProps {
  transitionRequestId: string;
  onUploadSuccess?: () => void;
}

export function AuditFormUpload({ transitionRequestId, onUploadSuccess }: AuditFormUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${transitionRequestId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("audit_forms")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: submissionError } = await supabase
        .from("role_audit_submissions")
        .insert({
          transition_request_id: transitionRequestId,
          audit_form_url: filePath,
        });

      if (submissionError) throw submissionError;

      toast.success("Audit form uploaded successfully");
      setFile(null);
      onUploadSuccess?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload audit form");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Audit Form</CardTitle>
        <CardDescription>
          Upload the required audit form for this role transition request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="audit-form">Audit Form</Label>
            <Input
              id="audit-form"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Form
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
