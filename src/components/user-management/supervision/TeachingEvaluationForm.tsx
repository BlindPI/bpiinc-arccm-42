
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

type EvaluationStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUBMITTED";

interface TeachingEvaluationFormData {
  teaching_session_id: string;
  instructor_id: string;
  evaluator_id: string;
  teaching_competency: number;
  student_feedback: string;
  areas_for_improvement: string;
  additional_notes: string;
  status: EvaluationStatus;
}

interface TeachingEvaluationFormProps {
  sessionId: string;
  instructorId: string;
  onSuccess?: () => void;
}

export const TeachingEvaluationForm = ({ sessionId, instructorId, onSuccess }: TeachingEvaluationFormProps) => {
  const { user } = useAuth();
  const form = useForm<TeachingEvaluationFormData>({
    defaultValues: {
      teaching_session_id: sessionId,
      instructor_id: instructorId,
      evaluator_id: user?.id || '',
      teaching_competency: 3,
      student_feedback: '',
      areas_for_improvement: '',
      additional_notes: '',
      status: 'PENDING' as EvaluationStatus,
    },
  });

  const onSubmit = async (data: TeachingEvaluationFormData) => {
    try {
      const { error } = await supabase
        .from('supervisor_evaluations')
        .insert(data);

      if (error) throw error;

      toast.success('Evaluation submitted successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast.error('Failed to submit evaluation');
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="teaching_competency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teaching Competency (1-5)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="student_feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter student feedback..."
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="areas_for_improvement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Areas for Improvement</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter areas for improvement..."
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additional_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter additional notes..."
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit">Submit Evaluation</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
