import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAttendance } from '../contexts/AttendanceContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { Table, type Column } from '../components/common/Table';
import type { AttendanceRecord } from '../types';
import { formatDate, formatTime } from '../lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Plane,
  Clock,
  Search,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { profile, role } = useAuth();
  const { records, currentMonthSummary } = useAttendance();

  const [selectedMonth] = useState('August 2026');
  const [adminViewMode, setAdminViewMode] = useState<'day' | 'month'>('day');
  const [adminSearch, setAdminSearch] = useState('');

  // Filter records based on active role
  const isEmployee = role === 'employee';

  const displayedRecords = records.filter((r) => {
    if (isEmployee) {
      return r.user_id === profile?.id;
    }
    // Admin view
    if (adminSearch.trim()) {
      const q = adminSearch.toLowerCase();
      const empName = `${r.profile?.first_name} ${r.profile?.last_name}`.toLowerCase();
      return empName.includes(q) || (r.profile?.emp_code && r.profile.emp_code.toLowerCase().includes(q));
    }
    return true;
  });

  // Table columns for Employee View (Wireframe 9)
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
        <span className="font-mono text-xs">{row.check_in ? formatTime(row.check_in) : '—'}</span>
      ),
    },
    {
      header: 'Check Out',
      cell: (row) => (
        <span className="font-mono text-xs">{row.check_out ? formatTime(row.check_out) : '—'}</span>
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

  // Table columns for Admin View (Wireframe 8)
  const adminColumns: Column<AttendanceRecord>[] = [
    {
      header: 'Employee',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={row.profile?.avatar_url}
            name={`${row.profile?.first_name} ${row.profile?.last_name}`}
            size="sm"
          />
          <div>
            <p className="font-medium text-neutral-100">
              {row.profile?.first_name} {row.profile?.last_name}
            </p>
            <p className="text-[11px] font-mono text-neutral-500">{row.profile?.emp_code}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Date',
      cell: (row) => <span className="text-xs text-neutral-300">{formatDate(row.date)}</span>,
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Attendance Records
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            {isEmployee
              ? 'Day-wise working hours, check-ins, and overtime logs'
              : 'Organization-wide daily attendance monitoring & logs'}
          </p>
        </div>
      </div>

      {/* EMPLOYEE VIEW KPI STATS (Wireframe 9) */}
      {isEmployee && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card hoverEffect className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium uppercase">Count of Days Present</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-0.5">
                {currentMonthSummary.daysPresent}
              </h3>
            </div>
          </Card>

          <Card hoverEffect className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium uppercase">Leaves Count</p>
              <h3 className="text-2xl font-bold text-sky-400 mt-0.5">
                {currentMonthSummary.leavesCount}
              </h3>
            </div>
          </Card>

          <Card hoverEffect className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium uppercase">Total Working Days</p>
              <h3 className="text-2xl font-bold text-purple-300 mt-0.5">
                {currentMonthSummary.totalWorkingDays}
              </h3>
            </div>
          </Card>
        </div>
      )}

      {/* Navigation Controls matching Wireframe 8 & 9 */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Month/Day Selector with Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-4 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-semibold text-neutral-200">
              {selectedMonth}
            </div>

            <button
              type="button"
              className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Admin Controls: Day/Month View toggle + Search */}
          {!isEmployee && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
              </div>

              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setAdminViewMode('day')}
                  className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                    adminViewMode === 'day'
                      ? 'bg-purple-600 text-white'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Day
                </button>
                <button
                  type="button"
                  onClick={() => setAdminViewMode('month')}
                  className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                    adminViewMode === 'month'
                      ? 'bg-purple-600 text-white'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Attendance Table */}
      <Table
        columns={isEmployee ? employeeColumns : adminColumns}
        data={displayedRecords}
        keyExtractor={(row) => row.id}
        emptyMessage="No attendance logs found for this period."
      />
    </div>
  );
};
