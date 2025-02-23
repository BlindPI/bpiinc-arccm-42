
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SupervisorEvaluationFormProps {
  teachingSessionId: string;
  instructorId: string;
}

export const SupervisorEvaluationForm = ({
  teachingSessionId,
  instructorId
}: SupervisorEvaluationFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [competency, setCompetency] = useState<string>("");
  const [studentFeedback, setStudentFeedback] = useState("");
  const [improvements, setImprovements] = useState("");
  const [notes, setNotes] = useState("");

  const { data: existingEvaluation, isLoading } = useQuery({
    queryKey: ['supervisor-evaluation', teachingSessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supervisor_evaluations')
        .select('*')
        .eq('teaching_session_id', teachingSessionId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const submitEvaluation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!competency) throw new Error('Teaching competency is required');

      const evaluationData = {
        teaching_session_id: teachingSessionId,
        evaluator_id: user.id,
        instructor_id: instructorId,
        teaching_competency: parseInt(competency),
        student_feedback: studentFeedback,
        areas_for_improvement: improvements,
        additional_notes: notes,
        status: 'SUBMITTED'
      };

      const { error } = await supabase
        .from('supervisor_evaluations')
        .upsert(evaluationData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor-evaluation'] });
      toast.success('Evaluation submitted successfully');
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supervisor Evaluation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="competency">Teaching Competency (1-5)</Label>
          <Select
            value={competency || existingEvaluation?.teaching_competency?.toString()}
            onValueChange={setCompetency}
          >
            <SelectTrigger id="competency">
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
          <Label htmlFor="feedback">Student Feedback</Label>
          <Textarea
            id="feedback"
            value={studentFeedback || existingEvaluation?.student_feedback}
            onChange={(e) => setStudentFeedback(e.target.value)}
            placeholder="Enter student feedback"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="improvements">Areas for Improvement</Label>
          <Textarea
            id="improvements"
            value={improvements || existingEvaluation?.areas_for_improvement}
            onChange={(e) => setImprovements(e.target.value)}
            placeholder="Enter areas for improvement"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={notes || existingEvaluation?.additional_notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter additional notes"
          />
        </div>

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
      </CardContent>
    </Card>
  );
};
