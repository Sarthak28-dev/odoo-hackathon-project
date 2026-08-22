-- ============================================================================
-- Dayflow HRMS — Migration 00003: Row Level Security (RLS) Policies
-- Authoritative Specification: docs/DATABASE.md Section 5 & docs/ARCHITECTURE.md
-- ============================================================================

-- ============================================================================
-- 1. Enable RLS on all public application tables
-- ============================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_id_sequences ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 2. Policies for: companies
-- ============================================================================

-- SELECT: Authenticated users can view only their own company
DROP POLICY IF EXISTS "companies_select_own" ON public.companies;
CREATE POLICY "companies_select_own"
    ON public.companies
    FOR SELECT
    TO authenticated
    USING (
        id = public.auth_user_company_id()
    );

-- INSERT: Authenticated users can register a new company (during admin sign-up)
DROP POLICY IF EXISTS "companies_insert_auth" ON public.companies;
CREATE POLICY "companies_insert_auth"
    ON public.companies
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- UPDATE: Only company admin can update company info
DROP POLICY IF EXISTS "companies_update_admin" ON public.companies;
CREATE POLICY "companies_update_admin"
    ON public.companies
    FOR UPDATE
    TO authenticated
    USING (
        id = public.auth_user_company_id() AND public.is_admin()
    )
    WITH CHECK (
        id = public.auth_user_company_id() AND public.is_admin()
    );


-- ============================================================================
-- 3. Policies for: profiles
-- ============================================================================

-- SELECT: Users can view profiles within their own company (multi-tenant isolation)
DROP POLICY IF EXISTS "profiles_select_company" ON public.profiles;
CREATE POLICY "profiles_select_company"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        company_id = public.auth_user_company_id()
    );

-- INSERT: Admin can create profiles in their company; or user can insert own during auth
DROP POLICY IF EXISTS "profiles_insert_admin_or_self" ON public.profiles;
CREATE POLICY "profiles_insert_admin_or_self"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (public.is_admin() AND company_id = public.auth_user_company_id())
        OR (id = auth.uid())
    );

-- UPDATE: Admin can update all profiles in company; Employees can update their own row
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        (public.is_admin() AND company_id = public.auth_user_company_id())
        OR (id = auth.uid())
    )
    WITH CHECK (
        (public.is_admin() AND company_id = public.auth_user_company_id())
        OR (id = auth.uid())
    );

-- DELETE: Admin can delete employee profiles in company (except self)
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin() AND company_id = public.auth_user_company_id() AND id <> auth.uid()
    );


-- ============================================================================
-- 4. Policies for: attendance_records
-- ============================================================================

-- SELECT: Admin can view all attendance in company; Employee can view only own
DROP POLICY IF EXISTS "attendance_select_policy" ON public.attendance_records;
CREATE POLICY "attendance_select_policy"
    ON public.attendance_records
    FOR SELECT
    TO authenticated
    USING (
        (public.is_admin() AND company_id = public.auth_user_company_id())
        OR (user_id = auth.uid() AND company_id = public.auth_user_company_id())
    );

-- INSERT: Admin can log attendance; Employee can log check-in for self
DROP POLICY IF EXISTS "attendance_insert_policy" ON public.attendance_records;
CREATE POLICY "attendance_insert_policy"
    ON public.attendance_records
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (public.is_admin() AND company_id = public.auth_user_company_id())
        OR (user_id = auth.uid() AND company_id = public.auth_user_company_id())
    );

-- UPDATE: Admin can edit attendance; Employee can check out for self
DROP POLICY IF EXISTS "attendance_update_policy" ON public.attendance_records;
CREATE POLICY "attendance_update_policy"
    ON public.attendance_records
    FOR UPDATE
    TO authenticated
    USING (
        (public.is_admin() AND company_id = public.auth_user_company_id())
        OR (user_id = auth.uid() AND company_id = public.auth_user_company_id())
    )
    WITH CHECK (
        (public.is_admin() AND company_id = public.auth_user_company_id())
        OR (user_id = auth.uid() AND company_id = public.auth_user_company_id())
    );

-- DELETE: Only Admin can delete attendance records
DROP POLICY IF EXISTS "attendance_delete_admin" ON public.attendance_records;
CREATE POLICY "attendance_delete_admin"
    ON public.attendance_records
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin() AND company_id = public.auth_user_company_id()
    );


-- ============================================================================
-- 5. Policies for: leave_requests
-- ============================================================================

