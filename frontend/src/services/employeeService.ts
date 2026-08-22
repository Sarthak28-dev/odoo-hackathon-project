import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile, PresenceIndicator } from '../types';
import { mockProfiles, mockSalaryStructure } from './mockData';

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

// In-memory cache for offline demo mode
let localProfiles: Profile[] = [...mockProfiles];

export const employeeService = {
  /**
   * Fetch all employee profiles in the organization (RLS enforced)
   */
  async getEmployees(): Promise<{ data: Profile[] | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: localProfiles, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name', { ascending: true });

      if (error) throw error;
      return { data: (data as Profile[]) || [], error: null };
    } catch (err: any) {
      console.warn('Supabase fetch failed, falling back to local state:', err);
      return { data: localProfiles, error: null };
    }
  },

  /**
   * Fetch presence indicators for all employees based on today's attendance
   */
  async getTodayPresenceMap(): Promise<Record<string, PresenceIndicator>> {
    if (!isSupabaseConfigured) {
      return {
        'u1111111-1111-1111-1111-111111111111': 'present',
        'u2222222-2222-2222-2222-222222222222': 'present',
        'u3333333-3333-3333-3333-333333333333': 'present',
        'u4444444-4444-4444-4444-444444444444': 'on_leave',
        'u5555555-5555-5555-5555-555555555555': 'absent',
      };
    }

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
      console.warn('Error fetching presence map:', err);
      return {};
    }
  },

  /**
   * Fetch a single employee profile by ID
   */
  async getProfileById(userId: string): Promise<{ data: Profile | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      const found = localProfiles.find((p) => p.id === userId) || localProfiles[0];
      return { data: found || null, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data: data as Profile, error: null };
    } catch (err: any) {
      console.warn('Error fetching profile from Supabase, using local fallback:', err);
      const found = localProfiles.find((p) => p.id === userId) || localProfiles[0];
      return { data: found || null, error: null };
    }
  },

  /**
   * Create an employee using the canonical create-employee Edge Function (Admin only)
   */
  async createEmployee(payload: CreateEmployeePayload) {
    if (!isSupabaseConfigured) {
      const newId = `u-${Date.now()}`;
      const generatedLoginId = `OI${payload.first_name.slice(0, 2).toUpperCase()}${payload.last_name.slice(0, 2).toUpperCase()}${new Date().getFullYear()}00${localProfiles.length + 1}`;
      const tempPass = payload.password || `TempPass@${Math.floor(1000 + Math.random() * 9000)}`;

      const newProf: Profile = {
        id: newId,
        company_id: localProfiles[0]?.company_id || 'c1111111-1111-1111-1111-111111111111',
        role: 'employee',
        login_id: generatedLoginId,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone || null,
        job_position: payload.job_position || 'Associate',
        department: payload.department || 'General',
        manager_name: payload.manager_name || 'HR Team',
        location: payload.location || 'Bangalore HQ',
        avatar_url: null,
        about: null,
        job_love: null,
        hobbies: null,
        skills: [],
        certifications: [],
        date_of_birth: null,
        residential_address: null,
        nationality: 'Indian',
        personal_email: null,
        gender: null,
        marital_status: null,
        date_of_joining: payload.date_of_joining || new Date().toISOString().split('T')[0],
        bank_account_no: null,
        bank_name: null,
        ifsc_code: null,
        pan_no: null,
        uan_no: null,
        emp_code: `EMP-00${localProfiles.length + 1}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      localProfiles = [newProf, ...localProfiles];
      return {
        data: {
          user: {
            id: newId,
            email: payload.email,
            login_id: generatedLoginId,
            temporary_password: tempPass,
            profile: newProf,
          },
        },
        error: null,
      };
    }

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
    if (!isSupabaseConfigured) {
      localProfiles = localProfiles.map((p) => (p.id === userId ? { ...p, ...updates } : p));
      return { error: null };
    }

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
   * Update Private Info tab information
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
    if (!isSupabaseConfigured) {
      localProfiles = localProfiles.map((p) => (p.id === userId ? { ...p, ...updates } : p));
      return { error: null };
    }

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
    if (!isSupabaseConfigured) {
      return { data: { ...mockSalaryStructure, user_id: userId }, error: null };
    }

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
      return { data: { ...mockSalaryStructure, user_id: userId }, error: null };
    }
  },

  /**
   * Update Salary Structure (Admin only)
   */
  async updateSalaryStructure(userId: string, companyId: string, monthlyWage: number) {
    if (!isSupabaseConfigured) {
      return { data: { ...mockSalaryStructure, monthly_wage: monthlyWage, user_id: userId }, error: null };
    }

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
    if (!isSupabaseConfigured) {
      const fakeUrl = URL.createObjectURL(file);
      localProfiles = localProfiles.map((p) => (p.id === userId ? { ...p, avatar_url: fakeUrl } : p));
      return { publicUrl: fakeUrl, error: null };
    }

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
