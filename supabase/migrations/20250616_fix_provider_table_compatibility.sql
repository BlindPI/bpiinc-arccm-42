-- Fix Provider Table Compatibility Issues
-- Ensure authorized_providers table exists with proper UUID types

-- First, check if authorized_providers table exists and create it if it doesn't
DO $$
BEGIN
    -- Check if authorized_providers table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'authorized_providers'
    ) THEN
        -- Create authorized_providers as an alias/view to providers table
        CREATE TABLE public.authorized_providers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            provider_type VARCHAR(50) DEFAULT 'training_provider',
            status VARCHAR(20) DEFAULT 'pending',
            primary_location_id UUID REFERENCES public.locations(id),
            performance_rating DECIMAL(3,2) DEFAULT 0.0,
            compliance_score DECIMAL(5,2) DEFAULT 0.0,
            description TEXT,
            website VARCHAR(255),
            contact_email VARCHAR(255),
            contact_phone VARCHAR(20),
            address TEXT,
            approved_by UUID REFERENCES auth.users(id),
            approval_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created authorized_providers table with UUID primary key';
        
        -- Copy data from providers table if it exists and has data
        IF EXISTS (SELECT 1 FROM public.providers LIMIT 1) THEN
            INSERT INTO public.authorized_providers (
                id, name, provider_type, status, primary_location_id,
                performance_rating, compliance_score, description, website,
                contact_email, contact_phone, address, created_at, updated_at
            )
            SELECT 
                id, name, provider_type, status, primary_location_id,
                performance_rating, compliance_score, description, website,
                contact_email, contact_phone, address, created_at, updated_at
            FROM public.providers
            ON CONFLICT (id) DO NOTHING;
            
            RAISE NOTICE 'Copied data from providers to authorized_providers';
        END IF;
        
    ELSE
        -- Table exists, check if ID column is the right type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'authorized_providers' 
            AND column_name = 'id' 
            AND data_type = 'bigint'
        ) THEN
            RAISE NOTICE 'authorized_providers table exists but has bigint ID, needs conversion';
            
            -- Create a backup of the existing table
            CREATE TABLE IF NOT EXISTS public.authorized_providers_backup AS 
            SELECT * FROM public.authorized_providers;
            
            -- Drop and recreate with UUID
            DROP TABLE public.authorized_providers CASCADE;
            
            CREATE TABLE public.authorized_providers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                provider_type VARCHAR(50) DEFAULT 'training_provider',
                status VARCHAR(20) DEFAULT 'pending',
                primary_location_id UUID REFERENCES public.locations(id),
                performance_rating DECIMAL(3,2) DEFAULT 0.0,
                compliance_score DECIMAL(5,2) DEFAULT 0.0,
                description TEXT,
                website VARCHAR(255),
                contact_email VARCHAR(255),
                contact_phone VARCHAR(20),
                address TEXT,
                approved_by UUID REFERENCES auth.users(id),
                approval_date TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            RAISE NOTICE 'Recreated authorized_providers table with UUID primary key';
            
        ELSE
            RAISE NOTICE 'authorized_providers table exists with correct UUID type';
        END IF;
    END IF;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_authorized_providers_status ON public.authorized_providers(status);
CREATE INDEX IF NOT EXISTS idx_authorized_providers_provider_type ON public.authorized_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_authorized_providers_primary_location_id ON public.authorized_providers(primary_location_id);

-- Enable RLS on authorized_providers table
ALTER TABLE public.authorized_providers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authorized_providers
DROP POLICY IF EXISTS "Users can view authorized providers" ON public.authorized_providers;
CREATE POLICY "Users can view authorized providers" ON public.authorized_providers
FOR SELECT USING (true);

DROP POLICY IF EXISTS "SA and AD can manage authorized providers" ON public.authorized_providers;
CREATE POLICY "SA and AD can manage authorized providers" ON public.authorized_providers
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- Grant permissions
GRANT SELECT ON public.authorized_providers TO authenticated;

-- Add some sample data if the table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.authorized_providers LIMIT 1) THEN
        INSERT INTO public.authorized_providers (name, provider_type, status, performance_rating, compliance_score, description)
        VALUES
            ('Assured Response Training Center', 'training_provider', 'active', 4.8, 98.5, 'Primary training facility for emergency response certification'),
            ('Regional Safety Institute', 'training_provider', 'active', 4.6, 96.2, 'Specialized safety and compliance training provider'),
            ('Professional Development Corp', 'training_provider', 'pending', 4.2, 94.1, 'Corporate training and professional development services');
        
        RAISE NOTICE 'Added sample authorized providers';
    END IF;
END;
$$;

-- Create a function to sync data between providers and authorized_providers if needed
CREATE OR REPLACE FUNCTION sync_providers_to_authorized_providers()
RETURNS TRIGGER AS $$
BEGIN
    -- When providers table is updated, sync to authorized_providers
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.authorized_providers (
            id, name, provider_type, status, primary_location_id,
            performance_rating, compliance_score, description, website,
            contact_email, contact_phone, address, created_at, updated_at
        ) VALUES (
            NEW.id, NEW.name, NEW.provider_type, NEW.status, NEW.primary_location_id,
            NEW.performance_rating, NEW.compliance_score, NEW.description, NEW.website,
            NEW.contact_email, NEW.contact_phone, NEW.address, NEW.created_at, NEW.updated_at
        ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            provider_type = EXCLUDED.provider_type,
            status = EXCLUDED.status,
            primary_location_id = EXCLUDED.primary_location_id,
            performance_rating = EXCLUDED.performance_rating,
            compliance_score = EXCLUDED.compliance_score,
            description = EXCLUDED.description,
            website = EXCLUDED.website,
            contact_email = EXCLUDED.contact_email,
            contact_phone = EXCLUDED.contact_phone,
            address = EXCLUDED.address,
            updated_at = EXCLUDED.updated_at;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.authorized_providers SET
            name = NEW.name,
            provider_type = NEW.provider_type,
            status = NEW.status,
            primary_location_id = NEW.primary_location_id,
            performance_rating = NEW.performance_rating,
            compliance_score = NEW.compliance_score,
            description = NEW.description,
            website = NEW.website,
            contact_email = NEW.contact_email,
            contact_phone = NEW.contact_phone,
            address = NEW.address,
            updated_at = NEW.updated_at
        WHERE id = NEW.id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM public.authorized_providers WHERE id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep tables in sync if both exist
DROP TRIGGER IF EXISTS sync_providers_trigger ON public.providers;
CREATE TRIGGER sync_providers_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.providers
    FOR EACH ROW EXECUTE FUNCTION sync_providers_to_authorized_providers();

RAISE NOTICE 'Provider table compatibility migration completed successfully';