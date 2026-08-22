import React from 'react';
import { Card } from '../common/Card';
import { formatCurrency } from '../../lib/utils';
import {
  DollarSign,
  CheckCircle2,
  TrendingDown,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import type { Payslip } from '../../types';

interface PayrollSummaryCardsProps {
  payslips: Payslip[];
  isLoading?: boolean;
}

export const PayrollSummaryCards: React.FC<PayrollSummaryCardsProps> = ({
  payslips,
}) => {
  const totalGross = payslips.reduce((acc, p) => acc + (Number(p.gross_salary) || 0), 0);
  const totalLop = payslips.reduce((acc, p) => acc + (Number(p.lop_deduction) || 0), 0);
  const totalPf = payslips.reduce((acc, p) => acc + (Number(p.pf_deduction) || 0), 0);
  const totalPt = payslips.reduce((acc, p) => acc + (Number(p.pt_deduction) || 0), 0);
  const totalDeductions = totalLop + totalPf + totalPt;
  const totalNet = payslips.reduce((acc, p) => acc + (Number(p.net_salary) || 0), 0);
  const averageNet = payslips.length > 0 ? Math.round(totalNet / payslips.length) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Gross Payroll */}
      <Card hoverEffect className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
          <DollarSign className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
            Total Gross Wage
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5 truncate">
            {formatCurrency(totalGross)}
          </h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Across {payslips.length} employee{payslips.length === 1 ? '' : 's'}
          </p>
        </div>
      </Card>

      {/* Net Disbursed */}
      <Card hoverEffect className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          <Wallet className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
            Total Net Payout
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5 truncate">
            {formatCurrency(totalNet)}
          </h3>
          <p className="text-[11px] text-emerald-500/80 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Avg: {formatCurrency(averageNet)} / emp</span>
          </p>
        </div>
      </Card>

      {/* Statutory Deductions */}
      <Card hoverEffect className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
            Statutory (PF + PT)
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-sky-400 mt-0.5 truncate">
            {formatCurrency(totalPf + totalPt)}
          </h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            PF: {formatCurrency(totalPf)} • PT: {formatCurrency(totalPt)}
          </p>
        </div>
      </Card>

      {/* Loss of Pay (LOP) */}
      <Card hoverEffect className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
          <TrendingDown className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
            Loss of Pay (LOP)
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-rose-400 mt-0.5 truncate">
            - {formatCurrency(totalLop)}
          </h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Total deductions: {formatCurrency(totalDeductions)}
          </p>
        </div>
      </Card>
    </div>
  );
};
