
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeachingEvaluationFormProps {
  sessionId: string;
  instructorId: string;
  instructorName: string;
  courseName: string;
  sessionDate: string;
  onSuccess?: () => void;
}

export const TeachingEvaluationForm = ({
  sessionId,
  instructorId,
  instructorName,
  courseName,
  sessionDate,
  onSuccess
}: TeachingEvaluationFormProps) => {
  const queryClient = useQueryClient();
  const [competency, setCompetency] = useState<string>("");
  const [studentFeedback, setStudentFeedback] = useState("");
  const [improvements, setImprovements] = useState("");
  const [notes, setNotes] = useState("");

  const submitEvaluation = useMutation({
    mutationFn: async () => {
      if (!competency) throw new Error('Teaching competency is required');

      const { error } = await supabase
        .from('supervisor_evaluations')
        .insert([
          {
            teaching_session_id: sessionId,
            instructor_id: instructorId,
            teaching_competency: parseInt(competency),
            student_feedback: studentFeedback,
            areas_for_improvement: improvements,
            additional_notes: notes,
            status: "SUBMITTED"
          }
        ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['teaching-evaluations'] });
      toast.success('Evaluation submitted successfully');
      if (onSuccess) onSuccess();
      
      // Reset form
      setCompetency("");
      setStudentFeedback("");
      setImprovements("");
      setNotes("");
    },
    onError: (error) => {
      console.error('Error submitting evaluation:', error);
      toast.error('Failed to submit evaluation');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teaching Evaluation</CardTitle>
        <CardDescription>
          {courseName} - {instructorName} - {new Date(sessionDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="competency">Teaching Competency (1-5)</Label>
          <Select value={competency} onValueChange={setCompetency}>
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((rating) => (
                <SelectItem key={rating} value={rating.toString()}>
                  {rating}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="studentFeedback">Student Feedback</Label>
          <Textarea
            id="studentFeedback"
            value={studentFeedback}
            onChange={(e) => setStudentFeedback(e.target.value)}
            placeholder="Enter student feedback"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="improvements">Areas for Improvement</Label>
          <Textarea
            id="improvements"
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            placeholder="Enter areas for improvement"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter additional notes"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => submitEvaluation.mutate()}
          disabled={submitEvaluation.isPending || !competency}
          className="w-full"
        >
          {submitEvaluation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Evaluation'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
