import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AttendanceRecord } from '../types';
import { attendanceService } from '../services/attendanceService';
import { useAuth } from './AuthContext';

interface AttendanceContextType {
  isCheckedIn: boolean;
  checkInTime: string | null;
  records: AttendanceRecord[];
  isLoading: boolean;
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  refreshAttendance: () => Promise<void>;
  currentMonthSummary: {
    daysPresent: number;
    leavesCount: number;
    totalWorkingDays: number;
  };
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, role } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshAttendance = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      // If admin, fetch all company records for reporting; if employee, fetch own
      const targetUserId = role === 'employee' ? profile.id : undefined;
      const { data } = await attendanceService.getAttendanceRecords(targetUserId);
      if (data) {
        setRecords(data);
      }
    } catch (err) {
      console.error('Failed to load attendance records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [profile, role]);

  useEffect(() => {
    refreshAttendance();
  }, [refreshAttendance]);

  // Determine if current user is checked in today
  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayRecord = records.find(
    (r) => r.user_id === profile?.id && r.date === todayStr
  );

  const isCheckedIn = Boolean(userTodayRecord?.check_in && !userTodayRecord.check_out);
  const checkInTime = userTodayRecord?.check_in || null;

  const checkIn = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const { error } = await attendanceService.checkIn(profile.id, profile.company_id);
      if (error) {
        alert('Check-in failed: ' + error.message);
      }
      await refreshAttendance();
    } catch (err: any) {
      console.error('Check-in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkOut = async () => {
    if (!profile || !userTodayRecord) return;
    setIsLoading(true);
    try {
      const { error } = await attendanceService.checkOut(userTodayRecord.id);
      if (error) {
        alert('Check-out failed: ' + error.message);
      }
      await refreshAttendance();
    } catch (err: any) {
      console.error('Check-out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Monthly metrics for the user
  const userMonthRecords = records.filter(
    (r) => r.user_id === profile?.id && r.date.startsWith(todayStr.slice(0, 7))
  );

  const daysPresent = userMonthRecords.filter(
    (r) => r.status === 'present' || r.status === 'half_day'
  ).length;

  const leavesCount = userMonthRecords.filter((r) => r.status === 'on_leave').length;

  return (
    <AttendanceContext.Provider
      value={{
        isCheckedIn,
        checkInTime,
        records,
        isLoading,
        checkIn,
        checkOut,
        refreshAttendance,
        currentMonthSummary: {
          daysPresent,
          leavesCount,
          totalWorkingDays: 22,
        },
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
