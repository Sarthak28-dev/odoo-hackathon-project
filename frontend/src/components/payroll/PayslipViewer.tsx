import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatCurrency } from '../../lib/utils';
import type { Payslip, PayslipStatus } from '../../types';
import { updatePayslipStatus } from '../../services/payrollService';
import {
  Layers,
  Printer,
  CheckCircle,
  CheckCheck,
  AlertCircle,
  Calendar,
  Wallet,
} from 'lucide-react';

interface PayslipViewerProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: Payslip | null;
  companyName?: string;
  isAdmin?: boolean;
  onStatusUpdated?: (updatedSlip: Payslip) => void;
}

export const PayslipViewer: React.FC<PayslipViewerProps> = ({
  isOpen,
  onClose,
  payslip,
  companyName = 'Dayflow Organization',
  isAdmin = false,
  onStatusUpdated,
}) => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!payslip) return null;

  const handleStatusChange = async (newStatus: PayslipStatus) => {
    setIsUpdating(true);
    setError(null);
    try {
      const updated = await updatePayslipStatus(payslip.id, newStatus);
      if (onStatusUpdated) onStatusUpdated(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update payslip status';
      setError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculations for earnings components based on Section 9 PRD rules
  const grossSalary = Number(payslip.gross_salary) || 0;
  const basicSalary = Math.round(grossSalary * 0.5);
  const hra = Math.round(basicSalary * 0.5);
  const standardAllowance = Math.round(basicSalary * 0.16668);
  const performanceBonus = Math.round(basicSalary * 0.0833);
  const lta = Math.round(basicSalary * 0.0833);
  const fixedAllowance = Math.max(
    0,
    Math.round(grossSalary - (basicSalary + hra + standardAllowance + performanceBonus + lta))
  );

  const lopDays = Math.max(
    0,
    Number(payslip.total_working_days) - Number(payslip.payable_days)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Payslip / Salary Slip"
      description={`Generated compensation and attendance statement for ${payslip.payroll_period}`}
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-500">
              Slip ID: {payslip.id.slice(0, 13)}
            </span>
            <Badge variant={payslip.status} />
          </div>

          <div className="flex items-center gap-2">
            {/* Admin Workflow Status Actions */}
            {isAdmin && payslip.status === 'draft' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStatusChange('finalized')}
                isLoading={isUpdating}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Finalize Payslip
              </Button>
            )}

            {isAdmin && payslip.status === 'finalized' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStatusChange('paid')}
                isLoading={isUpdating}
                leftIcon={<CheckCheck className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                Mark as Paid
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Print / PDF
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-neutral-200 print:text-black">
        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Payslip Header */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{companyName}</h3>
              <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Payroll Period: <strong className="text-neutral-200">{payslip.payroll_period}</strong></span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <Badge variant={payslip.status} />
            <p className="text-[11px] text-neutral-500 font-mono mt-1">
              Generated: {new Date(payslip.generated_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Employee & Bank Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl text-xs">
          <div>
            <p className="text-neutral-500 font-medium">Employee Name</p>
            <p className="font-semibold text-white mt-0.5 truncate">
              {payslip.profile?.first_name} {payslip.profile?.last_name}
            </p>
          </div>

          <div>
            <p className="text-neutral-500 font-medium">Login / Employee ID</p>
            <p className="font-mono text-purple-400 font-semibold mt-0.5">
              {payslip.profile?.login_id || 'OIJODO20220001'}
            </p>
          </div>

          <div>
            <p className="text-neutral-500 font-medium">Department</p>
            <p className="text-neutral-200 mt-0.5">{payslip.profile?.department || 'General'}</p>
          </div>

          <div>
            <p className="text-neutral-500 font-medium">Designation</p>
            <p className="text-neutral-200 mt-0.5">{payslip.profile?.job_position || 'Staff'}</p>
          </div>

          <div>
            <p className="text-neutral-500 font-medium">Bank Account</p>
            <p className="font-mono text-neutral-200 mt-0.5">
              {payslip.profile?.bank_account_no || '••••••••1928'}
            </p>
          </div>

          <div>
            <p className="text-neutral-500 font-medium">Tax Identifier (PAN)</p>
            <p className="font-mono text-neutral-200 mt-0.5">
              {payslip.profile?.pan_no || 'ABCDE1234F'}
            </p>
          </div>

          <div>
            <p className="text-neutral-500 font-medium">Total Working Days</p>
            <p className="font-semibold text-white mt-0.5">
              {payslip.total_working_days} Days
            </p>
          </div>

          <div>
            <p className="text-neutral-500 font-medium">Payable Days</p>
            <p className="font-bold text-emerald-400 mt-0.5">
              {payslip.payable_days} Days
            </p>
          </div>
        </div>

        {/* Attendance Summary Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-center text-xs">
          <div className="p-1.5 bg-neutral-900/80 rounded-lg">
            <span className="text-[10px] text-neutral-400">Present Days</span>
            <p className="text-sm font-bold text-emerald-400 mt-0.5">{payslip.days_present}</p>
          </div>
          <div className="p-1.5 bg-neutral-900/80 rounded-lg">
            <span className="text-[10px] text-neutral-400">Paid Leave</span>
            <p className="text-sm font-bold text-sky-400 mt-0.5">{payslip.paid_leaves}</p>
          </div>
          <div className="p-1.5 bg-neutral-900/80 rounded-lg">
            <span className="text-[10px] text-neutral-400">Unpaid Leave</span>
            <p className="text-sm font-bold text-amber-400 mt-0.5">{payslip.unpaid_leaves}</p>
          </div>
          <div className="p-1.5 bg-neutral-900/80 rounded-lg">
            <span className="text-[10px] text-neutral-400">Absent Days</span>
            <p className="text-sm font-bold text-rose-400 mt-0.5">{payslip.absent_days}</p>
          </div>
          <div className="p-1.5 bg-neutral-900/80 rounded-lg">
            <span className="text-[10px] text-neutral-400">LOP Days</span>
            <p className="text-sm font-bold text-rose-400 mt-0.5">{lopDays}</p>
          </div>
          <div className="p-1.5 bg-neutral-900/80 rounded-lg">
            <span className="text-[10px] text-neutral-400">Payable Days</span>
            <p className="text-sm font-bold text-emerald-400 mt-0.5">{payslip.payable_days}</p>
          </div>
        </div>

        {/* Earnings vs Deductions Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Earnings Breakdown */}
          <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-2">
            <p className="font-semibold text-neutral-300 uppercase tracking-wider pb-2 border-b border-neutral-800">
              Earnings Breakdown
            </p>
            <div className="flex justify-between py-0.5">
              <span className="text-neutral-400">Basic Salary (50%)</span>
              <span className="font-mono text-neutral-200">{formatCurrency(basicSalary)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-neutral-400">House Rent Allowance (HRA)</span>
              <span className="font-mono text-neutral-200">{formatCurrency(hra)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-neutral-400">Standard Allowance</span>
              <span className="font-mono text-neutral-200">{formatCurrency(standardAllowance)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-neutral-400">Performance Bonus</span>
              <span className="font-mono text-neutral-200">{formatCurrency(performanceBonus)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-neutral-400">Leave Travel Allowance (LTA)</span>
              <span className="font-mono text-neutral-200">{formatCurrency(lta)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-neutral-400">Fixed Allowance</span>
              <span className="font-mono text-neutral-200">{formatCurrency(fixedAllowance)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-neutral-800 font-bold text-white text-sm">
              <span>Gross Earnings</span>
              <span className="font-mono text-purple-300">{formatCurrency(grossSalary)}</span>
            </div>
          </div>

          {/* Deductions Breakdown */}
          <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-2">
            <p className="font-semibold text-neutral-300 uppercase tracking-wider pb-2 border-b border-neutral-800">
              Deductions Breakdown
            </p>
            <div className="flex justify-between py-0.5 text-neutral-400">
              <span>Loss of Pay (Unpaid / Absent)</span>
              <span className="font-mono text-rose-400">
                - {formatCurrency(payslip.lop_deduction)}
              </span>
            </div>
            <div className="flex justify-between py-0.5 text-neutral-400">
              <span>Employee Provident Fund (PF 12%)</span>
              <span className="font-mono text-rose-400">
                - {formatCurrency(payslip.pf_deduction)}
              </span>
            </div>
            <div className="flex justify-between py-0.5 text-neutral-400">
              <span>Professional Tax (PT)</span>
              <span className="font-mono text-rose-400">
                - {formatCurrency(payslip.pt_deduction)}
              </span>
            </div>
            <div className="flex justify-between pt-10 border-t border-neutral-800 font-bold text-rose-300 text-sm">
              <span>Total Deductions</span>
              <span className="font-mono">- {formatCurrency(payslip.total_deductions)}</span>
            </div>
          </div>
        </div>

        {/* Net Salary Payable Highlight */}
        <div className="p-4 bg-gradient-to-br from-emerald-950/50 to-neutral-950 border border-emerald-800/50 rounded-xl flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                Net Salary Payable
              </p>
              <p className="text-xs text-emerald-400/80">
                Disbursed to bank account ({payslip.profile?.bank_account_no || '••••••••1928'})
              </p>
            </div>
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(payslip.net_salary)}
          </span>
        </div>
      </div>
    </Modal>
  );
};
