import React, { createContext, useContext, useState } from 'react';
import type { AttendanceRecord } from '../types';
import { mockAttendanceRecords } from '../services/mockData';
import { useAuth } from './AuthContext';

interface AttendanceContextType {
  isCheckedIn: boolean;
  checkInTime: string | null;
  records: AttendanceRecord[];
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  currentMonthSummary: {
    daysPresent: number;
    leavesCount: number;
    totalWorkingDays: number;
  };
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);

  // Determine if the current active user is checked in today
  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayRecord = records.find(
    (r) => r.user_id === profile?.id && r.date === todayStr
  );

  const isCheckedIn = Boolean(userTodayRecord?.check_in && !userTodayRecord.check_out);
  const checkInTime = userTodayRecord?.check_in || null;

  const checkIn = async () => {
    if (!profile) return;
    const nowIso = new Date().toISOString();
    
    if (userTodayRecord) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === userTodayRecord.id
            ? { ...r, check_in: nowIso, check_out: null, status: 'present' }
            : r
        )
      );
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        user_id: profile.id,
        company_id: profile.company_id,
        date: todayStr,
        check_in: nowIso,
        check_out: null,
        work_hours: 0.0,
        extra_hours: 0.0,
        status: 'present',
        created_at: nowIso,
        updated_at: nowIso,
        profile: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          emp_code: profile.emp_code,
          avatar_url: profile.avatar_url,
        },
      };
      setRecords((prev) => [newRecord, ...prev]);
    }
  };

  const checkOut = async () => {
    if (!profile || !userTodayRecord?.check_in) return;
    const nowIso = new Date().toISOString();
    const checkInDate = new Date(userTodayRecord.check_in);
    const checkOutDate = new Date(nowIso);
    const diffHours = Math.max(
      0,
      Number(((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)).toFixed(2))
    );
    const extra = Math.max(0, Number((diffHours - 8.0).toFixed(2)));

    setRecords((prev) =>
      prev.map((r) =>
        r.id === userTodayRecord.id
          ? {
              ...r,
              check_out: nowIso,
              work_hours: diffHours,
              extra_hours: extra,
              status: diffHours >= 4.5 ? 'present' : 'half_day',
              updated_at: nowIso,
            }
          : r
      )
    );
  };

  // Month stats for active profile
  const userMonthRecords = records.filter(
    (r) => r.user_id === profile?.id && r.date.startsWith(todayStr.slice(0, 7))
  );
  const daysPresent = userMonthRecords.filter(
    (r) => r.status === 'present' || r.status === 'half_day'
  ).length;
  const leavesCount = userMonthRecords.filter((r) => r.status === 'on_leave').length;
  const totalWorkingDays = 22;

  return (
    <AttendanceContext.Provider
      value={{
        isCheckedIn,
        checkInTime,
        records,
        checkIn,
        checkOut,
        currentMonthSummary: {
          daysPresent: daysPresent || 18,
          leavesCount: leavesCount || 1,
          totalWorkingDays,
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
