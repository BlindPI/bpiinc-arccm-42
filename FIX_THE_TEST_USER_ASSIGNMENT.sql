-- FIX: Create proper provider assignment for "The Test User"
-- This will ensure they show up with "Barrie First Aid & CPR Training" instead of "BPI INC 2"

-- First, let's find "The Test User" ID
DO $$
DECLARE
    test_user_id UUID;
    barrie_team_id UUID := 'b71ff364-e876-4caf-9519-03697d015cfc';
BEGIN
    -- Get "The Test User" ID
    SELECT id INTO test_user_id
    FROM profiles 
    WHERE display_name ILIKE '%test user%' 
    OR email ILIKE '%jonathan.d.e.wood%'
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'The Test User not found in profiles table';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found The Test User ID: %', test_user_id;
    
    -- Create authorized_provider record if it doesn't exist
    INSERT INTO authorized_providers (id, provider_name, contact_email, status, created_at, updated_at)
    SELECT 
        p.id,
        p.display_name,
        p.email,
        'active',
        NOW(),
        NOW()
    FROM profiles p 
    WHERE p.id = test_user_id
    ON CONFLICT (id) DO UPDATE SET
        provider_name = EXCLUDED.provider_name,
        contact_email = EXCLUDED.contact_email,
        updated_at = NOW();
    
    RAISE NOTICE 'Created/Updated authorized_provider record for The Test User';
    
    -- Create provider_team_assignment record
    INSERT INTO provider_team_assignments (
        id,
        provider_id,
        team_id,
        assignment_role,
        status,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        test_user_id,
        barrie_team_id,
        'primary',
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (provider_id, team_id, assignment_role) DO UPDATE SET
        status = 'active',
        updated_at = NOW();
    
    RAISE NOTICE 'Created provider_team_assignment for The Test User -> Barrie First Aid & CPR Training';
    
    -- Update teams.provider_id to maintain synchronization
    UPDATE teams 
    SET provider_id = test_user_id, updated_at = NOW()
    WHERE id = barrie_team_id;
    
    RAISE NOTICE 'Updated teams.provider_id for Barrie First Aid & CPR Training';
    
    -- Verify the assignment
    PERFORM 1 FROM provider_team_assignments 
    WHERE provider_id = test_user_id 
    AND team_id = barrie_team_id 
    AND status = 'active';
    
    IF FOUND THEN
        RAISE NOTICE 'SUCCESS: The Test User is now properly assigned to Barrie First Aid & CPR Training';
    ELSE
        RAISE NOTICE 'ERROR: Assignment verification failed';
    END IF;
    
END $$;

-- Verification query to confirm the fix
SELECT 
    'VERIFICATION' as status,
    p.display_name as user_name,
    t.name as team_name,
    l.name as location_name,
    pta.assignment_role,
    pta.status
FROM provider_team_assignments pta
JOIN profiles p ON pta.provider_id = p.id
JOIN teams t ON pta.team_id = t.id
JOIN locations l ON t.location_id = l.id
WHERE p.display_name ILIKE '%test user%'
AND pta.status = 'active';