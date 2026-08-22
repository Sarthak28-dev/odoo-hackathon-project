import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatCurrency } from '../../lib/utils';
import type { Profile, SalaryStructure as SalaryStructureType } from '../../types';
import { SalaryStructureModal } from './SalaryStructureModal';
import {
  DollarSign,
  Calendar,
  Clock,
  Edit,
  ShieldAlert,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface SalaryStructureProps {
  salaryStructure: SalaryStructureType | null;
  employee?: Profile | null;
  isAdmin?: boolean;
  companyId: string;
  onStructureUpdated?: (updated: SalaryStructureType) => void;
}

export const SalaryStructure: React.FC<SalaryStructureProps> = ({
  salaryStructure,
  employee,
  isAdmin = false,
  companyId,
  onStructureUpdated,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!salaryStructure) {
    return (
      <Card className="p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">No Salary Structure Configured</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1">
            {isAdmin
              ? 'This employee has no salary structure configured yet. Configure base monthly wage to enable automated payslips.'
              : 'Your salary structure has not been configured yet. Please contact HR.'}
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Sparkles className="w-4 h-4" />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Configure Salary Structure
          </Button>
        )}

        <SalaryStructureModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          companyId={companyId}
          employee={employee}
          initialStructure={null}
          onSuccess={(saved) => {
            if (onStructureUpdated) onStructureUpdated(saved);
          }}
        />
      </Card>
    );
  }

  const monthlyWage = Number(salaryStructure.monthly_wage) || 0;
  const yearlyWage = Number(salaryStructure.yearly_wage) || monthlyWage * 12;
  const basicSalary = Number(salaryStructure.basic_salary) || Math.round(monthlyWage * 0.5);
  const hra = Number(salaryStructure.hra) || Math.round(basicSalary * 0.5);
  const standardAllowance =
    Number(salaryStructure.standard_allowance) || Math.round(basicSalary * 0.16668);
  const performanceBonus =
    Number(salaryStructure.performance_bonus) || Math.round(basicSalary * 0.0833);
  const lta =
    Number(salaryStructure.leave_travel_allowance) || Math.round(basicSalary * 0.0833);
  const fixedAllowance =
    Number(salaryStructure.fixed_allowance) ||
    Math.max(0, Math.round(monthlyWage - (basicSalary + hra + standardAllowance + performanceBonus + lta)));

  const pfRate = Number(salaryStructure.pf_employee_rate) || 12.0;
  const pfEmployee = Math.round(basicSalary * (pfRate / 100));
  const pt = Number(salaryStructure.professional_tax) || 200.0;
  const totalDeductions = pfEmployee + pt;
  const estimatedNet = Math.round(monthlyWage - totalDeductions);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {employee
                  ? `${employee.first_name} ${employee.last_name}'s Compensation`
                  : 'Compensation Structure'}
              </h2>
              <Badge variant="admin">Verified Structure</Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Base Gross Wage:{' '}
              <span className="text-white font-mono font-semibold">
                {formatCurrency(monthlyWage)} / month
              </span>{' '}
              ({formatCurrency(yearlyWage)} CTC)
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Structure
          </Button>
        )}
      </div>

      {/* Schedule Parameters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3.5 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <p className="text-[11px] text-neutral-400 uppercase font-medium">Working Days</p>
            <p className="text-sm font-semibold text-white mt-0.5">
              {salaryStructure.working_days_per_week || 5} Days / Week
            </p>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <Clock className="w-5 h-5 text-sky-400 shrink-0" />
          <div>
            <p className="text-[11px] text-neutral-400 uppercase font-medium">Shift Hours</p>
            <p className="text-sm font-semibold text-white mt-0.5">
              {salaryStructure.working_hours_per_day || 8} Hours / Day
            </p>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <Layers className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-[11px] text-neutral-400 uppercase font-medium">Daily Break Time</p>
            <p className="text-sm font-semibold text-white mt-0.5">
              {salaryStructure.break_hours || 1} Hour
            </p>
          </div>
        </Card>
      </div>

      {/* Detailed Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Column */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Earnings Components</span>
            </h3>
            <span className="text-xs text-neutral-400 font-mono">Monthly Amount</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-neutral-900">
              <div>
                <p className="text-neutral-200 font-medium">Basic Salary</p>
                <p className="text-[10px] text-neutral-500">50% of Monthly Wage</p>
              </div>
              <span className="font-mono text-neutral-200 font-semibold">
                {formatCurrency(basicSalary)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-neutral-900">
              <div>
                <p className="text-neutral-200 font-medium">House Rent Allowance (HRA)</p>
                <p className="text-[10px] text-neutral-500">50% of Basic Salary</p>
              </div>
              <span className="font-mono text-neutral-200 font-semibold">
                {formatCurrency(hra)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-neutral-900">
              <div>
                <p className="text-neutral-200 font-medium">Standard Allowance</p>
                <p className="text-[10px] text-neutral-500">16.67% of Basic Salary</p>
              </div>
              <span className="font-mono text-neutral-200 font-semibold">
                {formatCurrency(standardAllowance)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-neutral-900">
              <div>
                <p className="text-neutral-200 font-medium">Performance Bonus</p>
                <p className="text-[10px] text-neutral-500">8.33% of Basic Salary</p>
              </div>
              <span className="font-mono text-neutral-200 font-semibold">
                {formatCurrency(performanceBonus)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-neutral-900">
              <div>
                <p className="text-neutral-200 font-medium">Leave Travel Allowance (LTA)</p>
                <p className="text-[10px] text-neutral-500">8.33% of Basic Salary</p>
              </div>
              <span className="font-mono text-neutral-200 font-semibold">
                {formatCurrency(lta)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-neutral-900">
              <div>
                <p className="text-neutral-200 font-medium">Fixed Allowance</p>
                <p className="text-[10px] text-neutral-500">Balancing Wage Component</p>
              </div>
              <span className="font-mono text-neutral-200 font-semibold">
                {formatCurrency(fixedAllowance)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-neutral-800 text-sm font-bold text-white">
              <span>Gross Total Monthly Earnings</span>
              <span className="font-mono text-purple-300">{formatCurrency(monthlyWage)}</span>
            </div>
          </div>
        </Card>

        {/* Deductions & Statutory Column */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Statutory Deductions</span>
              </h3>
              <span className="text-xs text-neutral-400 font-mono">Deductions</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-neutral-900">
                <div>
                  <p className="text-neutral-200 font-medium">Employee Provident Fund (PF)</p>
                  <p className="text-[10px] text-neutral-500">
                    {pfRate}% of Basic Salary (Statutory)
                  </p>
                </div>
                <span className="font-mono text-rose-400 font-semibold">
                  - {formatCurrency(pfEmployee)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-neutral-900">
                <div>
                  <p className="text-neutral-200 font-medium">Professional Tax (PT)</p>
                  <p className="text-[10px] text-neutral-500">State Statutory Tax</p>
                </div>
                <span className="font-mono text-rose-400 font-semibold">
                  - {formatCurrency(pt)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-neutral-900 text-neutral-400">
                <div>
                  <p className="text-neutral-300 font-medium">Employer PF Contribution</p>
                  <p className="text-[10px] text-neutral-500">
                    {salaryStructure.pf_employer_rate || 12}% (Paid by company, non-deducted)
                  </p>
                </div>
                <span className="font-mono text-neutral-400">
                  {formatCurrency(pfEmployee)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-neutral-800 text-sm font-bold text-rose-400">
                <span>Total Monthly Deductions</span>
                <span className="font-mono">- {formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </Card>

          {/* Net Salary Summary Card */}
          <div className="p-5 bg-gradient-to-br from-emerald-950/40 to-neutral-950 border border-emerald-800/40 rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                Target Monthly Net In-Hand
              </p>
              <p className="text-xs text-emerald-500/80 mt-0.5">
                Before dynamic attendance LOP deductions
              </p>
            </div>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {formatCurrency(estimatedNet)}
            </span>
          </div>

          <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/80 flex items-start gap-2.5 text-xs text-neutral-400">
            <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p>
              Actual monthly payout is calculated during payroll run by deducting Loss of Pay (LOP)
              for unpaid leaves and unexcused absences.
            </p>
          </div>
        </div>
      </div>

      {/* Salary Structure Modal */}
      <SalaryStructureModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        companyId={companyId}
        employee={employee}
        initialStructure={salaryStructure}
        onSuccess={(saved) => {
          if (onStructureUpdated) onStructureUpdated(saved);
        }}
      />
    </div>
  );
};
