/**
 * Dayflow HRMS — Payroll Service
 * Integrates with Supabase backend tables: salary_structures, payslips, and profiles
 * Authoritative RPC: generate_monthly_payslips(p_company_id, p_payroll_period)
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { SalaryStructure, Payslip, PayslipStatus } from '../types';
import {
  mockSalaryStructure,
  mockPayslips,
  mockProfiles,
} from './mockData';

export interface GeneratePayrollResult {
  success: boolean;
  count: number;
  message?: string;
  payslips?: Payslip[];
  error?: string;
}

/**
 * Fetch salary structure for a specific user.
 * RLS ensures employees can only read their own row, admins can read all in company.
 */
export async function fetchSalaryStructure(userId: string): Promise<SalaryStructure | null> {
  if (!isSupabaseConfigured) {
    if (userId === mockSalaryStructure.user_id) {
      return mockSalaryStructure;
    }
    // Return a default mock structure for other users
    return {
      ...mockSalaryStructure,
      id: `s-${userId}`,
      user_id: userId,
    };
  }

  const { data, error } = await supabase
    .from('salary_structures')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching salary structure:', error);
    throw error;
  }

  return data as SalaryStructure | null;
}

/**
 * Fetch all salary structures in the company (Admin only)
 */
export async function fetchCompanySalaryStructures(companyId: string): Promise<SalaryStructure[]> {
  if (!isSupabaseConfigured) {
    return [mockSalaryStructure];
  }

  const { data, error } = await supabase
    .from('salary_structures')
    .select('*')
    .eq('company_id', companyId);

  if (error) {
    console.error('Error fetching company salary structures:', error);
    throw error;
  }

  return (data || []) as SalaryStructure[];
}

/**
 * Create or update an employee's salary structure (Admin only).
 * The PostgreSQL trigger compute_salary_structure will authoritatively calculate
 * basic_salary, hra, allowances, pf, pt, and net on insert/update.
 */
