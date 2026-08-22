/**
 * Dayflow HRMS — Auto-Generated Supabase Database TypeScript Schema
 * Matches PostgreSQL Schema: supabase/migrations/*
 * Authoritative Contracts: docs/DATABASE.md & docs/OWNERSHIP.md
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'employee';
export type AttendanceStatus = 'present' | 'half_day' | 'absent' | 'on_leave';
export type LeaveType = 'paid' | 'sick' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type PayslipStatus = 'draft' | 'finalized' | 'paid';

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          email: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          email: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          email?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          company_id: string;
          role: UserRole;
          login_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          job_position: string | null;
          department: string | null;
          manager_name: string | null;
          location: string | null;
          avatar_url: string | null;
          about: string | null;
          job_love: string | null;
          hobbies: string | null;
          skills: string[];
          certifications: string[];
          date_of_birth: string | null;
          residential_address: string | null;
          nationality: string | null;
          personal_email: string | null;
          gender: string | null;
          marital_status: string | null;
          date_of_joining: string;
          bank_account_no: string | null;
          bank_name: string | null;
          ifsc_code: string | null;
          pan_no: string | null;
          uan_no: string | null;
          emp_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_id: string;
          role?: UserRole;
          login_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          job_position?: string | null;
          department?: string | null;
          manager_name?: string | null;
          location?: string | null;
          avatar_url?: string | null;
          about?: string | null;
          job_love?: string | null;
          hobbies?: string | null;
          skills?: string[];
          certifications?: string[];
          date_of_birth?: string | null;
          residential_address?: string | null;
          nationality?: string | null;
          personal_email?: string | null;
          gender?: string | null;
          marital_status?: string | null;
          date_of_joining?: string;
          bank_account_no?: string | null;
          bank_name?: string | null;
          ifsc_code?: string | null;
          pan_no?: string | null;
          uan_no?: string | null;
          emp_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          role?: UserRole;
          login_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          job_position?: string | null;
          department?: string | null;
          manager_name?: string | null;
          location?: string | null;
          avatar_url?: string | null;
          about?: string | null;
          job_love?: string | null;
          hobbies?: string | null;
          skills?: string[];
          certifications?: string[];
          date_of_birth?: string | null;
          residential_address?: string | null;
          nationality?: string | null;
          personal_email?: string | null;
          gender?: string | null;
          marital_status?: string | null;
          date_of_joining?: string;
          bank_account_no?: string | null;
          bank_name?: string | null;
          ifsc_code?: string | null;
          pan_no?: string | null;
          uan_no?: string | null;
          emp_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
      attendance_records: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          date: string;
          check_in: string | null;
          check_out: string | null;
          work_hours: number;
          extra_hours: number;
          status: AttendanceStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          work_hours?: number;
          extra_hours?: number;
          status?: AttendanceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          work_hours?: number;
          extra_hours?: number;
          status?: AttendanceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'attendance_records_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attendance_records_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      leave_requests: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          leave_type: LeaveType;
          start_date: string;
          end_date: string;
          total_days: number;
          remarks: string | null;
          status: LeaveStatus;
          hr_comments: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          leave_type: LeaveType;
          start_date: string;
          end_date: string;
          total_days: number;
          remarks?: string | null;
          status?: LeaveStatus;
          hr_comments?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          leave_type?: LeaveType;
          start_date?: string;
          end_date?: string;
          total_days?: number;
          remarks?: string | null;
          status?: LeaveStatus;
          hr_comments?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'leave_requests_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'leave_requests_reviewed_by_fkey';
            columns: ['reviewed_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'leave_requests_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      salary_structures: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          monthly_wage: number;
          yearly_wage: number;
          working_days_per_week: number;
          working_hours_per_day: number;
          break_hours: number;
          basic_salary: number;
          hra: number;
          standard_allowance: number;
          performance_bonus: number;
          leave_travel_allowance: number;
          fixed_allowance: number;
          pf_employee_rate: number;
          pf_employer_rate: number;
          professional_tax: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          monthly_wage: number;
          yearly_wage?: number;
          working_days_per_week?: number;
          working_hours_per_day?: number;
          break_hours?: number;
          basic_salary?: number;
          hra?: number;
          standard_allowance?: number;
          performance_bonus?: number;
          leave_travel_allowance?: number;
          fixed_allowance?: number;
          pf_employee_rate?: number;
          pf_employer_rate?: number;
          professional_tax?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          monthly_wage?: number;
          yearly_wage?: number;
          working_days_per_week?: number;
          working_hours_per_day?: number;
          break_hours?: number;
          basic_salary?: number;
          hra?: number;
          standard_allowance?: number;
          performance_bonus?: number;
          leave_travel_allowance?: number;
          fixed_allowance?: number;
          pf_employee_rate?: number;
          pf_employer_rate?: number;
          professional_tax?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'salary_structures_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salary_structures_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      payslips: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          payroll_period: string;
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
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          payroll_period: string;
          total_working_days: number;
          days_present?: number;
          paid_leaves?: number;
          unpaid_leaves?: number;
          absent_days?: number;
          payable_days: number;
          gross_salary: number;
          lop_deduction?: number;
          pf_deduction: number;
          pt_deduction?: number;
          total_deductions: number;
          net_salary: number;
          status?: PayslipStatus;
          generated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          payroll_period?: string;
          total_working_days?: number;
          days_present?: number;
          paid_leaves?: number;
          unpaid_leaves?: number;
          absent_days?: number;
          payable_days?: number;
          gross_salary?: number;
          lop_deduction?: number;
          pf_deduction?: number;
          pt_deduction?: number;
          total_deductions?: number;
          net_salary?: number;
          status?: PayslipStatus;
          generated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payslips_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payslips_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_email_by_login_id: {
        Args: { p_login_id: string };
        Returns: string | null;
      };
      generate_login_id: {
        Args: {
          p_company_id: string;
          p_first_name: string;
          p_last_name: string;
          p_joining_year?: number;
        };
        Returns: string;
      };
      generate_monthly_payslips: {
        Args: {
          p_company_id: string;
          p_payroll_period: string;
        };
        Returns: {
          payslip_id: string;
          user_id: string;
          payable_days: number;
          gross_salary: number;
          lop_deduction: number;
          pf_deduction: number;
          pt_deduction: number;
          total_deductions: number;
          net_salary: number;
          status: string;
        }[];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      auth_user_company_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      auth_user_role: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
    Enums: {
      user_role: UserRole;
      attendance_status: AttendanceStatus;
      leave_type: LeaveType;
      leave_status: LeaveStatus;
      payslip_status: PayslipStatus;
    };
  };
}
