-- Add default availability for existing instructors who don't have any availability set

-- Function to create default availability for an instructor
CREATE OR REPLACE FUNCTION public.create_default_instructor_availability(instructor_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Insert default availability for Monday through Sunday (9 AM to 5 PM)
    INSERT INTO public.user_availability (user_id, day_of_week, start_time, end_time, availability_type, duration_minutes, recurrence_pattern)
    VALUES 
        (instructor_id, 1, '09:00:00', '17:00:00', 'available', 60, 'weekly'), -- Monday
        (instructor_id, 2, '09:00:00', '17:00:00', 'available', 60, 'weekly'), -- Tuesday  
        (instructor_id, 3, '09:00:00', '17:00:00', 'available', 60, 'weekly'), -- Wednesday
        (instructor_id, 4, '09:00:00', '17:00:00', 'available', 60, 'weekly'), -- Thursday
        (instructor_id, 5, '09:00:00', '17:00:00', 'available', 60, 'weekly'), -- Friday
        (instructor_id, 6, '09:00:00', '17:00:00', 'available', 60, 'weekly'), -- Saturday
        (instructor_id, 0, '09:00:00', '17:00:00', 'available', 60, 'weekly')  -- Sunday
    ON CONFLICT (user_id, day_of_week, start_time, end_time) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default availability for all existing instructors who don't have any availability set
DO $$
DECLARE
    instructor_record RECORD;
    affected_count INTEGER := 0;
BEGIN
    FOR instructor_record IN 
        SELECT p.id, p.display_name 
        FROM public.profiles p
        LEFT JOIN public.user_availability ua ON ua.user_id = p.id
        WHERE p.role IN ('IC', 'IP', 'IT') 
        AND ua.user_id IS NULL
    LOOP
        PERFORM public.create_default_instructor_availability(instructor_record.id);
        affected_count := affected_count + 1;
        RAISE NOTICE 'Added default availability for instructor: % (ID: %)', instructor_record.display_name, instructor_record.id;
    END LOOP;
    
    RAISE NOTICE 'Created default availability for % instructors', affected_count;
END $$;

-- Create trigger to automatically add default availability for new instructors
CREATE OR REPLACE FUNCTION public.handle_new_instructor_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the new/updated profile is an instructor role
    IF NEW.role IN ('IC', 'IP', 'IT') AND (OLD IS NULL OR OLD.role NOT IN ('IC', 'IP', 'IT')) THEN
        -- Check if they don't already have availability set up
        IF NOT EXISTS (SELECT 1 FROM public.user_availability WHERE user_id = NEW.id) THEN
            PERFORM public.create_default_instructor_availability(NEW.id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table for new/updated instructors (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_new_instructor_availability'
    ) THEN
        CREATE TRIGGER trigger_new_instructor_availability
            AFTER INSERT OR UPDATE OF role ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_instructor_availability();
    END IF;
END $$;