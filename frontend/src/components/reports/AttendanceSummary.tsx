import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import type { AttendanceAnalytics } from '../../services/reportsService';
import { Users, CalendarCheck, Clock, UserX, Plane, TrendingUp } from 'lucide-react';

interface AttendanceSummaryProps {
  data: AttendanceAnalytics;
  isLoading?: boolean;
}

export const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 text-center">
          <div className="flex items-center justify-center text-purple-400 mb-1.5">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-neutral-400 font-medium uppercase">
            Total Staff
          </span>
          <p className="text-xl font-bold text-white mt-0.5">{data.totalEmployees}</p>
        </Card>

        <Card className="p-3.5 text-center">
          <div className="flex items-center justify-center text-emerald-400 mb-1.5">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-neutral-400 font-medium uppercase">Present</span>
          <p className="text-xl font-bold text-emerald-400 mt-0.5">{data.presentCount}</p>
        </Card>

        <Card className="p-3.5 text-center">
          <div className="flex items-center justify-center text-amber-400 mb-1.5">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-neutral-400 font-medium uppercase">Half Day</span>
          <p className="text-xl font-bold text-amber-400 mt-0.5">{data.halfDayCount}</p>
        </Card>

        <Card className="p-3.5 text-center">
          <div className="flex items-center justify-center text-sky-400 mb-1.5">
            <Plane className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-neutral-400 font-medium uppercase">On Leave</span>
          <p className="text-xl font-bold text-sky-400 mt-0.5">{data.onLeaveCount}</p>
        </Card>

        <Card className="p-3.5 text-center">
          <div className="flex items-center justify-center text-rose-400 mb-1.5">
            <UserX className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-neutral-400 font-medium uppercase">Absent</span>
          <p className="text-xl font-bold text-rose-400 mt-0.5">{data.absentCount}</p>
        </Card>

        <Card className="p-3.5 text-center bg-purple-950/20 border-purple-800/30">
          <div className="flex items-center justify-center text-purple-400 mb-1.5">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-purple-300 font-medium uppercase">
            Presence Rate
          </span>
          <p className="text-xl font-bold text-purple-400 mt-0.5">{data.attendanceRate}%</p>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Department Attendance Distribution</span>
          </h3>
          <Badge variant="success">Active Tracking</Badge>
        </div>

        <div className="space-y-4 pt-1">
          {data.departmentStats && data.departmentStats.length > 0 ? (
            data.departmentStats.map((dept) => (
              <div key={dept.department}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-300 font-medium">
                    {dept.department} ({dept.employeeCount} employee
                    {dept.employeeCount === 1 ? '' : 's'})
                  </span>
                  <span className="font-semibold font-mono text-emerald-400">
                    {dept.attendanceRate}%
                  </span>
                </div>
                <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, dept.attendanceRate)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-500 py-3 text-center">
              No department records recorded yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
