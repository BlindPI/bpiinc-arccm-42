-- Create default availability for all instructors (Monday-Sunday, 9:00 AM - 5:00 PM)

-- First, let's check if user_availability table exists, if not create it
CREATE TABLE IF NOT EXISTS public.user_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    availability_type VARCHAR(20) NOT NULL DEFAULT 'available',
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    recurrence_pattern VARCHAR(20) NOT NULL DEFAULT 'weekly',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, day_of_week, start_time, end_time)
);

-- Enable RLS on user_availability
ALTER TABLE public.user_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_availability
CREATE POLICY "Users can manage own availability" ON public.user_availability
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all availability" ON public.user_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role IN ('SA', 'AD', 'AP')
        )
    );

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
BEGIN
    FOR instructor_record IN 
        SELECT p.id 
        FROM public.profiles p
        LEFT JOIN public.user_availability ua ON ua.user_id = p.id
        WHERE p.role IN ('IC', 'IP', 'IT') 
        AND ua.user_id IS NULL
    LOOP
        PERFORM public.create_default_instructor_availability(instructor_record.id);
    END LOOP;
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

-- Create trigger on profiles table for new/updated instructors
DROP TRIGGER IF EXISTS trigger_new_instructor_availability ON public.profiles;
CREATE TRIGGER trigger_new_instructor_availability
    AFTER INSERT OR UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_instructor_availability();