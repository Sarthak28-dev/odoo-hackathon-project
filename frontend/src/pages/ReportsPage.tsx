import React from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { formatCurrency } from '../lib/utils';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  CalendarCheck,
  Plane,
  AlertTriangle,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Title Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          HR Reports & Analytics Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
          Executive insights on workforce presence, time-off trends, and payroll expenses
        </p>
      </div>

      {/* Top High-level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase">
              Average Attendance
            </span>
            <CalendarCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2">94.2%</h3>
          <p className="text-xs text-emerald-500/80 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+2.1% from previous month</span>
          </p>
        </Card>

        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase">
              Monthly Gross Payroll
            </span>
            <DollarSign className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">{formatCurrency(250000)}</h3>
          <p className="text-xs text-neutral-400 mt-1">Across 5 active employees</p>
        </Card>

        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase">
              Statutory Deductions (PF/PT)
            </span>
            <BarChart3 className="w-5 h-5 text-sky-400" />
          </div>
          <h3 className="text-2xl font-bold text-sky-400 mt-2">{formatCurrency(16000)}</h3>
          <p className="text-xs text-neutral-400 mt-1">PF ₹15,000 • PT ₹1,000</p>
        </Card>

        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase">
              Total Leaves Taken
            </span>
            <Plane className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-2xl font-bold text-amber-400 mt-2">6 Days</h3>
          <p className="text-xs text-neutral-400 mt-1">4 Paid • 2 Unpaid (LOP)</p>
        </Card>
      </div>

      {/* Analytics Breakdown Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Distribution by Department */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Department Attendance Rates</span>
            </h3>
            <Badge variant="success">High Performing</Badge>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-300 font-medium">Engineering (2 Employees)</span>
                <span className="font-semibold text-emerald-400">96.5%</span>
              </div>
              <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '96.5%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-300 font-medium">Product Design (1 Employee)</span>
                <span className="font-semibold text-emerald-400">91.0%</span>
              </div>
              <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '91%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-300 font-medium">Quality Assurance (1 Employee)</span>
                <span className="font-semibold text-sky-400">88.5%</span>
              </div>
              <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div className="bg-sky-500 h-full rounded-full" style={{ width: '88.5%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-300 font-medium">Infrastructure / DevOps (1 Employee)</span>
                <span className="font-semibold text-amber-400">82.0%</span>
              </div>
              <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '82%' }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Leave & Absence Summary */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Plane className="w-4 h-4 text-sky-400" />
              <span>Time-Off Type Breakdown</span>
            </h3>
            <span className="text-xs text-neutral-400 font-mono">August 2026</span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-center">
              <p className="text-xs text-emerald-400 font-semibold">Paid Leaves</p>
              <p className="text-2xl font-bold text-white mt-1">4</p>
              <p className="text-[10px] text-neutral-500 mt-1">66.7% of total</p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-center">
              <p className="text-xs text-sky-400 font-semibold">Sick Leaves</p>
              <p className="text-2xl font-bold text-white mt-1">0</p>
              <p className="text-[10px] text-neutral-500 mt-1">0% of total</p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-center">
              <p className="text-xs text-rose-400 font-semibold">Unpaid (LOP)</p>
              <p className="text-2xl font-bold text-white mt-1">2</p>
              <p className="text-[10px] text-neutral-500 mt-1">33.3% of total</p>
            </div>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-start gap-2.5 text-xs text-neutral-400 mt-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Unpaid leaves trigger automatic Loss of Pay (LOP) deductions during monthly payslip generation.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
