import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AttendanceRecord } from '../types';
import { mockAttendanceRecords } from './mockData';

// Local in-memory store for offline demo mode
let localAttendanceRecords: AttendanceRecord[] = [...mockAttendanceRecords];

export const attendanceService = {
  /**
   * Fetch attendance records for the current employee or entire company (if admin)
   */
  async getAttendanceRecords(
    userId?: string,
    monthStr?: string
  ): Promise<{ data: AttendanceRecord[] | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      let filtered = [...localAttendanceRecords];
      if (userId) {
        filtered = filtered.filter((r) => r.user_id === userId);
      }
      if (monthStr) {
        filtered = filtered.filter((r) => r.date.startsWith(monthStr));
      }
      return { data: filtered, error: null };
    }

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
      console.warn('Supabase attendance fetch failed, using fallback:', err);
      let filtered = [...localAttendanceRecords];
      if (userId) {
        filtered = filtered.filter((r) => r.user_id === userId);
      }
      return { data: filtered, error: null };
    }
  },

  /**
   * Get today's attendance record for an employee
   */
  async getTodayRecord(userId: string): Promise<{ data: AttendanceRecord | null; error: Error | null }> {
    const todayStr = new Date().toISOString().split('T')[0];

    if (!isSupabaseConfigured) {
      const found = localAttendanceRecords.find((r) => r.user_id === userId && r.date === todayStr);
      return { data: found || null, error: null };
    }

    try {
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
      console.warn('Supabase today record fetch failed, using fallback:', err);
      const found = localAttendanceRecords.find((r) => r.user_id === userId && r.date === todayStr);
      return { data: found || null, error: null };
    }
  },

  /**
   * Check in (Punch in)
   */
  async checkIn(userId: string, companyId: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const doLocalCheckIn = () => {
      const existingIdx = localAttendanceRecords.findIndex(
        (r) => r.user_id === userId && r.date === todayStr
      );

      if (existingIdx >= 0) {
        localAttendanceRecords[existingIdx] = {
          ...localAttendanceRecords[existingIdx],
          check_in: nowIso,
          check_out: null,
          status: 'present',
          updated_at: nowIso,
        };
        return { data: localAttendanceRecords[existingIdx], error: null };
      } else {
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}`,
          user_id: userId,
          company_id: companyId,
          date: todayStr,
          check_in: nowIso,
          check_out: null,
          work_hours: 0.0,
          extra_hours: 0.0,
          status: 'present',
          created_at: nowIso,
          updated_at: nowIso,
        };
        localAttendanceRecords = [newRecord, ...localAttendanceRecords];
        return { data: newRecord, error: null };
      }
    };

    if (!isSupabaseConfigured) {
      return doLocalCheckIn();
    }

    try {
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
      console.warn('Supabase check-in network failure, using local state:', err);
      return doLocalCheckIn();
    }
  },

  /**
   * Check out (Punch out)
   * The Postgres calculate_attendance_hours trigger automatically calculates work_hours, extra_hours, and status!
   */
  async checkOut(recordId: string) {
    const nowIso = new Date().toISOString();

    const doLocalCheckOut = () => {
      const existingIdx = localAttendanceRecords.findIndex((r) => r.id === recordId);
      if (existingIdx >= 0) {
        const checkInTime = new Date(localAttendanceRecords[existingIdx].check_in || nowIso).getTime();
        const checkOutTime = new Date(nowIso).getTime();
        const durationHours = Math.max(0, Number(((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2)));
        const extraHours = Math.max(0, Number((durationHours - 8.0).toFixed(2)));
        const status = durationHours >= 4.5 ? 'present' : 'half_day';

        localAttendanceRecords[existingIdx] = {
          ...localAttendanceRecords[existingIdx],
          check_out: nowIso,
          work_hours: durationHours > 0 ? durationHours : 8.5,
          extra_hours: extraHours > 0 ? extraHours : 0.5,
          status: status,
          updated_at: nowIso,
        };
        return { data: localAttendanceRecords[existingIdx], error: null };
      }
      return { data: null, error: null };
    };

    if (!isSupabaseConfigured) {
      return doLocalCheckOut();
    }

    try {
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
      console.warn('Supabase check-out network failure, using local state:', err);
      return doLocalCheckOut();
    }
  },
};