-- SELECT: Admin can view all leaves in company; Employee can view own requests
DROP POLICY IF EXISTS "leave_select_policy" ON public.leave_requests;
CREATE POLICY "leave_select_policy"
    ON public.leave_requests
    FOR SELECT
    TO authenticated
    USING (
        (public.is_admin() AND company_id = public.auth_user_company_id())
        OR (user_id = auth.uid() AND company_id = public.auth_user_company_id())
    );

-- INSERT: Employee can apply for self; Admin can apply for employees in company
DROP POLICY IF EXISTS "leave_insert_policy" ON public.leave_requests;
CREATE POLICY "leave_insert_policy"
    ON public.leave_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (public.is_admin() AND company_id = public.auth_user_company_id())
        OR (user_id = auth.uid() AND company_id = public.auth_user_company_id())
    );

-- UPDATE: Admin can approve/reject; Employee can edit only own pending request
DROP POLICY IF EXISTS "leave_update_policy" ON public.leave_requests;
CREATE POLICY "leave_update_policy"
    ON public.leave_requests
    FOR UPDATE
    TO authenticated
    USING (
        (public.is_admin() AND company_id = public.auth_user_company_id())
        OR (user_id = auth.uid() AND status = 'pending')
    )
    WITH CHECK (
        (public.is_admin() AND company_id = public.auth_user_company_id())
        OR (user_id = auth.uid() AND status = 'pending')
    );

-- DELETE: Admin can delete any request; Employee can delete own pending request
DROP POLICY IF EXISTS "leave_delete_policy" ON public.leave_requests;
CREATE POLICY "leave_delete_policy"
    ON public.leave_requests
    FOR DELETE
    TO authenticated
    USING (
        (public.is_admin() AND company_id = public.auth_user_company_id())
        OR (user_id = auth.uid() AND status = 'pending')
    );


-- ============================================================================
-- 6. Policies for: salary_structures
-- ============================================================================

-- SELECT: Admin can view all in company; Employee can view only own salary
DROP POLICY IF EXISTS "salary_select_policy" ON public.salary_structures;
CREATE POLICY "salary_select_policy"
    ON public.salary_structures
    FOR SELECT
    TO authenticated
    USING (
        (public.is_admin() AND company_id = public.auth_user_company_id())
        OR (user_id = auth.uid() AND company_id = public.auth_user_company_id())
    );

-- INSERT: Admin ONLY
DROP POLICY IF EXISTS "salary_insert_admin" ON public.salary_structures;
CREATE POLICY "salary_insert_admin"
    ON public.salary_structures
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() AND company_id = public.auth_user_company_id()
    );

-- UPDATE: Admin ONLY
DROP POLICY IF EXISTS "salary_update_admin" ON public.salary_structures;
CREATE POLICY "salary_update_admin"
    ON public.salary_structures
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin() AND company_id = public.auth_user_company_id()
    )
    WITH CHECK (
        public.is_admin() AND company_id = public.auth_user_company_id()
    );

-- DELETE: Admin ONLY
DROP POLICY IF EXISTS "salary_delete_admin" ON public.salary_structures;
CREATE POLICY "salary_delete_admin"
    ON public.salary_structures
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin() AND company_id = public.auth_user_company_id()
    );


-- ============================================================================
-- 7. Policies for: payslips
-- ============================================================================

-- SELECT: Admin can view all in company; Employee can view only own payslips
DROP POLICY IF EXISTS "payslips_select_policy" ON public.payslips;
CREATE POLICY "payslips_select_policy"
    ON public.payslips
    FOR SELECT
    TO authenticated
    USING (
        (public.is_admin() AND company_id = public.auth_user_company_id())
        OR (user_id = auth.uid() AND company_id = public.auth_user_company_id())
    );

-- INSERT: Admin ONLY
DROP POLICY IF EXISTS "payslips_insert_admin" ON public.payslips;
CREATE POLICY "payslips_insert_admin"
    ON public.payslips
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() AND company_id = public.auth_user_company_id()
    );

-- UPDATE: Admin ONLY
DROP POLICY IF EXISTS "payslips_update_admin" ON public.payslips;
CREATE POLICY "payslips_update_admin"
    ON public.payslips
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin() AND company_id = public.auth_user_company_id()
    )
    WITH CHECK (
        public.is_admin() AND company_id = public.auth_user_company_id()
    );

-- DELETE: Admin ONLY
DROP POLICY IF EXISTS "payslips_delete_admin" ON public.payslips;
CREATE POLICY "payslips_delete_admin"
    ON public.payslips
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin() AND company_id = public.auth_user_company_id()
    );
