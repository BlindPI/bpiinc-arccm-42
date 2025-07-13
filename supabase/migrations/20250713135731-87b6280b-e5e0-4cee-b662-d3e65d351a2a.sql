-- Fix RLS policies for availability_bookings to allow course scheduling
-- Add INSERT and UPDATE policies for users to create availability bookings

-- Allow users to create their own bookings
CREATE POLICY "Users can create own availability bookings" ON availability_bookings
    FOR INSERT 
    WITH CHECK (user_id = auth.uid() OR created_by = auth.uid());

-- Allow AP users to create bookings for team members
CREATE POLICY "AP users can create team availability bookings" ON availability_bookings
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM availability_permissions ap
            WHERE ap.grantee_id = auth.uid()
            AND ap.permission_type IN ('edit', 'manage')
            AND ap.is_active = true
            AND (ap.target_user_id IS NULL OR ap.target_user_id = availability_bookings.user_id)
            AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role IN ('SA', 'AD', 'AP')
        )
    );

-- Allow users to update their own bookings  
CREATE POLICY "Users can update own availability bookings" ON availability_bookings
    FOR UPDATE 
    USING (user_id = auth.uid() OR created_by = auth.uid());

-- Allow AP users to update team bookings
CREATE POLICY "AP users can update team availability bookings" ON availability_bookings
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM availability_permissions ap
            WHERE ap.grantee_id = auth.uid()
            AND ap.permission_type IN ('edit', 'manage')
            AND ap.is_active = true
            AND (ap.target_user_id IS NULL OR ap.target_user_id = availability_bookings.user_id)
            AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role IN ('SA', 'AD', 'AP')
        )
    );