import { useProfile } from "@/hooks/useProfile";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface TeachingEvaluationFormProps {
  teachingSessionId: string;
  instructorId: string;
  onSubmit: () => void;
}

export const TeachingEvaluationForm = ({
  teachingSessionId,
  instructorId,
  onSubmit,
}: TeachingEvaluationFormProps) => {
  const { data: profile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    teachingCompetency: 0,
    studentFeedback: "",
    areasForImprovement: "",
    additionalNotes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) {
      toast.error("You must be logged in to submit an evaluation");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a single evaluation object with all required fields
      const evaluation = {
        teaching_session_id: teachingSessionId,
        instructor_id: instructorId,
        evaluator_id: profile.id, // Add the evaluator_id
        teaching_competency: formData.teachingCompetency,
        student_feedback: formData.studentFeedback,
        areas_for_improvement: formData.areasForImprovement,
        additional_notes: formData.additionalNotes,
        status: "SUBMITTED"
      };

      const { error } = await supabase
        .from('supervisor_evaluations')
        .insert(evaluation);

      if (error) throw error;

      toast.success("Evaluation submitted successfully");
      onSubmit();
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      toast.error("Failed to submit evaluation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSliderChange = (value: number[]) => {
    setFormData(prevData => ({
      ...prevData,
      teachingCompetency: value[0],
    }));
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <FormLabel>Teaching Competency (1-5)</FormLabel>
          <Slider
            defaultValue={[0]}
            max={5}
            step={1}
            onValueChange={handleSliderChange}
            disabled={isSubmitting}
          />
          <p className="text-sm text-muted-foreground">
            Current: {formData.teachingCompetency}
          </p>
        </div>

        <div>
          <FormLabel>Student Feedback</FormLabel>
          <Textarea
            name="studentFeedback"
            value={formData.studentFeedback}
            onChange={handleInputChange}
            placeholder="Enter student feedback"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <FormLabel>Areas for Improvement</FormLabel>
          <Textarea
            name="areasForImprovement"
            value={formData.areasForImprovement}
            onChange={handleInputChange}
            placeholder="Enter areas for improvement"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <FormLabel>Additional Notes</FormLabel>
          <Textarea
            name="additionalNotes"
            value={formData.additionalNotes}
            onChange={handleInputChange}
            placeholder="Enter any additional notes"
            disabled={isSubmitting}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Evaluation"}
        </Button>
      </div>
    </Form>
  );
};
