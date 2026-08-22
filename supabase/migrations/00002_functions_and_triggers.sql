-- ============================================================================
-- Dayflow HRMS — Migration 00002: Functions, Triggers & Payroll Engine
-- Authoritative Specification: docs/DATABASE.md & docs/PROJECT_CONTEXT.md
-- ============================================================================

-- ============================================================================
-- 1. General Trigger: Update updated_at column
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_attendance_records_updated_at ON public.attendance_records;
CREATE TRIGGER trg_attendance_records_updated_at
    BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER trg_leave_requests_updated_at
    BEFORE UPDATE ON public.leave_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_salary_structures_updated_at ON public.salary_structures;
CREATE TRIGGER trg_salary_structures_updated_at
    BEFORE UPDATE ON public.salary_structures
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 2. Auth Helper Functions (Security Definer & Stable for RLS optimization)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auth_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- Helper to look up an employee's email by their Login ID for login flow
CREATE OR REPLACE FUNCTION public.get_email_by_login_id(p_login_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email
    FROM public.profiles
    WHERE LOWER(TRIM(login_id)) = LOWER(TRIM(p_login_id))
       OR LOWER(TRIM(email)) = LOWER(TRIM(p_login_id))
    LIMIT 1;
    
    RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_by_login_id(TEXT) TO anon, authenticated;


-- ============================================================================
-- 3. Concurrency-Safe Login ID Generation Function
-- Format: [Company Prefix][First 2 letters First Name][First 2 letters Last Name][Year][4DigitSerial]
-- Example: OIJODO20220001
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_login_id(
    p_company_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_joining_year INT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_company_prefix TEXT := 'OI';
    v_company_name TEXT;
    v_f2 TEXT;
    v_l2 TEXT;
    v_year TEXT;
    v_prefix_key TEXT;
    v_serial INT;
BEGIN
    -- Determine company prefix from company name or default to 'OI'
    IF p_company_id IS NOT NULL THEN
        SELECT name INTO v_company_name FROM public.companies WHERE id = p_company_id;
        IF v_company_name IS NOT NULL THEN
            v_company_prefix := UPPER(SUBSTRING(REGEXP_REPLACE(v_company_name, '[^a-zA-Z]', '', 'g') FROM 1 FOR 2));
            IF LENGTH(v_company_prefix) < 2 THEN
                v_company_prefix := RPAD(COALESCE(v_company_prefix, ''), 2, 'X');
            END IF;
        END IF;
    END IF;
    
    IF v_company_prefix IS NULL OR LENGTH(v_company_prefix) < 2 THEN
        v_company_prefix := 'OI';
    END IF;

    -- Extract first 2 chars of first and last name
    v_f2 := UPPER(SUBSTRING(REGEXP_REPLACE(COALESCE(p_first_name, 'EM'), '[^a-zA-Z]', '', 'g') FROM 1 FOR 2));
    v_f2 := RPAD(COALESCE(v_f2, ''), 2, 'X');

    v_l2 := UPPER(SUBSTRING(REGEXP_REPLACE(COALESCE(p_last_name, 'PL'), '[^a-zA-Z]', '', 'g') FROM 1 FOR 2));
    v_l2 := RPAD(COALESCE(v_l2, ''), 2, 'X');

    -- Joining Year
    IF p_joining_year IS NOT NULL AND p_joining_year >= 2000 AND p_joining_year <= 2100 THEN
        v_year := p_joining_year::TEXT;
    ELSE
        v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    END IF;

    v_prefix_key := v_company_prefix || v_f2 || v_l2 || v_year;

    -- Concurrency-safe atomic counter increment
    INSERT INTO public.login_id_sequences (prefix, current_val)
    VALUES (v_prefix_key, 1)
    ON CONFLICT (prefix)
    DO UPDATE SET current_val = public.login_id_sequences.current_val + 1
    RETURNING current_val INTO v_serial;

    RETURN v_prefix_key || LPAD(v_serial::TEXT, 4, '0');
END;
$$;


-- ============================================================================
-- 4. Salary Structure Auto-computation Trigger
-- Strictly enforces the Section 9 PRD mathematical formulas:
-- Basic: 50% of W, HRA: 50% of Basic, Standard: 16.67% of Basic (or 4167),
-- Bonus: 8.33% of Basic, LTA: 8.33% of Basic, Fixed: remainder balancing W
-- ============================================================================

CREATE OR REPLACE FUNCTION public.compute_salary_structure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.monthly_wage IS NOT NULL THEN
        NEW.yearly_wage := ROUND(NEW.monthly_wage * 12.0, 2);
        NEW.basic_salary := ROUND(NEW.monthly_wage * 0.50, 2);
        NEW.hra := ROUND(NEW.basic_salary * 0.50, 2);
        NEW.standard_allowance := ROUND(NEW.basic_salary * 0.16668, 2);
        NEW.performance_bonus := ROUND(NEW.basic_salary * 0.0833, 2);
        NEW.leave_travel_allowance := ROUND(NEW.basic_salary * 0.0833, 2);
        
        -- Balancing component
        NEW.fixed_allowance := ROUND(NEW.monthly_wage - (
            NEW.basic_salary + NEW.hra + NEW.standard_allowance + NEW.performance_bonus + NEW.leave_travel_allowance
        ), 2);
        
        IF NEW.pf_employee_rate IS NULL THEN
            NEW.pf_employee_rate := 12.00;
        END IF;
        IF NEW.pf_employer_rate IS NULL THEN
            NEW.pf_employer_rate := 12.00;
        END IF;
        IF NEW.professional_tax IS NULL THEN
            NEW.professional_tax := 200.00;
        END IF;
        IF NEW.working_days_per_week IS NULL THEN
            NEW.working_days_per_week := 5;
        END IF;
        IF NEW.working_hours_per_day IS NULL THEN
            NEW.working_hours_per_day := 8.00;
        END IF;
        IF NEW.break_hours IS NULL THEN
            NEW.break_hours := 1.00;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salary_structures_compute ON public.salary_structures;
CREATE TRIGGER trg_salary_structures_compute
    BEFORE INSERT OR UPDATE OF monthly_wage ON public.salary_structures
    FOR EACH ROW EXECUTE FUNCTION public.compute_salary_structure();


-- ============================================================================
-- 5. Attendance Hours and Status Computation Trigger
-- Calculates work_hours, extra_hours, and sets status (present vs half_day)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.compute_attendance_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_raw_hours NUMERIC;
    v_break NUMERIC := 1.00;
BEGIN
    IF NEW.check_in IS NOT NULL AND NEW.check_out IS NOT NULL THEN
        -- Elapsed hours
        v_raw_hours := EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600.0;
        
        -- Deduct break time if shift exceeds 5 hours
        IF v_raw_hours >= 5.0 THEN
            NEW.work_hours := ROUND(GREATEST(0, v_raw_hours - v_break)::NUMERIC, 2);
        ELSE
            NEW.work_hours := ROUND(GREATEST(0, v_raw_hours)::NUMERIC, 2);
        END IF;
        
        -- Extra / Overtime hours beyond 8 hours
        IF NEW.work_hours > 8.00 THEN
            NEW.extra_hours := ROUND((NEW.work_hours - 8.00)::NUMERIC, 2);
        ELSE
            NEW.extra_hours := 0.00;
        END IF;
        
        -- Status determination (present if >= 4.5 hrs, half_day if < 4.5 hrs)
        IF NEW.work_hours >= 4.50 THEN
            NEW.status := 'present';
        ELSIF NEW.work_hours > 0.00 THEN
            NEW.status := 'half_day';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_attendance_records_compute ON public.attendance_records;
CREATE TRIGGER trg_attendance_records_compute
    BEFORE INSERT OR UPDATE OF check_in, check_out ON public.attendance_records
    FOR EACH ROW EXECUTE FUNCTION public.compute_attendance_metrics();


-- ============================================================================
-- 6. Leave Approval -> Attendance Calendar Synchronization Trigger
-- When a leave request is approved, marks attendance records as 'on_leave'
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_approved_leave_to_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_curr_date DATE;
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
        v_curr_date := NEW.start_date;
        WHILE v_curr_date <= NEW.end_date LOOP
            INSERT INTO public.attendance_records (
                user_id,
                company_id,
                date,
                work_hours,
                extra_hours,
                status
            )
            VALUES (
                NEW.user_id,
                NEW.company_id,
                v_curr_date,
                0.00,
                0.00,
                'on_leave'
            )
            ON CONFLICT (user_id, date)
            DO UPDATE SET
                status = 'on_leave',
                updated_at = NOW();
                
            v_curr_date := v_curr_date + 1;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leave_requests_on_approval ON public.leave_requests;
CREATE TRIGGER trg_leave_requests_on_approval
    AFTER UPDATE OF status ON public.leave_requests
    FOR EACH ROW EXECUTE FUNCTION public.sync_approved_leave_to_attendance();


-- ============================================================================
-- 7. Backend-Enforced Payroll & Payslip Calculation Engine
-- Authoritative calculation rules: docs/DATABASE.md Section 3 & docs/PROJECT_CONTEXT.md Section 10
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_monthly_payslips(
    p_company_id UUID,
    p_payroll_period TEXT
)
RETURNS TABLE (
    payslip_id UUID,
    user_id UUID,
    payable_days NUMERIC,
    gross_salary NUMERIC,
    lop_deduction NUMERIC,
    pf_deduction NUMERIC,
    pt_deduction NUMERIC,
    total_deductions NUMERIC,
    net_salary NUMERIC,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_year INT;
    v_month INT;
    v_start_date DATE;
    v_end_date DATE;
    v_total_working_days INT;
    v_emp RECORD;
    v_salary RECORD;
    v_days_present NUMERIC;
    v_paid_leaves INT;
    v_unpaid_leaves INT;
    v_absent_days NUMERIC;
    v_payable_days NUMERIC;
    v_daily_wage NUMERIC;
    v_lop NUMERIC;
    v_pf NUMERIC;
    v_pt NUMERIC;
    v_total_ded NUMERIC;
    v_net NUMERIC;
    v_new_id UUID;
BEGIN
    -- Validate period format YYYY-MM
    IF p_payroll_period !~ '^\d{4}-\d{2}$' THEN
        RAISE EXCEPTION 'Invalid payroll period format. Expected YYYY-MM (e.g. 2026-10)';
    END IF;

    v_year := SPLIT_PART(p_payroll_period, '-', 1)::INT;
    v_month := SPLIT_PART(p_payroll_period, '-', 2)::INT;
    v_start_date := MAKE_DATE(v_year, v_month, 1);
    v_end_date := (v_start_date + INTERVAL '1 month - 1 day')::DATE;

    -- Calculate total Monday-Friday working days in the month
    SELECT COUNT(*)::INT INTO v_total_working_days
    FROM GENERATE_SERIES(v_start_date, v_end_date, INTERVAL '1 day') AS s(day)
    WHERE EXTRACT(DOW FROM s.day) BETWEEN 1 AND 5;

    IF v_total_working_days = 0 THEN
        v_total_working_days := 22; -- Fallback standard
    END IF;

    -- Loop through all active employee profiles in the specified company
    FOR v_emp IN
        SELECT p.id AS emp_id, p.first_name, p.last_name
        FROM public.profiles p
        WHERE p.company_id = p_company_id
    LOOP
        -- Fetch employee salary structure
        SELECT * INTO v_salary
        FROM public.salary_structures ss
        WHERE ss.user_id = v_emp.emp_id;

        -- If no salary structure is defined, skip this profile
        IF v_salary IS NULL THEN
            CONTINUE;
        END IF;

        -- 1. Present Days (1.0 for present, 0.5 for half_day)
        SELECT
            COALESCE(SUM(
                CASE
                    WHEN ar.status = 'present' THEN 1.0
                    WHEN ar.status = 'half_day' THEN 0.5
                    ELSE 0.0
                END
            ), 0.0)
        INTO v_days_present
        FROM public.attendance_records ar
        WHERE ar.user_id = v_emp.emp_id
          AND ar.date BETWEEN v_start_date AND v_end_date;

        -- 2. Approved Paid Leaves (paid + sick)
        SELECT COALESCE(SUM(lr.total_days), 0)::INT
        INTO v_paid_leaves
        FROM public.leave_requests lr
        WHERE lr.user_id = v_emp.emp_id
          AND lr.status = 'approved'
          AND lr.leave_type IN ('paid', 'sick')
          AND lr.start_date <= v_end_date
          AND lr.end_date >= v_start_date;

        -- 3. Approved Unpaid Leaves
        SELECT COALESCE(SUM(lr.total_days), 0)::INT
        INTO v_unpaid_leaves
        FROM public.leave_requests lr
        WHERE lr.user_id = v_emp.emp_id
          AND lr.status = 'approved'
          AND lr.leave_type = 'unpaid'
          AND lr.start_date <= v_end_date
          AND lr.end_date >= v_start_date;

        -- 4. Unexcused Absences
        v_absent_days := GREATEST(0.0, v_total_working_days - (v_days_present + v_paid_leaves + v_unpaid_leaves));

        -- 5. Payable Days Formula: Total Working Days - (Unpaid Leaves + Absent Days)
        v_payable_days := GREATEST(0.0, v_total_working_days - (v_unpaid_leaves + v_absent_days));

        -- 6. Loss of Pay (LOP) Deduction
        v_daily_wage := v_salary.monthly_wage / v_total_working_days;
        v_lop := ROUND(((v_unpaid_leaves + v_absent_days) * v_daily_wage)::NUMERIC, 2);
        
        -- Cap LOP at monthly wage
        IF v_lop > v_salary.monthly_wage THEN
            v_lop := v_salary.monthly_wage;
        END IF;

        -- 7. Statutory Deductions
        v_pf := ROUND((v_salary.basic_salary * (v_salary.pf_employee_rate / 100.0))::NUMERIC, 2);
        v_pt := COALESCE(v_salary.professional_tax, 200.00);
        v_total_ded := ROUND((v_lop + v_pf + v_pt)::NUMERIC, 2);
        v_net := ROUND((v_salary.monthly_wage - v_total_ded)::NUMERIC, 2);

        -- Upsert payslip record
        INSERT INTO public.payslips (
            user_id,
            company_id,
            payroll_period,
            total_working_days,
            days_present,
            paid_leaves,
            unpaid_leaves,
            absent_days,
            payable_days,
            gross_salary,
            lop_deduction,
            pf_deduction,
            pt_deduction,
            total_deductions,
            net_salary,
            status,
            generated_at
        )
        VALUES (
            v_emp.emp_id,
            p_company_id,
            p_payroll_period,
            v_total_working_days,
            FLOOR(v_days_present)::INT,
            v_paid_leaves,
            v_unpaid_leaves,
            FLOOR(v_absent_days)::INT,
            v_payable_days,
            v_salary.monthly_wage,
            v_lop,
            v_pf,
            v_pt,
            v_total_ded,
            v_net,
            'draft',
            NOW()
        )
        ON CONFLICT (user_id, payroll_period)
        DO UPDATE SET
            total_working_days = EXCLUDED.total_working_days,
            days_present = EXCLUDED.days_present,
            paid_leaves = EXCLUDED.paid_leaves,
            unpaid_leaves = EXCLUDED.unpaid_leaves,
            absent_days = EXCLUDED.absent_days,
            payable_days = EXCLUDED.payable_days,
            gross_salary = EXCLUDED.gross_salary,
            lop_deduction = EXCLUDED.lop_deduction,
            pf_deduction = EXCLUDED.pf_deduction,
            pt_deduction = EXCLUDED.pt_deduction,
            total_deductions = EXCLUDED.total_deductions,
            net_salary = EXCLUDED.net_salary,
            generated_at = NOW()
        RETURNING id INTO v_new_id;

        -- Return output row
        payslip_id := v_new_id;
        user_id := v_emp.emp_id;
        payable_days := v_payable_days;
        gross_salary := v_salary.monthly_wage;
        lop_deduction := v_lop;
        pf_deduction := v_pf;
        pt_deduction := v_pt;
        total_deductions := v_total_ded;
        net_salary := v_net;
        status := 'draft';
        RETURN NEXT;
    END LOOP;
END;
$$;


-- ============================================================================
-- 8. Auto-Provision Profile on Auth User Creation (Trigger on auth.users)
-- Handles Admin Signup & Employee Creation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_company_id UUID;
    v_company_name TEXT;
    v_role TEXT := 'employee';
    v_first_name TEXT;
    v_last_name TEXT;
    v_phone TEXT;
    v_login_id TEXT;
    v_joining_year INT;
BEGIN
    -- Extract metadata supplied during signup / admin creation
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'Employee');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', 'User');
    v_phone := NEW.raw_user_meta_data->>'phone';
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'employee');
    v_company_name := NEW.raw_user_meta_data->>'company_name';
    
    IF NEW.raw_user_meta_data->>'company_id' IS NOT NULL THEN
        v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;
    END IF;

    -- If company_id is null but company_name is provided, this is an Admin registering a new Company
    IF v_company_id IS NULL AND v_company_name IS NOT NULL THEN
        INSERT INTO public.companies (name, email, phone)
        VALUES (v_company_name, NEW.email, v_phone)
        RETURNING id INTO v_company_id;
        
        v_role := 'admin';
    END IF;

    -- If still null (e.g. basic fallback), assign to default/first company or create fallback
    IF v_company_id IS NULL THEN
        SELECT id INTO v_company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;
        IF v_company_id IS NULL THEN
            INSERT INTO public.companies (name, email, phone)
            VALUES ('Dayflow Organization', NEW.email, v_phone)
            RETURNING id INTO v_company_id;
        END IF;
    END IF;

    v_joining_year := EXTRACT(YEAR FROM CURRENT_DATE)::INT;

    -- Generate unique Login ID
    v_login_id := public.generate_login_id(v_company_id, v_first_name, v_last_name, v_joining_year);

    -- Insert profile
    INSERT INTO public.profiles (
        id,
        company_id,
        role,
        login_id,
        first_name,
        last_name,
        email,
        phone,
        date_of_joining
    )
    VALUES (
        NEW.id,
        v_company_id,
        v_role,
        v_login_id,
        v_first_name,
        v_last_name,
        NEW.email,
        v_phone,
        CURRENT_DATE
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
