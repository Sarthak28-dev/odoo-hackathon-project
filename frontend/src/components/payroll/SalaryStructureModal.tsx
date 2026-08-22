import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { formatCurrency } from '../../lib/utils';
import { upsertSalaryStructure } from '../../services/payrollService';
import type { Profile, SalaryStructure } from '../../types';
import { Layers, ShieldCheck, AlertCircle } from 'lucide-react';

interface SalaryStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  employee?: Profile | null;
  allEmployees?: Profile[];
  initialStructure?: SalaryStructure | null;
  onSuccess: (saved: SalaryStructure) => void;
}

export const SalaryStructureModal: React.FC<SalaryStructureModalProps> = ({
  isOpen,
  onClose,
  companyId,
  employee,
  allEmployees = [],
  initialStructure,
  onSuccess,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [monthlyWage, setMonthlyWage] = useState<number>(50000);
  const [workingDays, setWorkingDays] = useState<number>(5);
  const [workingHours, setWorkingHours] = useState<number>(8);
  const [breakHours, setBreakHours] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setSelectedUserId(employee.id);
    } else if (allEmployees.length > 0 && !selectedUserId) {
      setSelectedUserId(allEmployees[0].id);
    }

    if (initialStructure) {
      setMonthlyWage(Number(initialStructure.monthly_wage) || 50000);
      setWorkingDays(initialStructure.working_days_per_week || 5);
      setWorkingHours(Number(initialStructure.working_hours_per_day) || 8);
      setBreakHours(Number(initialStructure.break_hours) || 1);
    } else {
      setMonthlyWage(50000);
      setWorkingDays(5);
      setWorkingHours(8);
      setBreakHours(1);
    }
    setError(null);
  }, [employee, initialStructure, allEmployees, isOpen]);

  // Client-side preview calculations (mirrors PostgreSQL compute_salary_structure trigger)
  const basicSalary = Math.round(monthlyWage * 0.5);
  const hra = Math.round(basicSalary * 0.5);
  const standardAllowance = Math.round(basicSalary * 0.16668);
  const performanceBonus = Math.round(basicSalary * 0.0833);
  const lta = Math.round(basicSalary * 0.0833);
  const fixedAllowance = Math.max(0, Math.round(monthlyWage - (basicSalary + hra + standardAllowance + performanceBonus + lta)));
  const pfEmployee = Math.round(basicSalary * 0.12);
  const pt = 200;
  const totalDeductions = pfEmployee + pt;
  const netInHand = Math.round(monthlyWage - totalDeductions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select an employee');
      return;
    }
    if (monthlyWage <= 0) {
      setError('Monthly wage must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const saved = await upsertSalaryStructure({
        userId: selectedUserId,
        companyId,
        monthlyWage,
        workingDaysPerWeek: workingDays,
        workingHoursPerDay: workingHours,
        breakHours,
      });

      onSuccess(saved);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save salary structure';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmployeeObj =
    employee || allEmployees.find((e) => e.id === selectedUserId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Salary Structure"
      description="Define standard monthly wage and schedule parameters. Authoritative components are calculated on the backend."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Employee Selection */}
        {!employee && allEmployees.length > 0 ? (
          <Select
            label="Select Employee"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            options={allEmployees.map((emp) => ({
              label: `${emp.first_name} ${emp.last_name} (${emp.login_id})`,
              value: emp.id,
            }))}
            required
          />
        ) : (
          selectedEmployeeObj && (
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400">Configuring for</p>
                <p className="font-semibold text-white mt-0.5">
                  {selectedEmployeeObj.first_name} {selectedEmployeeObj.last_name}
                </p>
              </div>
              <span className="font-mono text-xs text-purple-400">
                {selectedEmployeeObj.login_id}
              </span>
            </div>
          )
        )}

        {/* Base Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Base Monthly Wage (₹)"
            type="number"
            min={1000}
            step={100}
            value={monthlyWage || ''}
            onChange={(e) => setMonthlyWage(Number(e.target.value))}
            placeholder="e.g. 50000"
            helperText={`Yearly Wage: ${formatCurrency(monthlyWage * 12)}`}
            required
          />

          <Input
            label="Working Days / Week"
            type="number"
            min={1}
            max={7}
            value={workingDays || ''}
            onChange={(e) => setWorkingDays(Number(e.target.value))}
            required
          />

          <Input
            label="Working Hours / Day"
            type="number"
            min={1}
            max={24}
            step={0.5}
            value={workingHours || ''}
            onChange={(e) => setWorkingHours(Number(e.target.value))}
            required
          />

          <Input
            label="Daily Break Time (Hours)"
            type="number"
            min={0}
            max={5}
            step={0.5}
            value={breakHours || ''}
            onChange={(e) => setBreakHours(Number(e.target.value))}
            required
          />
        </div>

        {/* Live Calculation Breakdown Preview */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Authoritative Salary Breakdown Preview</span>
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {formatCurrency(monthlyWage)} / mo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-900">
              <span className="text-neutral-400">Basic Salary (50%)</span>
              <span className="font-mono text-neutral-200">{formatCurrency(basicSalary)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-900">
              <span className="text-neutral-400">House Rent Allowance (50% Basic)</span>
              <span className="font-mono text-neutral-200">{formatCurrency(hra)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-900">
              <span className="text-neutral-400">Standard Allowance (16.67%)</span>
              <span className="font-mono text-neutral-200">{formatCurrency(standardAllowance)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-900">
              <span className="text-neutral-400">Performance Bonus (8.33%)</span>
              <span className="font-mono text-neutral-200">{formatCurrency(performanceBonus)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-900">
              <span className="text-neutral-400">Leave Travel Allowance (8.33%)</span>
              <span className="font-mono text-neutral-200">{formatCurrency(lta)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-900">
              <span className="text-neutral-400">Fixed Allowance (Balancing)</span>
              <span className="font-mono text-neutral-200">{formatCurrency(fixedAllowance)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-900 text-rose-300">
              <span>Employee PF (12% of Basic)</span>
              <span className="font-mono">- {formatCurrency(pfEmployee)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-900 text-rose-300">
              <span>Professional Tax (PT Fixed)</span>
              <span className="font-mono">- {formatCurrency(pt)}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/30">
            <div>
              <p className="text-xs font-semibold text-emerald-400">Estimated Net Monthly In-Hand</p>
              <p className="text-[10px] text-neutral-500">Before monthly attendance LOP deductions</p>
            </div>
            <span className="font-mono font-bold text-base text-emerald-400">
              {formatCurrency(netInHand)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Save Salary Structure
          </Button>
        </div>
      </form>
    </Modal>
  );
};
