import { supabase } from '../lib/supabase';
import type { Profile, PresenceIndicator } from '../types';

export interface CreateEmployeePayload {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  job_position?: string;
  department?: string;
  manager_name?: string;
  location?: string;
  monthly_wage?: number;
  date_of_joining?: string;
}

export const employeeService = {
  /**
   * Fetch all employee profiles in the organization (RLS enforced)
   */
  async getEmployees(): Promise<{ data: Profile[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name', { ascending: true });

      if (error) throw error;
      return { data: (data as Profile[]) || [], error: null };
    } catch (err: any) {
      console.error('Error fetching employees from Supabase:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Fetch presence indicators for all employees based on today's attendance
   */
  async getTodayPresenceMap(): Promise<Record<string, PresenceIndicator>> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance_records')
        .select('user_id, status, check_in, check_out')
        .eq('date', todayStr);

      if (error || !data) return {};

      const map: Record<string, PresenceIndicator> = {};
      data.forEach((rec) => {
        if (rec.status === 'on_leave') {
          map[rec.user_id] = 'on_leave';
        } else if (rec.check_in && !rec.check_out) {
          map[rec.user_id] = 'present';
        } else if (rec.status === 'present') {
          map[rec.user_id] = 'present';
        } else {
          map[rec.user_id] = 'absent';
        }
      });
      return map;
    } catch (err) {
      console.error('Error fetching presence map:', err);
      return {};
    }
  },

  /**
   * Fetch a single employee profile by ID
   */
  async getProfileById(userId: string): Promise<{ data: Profile | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data: data as Profile, error: null };
    } catch (err: any) {
      console.error('Error fetching profile from Supabase:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Create an employee using the canonical create-employee Edge Function (Admin only)
   */
  async createEmployee(payload: CreateEmployeePayload) {
    try {
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: payload,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error invoking create-employee Edge Function:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Update Resume tab information (Bio, skills, certifications)
   */
  async updateResume(
    userId: string,
    updates: {
      about?: string | null;
      job_love?: string | null;
      hobbies?: string | null;
      skills?: string[];
      certifications?: string[];
    }
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('Error updating resume in Supabase:', err);
      return { error: err };
    }
  },

  /**
   * Update Private Info tab information (Personal, contact, statutory & bank details)
   */
  async updatePrivateInfo(
    userId: string,
    updates: {
      date_of_birth?: string | null;
      residential_address?: string | null;
      nationality?: string | null;
      personal_email?: string | null;
      gender?: string | null;
      marital_status?: string | null;
      bank_account_no?: string | null;
      bank_name?: string | null;
      ifsc_code?: string | null;
      pan_no?: string | null;
      uan_no?: string | null;
      emp_code?: string | null;
      phone?: string | null;
    }
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('Error updating private info in Supabase:', err);
      return { error: err };
    }
  },

  /**
   * Fetch Salary Structure for employee
   */
  async getSalaryStructure(userId: string) {
    try {
      const { data, error } = await supabase
        .from('salary_structures')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error fetching salary structure from Supabase:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Update Salary Structure (Admin only)
   */
  async updateSalaryStructure(userId: string, companyId: string, monthlyWage: number) {
    try {
      const { data, error } = await supabase
        .from('salary_structures')
        .upsert(
          {
            user_id: userId,
            company_id: companyId,
            monthly_wage: monthlyWage,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating salary structure in Supabase:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Upload profile avatar to Supabase Storage avatars bucket
   */
  async uploadAvatar(userId: string, file: File): Promise<{ publicUrl: string | null; error: Error | null }> {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);

      return { publicUrl, error: null };
    } catch (err: any) {
      console.error('Error uploading avatar to Supabase Storage:', err);
      return { publicUrl: null, error: err };
    }
  },
};
