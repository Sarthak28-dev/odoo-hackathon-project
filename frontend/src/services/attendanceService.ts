import { supabase } from '../lib/supabase';
import type { AttendanceRecord } from '../types';

export const attendanceService = {
  /**
   * Fetch attendance records for the current employee or entire company (if admin)
   */
  async getAttendanceRecords(
    userId?: string,
    monthStr?: string
  ): Promise<{ data: AttendanceRecord[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            emp_code,
            avatar_url,
            department
          )
        `)
        .order('date', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (monthStr) {
        const startOfMonth = `${monthStr}-01`;
        const endOfMonth = `${monthStr}-31`;
        query = query.gte('date', startOfMonth).lte('date', endOfMonth);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform profile join for frontend components
      const formatted: AttendanceRecord[] = ((data as any[]) || []).map((row) => ({
        ...row,
        work_hours: Number(row.work_hours || 0),
        extra_hours: Number(row.extra_hours || 0),
        profile: row.profiles
          ? {
              first_name: row.profiles.first_name,
              last_name: row.profiles.last_name,
              emp_code: row.profiles.emp_code,
              avatar_url: row.profiles.avatar_url,
            }
          : undefined,
      }));

      return { data: formatted, error: null };
    } catch (err: any) {
      console.error('Error fetching attendance records from Supabase:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Get today's attendance record for an employee
   */
  async getTodayRecord(userId: string): Promise<{ data: AttendanceRecord | null; error: Error | null }> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', userId)
        .eq('date', todayStr)
        .maybeSingle();

      if (error) throw error;
      return {
        data: data
          ? {
              ...data,
              work_hours: Number(data.work_hours || 0),
              extra_hours: Number(data.extra_hours || 0),
            }
          : null,
        error: null,
      };
    } catch (err: any) {
      console.error('Error getting today attendance record:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Check in (Punch in)
   */
  async checkIn(userId: string, companyId: string) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from('attendance_records')
        .upsert(
          {
            user_id: userId,
            company_id: companyId,
            date: todayStr,
            check_in: nowIso,
            status: 'present',
            updated_at: nowIso,
          },
          { onConflict: 'user_id,date' }
        )
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error during check-in in Supabase:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Check out (Punch out)
   * The Postgres calculate_attendance_hours trigger automatically calculates work_hours, extra_hours, and status!
   */
  async checkOut(recordId: string) {
    try {
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from('attendance_records')
        .update({
          check_out: nowIso,
          updated_at: nowIso,
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error during check-out in Supabase:', err);
      return { data: null, error: err };
    }
  },
};
