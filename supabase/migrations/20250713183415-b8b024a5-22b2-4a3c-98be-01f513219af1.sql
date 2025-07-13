-- Create trigger to automatically update assignment_start_date when missing
CREATE OR REPLACE FUNCTION public.update_team_member_assignment_date()
RETURNS TRIGGER AS $$
BEGIN
  -- If assignment_start_date is null, set it to created_at or current timestamp
  IF NEW.assignment_start_date IS NULL THEN
    NEW.assignment_start_date = COALESCE(NEW.created_at, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on team_members table
DROP TRIGGER IF EXISTS update_assignment_start_date_trigger ON public.team_members;
CREATE TRIGGER update_assignment_start_date_trigger
  BEFORE INSERT OR UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_member_assignment_date();

-- Backfill existing records that have null assignment_start_date
UPDATE public.team_members 
SET assignment_start_date = COALESCE(created_at, NOW())
WHERE assignment_start_date IS NULL;