import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAttendance } from '../contexts/AttendanceContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Table, type Column } from '../components/common/Table';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { leaveService } from '../services/leaveService';
import type { LeaveRequest, LeaveType, LeaveStatus } from '../types';
import { formatDate } from '../lib/utils';
import { Plus, Check, X, Plane, Calendar, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

export const TimeOffPage: React.FC = () => {
  const { profile, role } = useAuth();
  const { refreshAttendance } = useAttendance();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply Leave Form State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('paid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // HR Review Modal State
  const [reviewModalRequest, setReviewModalRequest] = useState<LeaveRequest | null>(null);
  const [hrComment, setHrComment] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const isEmployee = role === 'employee';

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const targetUserId = isEmployee ? profile?.id : undefined;
      const { data, error: fetchErr } = await leaveService.getLeaveRequests(targetUserId);
      if (fetchErr) throw fetchErr;
      setLeaves(data || []);
    } catch (err: any) {
      console.error('Failed to fetch leave requests:', err);
      setError(err.message || 'Unable to retrieve leave requests from Supabase.');
    } finally {
      setIsLoading(false);
    }
  }, [isEmployee, profile?.id]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!profile) return;

    if (!startDate || !endDate) {
      setFormError('Please select both start and end dates.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    setIsSubmitting(true);

    try {
      const { error: applyErr } = await leaveService.applyLeave({
        userId: profile.id,
        companyId: profile.company_id,
        leaveType,
        startDate,
        endDate,
        totalDays: diffDays,
        remarks,
      });

      if (applyErr) throw applyErr;

      showSuccess(`Leave application for ${diffDays} days submitted to Supabase!`);
      setIsApplyModalOpen(false);
      setRemarks('');
      setStartDate('');
      setEndDate('');
      await fetchLeaves();
    } catch (err: any) {
      console.error('Apply leave error:', err);
      setFormError(err.message || 'Failed to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHRAction = async (status: LeaveStatus) => {
    if (!reviewModalRequest || !profile) return;
    setIsReviewing(true);

    try {
      const { error: revErr } = await leaveService.reviewLeave(
        reviewModalRequest.id,
        status,
        profile.id,
        hrComment || (status === 'approved' ? 'Approved by HR' : 'Rejected by HR')
      );

      if (revErr) throw revErr;

      showSuccess(
        `Leave marked ${status.toUpperCase()}. Postgres trigger synchronized attendance records.`
      );
      setReviewModalRequest(null);
      setHrComment('');
      await Promise.all([fetchLeaves(), refreshAttendance()]);
    } catch (err: any) {
      alert('Review action failed: ' + err.message);
    } finally {
      setIsReviewing(false);
    }
  };

  // Quota computations
  const paidApproved = leaves
    .filter((l) => l.leave_type === 'paid' && l.status === 'approved')
    .reduce((sum, l) => sum + (l.total_days || 0), 0);

  const sickApproved = leaves
    .filter((l) => l.leave_type === 'sick' && l.status === 'approved')
    .reduce((sum, l) => sum + (l.total_days || 0), 0);

  const unpaidApproved = leaves
    .filter((l) => l.leave_type === 'unpaid' && l.status === 'approved')
    .reduce((sum, l) => sum + (l.total_days || 0), 0);

  const pendingCount = leaves.filter((l) => l.status === 'pending').length;

  const leaveColumns: Column<LeaveRequest>[] = [
    ...(!isEmployee
      ? [
          {
            header: 'Employee',
            cell: (row: LeaveRequest) => (
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
        ]
      : []),
    {
      header: 'Type',
      cell: (row: LeaveRequest) => <Badge variant={row.leave_type} />,
    },
    {
      header: 'Period (From - To)',
      cell: (row: LeaveRequest) => (
        <div className="text-xs text-neutral-200 flex items-center gap-1.5 font-medium">
          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
          <span>{formatDate(row.start_date)}</span>
          <span className="text-neutral-500">→</span>
          <span>{formatDate(row.end_date)}</span>
        </div>
      ),
    },
    {
      header: 'Days',
      cell: (row: LeaveRequest) => (
        <span className="font-mono font-semibold text-xs text-neutral-200">
          {row.total_days} {row.total_days === 1 ? 'day' : 'days'}
        </span>
      ),
    },
    {
      header: 'Remarks',
      cell: (row: LeaveRequest) => (
        <span className="text-xs text-neutral-400 max-w-[180px] truncate block">
          {row.remarks || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row: LeaveRequest) => <Badge variant={row.status} />,
    },
    {
      header: 'HR Notes',
      cell: (row: LeaveRequest) => (
        <span className="text-xs text-neutral-400 max-w-[160px] truncate block">
          {row.hr_comments || '—'}
        </span>
      ),
    },
    ...(!isEmployee
      ? [
          {
            header: 'Actions',
            cell: (row: LeaveRequest) =>
              row.status === 'pending' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReviewModalRequest(row);
                    setHrComment('');
                  }}
                  className="py-1 text-xs text-purple-400 border-purple-800/60 hover:bg-purple-950/40"
                >
                  Review
                </Button>
              ) : (
                <span className="text-[11px] text-neutral-500 font-medium">Completed</span>
              ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Time Off & Leaves
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Apply for paid or sick leaves, track quota balances, and review team requests
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsApplyModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Apply for Leave
        </Button>
      </div>

      {successBanner && (
        <div className="p-3.5 bg-emerald-950/50 border border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Quota KPI Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-neutral-900/80 border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Paid Leave Balance
          </span>
          <div className="text-2xl font-extrabold text-blue-400 mt-1">
            {Math.max(0, 12 - paidApproved)} <span className="text-xs font-normal text-neutral-400">days left</span>
          </div>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">
            {paidApproved} / 12 days utilized
          </span>
        </Card>

        <Card className="p-4 bg-neutral-900/80 border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Sick Leave Balance
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {Math.max(0, 8 - sickApproved)} <span className="text-xs font-normal text-neutral-400">days left</span>
          </div>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">
            {sickApproved} / 8 days utilized
          </span>
        </Card>

        <Card className="p-4 bg-neutral-900/80 border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Unpaid Leaves Taken
          </span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            {unpaidApproved} <span className="text-xs font-normal text-neutral-400">days</span>
          </div>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">
            Deducted via Loss of Pay
          </span>
        </Card>

        <Card className="p-4 bg-neutral-900/80 border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Pending Approvals
          </span>
          <div className="text-2xl font-extrabold text-purple-400 mt-1">{pendingCount}</div>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">
            Awaiting HR review
          </span>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card className="bg-neutral-900/80 border-neutral-800 overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading leave records from Supabase..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchLeaves} />
        ) : leaves.length === 0 ? (
          <EmptyState
            title="No leave requests found"
            description="You have not submitted any time off applications yet."
            actionLabel="Apply for Leave"
            onAction={() => setIsApplyModalOpen(true)}
          />
        ) : (
          <Table columns={leaveColumns} data={leaves} />
        )}
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Time Off / Leave"
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Select
            label="Leave Type *"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            options={[
              { value: 'paid', label: 'Paid Annual Leave (Quota: 12 days)' },
              { value: 'sick', label: 'Sick / Medical Leave (Quota: 8 days)' },
              { value: 'unpaid', label: 'Unpaid Leave (Loss of Pay)' },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date *"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-300">
              Reason / Remarks *
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="State the reason for your time off request..."
              required
              className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApplyModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* Admin Review Modal */}
      {reviewModalRequest && (
        <Modal
          isOpen={Boolean(reviewModalRequest)}
          onClose={() => setReviewModalRequest(null)}
          title="Review Employee Leave Request"
        >
          <div className="space-y-4">
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between pb-1 border-b border-neutral-800">
                <span className="text-neutral-400">Employee:</span>
                <span className="text-neutral-200 font-semibold">
                  {reviewModalRequest.profile?.first_name} {reviewModalRequest.profile?.last_name}
                </span>
              </div>
              <div className="flex justify-between pb-1 border-b border-neutral-800">
                <span className="text-neutral-400">Leave Type:</span>
                <Badge variant={reviewModalRequest.leave_type} />
              </div>
              <div className="flex justify-between pb-1 border-b border-neutral-800">
                <span className="text-neutral-400">Duration:</span>
                <span className="font-mono text-purple-400 font-bold">
                  {reviewModalRequest.total_days} days ({formatDate(reviewModalRequest.start_date)} → {formatDate(reviewModalRequest.end_date)})
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block mb-1">Employee Remarks:</span>
                <p className="text-neutral-300 italic bg-neutral-900 p-2.5 rounded-lg">
                  "{reviewModalRequest.remarks || 'No remarks provided'}"
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                HR Review Comments
              </label>
              <textarea
                rows={2}
                value={hrComment}
                onChange={(e) => setHrComment(e.target.value)}
                placeholder="Optional feedback or approval notes..."
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
              <Button
                type="button"
                variant="danger"
                onClick={() => handleHRAction('rejected')}
                isLoading={isReviewing}
                leftIcon={<X className="w-4 h-4" />}
              >
                Reject Request
              </Button>
              <Button
                type="button"
                variant="success"
                onClick={() => handleHRAction('approved')}
                isLoading={isReviewing}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Approve Leave
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
