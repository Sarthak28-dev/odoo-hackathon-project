import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { formatCurrency } from '../../lib/utils';
import type { PayrollAnalytics } from '../../services/reportsService';
import { DollarSign, ShieldCheck, TrendingDown, Wallet, Layers, CheckCircle2 } from 'lucide-react';

interface PayrollSummaryProps {
  data: PayrollAnalytics;
  isLoading?: boolean;
}

export const PayrollSummary: React.FC<PayrollSummaryProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* High-level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Total Gross Payroll
            </span>
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2 font-mono">
            {formatCurrency(data.totalGrossPayroll)}
          </h3>
          <p className="text-[11px] text-neutral-400 mt-1">
            Across {data.payslipCount} generated payslip{data.payslipCount === 1 ? '' : 's'}
          </p>
        </Card>

        <Card className="p-4 bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Net Payroll Payout
            </span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            {formatCurrency(data.totalNetPayroll)}
          </h3>
          <p className="text-[11px] text-emerald-500/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Avg: {formatCurrency(data.averageNetSalary)} / employee</span>
          </p>
        </Card>

        <Card className="p-4 bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Statutory Contributions
            </span>
            <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-sky-400 mt-2 font-mono">
            {formatCurrency(data.totalPfDeductions + data.totalPtDeductions)}
          </h3>
          <p className="text-[11px] text-neutral-400 mt-1">
            PF: {formatCurrency(data.totalPfDeductions)} • PT: {formatCurrency(data.totalPtDeductions)}
          </p>
        </Card>

        <Card className="p-4 bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Loss of Pay (LOP) Total
            </span>
            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-rose-400 mt-2 font-mono">
            - {formatCurrency(data.totalLopDeductions)}
          </h3>
          <p className="text-[11px] text-neutral-400 mt-1">Attendance-linked deductions</p>
        </Card>
      </div>

      {/* Payslip Processing Lifecycle Status */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Payroll Batch Processing Status</span>
          </h3>
          <Badge variant="admin">Monthly Payrun</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-neutral-400 font-medium">Draft Slips</span>
              <p className="text-2xl font-bold text-amber-400 mt-0.5">{data.statusCounts.draft}</p>
            </div>
            <Badge variant="draft" />
          </div>

          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-neutral-400 font-medium">Finalized Slips</span>
              <p className="text-2xl font-bold text-sky-400 mt-0.5">
                {data.statusCounts.finalized}
              </p>
            </div>
            <Badge variant="finalized" />
          </div>

          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-neutral-400 font-medium">Paid Slips</span>
              <p className="text-2xl font-bold text-emerald-400 mt-0.5">{data.statusCounts.paid}</p>
            </div>
            <Badge variant="paid" />
          </div>
        </div>
      </Card>
    </div>
  );
};
