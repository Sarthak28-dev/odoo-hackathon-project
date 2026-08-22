import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Table, type Column } from '../components/common/Table';
import { mockPayslips, mockSalaryStructure, mockProfiles } from '../services/mockData';
import type { Payslip } from '../types';
import { formatCurrency } from '../lib/utils';
import {
  DollarSign,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const { profile, role } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>(mockPayslips);
  const [viewingSlip, setViewingSlip] = useState<Payslip | null>(null);
  const [isGeneratedAlert, setIsGeneratedAlert] = useState(false);

  const isEmployee = role === 'employee';

  const displayedSlips = payslips.filter((p) => (isEmployee ? p.user_id === profile?.id : true));

  const handleGeneratePayroll = () => {
    // Generate new payslips for all active employees for current month
    const newSlips: Payslip[] = mockProfiles.map((emp, i) => ({
      id: `p-new-${i}`,
      user_id: emp.id,
      company_id: emp.company_id,
      payroll_period: '2026-08',
      total_working_days: 22,
      days_present: 21,
      paid_leaves: 1,
      unpaid_leaves: 0,
      absent_days: 0,
      payable_days: 22,
      gross_salary: 50000.0,
      lop_deduction: 0.0,
      pf_deduction: 3000.0,
      pt_deduction: 200.0,
      total_deductions: 3200.0,
      net_salary: 46800.0,
      status: 'finalized',
      generated_at: new Date().toISOString(),
      profile: {
        first_name: emp.first_name,
        last_name: emp.last_name,
        emp_code: emp.emp_code,
        login_id: emp.login_id,
        job_position: emp.job_position,
        department: emp.department,
        bank_account_no: emp.bank_account_no,
        pan_no: emp.pan_no,
      },
    }));

    setPayslips([...newSlips, ...payslips]);
    setIsGeneratedAlert(true);
    setTimeout(() => setIsGeneratedAlert(false), 3000);
  };

  const columns: Column<Payslip>[] = [
    {
      header: 'Employee',
      cell: (row) => (
        <div>
          <p className="font-medium text-neutral-100">
            {row.profile?.first_name} {row.profile?.last_name}
          </p>
          <p className="text-[11px] font-mono text-purple-400">{row.profile?.login_id}</p>
        </div>
      ),
    },
    {
      header: 'Period',
      accessorKey: 'payroll_period',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-neutral-200">
          {row.payroll_period}
        </span>
      ),
    },
    {
      header: 'Payable Days',
      cell: (row) => (
        <span className="text-xs text-neutral-300">
          {row.payable_days} / {row.total_working_days} Days
        </span>
      ),
    },
    {
      header: 'Gross Wage',
      cell: (row) => (
        <span className="font-mono text-xs text-neutral-300">
          {formatCurrency(row.gross_salary)}
        </span>
      ),
    },
    {
      header: 'Deductions (LOP+PF+PT)',
      cell: (row) => (
        <span className="font-mono text-xs text-rose-400">
          - {formatCurrency(row.total_deductions)}
        </span>
      ),
    },
    {
      header: 'Net Salary',
      cell: (row) => (
        <span className="font-mono font-bold text-sm text-emerald-400">
          {formatCurrency(row.net_salary)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <Badge variant={row.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          onClick={() => setViewingSlip(row)}
          className="text-xs"
        >
          Salary Slip
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Payroll & Compensation
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            {isEmployee
              ? 'View monthly payslips, attendance deductions, and salary slips'
              : 'Company-wide salary structures, attendance-linked LOP, and monthly payroll batches'}
          </p>
        </div>

        {role === 'admin' && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<DollarSign className="w-4 h-4" />}
            onClick={handleGeneratePayroll}
          >
            Run Monthly Payroll
          </Button>
        )}
      </div>

      {isGeneratedAlert && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Payroll generated for all active employees based on logged attendance!</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverEffect className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium uppercase">Base Monthly Wage</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">
              {formatCurrency(mockSalaryStructure.monthly_wage)}
            </h3>
          </div>
        </Card>

        <Card hoverEffect className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium uppercase">Net In-Hand Average</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-0.5">
              {formatCurrency(46800.0)}
            </h3>
          </div>
        </Card>

        <Card hoverEffect className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium uppercase">Pay Day Cycle</p>
            <h3 className="text-2xl font-bold text-sky-400 mt-0.5">Monthly (Last Day)</h3>
          </div>
        </Card>
      </div>

      {/* Payslips Table */}
      <Table
        columns={columns}
        data={displayedSlips}
        keyExtractor={(row) => row.id}
        emptyMessage="No payslip records generated yet."
      />

      {/* SALARY SLIP POPUP MODAL (Matching PRD & Wireframe specs) */}
      <Modal
        isOpen={Boolean(viewingSlip)}
        onClose={() => setViewingSlip(null)}
        title="Official Payslip / Salary Slip"
        description="Generated compensation and attendance statement."
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-mono text-neutral-500">
              Slip ID: {viewingSlip?.id}
            </span>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => alert('Salary Slip PDF downloaded!')}
            >
              Download PDF
            </Button>
          </div>
        }
      >
        {viewingSlip && (
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-6 text-neutral-200">
            {/* Payslip Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Odoo India Pvt Ltd</h3>
                  <p className="text-xs text-neutral-400">Payroll Period: {viewingSlip.payroll_period}</p>
                </div>
              </div>
              <Badge variant={viewingSlip.status} />
            </div>

            {/* Employee Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-neutral-500">Employee Name</p>
                <p className="font-semibold text-white mt-0.5">
                  {viewingSlip.profile?.first_name} {viewingSlip.profile?.last_name}
                </p>
              </div>
              <div>
                <p className="text-neutral-500">Login / Employee ID</p>
                <p className="font-mono text-purple-300 mt-0.5">{viewingSlip.profile?.login_id}</p>
              </div>
              <div>
                <p className="text-neutral-500">Designation</p>
                <p className="text-neutral-300 mt-0.5">{viewingSlip.profile?.job_position || 'Engineer'}</p>
              </div>
              <div>
                <p className="text-neutral-500">Bank Account</p>
                <p className="font-mono text-neutral-300 mt-0.5">
                  {viewingSlip.profile?.bank_account_no || '••••••••1928'}
                </p>
              </div>
              <div>
                <p className="text-neutral-500">PAN Number</p>
                <p className="font-mono text-neutral-300 mt-0.5">{viewingSlip.profile?.pan_no || 'ABCDE1234F'}</p>
              </div>
              <div>
                <p className="text-neutral-500">Payable Days</p>
                <p className="font-semibold text-emerald-400 mt-0.5">
                  {viewingSlip.payable_days} / {viewingSlip.total_working_days} Days
                </p>
              </div>
            </div>

            {/* Earnings vs Deductions Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              {/* Earnings Column */}
              <div className="bg-neutral-900/60 p-3.5 rounded-lg border border-neutral-800 space-y-2">
                <p className="font-semibold text-neutral-300 uppercase tracking-wider pb-1 border-b border-neutral-800">
                  Earnings Breakdown
                </p>
                <div className="flex justify-between">
                  <span>Basic Salary</span>
                  <span className="font-mono">₹25,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span>House Rent Allowance (HRA)</span>
                  <span className="font-mono">₹12,500.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Allowance</span>
                  <span className="font-mono">₹4,167.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Performance Bonus</span>
                  <span className="font-mono">₹2,082.50</span>
                </div>
                <div className="flex justify-between">
                  <span>Leave Travel Allowance</span>
                  <span className="font-mono">₹2,082.50</span>
                </div>
                <div className="flex justify-between">
                  <span>Fixed Allowance</span>
                  <span className="font-mono">₹4,168.00</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-800 font-bold text-white">
                  <span>Gross Total Earnings</span>
                  <span className="font-mono">{formatCurrency(viewingSlip.gross_salary)}</span>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="bg-neutral-900/60 p-3.5 rounded-lg border border-neutral-800 space-y-2">
                <p className="font-semibold text-neutral-300 uppercase tracking-wider pb-1 border-b border-neutral-800">
                  Deductions Breakdown
                </p>
                <div className="flex justify-between text-neutral-400">
                  <span>Loss of Pay (Unpaid Leave / Absent)</span>
                  <span className="font-mono text-rose-400">
                    - {formatCurrency(viewingSlip.lop_deduction)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Employee PF (12%)</span>
                  <span className="font-mono text-rose-400">
                    - {formatCurrency(viewingSlip.pf_deduction)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Professional Tax (PT)</span>
                  <span className="font-mono text-rose-400">
                    - {formatCurrency(viewingSlip.pt_deduction)}
                  </span>
                </div>
                <div className="flex justify-between pt-8 border-t border-neutral-800 font-bold text-rose-300">
                  <span>Total Deductions</span>
                  <span className="font-mono">- {formatCurrency(viewingSlip.total_deductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Summary */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 font-medium">NET SALARY PAYABLE</p>
                <p className="text-xs text-emerald-500/80">Transferred to registered bank account</p>
              </div>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {formatCurrency(viewingSlip.net_salary)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
