-- Create junction table for linking training rosters to courses
CREATE TABLE public.course_roster_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_offering_id UUID REFERENCES public.course_offerings(id) ON DELETE CASCADE,
  availability_booking_id UUID REFERENCES public.availability_bookings(id) ON DELETE CASCADE,
  roster_id UUID REFERENCES public.student_rosters(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT course_roster_assignments_unique UNIQUE(course_offering_id, roster_id),
  CONSTRAINT course_roster_assignments_booking_roster_unique UNIQUE(availability_booking_id, roster_id)
);

-- Enable RLS
ALTER TABLE public.course_roster_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view course roster assignments" 
ON public.course_roster_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['SA'::text, 'AD'::text, 'AP'::text, 'IC'::text, 'IP'::text, 'IT'::text])
  )
);

CREATE POLICY "Authorized users can manage course roster assignments" 
ON public.course_roster_assignments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['SA'::text, 'AD'::text, 'AP'::text])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['SA'::text, 'AD'::text, 'AP'::text])
  )
);

-- Add roster assignment functionality to availability_bookings
ALTER TABLE public.availability_bookings 
ADD COLUMN IF NOT EXISTS roster_id UUID REFERENCES public.student_rosters(id);

-- Create student roster membership table for individual student management
CREATE TABLE public.student_roster_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roster_id UUID NOT NULL REFERENCES public.student_rosters(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES public.student_enrollment_profiles(id) ON DELETE CASCADE,
  enrollment_status TEXT NOT NULL DEFAULT 'enrolled',
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  enrolled_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT student_roster_members_unique UNIQUE(roster_id, student_profile_id)
);

-- Enable RLS
ALTER TABLE public.student_roster_members ENABLE ROW LEVEL SECURITY;

-- Create policies for student roster members
CREATE POLICY "Users can view student roster members" 
ON public.student_roster_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['SA'::text, 'AD'::text, 'AP'::text, 'IC'::text, 'IP'::text, 'IT'::text])
  )
);

CREATE POLICY "Authorized users can manage student roster members" 
ON public.student_roster_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['SA'::text, 'AD'::text, 'AP'::text])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['SA'::text, 'AD'::text, 'AP'::text])
  )
);

-- Create trigger to update roster enrollment count
CREATE OR REPLACE FUNCTION public.update_roster_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE student_rosters 
        SET current_enrollment = current_enrollment + 1 
        WHERE id = NEW.roster_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE student_rosters 
        SET current_enrollment = current_enrollment - 1 
        WHERE id = OLD.roster_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for student roster members
CREATE TRIGGER update_roster_count_trigger
    AFTER INSERT OR DELETE ON public.student_roster_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_roster_enrollment_count();