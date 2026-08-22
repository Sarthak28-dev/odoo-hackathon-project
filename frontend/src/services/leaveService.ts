import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { LeaveRequest, LeaveType, LeaveStatus } from '../types';
import { mockLeaveRequests } from './mockData';

let localLeaves: LeaveRequest[] = [...mockLeaveRequests];

export const leaveService = {
  /**
   * Fetch leave requests (RLS limits regular employees to their own records; admins view all)
   */
  async getLeaveRequests(userId?: string): Promise<{ data: LeaveRequest[] | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      const filtered = userId ? localLeaves.filter((l) => l.user_id === userId) : localLeaves;
      return { data: filtered, error: null };
    }

    try {
      let query = supabase
        .from('leave_requests')
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
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formatted: LeaveRequest[] = ((data as any[]) || []).map((row) => ({
        ...row,
        profile: row.profiles
          ? {
              first_name: row.profiles.first_name,
              last_name: row.profiles.last_name,
              emp_code: row.profiles.emp_code,
              avatar_url: row.profiles.avatar_url,
              department: row.profiles.department,
            }
          : undefined,
      }));

      return { data: formatted, error: null };
    } catch (err: any) {
      console.warn('Supabase leave fetch failed, falling back to local state:', err);
      const filtered = userId ? localLeaves.filter((l) => l.user_id === userId) : localLeaves;
      return { data: filtered, error: null };
    }
  },

  /**
   * Submit a new leave request
   */
  async applyLeave(payload: {
    userId: string;
    companyId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    remarks?: string;
  }) {
    if (!isSupabaseConfigured) {
      const newReq: LeaveRequest = {
        id: `l-${Date.now()}`,
        user_id: payload.userId,
        company_id: payload.companyId,
        leave_type: payload.leaveType,
        start_date: payload.startDate,
        end_date: payload.endDate,
        total_days: payload.totalDays,
        remarks: payload.remarks || null,
        status: 'pending',
        hr_comments: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localLeaves = [newReq, ...localLeaves];
      return { data: newReq, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          user_id: payload.userId,
          company_id: payload.companyId,
          leave_type: payload.leaveType,
          start_date: payload.startDate,
          end_date: payload.endDate,
          total_days: payload.totalDays,
          remarks: payload.remarks || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error applying for leave in Supabase:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Review a leave request (Admin/HR approval or rejection)
   * The Postgres trigger sync_approved_leave_to_attendance automatically updates attendance records as 'on_leave'!
   */
  async reviewLeave(
    leaveId: string,
    status: LeaveStatus,
    reviewerId: string,
    hrComments?: string
  ) {
    if (!isSupabaseConfigured) {
      localLeaves = localLeaves.map((l) =>
        l.id === leaveId
          ? {
              ...l,
              status,
              hr_comments: hrComments || (status === 'approved' ? 'Approved' : 'Rejected'),
              reviewed_by: reviewerId,
              reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : l
      );
      return { data: localLeaves.find((l) => l.id === leaveId), error: null };
    }

    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status,
          hr_comments: hrComments || null,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leaveId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error reviewing leave request in Supabase:', err);
      return { data: null, error: err };
    }
  },
};
