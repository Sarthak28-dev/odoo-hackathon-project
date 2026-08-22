/**
 * Dayflow HRMS — Canonical Data Contracts & TypeScript Types
 * Strictly aligned with docs/DATABASE.md and docs/OWNERSHIP.md
 */

export type UserRole = 'admin' | 'employee';

export type AttendanceStatus = 'present' | 'half_day' | 'absent' | 'on_leave';

export type LeaveType = 'paid' | 'sick' | 'unpaid';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type PayslipStatus = 'draft' | 'finalized' | 'paid';

export type PresenceIndicator = 'present' | 'on_leave' | 'absent';

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  email: string;
  phone: string | null;
  created_at: string;
}

export interface Profile {
  id: string; // references auth.users(id)
  company_id: string;
  role: UserRole;
  login_id: string; // e.g. OIJODO20220001
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  job_position: string | null;
  department: string | null;
  manager_name: string | null;
  location: string | null;
  avatar_url: string | null;
  
  // Resume Tab
  about: string | null;
  job_love: string | null;
  hobbies: string | null;
  skills: string[];
  certifications: string[];
  
  // Private Info Tab
  date_of_birth: string | null;
  residential_address: string | null;
  nationality: string | null;
  personal_email: string | null;
  gender: string | null;
  marital_status: string | null;
  date_of_joining: string;
  
  // Bank & Identification Details (Sensitive)
  bank_account_no: string | null;
  bank_name: string | null;
  ifsc_code: string | null;
  pan_no: string | null;
  uan_no: string | null;
  emp_code: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  company_id: string;
  date: string; // YYYY-MM-DD
  check_in: string | null; // ISO timestamp
  check_out: string | null; // ISO timestamp
  work_hours: number; // e.g. 8.5
  extra_hours: number; // e.g. 1.0
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
  
  // Joined presentation data
  profile?: Pick<Profile, 'first_name' | 'last_name' | 'emp_code' | 'avatar_url'>;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  company_id: string;
  leave_type: LeaveType;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  total_days: number;
  remarks: string | null;
  status: LeaveStatus;
  hr_comments: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined presentation data
  profile?: Pick<Profile, 'first_name' | 'last_name' | 'emp_code' | 'avatar_url' | 'department'>;
}

export interface SalaryStructure {
  id: string;
  user_id: string;
  company_id: string;
  monthly_wage: number; // W
  yearly_wage: number; // W * 12
  working_days_per_week: number;
  working_hours_per_day: number;
  break_hours: number;
  basic_salary: number; // 50% of W
  hra: number; // 50% of Basic
  standard_allowance: number; // 16.67% of Basic (or 4167)
  performance_bonus: number; // 8.33% of Basic
  leave_travel_allowance: number; // 8.33% of Basic
  fixed_allowance: number; // Balancing component
  pf_employee_rate: number; // 12%
  pf_employer_rate: number; // 12%
  professional_tax: number; // Fixed 200
  created_at: string;
  updated_at: string;
}

export interface Payslip {
  id: string;
  user_id: string;
  company_id: string;
  payroll_period: string; // YYYY-MM
  total_working_days: number;
  days_present: number;
  paid_leaves: number;
  unpaid_leaves: number;
  absent_days: number;
  payable_days: number;
  gross_salary: number;
  lop_deduction: number;
  pf_deduction: number;
  pt_deduction: number;
  total_deductions: number;
  net_salary: number;
  status: PayslipStatus;
  generated_at: string;
  
  // Joined presentation data
  profile?: Pick<Profile, 'first_name' | 'last_name' | 'emp_code' | 'login_id' | 'job_position' | 'department' | 'bank_account_no' | 'pan_no'>;
}
