-- ============================================================================
-- Dayflow HRMS — Migration 00004: Supabase Storage Buckets & Policies
-- Authoritative Specification: docs/ARCHITECTURE.md Section 4.4
-- ============================================================================

-- Create storage schema buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
    ('company-logos', 'company-logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- Storage Policies for 'avatars' bucket
-- ============================================================================

-- Public read access for profile avatars
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
CREATE POLICY "avatars_public_select"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'avatars');

-- Authenticated upload for avatars (own folder / avatar or admin)
DROP POLICY IF EXISTS "avatars_auth_insert" ON storage.objects;
CREATE POLICY "avatars_auth_insert"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (
            auth.uid() IS NOT NULL
        )
    );

-- Authenticated update for avatars
DROP POLICY IF EXISTS "avatars_auth_update" ON storage.objects;
CREATE POLICY "avatars_auth_update"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (
            (auth.uid()::text = (storage.foldername(name))[1])
            OR public.is_admin()
        )
    )
    WITH CHECK (
        bucket_id = 'avatars'
        AND (
            (auth.uid()::text = (storage.foldername(name))[1])
            OR public.is_admin()
        )
    );

-- Authenticated delete for avatars
DROP POLICY IF EXISTS "avatars_auth_delete" ON storage.objects;
CREATE POLICY "avatars_auth_delete"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (
            (auth.uid()::text = (storage.foldername(name))[1])
            OR public.is_admin()
        )
    );


-- ============================================================================
-- Storage Policies for 'company-logos' bucket
-- ============================================================================

-- Public read access for company logos
DROP POLICY IF EXISTS "logos_public_select" ON storage.objects;
CREATE POLICY "logos_public_select"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'company-logos');

-- Admin upload for company logos
DROP POLICY IF EXISTS "logos_admin_insert" ON storage.objects;
CREATE POLICY "logos_admin_insert"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'company-logos'
        AND public.is_admin()
    );

-- Admin update for company logos
DROP POLICY IF EXISTS "logos_admin_update" ON storage.objects;
CREATE POLICY "logos_admin_update"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'company-logos'
        AND public.is_admin()
    )
    WITH CHECK (
        bucket_id = 'company-logos'
        AND public.is_admin()
    );

-- Admin delete for company logos
DROP POLICY IF EXISTS "logos_admin_delete" ON storage.objects;
CREATE POLICY "logos_admin_delete"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'company-logos'
        AND public.is_admin()
    );
