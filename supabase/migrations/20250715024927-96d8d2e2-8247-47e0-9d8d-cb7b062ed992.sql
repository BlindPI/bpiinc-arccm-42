-- Fix the trigger function to use correct field names and optimize performance
CREATE OR REPLACE FUNCTION public.trigger_enrollment_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Create workflow for new enrollments requiring approval
    IF NEW.enrollment_status = 'pending_approval' AND (OLD IS NULL OR OLD.enrollment_status != 'pending_approval') THEN
        PERFORM create_enrollment_workflow(NEW.roster_id, NEW.student_profile_id, 'enrollment');
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Update the trigger to only fire on enrollment_status changes for better performance
DROP TRIGGER IF EXISTS trigger_enrollment_workflow_on_student_roster_members ON student_roster_members;

CREATE TRIGGER trigger_enrollment_workflow_on_student_roster_members
    AFTER UPDATE OF enrollment_status ON student_roster_members
    FOR EACH ROW EXECUTE FUNCTION trigger_enrollment_workflow();