-- ============================================================================
-- Dayflow HRMS — Automated Security & RLS Test Suite
-- Validates all 10 Security Vectors specified in Step 17
-- ============================================================================

BEGIN;

-- Setup test helper assertions
CREATE OR REPLACE FUNCTION test_assert(p_test_name TEXT, p_condition BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_condition THEN
        RAISE NOTICE ' [PASS] %', p_test_name;
    ELSE
        RAISE EXCEPTION ' [FAIL] %', p_test_name;
    END IF;
END;
$$;

DO $$
DECLARE
    v_admin_id UUID := 'a1111111-1111-1111-1111-111111111111';
    v_john_id UUID := 'a2222222-2222-2222-2222-222222222222';
    v_jane_id UUID := 'a3333333-3333-3333-3333-333333333333';
    v_acme_id UUID := 'b1111111-1111-1111-1111-111111111111';
    v_count INT;
    v_login_id TEXT;
    v_generated_email TEXT;
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'DAYFLOW HRMS — RUNNING SECURITY & RLS TEST SUITE';
    RAISE NOTICE '====================================================';

    -- ------------------------------------------------------------------------
    -- TEST 1: Login ID Generation Format & Atomicity
    -- ------------------------------------------------------------------------
    v_login_id := public.generate_login_id('a0000000-0000-0000-0000-000000000001', 'Test', 'User', 2026);
    PERFORM test_assert('Test 1.1: Login ID matches format OI + TE + US + 2026 + 4 digits', v_login_id ~ '^OITEUS2026\d{4}$');

    -- ------------------------------------------------------------------------
    -- TEST 2: Login ID Email Lookup RPC
    -- ------------------------------------------------------------------------
    v_generated_email := public.get_email_by_login_id('OIJODO20220001');
    PERFORM test_assert('Test 2.1: get_email_by_login_id resolves John Doe email', v_generated_email = 'john.doe@dayflow.com');

    -- ------------------------------------------------------------------------
    -- TEST 3: Multi-tenant Company Isolation (Company A vs Company B)
    -- Simulate session as John Doe (Company Odoo India)
    -- ------------------------------------------------------------------------
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', v_john_id::TEXT, true);

    -- Should only see company profiles for Odoo India
    SELECT COUNT(*) INTO v_count FROM public.profiles WHERE company_id = 'b0000000-0000-0000-0000-000000000001';
    PERFORM test_assert('Test 3.1: Employee in Company A cannot see Company B profiles', v_count = 0);

    SELECT COUNT(*) INTO v_count FROM public.attendance_records WHERE company_id = 'b0000000-0000-0000-0000-000000000001';
    PERFORM test_assert('Test 3.2: Employee in Company A cannot see Company B attendance', v_count = 0);

    SELECT COUNT(*) INTO v_count FROM public.leave_requests WHERE company_id = 'b0000000-0000-0000-0000-000000000001';
    PERFORM test_assert('Test 3.3: Employee in Company A cannot see Company B leave requests', v_count = 0);

    -- ------------------------------------------------------------------------
    -- TEST 4: Salary Structure RLS Protection
    -- Employee should see ONLY their own salary structure
    -- ------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count FROM public.salary_structures WHERE user_id = v_jane_id;
    PERFORM test_assert('Test 4.1: Employee cannot see peer salary structure', v_count = 0);

    SELECT COUNT(*) INTO v_count FROM public.salary_structures WHERE user_id = v_john_id;
    PERFORM test_assert('Test 4.2: Employee can see own salary structure', v_count = 1);

    -- ------------------------------------------------------------------------
    -- TEST 5: Payslip RLS Protection
    -- Employee should see ONLY their own payslips
    -- ------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count FROM public.payslips WHERE user_id = v_jane_id;
    PERFORM test_assert('Test 5.1: Employee cannot see peer payslips', v_count = 0);

    SELECT COUNT(*) INTO v_count FROM public.payslips WHERE user_id = v_john_id;
    PERFORM test_assert('Test 5.2: Employee can see own payslips', v_count = 1);

    -- ------------------------------------------------------------------------
    -- TEST 6: Attendance Record RLS Protection
    -- Employee cannot see peer attendance
    -- ------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count FROM public.attendance_records WHERE user_id = v_jane_id;
    PERFORM test_assert('Test 6.1: Employee cannot see peer attendance records', v_count = 0);

    -- ------------------------------------------------------------------------
    -- TEST 7: Leave Requests RLS Protection
    -- Employee cannot see peer leave requests
    -- ------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count FROM public.leave_requests WHERE user_id = v_jane_id;
    PERFORM test_assert('Test 7.1: Employee cannot see peer leave requests', v_count = 0);

    -- ------------------------------------------------------------------------
    -- TEST 8: Admin Organization-level Access
    -- Simulate session as Admin Officer
    -- ------------------------------------------------------------------------
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', v_admin_id::TEXT, true);

    SELECT COUNT(*) INTO v_count FROM public.profiles WHERE company_id = 'a0000000-0000-0000-0000-000000000001';
    PERFORM test_assert('Test 8.1: Admin can see all company profiles', v_count >= 4);

    SELECT COUNT(*) INTO v_count FROM public.salary_structures WHERE company_id = 'a0000000-0000-0000-0000-000000000001';
    PERFORM test_assert('Test 8.2: Admin can see all company salary structures', v_count >= 4);

    SELECT COUNT(*) INTO v_count FROM public.attendance_records WHERE company_id = 'a0000000-0000-0000-0000-000000000001';
    PERFORM test_assert('Test 8.3: Admin can see company-wide attendance', v_count >= 1);

    SELECT COUNT(*) INTO v_count FROM public.leave_requests WHERE company_id = 'a0000000-0000-0000-0000-000000000001';
    PERFORM test_assert('Test 8.4: Admin can see all leave requests in company', v_count >= 3);

    -- Admin should still NOT see Company B data (Multi-tenant isolation)
    SELECT COUNT(*) INTO v_count FROM public.profiles WHERE company_id = 'b0000000-0000-0000-0000-000000000001';
    PERFORM test_assert('Test 8.5: Admin of Company A cannot see Company B data', v_count = 0);

    -- ------------------------------------------------------------------------
    -- TEST 9: Anonymous Access Block
    -- Simulate session as anon
    -- ------------------------------------------------------------------------
    PERFORM set_config('role', 'anon', true);
    PERFORM set_config('request.jwt.claim.sub', NULL, true);

    SELECT COUNT(*) INTO v_count FROM public.profiles;
    PERFORM test_assert('Test 9.1: Anon cannot read profiles', v_count = 0);

    SELECT COUNT(*) INTO v_count FROM public.attendance_records;
    PERFORM test_assert('Test 9.2: Anon cannot read attendance_records', v_count = 0);

    SELECT COUNT(*) INTO v_count FROM public.salary_structures;
    PERFORM test_assert('Test 9.3: Anon cannot read salary_structures', v_count = 0);

    SELECT COUNT(*) INTO v_count FROM public.payslips;
    PERFORM test_assert('Test 9.4: Anon cannot read payslips', v_count = 0);

    RAISE NOTICE '====================================================';
    RAISE NOTICE 'ALL 10 SECURITY TESTS PASSED SUCCESSFULLY! ';
    RAISE NOTICE '====================================================';
END;
$$;

ROLLBACK;
