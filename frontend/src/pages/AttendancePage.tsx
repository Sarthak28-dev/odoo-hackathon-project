import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAttendance } from '../contexts/AttendanceContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { Table, type Column } from '../components/common/Table';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { attendanceService } from '../services/attendanceService';
import type { AttendanceRecord } from '../types';
import { formatDate, formatTime } from '../lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { profile, role } = useAuth();
  const { isCheckedIn, checkInTime, checkIn, checkOut, refreshAttendance } = useAttendance();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [adminSearch, setAdminSearch] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEmployee = role === 'employee';

  const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const fetchAttendanceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const targetUserId = isEmployee ? profile?.id : undefined;
      const { data, error: fetchErr } = await attendanceService.getAttendanceRecords(targetUserId, monthStr);
      if (fetchErr) throw fetchErr;
      setRecords(data || []);
    } catch (err: any) {
      console.error('Failed to fetch attendance data:', err);
      setError(err.message || 'Unable to fetch attendance records from Supabase.');
    } finally {
      setIsLoading(false);
    }
  }, [isEmployee, profile?.id, monthStr]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handlePunchToggle = async () => {
    if (isCheckedIn) {
      await checkOut();
    } else {
      await checkIn();
    }
    await fetchAttendanceData();
  };

  // Filter records in admin search
  const displayedRecords = records.filter((r) => {
    if (isEmployee) return true;
    if (adminSearch.trim()) {
      const q = adminSearch.toLowerCase();
      const empName = `${r.profile?.first_name || ''} ${r.profile?.last_name || ''}`.toLowerCase();
      return empName.includes(q) || (r.profile?.emp_code && r.profile.emp_code.toLowerCase().includes(q));
    }
    return true;
  });

  // Calculate monthly stats
  const totalDaysLogged = records.length;
  const presentDays = records.filter((r) => r.status === 'present').length;
  const halfDays = records.filter((r) => r.status === 'half_day').length;
  const onLeaveDays = records.filter((r) => r.status === 'on_leave').length;
  const totalWorkHours = records.reduce((sum, r) => sum + (r.work_hours || 0), 0);
  const totalExtraHours = records.reduce((sum, r) => sum + (r.extra_hours || 0), 0);

  // Table columns for Employee View
  const employeeColumns: Column<AttendanceRecord>[] = [
    {
      header: 'Date',
      accessorKey: 'date',
      cell: (row) => (
        <div className="font-medium text-neutral-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          <span>{formatDate(row.date)}</span>
        </div>
      ),
    },
    {
      header: 'Check In',
      cell: (row) => (
        <span className="font-mono text-xs text-neutral-200">
          {row.check_in ? formatTime(row.check_in) : '—'}
        </span>
      ),
    },
    {
      header: 'Check Out',
      cell: (row) => (
        <span className="font-mono text-xs text-neutral-200">
          {row.check_out ? formatTime(row.check_out) : '—'}
        </span>
      ),
    },
    {
      header: 'Work Hours',
      cell: (row) => (
        <span className="font-mono font-semibold text-neutral-200">
          {row.work_hours > 0 ? `${row.work_hours.toFixed(2)} hrs` : '—'}
        </span>
      ),
    },
    {
      header: 'Extra Hours',
      cell: (row) => (
        <span className="font-mono text-xs text-neutral-400">
          {row.extra_hours > 0 ? `+${row.extra_hours.toFixed(2)} hrs` : '00:00'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <Badge variant={row.status} />,
    },
  ];

  // Table columns for Admin View
  const adminColumns: Column<AttendanceRecord>[] = [
    {
      header: 'Employee',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={row.profile?.avatar_url}
            name={`${row.profile?.first_name || ''} ${row.profile?.last_name || ''}`}
            size="sm"
          />
          <div>
            <span className="font-semibold text-neutral-100 block text-xs">
              {row.profile?.first_name} {row.profile?.last_name}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {row.profile?.emp_code || 'EMP'} • {row.profile?.department || 'General'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Date',
      cell: (row) => <span className="font-medium text-xs text-neutral-200">{formatDate(row.date)}</span>,
    },
    {
      header: 'Check In',
      cell: (row) => (
        <span className="font-mono text-xs text-neutral-300">
          {row.check_in ? formatTime(row.check_in) : '—'}
        </span>
      ),
    },
    {
      header: 'Check Out',
      cell: (row) => (
        <span className="font-mono text-xs text-neutral-300">
          {row.check_out ? formatTime(row.check_out) : '—'}
        </span>
      ),
    },
    {
      header: 'Work Hours',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-neutral-200">
          {row.work_hours > 0 ? `${row.work_hours.toFixed(2)} hrs` : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <Badge variant={row.status} />,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Month Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Attendance Tracking
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Real-time shift punch in/out, duration records, and monthly logs
          </p>
        </div>

        {/* Month Picker Controls */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-1 shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-neutral-200 px-2 min-w-[110px] text-center">
            {monthName}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Employee Live Shift Punch Card */}
      {isEmployee && (
        <Card className="p-6 bg-gradient-to-r from-purple-950/40 via-neutral-900 to-indigo-950/40 border-purple-900/40">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  {isCheckedIn ? 'Active Work Shift' : 'Shift Inactive (Checked Out)'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {isCheckedIn
                  ? `Checked in at ${checkInTime ? formatTime(checkInTime) : 'Today'}`
                  : 'Ready to start your workday?'}
              </h2>
              <p className="text-xs text-neutral-400">
                Duration and overtime are computed automatically upon check out by PostgreSQL triggers.
              </p>
            </div>

            <button
              onClick={handlePunchToggle}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center gap-2 ${
                isCheckedIn
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{isCheckedIn ? 'Punch Out (Check Out)' : 'Punch In (Check In)'}</span>
            </button>
          </div>
        </Card>
      )}

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-neutral-900/80 border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Days Present
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{presentDays}</div>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">
            Out of {totalDaysLogged} recorded days
          </span>
        </Card>

        <Card className="p-4 bg-neutral-900/80 border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Half Days
          </span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{halfDays}</div>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">
            &lt; 4.5 working hours
          </span>
        </Card>

        <Card className="p-4 bg-neutral-900/80 border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Approved Leaves
          </span>
          <div className="text-2xl font-extrabold text-purple-400 mt-1">{onLeaveDays}</div>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">
            Synchronized from Time Off
          </span>
        </Card>

        <Card className="p-4 bg-neutral-900/80 border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Total Work Hours
          </span>
          <div className="text-2xl font-extrabold text-white mt-1">
            {totalWorkHours.toFixed(1)} <span className="text-xs font-normal text-neutral-400">hrs</span>
          </div>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">
            +{totalExtraHours.toFixed(1)} hrs overtime
          </span>
        </Card>
      </div>

      {/* Admin Search Bar */}
      {!isEmployee && (
        <div className="relative max-w-sm">
          <Input
            placeholder="Filter by employee name or code..."
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-neutral-400" />}
            className="py-1.5 text-xs"
          />
        </div>
      )}

      {/* Attendance History Table */}
      <Card className="bg-neutral-900/80 border-neutral-800 overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading attendance logs from Supabase..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchAttendanceData} />
        ) : displayedRecords.length === 0 ? (
          <EmptyState
            title="No attendance records found"
            description={`No attendance records found for ${monthName}.`}
          />
        ) : (
          <Table
            columns={isEmployee ? employeeColumns : adminColumns}
            data={displayedRecords}
            keyExtractor={(r) => r.id}
          />
        )}
      </Card>
    </div>
  );
};
