import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAttendance } from '../contexts/AttendanceContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { mockProfiles, mockLeaveRequests } from '../services/mockData';
import {
  Users,
  CalendarCheck2,
  Clock3,
  DollarSign,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plane,
  UserCheck,
  Building,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { profile, company, role } = useAuth();
  const { isCheckedIn, currentMonthSummary } = useAttendance();

  // Filter pending leave requests for HR
  const pendingLeaves = mockLeaveRequests.filter((l) => l.status === 'pending');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-neutral-900 border border-purple-500/20 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={profile?.avatar_url}
              name={`${profile?.first_name} ${profile?.last_name}`}
              size="lg"
              presence={isCheckedIn ? 'present' : 'absent'}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Welcome back, {profile?.first_name}!
                </h1>
                <Badge variant={role === 'admin' ? 'admin' : 'employee'} />
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 mt-1 flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-purple-400" />
                <span>{company?.name}</span>
                <span>•</span>
                <span className="font-mono text-purple-300">{profile?.login_id}</span>
                <span>•</span>
                <span>{profile?.job_position}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/profile">
              <Button variant="secondary" size="sm">
                View My Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ADMIN / HR DASHBOARD VIEW */}
      {role === 'admin' ? (
        <div className="space-y-8">
          {/* Admin KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card hoverEffect className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase">Total Employees</p>
                <h3 className="text-2xl font-bold text-white mt-0.5">{mockProfiles.length}</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Active team members</p>
              </div>
            </Card>

            <Card hoverEffect className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase">Present Today</p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-0.5">3</h3>
                <p className="text-[11px] text-emerald-500/80 mt-0.5">60% workforce active</p>
              </div>
            </Card>

            <Card hoverEffect className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase">On Leave</p>
                <h3 className="text-2xl font-bold text-sky-400 mt-0.5">1</h3>
                <p className="text-[11px] text-sky-400/80 mt-0.5">Approved time-off</p>
              </div>
            </Card>

            <Card hoverEffect className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase">Pending Approvals</p>
                <h3 className="text-2xl font-bold text-amber-400 mt-0.5">{pendingLeaves.length}</h3>
                <p className="text-[11px] text-amber-500/80 mt-0.5">Requires HR action</p>
              </div>
            </Card>
          </div>

          {/* Quick Actions & Recent Approvals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Leave Requests Module */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-purple-400" />
                  <span>Leave Requests Awaiting Approval</span>
                </h2>
                <Link to="/time-off" className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                  View All &rarr;
                </Link>
              </div>

              {pendingLeaves.length > 0 ? (
                <div className="space-y-3">
                  {pendingLeaves.map((req) => (
                    <Card key={req.id} hoverEffect className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={req.profile?.avatar_url}
                          name={`${req.profile?.first_name} ${req.profile?.last_name}`}
                          size="md"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-neutral-100">
                              {req.profile?.first_name} {req.profile?.last_name}
                            </span>
                            <Badge variant={req.leave_type}>{req.leave_type} leave</Badge>
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {req.start_date} to {req.end_date} ({req.total_days} days) •{' '}
                            <span className="italic">"{req.remarks}"</span>
                          </p>
                        </div>
                      </div>
                      <Link to="/time-off">
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </Link>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center text-sm text-neutral-400">
                  No pending leave requests at this time.
                </Card>
              )}
            </div>

            {/* Quick Navigation Cards */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-neutral-100">Quick Modules</h2>
              <div className="space-y-3">
                <Link to="/employees" className="block">
                  <Card interactive className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-100">Employee Directory</p>
                        <p className="text-xs text-neutral-400">Manage records & onboarding</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-500" />
                  </Card>
                </Link>

                <Link to="/attendance" className="block">
                  <Card interactive className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CalendarCheck2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-100">Attendance Log</p>
                        <p className="text-xs text-neutral-400">Daily check-in/out records</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-500" />
                  </Card>
                </Link>

                <Link to="/payroll" className="block">
                  <Card interactive className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-100">Payroll & Salary</p>
                        <p className="text-xs text-neutral-400">Salary structures & payslips</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-500" />
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* EMPLOYEE DASHBOARD VIEW matching Section 3.2.1 */
        <div className="space-y-8">
          {/* Employee KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card hoverEffect className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase">
                  Days Present (Month)
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mt-2">
                {currentMonthSummary.daysPresent}{' '}
                <span className="text-sm font-normal text-neutral-400">
                  / {currentMonthSummary.totalWorkingDays} days
                </span>
              </h3>
              <div className="w-full bg-neutral-800 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${(currentMonthSummary.daysPresent / currentMonthSummary.totalWorkingDays) * 100}%`,
                  }}
                />
              </div>
            </Card>

            <Card hoverEffect className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase">
                  Leaves Taken
                </span>
                <Plane className="w-5 h-5 text-sky-400" />
              </div>
              <h3 className="text-3xl font-bold text-sky-400 mt-2">
                {currentMonthSummary.leavesCount}{' '}
                <span className="text-sm font-normal text-neutral-400">days</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-2">12 Annual Paid Leaves Remaining</p>
            </Card>

            <Card hoverEffect className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase">
                  Monthly Wage
                </span>
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-3xl font-bold text-purple-300 mt-2">₹50,000.00</h3>
              <p className="text-xs text-neutral-400 mt-2">Next Pay Day: 31st August 2026</p>
            </Card>
          </div>

          {/* Quick Access Cards matching Section 3.2.1 (Profile, Attendance, Leave Requests) */}
          <div>
            <h2 className="text-base font-semibold text-neutral-100 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Quick Access Self-Service</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link to="/profile">
                <Card interactive className="p-5 flex flex-col justify-between h-36">
                  <div>
                    <Badge variant="employee" className="mb-2">
                      Personal File
                    </Badge>
                    <h3 className="text-base font-semibold text-white">My Profile</h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      View resume, private info, salary details
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-purple-400 font-medium gap-1">
                    <span>Open Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Card>
              </Link>

              <Link to="/attendance">
                <Card interactive className="p-5 flex flex-col justify-between h-36">
                  <div>
                    <Badge variant={isCheckedIn ? 'present' : 'absent'} className="mb-2">
                      {isCheckedIn ? 'Currently Active' : 'Offline'}
                    </Badge>
                    <h3 className="text-base font-semibold text-white">Attendance Log</h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Monthly check-in records & extra hours
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-purple-400 font-medium gap-1">
                    <span>View Attendance</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Card>
              </Link>

              <Link to="/time-off">
                <Card interactive className="p-5 flex flex-col justify-between h-36">
                  <div>
                    <Badge variant="info" className="mb-2">
                      Time Off
                    </Badge>
                    <h3 className="text-base font-semibold text-white">Apply for Leave</h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Submit paid, sick, or unpaid leave
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-purple-400 font-medium gap-1">
                    <span>Request Leave</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
