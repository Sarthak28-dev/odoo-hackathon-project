-- ============================================================================
-- Dayflow HRMS — Deterministic Seed Data
-- Aligned with docs/DATABASE.md & docs/PROJECT_CONTEXT.md
-- ============================================================================

-- 1. Insert Companies
INSERT INTO public.companies (id, name, logo_url, email, phone, created_at)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'Odoo India', 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150', 'contact@odoo-india.com', '+91 98765 43210', NOW()),
    ('b0000000-0000-0000-0000-000000000001', 'Acme Corporation', 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150', 'contact@acme.com', '+91 91234 56789', NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;

-- 2. Insert Auth Users (Supabase auth.users)
-- Standard hashed password for test users is: 'Password@123'
-- Encrypted with standard blowfish/bcrypt
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
)
VALUES 
    -- Admin: Odoo India
    (
        'a1111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin@dayflow.com',
        crypt('Password@123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "Admin", "last_name": "Officer", "role": "admin", "company_id": "a0000000-0000-0000-0000-000000000001"}',
        NOW(),
        NOW()
    ),
    -- Employee 1: John Doe (Engineering)
    (
        'a2222222-2222-2222-2222-222222222222',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'john.doe@dayflow.com',
        crypt('Password@123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "John", "last_name": "Doe", "role": "employee", "company_id": "a0000000-0000-0000-0000-000000000001"}',
        NOW(),
        NOW()
    ),
    -- Employee 2: Jane Smith (Human Resources)
    (
        'a3333333-3333-3333-3333-333333333333',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'jane.smith@dayflow.com',
        crypt('Password@123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "Jane", "last_name": "Smith", "role": "employee", "company_id": "a0000000-0000-0000-0000-000000000001"}',
        NOW(),
        NOW()
    ),
    -- Employee 3: Alex Jones (Design)
    (
        'a4444444-4444-4444-4444-444444444444',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'alex.jones@dayflow.com',
        crypt('Password@123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "Alex", "last_name": "Jones", "role": "employee", "company_id": "a0000000-0000-0000-0000-000000000001"}',
        NOW(),
        NOW()
    ),
    -- Acme Employee: Multi-tenant isolation testing
    (
        'b1111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'acme.user@acme.com',
        crypt('Password@123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "Acme", "last_name": "Employee", "role": "employee", "company_id": "b0000000-0000-0000-0000-000000000001"}',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Profiles
INSERT INTO public.profiles (
    id,
    company_id,
    role,
    login_id,
    first_name,
    last_name,
    email,
    phone,
    job_position,
    department,
    manager_name,
    location,
    avatar_url,
    about,
    job_love,
    hobbies,
    skills,
    certifications,
    date_of_birth,
    residential_address,
    nationality,
    personal_email,
    gender,
    marital_status,
    date_of_joining,
    bank_account_no,
    bank_name,
    ifsc_code,
    pan_no,
    uan_no,
    emp_code
)
VALUES 
    (
        'a1111111-1111-1111-1111-111111111111',
        'a0000000-0000-0000-0000-000000000001',
        'admin',
        'OIADMI20220001',
        'Admin',
        'Officer',
        'admin@dayflow.com',
        '+91 98765 00001',
        'HR Director',
        'Human Resources',
        NULL,
        'Gandhinagar HQ',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        'Head of People Operations at Dayflow.',
        'Empowering teams and building scalable organizational cultures.',
        'Reading, Chess, Cycling',
        ARRAY['HR Strategy', 'Talent Acquisition', 'Payroll Operations'],
        ARRAY['SHRM-CP', 'Global HR Certification'],
        '1988-03-12',
        'Plot 45, Sector 10, Gandhinagar, Gujarat',
        'Indian',
        'admin.personal@gmail.com',
        'Female',
        'Married',
        '2022-01-01',
        '987654321001',
        'HDFC Bank',
        'HDFC0001234',
        'ABCDE1234F',
        '100987654321',
        'EMP001'
    ),
    (
        'a2222222-2222-2222-2222-222222222222',
        'a0000000-0000-0000-0000-000000000001',
        'employee',
        'OIJODO20220001',
        'John',
        'Doe',
        'john.doe@dayflow.com',
        '+91 98765 00002',
        'Senior Software Engineer',
        'Engineering',
        'Admin Officer',
        'Gandhinagar HQ',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        'Full-stack engineer passionate about scalable backend architecture and React.',
        'Solving challenging database concurrency and real-time distributed state problems.',
        'Gaming, Open Source, Hiking',
        ARRAY['TypeScript', 'React', 'PostgreSQL', 'Node.js', 'Supabase'],
        ARRAY['AWS Certified Solutions Architect', 'PostgreSQL Professional'],
        '1995-07-24',
        'Flat 402, Skyline Residency, Ahmedabad, Gujarat',
        'Indian',
        'john.doe.personal@gmail.com',
        'Male',
        'Single',
        '2022-04-01',
        '123456789012',
        'State Bank of India',
        'SBIN0005678',
        'FGHIJ5678K',
        '100123456789',
        'EMP002'
    ),
    (
        'a3333333-3333-3333-3333-333333333333',
        'a0000000-0000-0000-0000-000000000001',
        'employee',
        'OIJASM20230002',
        'Jane',
        'Smith',
        'jane.smith@dayflow.com',
        '+91 98765 00003',
        'HR Operations Specialist',
        'Human Resources',
        'Admin Officer',
        'Gandhinagar HQ',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        'Specializing in employee onboarding, policy development, and workplace satisfaction.',
        'Connecting people with career growth opportunities.',
        'Photography, Yoga, Traveling',
        ARRAY['Employee Relations', 'Recruiting', 'Conflict Resolution'],
        ARRAY['PHR Certification'],
        '1996-11-05',
        'B-12, Greenwoods Society, Gandhinagar, Gujarat',
        'Indian',
        'jane.smith.personal@gmail.com',
        'Female',
        'Single',
        '2023-01-15',
        '234567890123',
        'ICICI Bank',
        'ICIC0009876',
        'KLMNO9012P',
        '100234567890',
        'EMP003'
    ),
    (
        'a4444444-4444-4444-4444-444444444444',
        'a0000000-0000-0000-0000-000000000001',
        'employee',
        'OIALJO20240003',
        'Alex',
        'Jones',
        'alex.jones@dayflow.com',
        '+91 98765 00004',
        'Lead Product Designer',
        'Design',
        'Admin Officer',
        'Remote',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        'UI/UX designer crafting high-impact enterprise applications and design systems.',
        'Translating complex enterprise workflows into intuitive, joyful user experiences.',
        'Digital Art, Espresso, Typography',
        ARRAY['Figma', 'Design Systems', 'User Research', 'Prototyping'],
        ARRAY['Nielsen Norman UX Master Certified'],
        '1994-02-18',
        '101 Palm Grove, Pune, Maharashtra',
        'Indian',
        'alex.jones.personal@gmail.com',
        'Non-binary',
        'Single',
        '2024-06-01',
        '345678901234',
        'Axis Bank',
        'UTIB0001122',
        'PQRST3456U',
        '100345678901',
        'EMP004'
    ),
    -- Acme Corp Employee (Multi-tenant check)
    (
        'b1111111-1111-1111-1111-111111111111',
        'b0000000-0000-0000-0000-000000000001',
        'employee',
        'ACACEM20240001',
        'Acme',
        'Employee',
        'acme.user@acme.com',
        '+91 91234 00001',
        'Operations Analyst',
        'Operations',
        NULL,
        'Mumbai',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        'Operations lead at Acme Corporation.',
        'Data analysis and supply chain logistics.',
        'Running, Music',
        ARRAY['Logistics', 'Supply Chain', 'Excel'],
        ARRAY['Six Sigma Green Belt'],
        '1993-09-09',
        'Marine Drive, Mumbai, Maharashtra',
        'Indian',
        'acme.emp@gmail.com',
        'Male',
        'Married',
        '2024-01-01',
        '456789012345',
        'Kotak Mahindra Bank',
        'KKBK0004321',
        'UVWXY7890Z',
        '100456789012',
        'ACM001'
    )
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    job_position = EXCLUDED.job_position,
    department = EXCLUDED.department;


-- 4. Insert Salary Structures
-- Triggers automatically compute basic_salary, hra, standard_allowance, bonus, lta, fixed_allowance, yearly_wage!
INSERT INTO public.salary_structures (
    user_id,
    company_id,
    monthly_wage,
    yearly_wage,
    working_days_per_week,
    working_hours_per_day,
    break_hours,
    basic_salary,
    hra,
    standard_allowance,
    performance_bonus,
    leave_travel_allowance,
    fixed_allowance,
    pf_employee_rate,
    pf_employer_rate,
    professional_tax
)
VALUES 
    -- Admin Salary: 80,000 / month
    (
        'a1111111-1111-1111-1111-111111111111',
        'a0000000-0000-0000-0000-000000000001',
        80000.00,
        960000.00,
        5, 8.00, 1.00,
        40000.00, 20000.00, 6667.20, 3332.00, 3332.00, 6668.80,
        12.00, 12.00, 200.00
    ),
    -- John Doe Salary: 50,000 / month (matching PRD Section 9 exact example)
    (
        'a2222222-2222-2222-2222-222222222222',
        'a0000000-0000-0000-0000-000000000001',
        50000.00,
        600000.00,
        5, 8.00, 1.00,
        25000.00, 12500.00, 4167.00, 2082.50, 2082.50, 4168.00,
        12.00, 12.00, 200.00
    ),
    -- Jane Smith Salary: 45,000 / month
    (
        'a3333333-3333-3333-3333-333333333333',
        'a0000000-0000-0000-0000-000000000001',
        45000.00,
        540000.00,
        5, 8.00, 1.00,
        22500.00, 11250.00, 3750.30, 1874.25, 1874.25, 3751.20,
        12.00, 12.00, 200.00
    ),
    -- Alex Jones Salary: 60,000 / month
    (
        'a4444444-4444-4444-4444-444444444444',
        'a0000000-0000-0000-0000-000000000001',
        60000.00,
        720000.00,
        5, 8.00, 1.00,
        30000.00, 15000.00, 5000.40, 2499.00, 2499.00, 5001.60,
        12.00, 12.00, 200.00
    ),
    -- Acme Employee: 55,000 / month
    (
        'b1111111-1111-1111-1111-111111111111',
        'b0000000-0000-0000-0000-000000000001',
        55000.00,
        660000.00,
        5, 8.00, 1.00,
        27500.00, 13750.00, 4583.70, 2290.75, 2290.75, 4584.80,
        12.00, 12.00, 200.00
    )
ON CONFLICT (user_id) DO UPDATE SET
    monthly_wage = EXCLUDED.monthly_wage;


-- 5. Insert Sample Attendance Records
INSERT INTO public.attendance_records (
    user_id,
    company_id,
    date,
    check_in,
    check_out,
    work_hours,
    extra_hours,
    status
)
VALUES 
    -- John Doe: Recent attendance history
    ('a2222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '4 days', (CURRENT_DATE - INTERVAL '4 days' + TIME '09:00:00')::TIMESTAMPTZ, (CURRENT_DATE - INTERVAL '4 days' + TIME '18:00:00')::TIMESTAMPTZ, 8.00, 0.00, 'present'),
    ('a2222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '3 days', (CURRENT_DATE - INTERVAL '3 days' + TIME '09:15:00')::TIMESTAMPTZ, (CURRENT_DATE - INTERVAL '3 days' + TIME '19:15:00')::TIMESTAMPTZ, 9.00, 1.00, 'present'),
    ('a2222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', (CURRENT_DATE - INTERVAL '2 days' + TIME '09:00:00')::TIMESTAMPTZ, (CURRENT_DATE - INTERVAL '2 days' + TIME '13:30:00')::TIMESTAMPTZ, 4.50, 0.00, 'half_day'),
    ('a2222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 days', (CURRENT_DATE - INTERVAL '1 days' + TIME '09:00:00')::TIMESTAMPTZ, (CURRENT_DATE - INTERVAL '1 days' + TIME '18:00:00')::TIMESTAMPTZ, 8.00, 0.00, 'present'),
    ('a2222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE, (CURRENT_DATE + TIME '09:05:00')::TIMESTAMPTZ, NULL, 0.00, 0.00, 'present'),

    -- Jane Smith
    ('a3333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', (CURRENT_DATE - INTERVAL '2 days' + TIME '09:30:00')::TIMESTAMPTZ, (CURRENT_DATE - INTERVAL '2 days' + TIME '18:30:00')::TIMESTAMPTZ, 8.00, 0.00, 'present'),
    ('a3333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 days', (CURRENT_DATE - INTERVAL '1 days' + TIME '09:00:00')::TIMESTAMPTZ, (CURRENT_DATE - INTERVAL '1 days' + TIME '17:30:00')::TIMESTAMPTZ, 7.50, 0.00, 'present'),
    ('a3333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE, (CURRENT_DATE + TIME '09:00:00')::TIMESTAMPTZ, NULL, 0.00, 0.00, 'present'),

    -- Alex Jones (On Approved Leave today)
    ('a4444444-4444-4444-4444-444444444444', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE, NULL, NULL, 0.00, 0.00, 'on_leave')
ON CONFLICT (user_id, date) DO NOTHING;


-- 6. Insert Sample Leave Requests
INSERT INTO public.leave_requests (
    id,
    user_id,
    company_id,
    leave_type,
    start_date,
    end_date,
    total_days,
    remarks,
    status,
    hr_comments,
    reviewed_by,
    reviewed_at
)
VALUES 
    -- John Doe: Approved Paid Leave
    (
        'c1111111-1111-1111-1111-111111111111',
        'a2222222-2222-2222-2222-222222222222',
        'a0000000-0000-0000-0000-000000000001',
        'paid',
        CURRENT_DATE - INTERVAL '10 days',
        CURRENT_DATE - INTERVAL '9 days',
        2,
        'Family function in home town.',
        'approved',
        'Approved. Have a great time!',
        'a1111111-1111-1111-1111-111111111111',
        NOW() - INTERVAL '11 days'
    ),
    -- Alex Jones: Approved Sick Leave
    (
        'c2222222-2222-2222-2222-222222222222',
        'a4444444-4444-4444-4444-444444444444',
        'a0000000-0000-0000-0000-000000000001',
        'sick',
        CURRENT_DATE,
        CURRENT_DATE,
        1,
        'Viral fever and doctor appointment.',
        'approved',
        'Approved. Get well soon!',
        'a1111111-1111-1111-1111-111111111111',
        NOW()
    ),
    -- Jane Smith: Pending Paid Leave
    (
        'c3333333-3333-3333-3333-333333333333',
        'a3333333-3333-3333-3333-333333333333',
        'a0000000-0000-0000-0000-000000000001',
        'paid',
        CURRENT_DATE + INTERVAL '5 days',
        CURRENT_DATE + INTERVAL '7 days',
        3,
        'Personal travel.',
        'pending',
        NULL,
        NULL,
        NULL
    )
ON CONFLICT (id) DO NOTHING;


-- 7. Insert Sample Payslips
INSERT INTO public.payslips (
    id,
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
VALUES 
    -- John Doe: 2026-07 (Full attendance)
    (
        'd1111111-1111-1111-1111-111111111111',
        'a2222222-2222-2222-2222-222222222222',
        'a0000000-0000-0000-0000-000000000001',
        '2026-07',
        22,
        22,
        0,
        0,
        0,
        22.00,
        50000.00,
        0.00,
        3000.00,
        200.00,
        3200.00,
        46800.00,
        'paid',
        NOW() - INTERVAL '20 days'
    ),
    -- Jane Smith: 2026-07 (Full attendance)
    (
        'd2222222-2222-2222-2222-222222222222',
        'a3333333-3333-3333-3333-333333333333',
        'a0000000-0000-0000-0000-000000000001',
        '2026-07',
        22,
        22,
        0,
        0,
        0,
        22.00,
        45000.00,
        0.00,
        2700.00,
        200.00,
        2900.00,
        42100.00,
        'paid',
        NOW() - INTERVAL '20 days'
    ),
    -- Alex Jones: 2026-07 (Full attendance)
    (
        'd3333333-3333-3333-3333-333333333333',
        'a4444444-4444-4444-4444-444444444444',
        'a0000000-0000-0000-0000-000000000001',
        '2026-07',
        22,
        22,
        0,
        0,
        0,
        22.00,
        60000.00,
        0.00,
        3600.00,
        200.00,
        3800.00,
        56200.00,
        'paid',
        NOW() - INTERVAL '20 days'
    )
ON CONFLICT (user_id, payroll_period) DO NOTHING;
