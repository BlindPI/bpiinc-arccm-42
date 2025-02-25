
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supervisorId: string;
  superviseeId: string;
  onSuccess: () => void;
}

export const NewSessionDialog = ({
  open,
  onOpenChange,
  supervisorId,
  superviseeId,
  onSuccess,
}: NewSessionDialogProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [duration, setDuration] = useState("60");
  const [sessionType, setSessionType] = useState("CHECK_IN");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [nextDate, setNextDate] = useState<Date | undefined>();
  const queryClient = useQueryClient();

  const createSession = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('supervision_sessions')
        .insert([
          {
            supervisor_id: supervisorId,
            supervisee_id: superviseeId,
            session_date: date.toISOString(),
            duration_minutes: parseInt(duration),
            session_type: sessionType,
            meeting_notes: notes,
            feedback_given: feedback,
            action_items: actionItems,
            next_session_date: nextDate?.toISOString(),
          }
        ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['supervision-metrics'] });
      toast.success("Session recorded successfully");
      onSuccess();
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating session:', error);
      toast.error("Failed to record session");
    },
  });

  const resetForm = () => {
    setDate(new Date());
    setDuration("60");
    setSessionType("CHECK_IN");
    setNotes("");
    setFeedback("");
    setActionItems("");
    setNextDate(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record New Supervision Session</DialogTitle>
          <DialogDescription>
            Record details about your supervision session
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Session Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Session Type</Label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CHECK_IN">Regular Check-in</SelectItem>
                <SelectItem value="EVALUATION">Evaluation Session</SelectItem>
                <SelectItem value="PROGRESS_REVIEW">Progress Review</SelectItem>
                <SelectItem value="SUPPORT">Support Session</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Meeting Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter meeting notes..."
            />
          </div>

          <div className="space-y-2">
            <Label>Feedback Given</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter feedback..."
            />
          </div>

          <div className="space-y-2">
            <Label>Action Items</Label>
            <Textarea
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              placeholder="Enter action items..."
            />
          </div>

          <div className="space-y-2">
            <Label>Next Session Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                >
                  {nextDate ? format(nextDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={nextDate}
                  onSelect={setNextDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => createSession.mutate()}
            disabled={createSession.isPending}
          >
            {createSession.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
