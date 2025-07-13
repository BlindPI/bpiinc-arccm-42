-- Phase 1: User Availability System Database Schema

-- Create enum for availability types
CREATE TYPE availability_type AS ENUM ('available', 'busy', 'tentative', 'out_of_office');

-- Create enum for days of week (0 = Sunday, 6 = Saturday)
CREATE TYPE day_of_week AS ENUM ('0', '1', '2', '3', '4', '5', '6');

-- Create enum for booking types
CREATE TYPE booking_type AS ENUM ('course_instruction', 'training_session', 'meeting', 'administrative', 'personal');

-- Create enum for permission types
CREATE TYPE permission_type AS ENUM ('view', 'edit', 'manage');

-- Core user availability table
CREATE TABLE user_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    availability_type availability_type NOT NULL DEFAULT 'available',
    recurring_pattern TEXT DEFAULT 'weekly', -- weekly, biweekly, monthly, one-time
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NULL,
    time_slot_duration INTEGER NOT NULL DEFAULT 60, -- minutes: 15, 30, 60
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure valid time ranges
    CONSTRAINT valid_time_range CHECK (start_time < end_time),
    -- Prevent overlapping slots for same user/day
    EXCLUDE USING gist (user_id WITH =, day_of_week WITH =, tsrange(start_time::text::time, end_time::text::time, '[)') WITH &&) WHERE (is_active = true)
);

-- Availability exceptions (for one-time changes)
CREATE TABLE availability_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    availability_type availability_type NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, exception_date, start_time, end_time)
);

-- Time slot bookings
CREATE TABLE availability_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    booking_type booking_type NOT NULL,
    course_id UUID REFERENCES courses(id),
    course_offering_id UUID REFERENCES course_offerings(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    hours_credited DECIMAL(4,2) DEFAULT 0,
    billable_hours DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_booking_time CHECK (start_time < end_time)
);

-- User work hours tracking
CREATE TABLE user_work_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    scheduled_start TIME,
    scheduled_end TIME,
    actual_start TIME,
    actual_end TIME,
    break_duration INTEGER DEFAULT 0, -- minutes
    scheduled_hours DECIMAL(4,2),
    actual_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    payroll_period VARCHAR(20),
    notes TEXT,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, work_date)
);

-- Team/location availability permissions
CREATE TABLE availability_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grantor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Who granted permission
    grantee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Who received permission
    target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Whose availability can be managed (NULL = all in scope)
    permission_type permission_type NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Must have either team_id or location_id
    CONSTRAINT must_have_scope CHECK (team_id IS NOT NULL OR location_id IS NOT NULL)
);

-- Enable RLS on all tables
ALTER TABLE user_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_work_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_availability
CREATE POLICY "Users can manage own availability" ON user_availability
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "AP users can view team availability" ON user_availability
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM availability_permissions ap
            WHERE ap.grantee_id = auth.uid()
            AND ap.permission_type IN ('view', 'edit', 'manage')
            AND ap.is_active = true
            AND (ap.target_user_id IS NULL OR ap.target_user_id = user_availability.user_id)
            AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role IN ('SA', 'AD')
        )
    );

CREATE POLICY "AP users can edit authorized availability" ON user_availability
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM availability_permissions ap
            WHERE ap.grantee_id = auth.uid()
            AND ap.permission_type IN ('edit', 'manage')
            AND ap.is_active = true
            AND (ap.target_user_id IS NULL OR ap.target_user_id = user_availability.user_id)
            AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role IN ('SA', 'AD')
        )
    );

-- Similar policies for other tables
CREATE POLICY "Users can manage own exceptions" ON availability_exceptions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view own bookings" ON availability_bookings
    FOR SELECT USING (user_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can manage own work hours" ON user_work_hours
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage permissions" ON availability_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role IN ('SA', 'AD')
        )
    );

-- Create indexes for performance
CREATE INDEX idx_user_availability_user_day ON user_availability(user_id, day_of_week);
CREATE INDEX idx_availability_bookings_user_date ON availability_bookings(user_id, booking_date);
CREATE INDEX idx_user_work_hours_user_date ON user_work_hours(user_id, work_date);
CREATE INDEX idx_availability_permissions_grantee ON availability_permissions(grantee_id) WHERE is_active = true;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_availability_updated_at BEFORE UPDATE ON user_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_bookings_updated_at BEFORE UPDATE ON availability_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_work_hours_updated_at BEFORE UPDATE ON user_work_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();