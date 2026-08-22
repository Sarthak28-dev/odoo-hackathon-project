import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Table, type Column } from '../components/common/Table';
import { mockLeaveRequests } from '../services/mockData';
import type { LeaveRequest, LeaveType } from '../types';
import { formatDate } from '../lib/utils';
import { Plus, Check, X, Plane, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

export const TimeOffPage: React.FC = () => {
  const { profile, role } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Apply Leave Form State
  const [leaveType, setLeaveType] = useState<LeaveType>('paid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // HR Review Modal State
  const [reviewModalRequest, setReviewModalRequest] = useState<LeaveRequest | null>(null);
  const [hrComment, setHrComment] = useState('');

  const isEmployee = role === 'employee';

  const displayedLeaves = leaves.filter((l) => (isEmployee ? l.user_id === profile?.id : true));

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

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

    const newReq: LeaveRequest = {
      id: `l-${Date.now()}`,
      user_id: profile?.id || 'u2',
      company_id: profile?.company_id || 'c1',
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      total_days: diffDays,
      remarks,
      status: 'pending',
      hr_comments: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: {
        first_name: profile?.first_name || 'John',
        last_name: profile?.last_name || 'Doe',
        emp_code: profile?.emp_code || 'EMP-002',
        avatar_url: profile?.avatar_url || null,
        department: profile?.department || 'Engineering',
      },
    };

    setLeaves([newReq, ...leaves]);
    setIsApplyModalOpen(false);
    setRemarks('');
    setStartDate('');
    setEndDate('');
  };

  const handleHRAction = (status: 'approved' | 'rejected') => {
    if (!reviewModalRequest) return;
    setLeaves((prev) =>
      prev.map((l) =>
        l.id === reviewModalRequest.id
          ? {
              ...l,
              status,
              hr_comments: hrComment || (status === 'approved' ? 'Approved' : 'Rejected'),
              reviewed_by: profile?.id || null,
              reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : l
      )
    );
    setReviewModalRequest(null);
    setHrComment('');
  };

  const columns: Column<LeaveRequest>[] = [
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
            <p className="text-[11px] font-mono text-neutral-500">{row.profile?.department}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Leave Type',
      cell: (row) => (
        <span className="capitalize font-medium text-xs text-neutral-300">
          {row.leave_type} Leave
        </span>
      ),
    },
    {
      header: 'Date Range',
      cell: (row) => (
        <div>
          <p className="text-xs font-medium text-neutral-200">
            {formatDate(row.start_date)} &rarr; {formatDate(row.end_date)}
          </p>
          <p className="text-[11px] text-neutral-500">{row.total_days} Day(s)</p>
        </div>
      ),
    },
    {
      header: 'Remarks & Comments',
      cell: (row) => (
        <div className="max-w-xs text-xs space-y-1">
          <p className="text-neutral-300 italic truncate">"{row.remarks || 'No remarks'}"</p>
          {row.hr_comments && (
            <p className="text-[11px] text-purple-400">
              HR: {row.hr_comments}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <Badge variant={row.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => {
        if (role === 'admin' && row.status === 'pending') {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 px-2 py-1 text-xs"
                onClick={() => setReviewModalRequest(row)}
              >
                Review
              </Button>
            </div>
          );
        }
        return <span className="text-xs text-neutral-500">—</span>;
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Time Off & Leave Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Submit leave requests, review pending time-off, and track balances
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsApplyModalOpen(true)}
        >
          Apply for Leave
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverEffect className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium uppercase">Paid Leave Balance</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-0.5">12 Days</h3>
          </div>
        </Card>

        <Card hoverEffect className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium uppercase">Sick Leave Balance</p>
            <h3 className="text-2xl font-bold text-sky-400 mt-0.5">7 Days</h3>
          </div>
        </Card>

        <Card hoverEffect className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium uppercase">Requests in Review</p>
            <h3 className="text-2xl font-bold text-purple-300 mt-0.5">
              {leaves.filter((l) => l.status === 'pending').length}
            </h3>
          </div>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Table
        columns={columns}
        data={displayedLeaves}
        keyExtractor={(row) => row.id}
        emptyMessage="No leave requests found."
      />

      {/* Modal: Apply for Leave */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
        description="Submit a time-off application for HR review."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleApplyLeave}>
              Submit Request
            </Button>
          </>
        }
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Select
            label="Leave Type"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            options={[
              { label: 'Paid Leave / Casual Leave', value: 'paid' },
              { label: 'Sick Leave / Medical', value: 'sick' },
              { label: 'Unpaid Leave (Loss of Pay)', value: 'unpaid' },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-300">Remarks / Reason</label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide a brief explanation for your leave..."
              className="w-full bg-neutral-950 text-neutral-200 text-sm p-3 rounded-lg border border-neutral-800 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: HR Review Request */}
      <Modal
        isOpen={Boolean(reviewModalRequest)}
        onClose={() => setReviewModalRequest(null)}
        title="Review Leave Application"
        description="Approve or reject employee leave with optional comments."
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="danger"
              size="sm"
              leftIcon={<X className="w-3.5 h-3.5" />}
              onClick={() => handleHRAction('rejected')}
            >
              Reject Request
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500"
              leftIcon={<Check className="w-3.5 h-3.5" />}
              onClick={() => handleHRAction('approved')}
            >
              Approve Request
            </Button>
          </div>
        }
      >
        {reviewModalRequest && (
          <div className="space-y-4">
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5 text-xs">
              <p className="text-neutral-400">
                Applicant:{' '}
                <span className="font-semibold text-neutral-200">
                  {reviewModalRequest.profile?.first_name} {reviewModalRequest.profile?.last_name}
                </span>
              </p>
              <p className="text-neutral-400">
                Period:{' '}
                <span className="text-neutral-200">
                  {formatDate(reviewModalRequest.start_date)} to{' '}
                  {formatDate(reviewModalRequest.end_date)} ({reviewModalRequest.total_days} Days)
                </span>
              </p>
              <p className="text-neutral-400">
                Reason:{' '}
                <span className="text-neutral-200 italic">"{reviewModalRequest.remarks}"</span>
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-300">HR Feedback Comment</label>
              <textarea
                rows={2}
                value={hrComment}
                onChange={(e) => setHrComment(e.target.value)}
                placeholder="Optional feedback for employee..."
                className="w-full bg-neutral-950 text-neutral-200 text-sm p-3 rounded-lg border border-neutral-800 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
