import React from 'react';
import { Card } from '../common/Card';
import type { LeaveAnalytics } from '../../services/reportsService';
import { Plane, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface LeaveSummaryProps {
  data: LeaveAnalytics;
  isLoading?: boolean;
}

export const LeaveSummary: React.FC<LeaveSummaryProps> = ({ data }) => {
  const totalDays = data.totalLeaveDays || 1;
  const paidPercent = Math.round((data.paidLeaveDays / totalDays) * 100) || 0;
  const sickPercent = Math.round((data.sickLeaveDays / totalDays) * 100) || 0;
  const unpaidPercent = Math.round((data.unpaidLeaveDays / totalDays) * 100) || 0;

  return (
    <div className="space-y-6">
      {/* Top Leave Types Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Paid Leaves
            </span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-bold text-white mt-2 font-mono">
            {data.paidLeaveDays}{' '}
            <span className="text-sm font-normal text-neutral-400 font-sans">Days</span>
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">{paidPercent}% of approved leaves</p>
        </Card>

        <Card className="p-4 bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Sick Leaves
            </span>
            <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Plane className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-bold text-white mt-2 font-mono">
            {data.sickLeaveDays}{' '}
            <span className="text-sm font-normal text-neutral-400 font-sans">Days</span>
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">{sickPercent}% of approved leaves</p>
        </Card>

        <Card className="p-4 bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Unpaid Leaves (LOP)
            </span>
            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-bold text-white mt-2 font-mono">
            {data.unpaidLeaveDays}{' '}
            <span className="text-sm font-normal text-neutral-400 font-sans">Days</span>
          </p>
          <p className="text-[11px] text-rose-400/90 mt-1">
            {unpaidPercent}% (Tied to Loss of Pay)
          </p>
        </Card>
      </div>

      {/* Leave Request Review Status Pipeline */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <Plane className="w-4 h-4 text-sky-400" />
            <span>Time-Off Request Pipeline</span>
          </h3>
          <span className="text-xs text-neutral-400 font-mono">HR Lifecycle</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-amber-300 font-medium">Pending Review</span>
              <p className="text-2xl font-bold text-white mt-0.5">{data.pendingCount}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-emerald-300 font-medium">Approved Requests</span>
              <p className="text-2xl font-bold text-white mt-0.5">{data.approvedCount}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/30 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-rose-300 font-medium">Rejected Requests</span>
              <p className="text-2xl font-bold text-white mt-0.5">{data.rejectedCount}</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-start gap-2.5 text-xs text-neutral-400 mt-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            Approved unpaid leave automatically marks employee attendance status as &apos;on_leave&apos; and is
            authoritatively factored into Loss of Pay (LOP) payslip formulas.
          </p>
        </div>
      </Card>
    </div>
  );
};