export async function upsertSalaryStructure(payload: {
  userId: string;
  companyId: string;
  monthlyWage: number;
  workingDaysPerWeek?: number;
  workingHoursPerDay?: number;
  breakHours?: number;
  pfEmployeeRate?: number;
  pfEmployerRate?: number;
  professionalTax?: number;
}): Promise<SalaryStructure> {
  if (!isSupabaseConfigured) {
    const monthlyWage = payload.monthlyWage;
    const basic = Math.round(monthlyWage * 0.5);
    const hra = Math.round(basic * 0.5);
    const standard = Math.round(basic * 0.16668);
    const bonus = Math.round(basic * 0.0833);
    const lta = Math.round(basic * 0.0833);
    const fixed = Math.round(monthlyWage - (basic + hra + standard + bonus + lta));

    const updated: SalaryStructure = {
      id: `s-${payload.userId}`,
      user_id: payload.userId,
      company_id: payload.companyId,
      monthly_wage: monthlyWage,
      yearly_wage: monthlyWage * 12,
      working_days_per_week: payload.workingDaysPerWeek ?? 5,
      working_hours_per_day: payload.workingHoursPerDay ?? 8.0,
      break_hours: payload.breakHours ?? 1.0,
      basic_salary: basic,
      hra: hra,
      standard_allowance: standard,
      performance_bonus: bonus,
      leave_travel_allowance: lta,
      fixed_allowance: fixed,
      pf_employee_rate: payload.pfEmployeeRate ?? 12.0,
      pf_employer_rate: payload.pfEmployerRate ?? 12.0,
      professional_tax: payload.professionalTax ?? 200.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return updated;
  }

  const { data, error } = await supabase
    .from('salary_structures')
    .upsert(
      {
        user_id: payload.userId,
        company_id: payload.companyId,
        monthly_wage: payload.monthlyWage,
        working_days_per_week: payload.workingDaysPerWeek ?? 5,
        working_hours_per_day: payload.workingHoursPerDay ?? 8.0,
        break_hours: payload.breakHours ?? 1.0,
        pf_employee_rate: payload.pfEmployeeRate ?? 12.0,
        pf_employer_rate: payload.pfEmployerRate ?? 12.0,
        professional_tax: payload.professionalTax ?? 200.0,
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single();

  if (error) {
    console.error('Error upserting salary structure:', error);
    throw error;
  }

  return data as SalaryStructure;
}

/**
 * Fetch monthly payslips for a company and period.
 * If userId is provided or the user is an employee, RLS restricts rows to that user.
 */
export async function fetchPayslips(params: {
  companyId: string;
  payrollPeriod?: string;
  userId?: string;
}): Promise<Payslip[]> {
  if (!isSupabaseConfigured) {
    let list = [...mockPayslips];
    if (params.payrollPeriod) {
      list = list.filter((p) => p.payroll_period === params.payrollPeriod);
    }
    if (params.userId) {
      list = list.filter((p) => p.user_id === params.userId);
    }
    return list;
  }

  let query = supabase
    .from('payslips')
    .select(`
      *,
      profile:profiles (
        first_name,
        last_name,
        emp_code,
        login_id,
        job_position,
        department,
        bank_account_no,
        pan_no
      )
    `)
    .eq('company_id', params.companyId)
    .order('generated_at', { ascending: false });

  if (params.payrollPeriod) {
    query = query.eq('payroll_period', params.payrollPeriod);
  }

  if (params.userId) {
    query = query.eq('user_id', params.userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching payslips:', error);
    throw error;
  }

  return (data || []) as unknown as Payslip[];
}

/**
 * Fetch a single payslip by ID
 */
export async function fetchPayslipById(payslipId: string): Promise<Payslip | null> {
  if (!isSupabaseConfigured) {
    const found = mockPayslips.find((p) => p.id === payslipId);
    return found || null;
  }

  const { data, error } = await supabase
    .from('payslips')
    .select(`
      *,
      profile:profiles (
        first_name,
        last_name,
        emp_code,
        login_id,
        job_position,
        department,
        bank_account_no,
        pan_no
      )
    `)
    .eq('id', payslipId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching payslip by ID:', error);
    throw error;
  }

  return data as unknown as Payslip | null;
}

/**
 * Triggers backend payroll generation RPC: generate_monthly_payslips(p_company_id, p_payroll_period)
 * strictly authoritatively computed on PostgreSQL.
 */
export async function generateMonthlyPayroll(
  companyId: string,
  payrollPeriod: string
): Promise<GeneratePayrollResult> {
  if (!isSupabaseConfigured) {
    // Mock run generates slips for mock profiles
    const generated: Payslip[] = mockProfiles.map((emp, i) => ({
      id: `p-${payrollPeriod}-${emp.id.slice(-4) || i}`,
      user_id: emp.id,
      company_id: companyId,
      payroll_period: payrollPeriod,
      total_working_days: 22,
      days_present: 21,
      paid_leaves: 1,
      unpaid_leaves: 0,
      absent_days: 0,
      payable_days: 22,
      gross_salary: 50000.0,
      lop_deduction: 0.0,
      pf_deduction: 3000.0,
      pt_deduction: 200.0,
      total_deductions: 3200.0,
      net_salary: 46800.0,
      status: 'draft',
      generated_at: new Date().toISOString(),
      profile: {
        first_name: emp.first_name,
        last_name: emp.last_name,
        emp_code: emp.emp_code,
        login_id: emp.login_id,
        job_position: emp.job_position,
        department: emp.department,
        bank_account_no: emp.bank_account_no,
        pan_no: emp.pan_no,
      },
    }));

    return {
      success: true,
      count: generated.length,
      payslips: generated,
      message: `Successfully computed and generated ${generated.length} payslips for ${payrollPeriod}.`,
    };
  }

  // Call PostgreSQL RPC directly
  const { data, error } = await supabase.rpc('generate_monthly_payslips', {
    p_company_id: companyId,
    p_payroll_period: payrollPeriod,
  });

  if (error) {
    console.error('RPC generate_monthly_payslips error:', error);
    return {
      success: false,
      count: 0,
      error: error.message || 'Failed to generate monthly payslips',
    };
  }

  // Fetch updated payslips with profile details
  const payslips = await fetchPayslips({ companyId, payrollPeriod });

  return {
    success: true,
    count: data?.length ?? payslips.length,
    payslips,
    message: `Generated ${data?.length ?? payslips.length} payslips for ${payrollPeriod}.`,
  };
}

/**
 * Update payslip status (Admin only)
 * e.g. draft -> finalized -> paid
 */
export async function updatePayslipStatus(
  payslipId: string,
  status: PayslipStatus
): Promise<Payslip> {
  if (!isSupabaseConfigured) {
    const slip = mockPayslips.find((p) => p.id === payslipId);
    if (slip) {
      slip.status = status;
      return { ...slip };
    }
    throw new Error('Payslip not found in mock store');
  }

  const { data, error } = await supabase
    .from('payslips')
    .update({ status })
    .eq('id', payslipId)
    .select(`
      *,
      profile:profiles (
        first_name,
        last_name,
        emp_code,
        login_id,
        job_position,
        department,
        bank_account_no,
        pan_no
      )
    `)
    .single();

  if (error) {
    console.error('Error updating payslip status:', error);
    throw error;
  }

  return data as unknown as Payslip;
}
