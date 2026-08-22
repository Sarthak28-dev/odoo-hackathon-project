-- ============================================================================
-- Dayflow HRMS — Migration 00001: Initial Relational Database Schema
-- Authoritative Specification: docs/DATABASE.md
-- ============================================================================

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. Table: companies (Multi-tenant Organization root)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. Table: profiles (Master Employee record linked 1:1 with auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    login_id TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    job_position TEXT,
    department TEXT,
    manager_name TEXT,
    location TEXT,
    avatar_url TEXT,
    
    -- Resume Tab
    about TEXT,
    job_love TEXT,
    hobbies TEXT,
    skills TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    
    -- Private Info Tab (Sensitive personal details)
    date_of_birth DATE,
    residential_address TEXT,
    nationality TEXT,
    personal_email TEXT,
    gender TEXT,
    marital_status TEXT,
    date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Bank & Identification Details (Sensitive)
    bank_account_no TEXT,
    bank_name TEXT,
    ifsc_code TEXT,
    pan_no TEXT,
    uan_no TEXT,
    emp_code TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. Table: attendance_records (Daily Check-in/out and Working Hours)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    work_hours NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (work_hours >= 0),
    extra_hours NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (extra_hours >= 0),
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'half_day', 'absent', 'on_leave')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_user_date UNIQUE (user_id, date)
);

-- ============================================================================
-- 4. Table: leave_requests (Time-off & HR Approval Lifecycle)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('paid', 'sick', 'unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL CHECK (total_days > 0),
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    hr_comments TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_leave_date_order CHECK (end_date >= start_date)
);

-- ============================================================================
-- 5. Table: salary_structures (Employee Wage Components & Statutory Rates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    monthly_wage NUMERIC(12,2) NOT NULL CHECK (monthly_wage >= 0),
    yearly_wage NUMERIC(12,2) NOT NULL CHECK (yearly_wage >= 0),
    working_days_per_week INTEGER NOT NULL DEFAULT 5 CHECK (working_days_per_week BETWEEN 1 AND 7),
    working_hours_per_day NUMERIC(4,2) NOT NULL DEFAULT 8.00 CHECK (working_hours_per_day >= 0),
    break_hours NUMERIC(4,2) NOT NULL DEFAULT 1.00 CHECK (break_hours >= 0),
    basic_salary NUMERIC(12,2) NOT NULL CHECK (basic_salary >= 0),
    hra NUMERIC(12,2) NOT NULL CHECK (hra >= 0),
    standard_allowance NUMERIC(12,2) NOT NULL CHECK (standard_allowance >= 0),
    performance_bonus NUMERIC(12,2) NOT NULL CHECK (performance_bonus >= 0),
    leave_travel_allowance NUMERIC(12,2) NOT NULL CHECK (leave_travel_allowance >= 0),
    fixed_allowance NUMERIC(12,2) NOT NULL CHECK (fixed_allowance >= 0),
    pf_employee_rate NUMERIC(5,2) NOT NULL DEFAULT 12.00 CHECK (pf_employee_rate >= 0),
    pf_employer_rate NUMERIC(5,2) NOT NULL DEFAULT 12.00 CHECK (pf_employer_rate >= 0),
    professional_tax NUMERIC(10,2) NOT NULL DEFAULT 200.00 CHECK (professional_tax >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. Table: payslips (Monthly Payroll Records & Attendance LOP Deductions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    payroll_period TEXT NOT NULL CHECK (payroll_period ~ '^\d{4}-\d{2}$'),
    total_working_days INTEGER NOT NULL CHECK (total_working_days >= 0),
    days_present INTEGER NOT NULL DEFAULT 0 CHECK (days_present >= 0),
    paid_leaves INTEGER NOT NULL DEFAULT 0 CHECK (paid_leaves >= 0),
    unpaid_leaves INTEGER NOT NULL DEFAULT 0 CHECK (unpaid_leaves >= 0),
    absent_days INTEGER NOT NULL DEFAULT 0 CHECK (absent_days >= 0),
    payable_days NUMERIC(4,2) NOT NULL CHECK (payable_days >= 0),
    gross_salary NUMERIC(12,2) NOT NULL CHECK (gross_salary >= 0),
    lop_deduction NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (lop_deduction >= 0),
    pf_deduction NUMERIC(12,2) NOT NULL CHECK (pf_deduction >= 0),
    pt_deduction NUMERIC(12,2) NOT NULL DEFAULT 200.00 CHECK (pt_deduction >= 0),
    total_deductions NUMERIC(12,2) NOT NULL CHECK (total_deductions >= 0),
    net_salary NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'paid')),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payslips_user_period UNIQUE (user_id, payroll_period)
);

-- ============================================================================
-- 7. Table: login_id_sequences (Concurrency-Safe Login ID Generator Counter)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.login_id_sequences (
    prefix TEXT PRIMARY KEY,
    current_val INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- 8. Performance Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_login_id ON public.profiles(login_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);

CREATE INDEX IF NOT EXISTS idx_attendance_records_user_date ON public.attendance_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_company_date ON public.attendance_records(company_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON public.attendance_records(status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON public.leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_company_status ON public.leave_requests(company_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON public.leave_requests(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_salary_structures_user_id ON public.salary_structures(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_structures_company_id ON public.salary_structures(company_id);

CREATE INDEX IF NOT EXISTS idx_payslips_user_period ON public.payslips(user_id, payroll_period);
CREATE INDEX IF NOT EXISTS idx_payslips_company_period ON public.payslips(company_id, payroll_period);
CREATE INDEX IF NOT EXISTS idx_payslips_status ON public.payslips(status);
