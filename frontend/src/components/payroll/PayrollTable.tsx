import React, { useState } from 'react';
import { Table, type Column } from '../common/Table';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Tabs } from '../common/Tabs';
import { formatCurrency } from '../../lib/utils';
import type { Payslip, PayslipStatus } from '../../types';
import { Eye, CheckCircle, CheckCheck, Search } from 'lucide-react';

interface PayrollTableProps {
  payslips: Payslip[];
  isAdmin?: boolean;
  onViewSlip: (payslip: Payslip) => void;
  onUpdateStatus?: (payslipId: string, status: PayslipStatus) => Promise<void>;
  isLoading?: boolean;
}

export const PayrollTable: React.FC<PayrollTableProps> = ({
  payslips,
  isAdmin = false,
  onViewSlip,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const statusTabs = [
    { id: 'all', label: 'All Payslips', count: payslips.length },
    {
      id: 'draft',
      label: 'Draft',
      count: payslips.filter((p) => p.status === 'draft').length,
    },
    {
      id: 'finalized',
      label: 'Finalized',
      count: payslips.filter((p) => p.status === 'finalized').length,
    },
    {
      id: 'paid',
      label: 'Paid',
      count: payslips.filter((p) => p.status === 'paid').length,
    },
  ];

  const filteredSlips = payslips.filter((p) => {
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    const name = `${p.profile?.first_name || ''} ${p.profile?.last_name || ''}`.toLowerCase();
    const loginId = (p.profile?.login_id || '').toLowerCase();
    const matchesSearch =
      !searchQuery ||
      name.includes(searchQuery.toLowerCase().trim()) ||
      loginId.includes(searchQuery.toLowerCase().trim());
    return matchesTab && matchesSearch;
  });

  const handleQuickStatus = async (payslipId: string, nextStatus: PayslipStatus) => {
    if (!onUpdateStatus) return;
    setUpdatingId(payslipId);
    try {
      await onUpdateStatus(payslipId, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<Payslip>[] = [
    {
      header: 'Employee',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-semibold text-purple-300">
            {row.profile?.first_name?.[0] || 'E'}
            {row.profile?.last_name?.[0] || 'U'}
          </div>
          <div>
            <p className="font-medium text-neutral-100 text-xs sm:text-sm">
              {row.profile?.first_name} {row.profile?.last_name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono text-purple-400">
                {row.profile?.login_id || 'OIJODO20220001'}
              </span>
              {row.profile?.department && (
                <span className="text-[10px] text-neutral-500">
                  • {row.profile.department}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Period',
      accessorKey: 'payroll_period',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-neutral-300">
          {row.payroll_period}
        </span>
      ),
    },
    {
      header: 'Payable Days',
      cell: (row) => (
        <div>
          <span className="text-xs font-semibold text-emerald-400 font-mono">
            {row.payable_days}
          </span>
          <span className="text-xs text-neutral-500 font-mono">
            {' '}
            / {row.total_working_days} Days
          </span>
        </div>
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
      header: 'LOP Deduction',
      cell: (row) => (
        <span
          className={`font-mono text-xs ${
            Number(row.lop_deduction) > 0 ? 'text-rose-400 font-semibold' : 'text-neutral-500'
          }`}
        >
          {Number(row.lop_deduction) > 0
            ? `- ${formatCurrency(row.lop_deduction)}`
            : '₹0.00'}
        </span>
      ),
    },
    {
      header: 'Statutory (PF+PT)',
      cell: (row) => (
        <span className="font-mono text-xs text-neutral-400">
          - {formatCurrency(Number(row.pf_deduction || 0) + Number(row.pt_deduction || 0))}
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
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => onViewSlip(row)}
            className="text-xs h-7 px-2.5"
            title="View Salary Slip"
          >
            Salary Slip
          </Button>

          {isAdmin && row.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle className="w-3 h-3" />}
              onClick={() => handleQuickStatus(row.id, 'finalized')}
              isLoading={updatingId === row.id}
              className="text-xs h-7 px-2"
              title="Finalize"
            >
              Finalize
            </Button>
          )}

          {isAdmin && row.status === 'finalized' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCheck className="w-3 h-3" />}
              onClick={() => handleQuickStatus(row.id, 'paid')}
              isLoading={updatingId === row.id}
              className="text-xs h-7 px-2 bg-emerald-600 hover:bg-emerald-500"
              title="Mark Paid"
            >
              Mark Paid
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <Tabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search employee or login ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filteredSlips}
        keyExtractor={(row) => row.id}
        emptyMessage={
          searchQuery
            ? 'No payslips match your search query.'
            : 'No payslip records found for this period. Click "Run Monthly Payroll" above to generate.'
        }
      />
    </div>
  );
};
