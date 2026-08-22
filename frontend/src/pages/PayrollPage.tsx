import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Tabs } from '../components/common/Tabs';
import { LoadingState } from '../components/common/LoadingState';
import { PayrollPeriodSelector } from '../components/payroll/PayrollPeriodSelector';
import { PayrollSummaryCards } from '../components/payroll/PayrollSummaryCards';
import { PayrollTable } from '../components/payroll/PayrollTable';
import { SalaryStructure } from '../components/payroll/SalaryStructure';
import { PayslipViewer } from '../components/payroll/PayslipViewer';
import { SalaryStructureModal } from '../components/payroll/SalaryStructureModal';
import {
  fetchPayslips,
  fetchSalaryStructure,
  generateMonthlyPayroll,
  updatePayslipStatus,
} from '../services/payrollService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Payslip, SalaryStructure as SalaryStructureType, Profile, PayslipStatus } from '../types';
import { mockProfiles } from '../services/mockData';
import {
  DollarSign,
  FileText,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const { profile, company, role } = useAuth();
  const isAdmin = role === 'admin';
  const companyId = company?.id || 'c1111111-1111-1111-1111-111111111111';

  // Navigation Sub-Tabs
  const [activeViewTab, setActiveViewTab] = useState<string>('payslips');

  // Selected period (default to current month, e.g. '2026-08')
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  // State
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [salaryStructure, setSalaryStructure] = useState<SalaryStructureType | null>(null);
  const [allEmployees, setAllEmployees] = useState<Profile[]>([]);
  const [selectedEmpForSalary, setSelectedEmpForSalary] = useState<Profile | null>(null);

  // Modals & UI states
  const [viewingSlip, setViewingSlip] = useState<Payslip | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Show banner helper
  const showBanner = (type: 'success' | 'error', text: string) => {
    setBannerMessage({ type, text });
    setTimeout(() => {
      setBannerMessage(null);
    }, 4500);
  };

  // Load all company employees (for Admin dropdown)
  useEffect(() => {
    async function loadEmployees() {
      if (isAdmin) {
        if (!isSupabaseConfigured) {
          setAllEmployees(mockProfiles);
          setSelectedEmpForSalary(mockProfiles[1]); // Default to John Doe
        } else {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('company_id', companyId);
          if (data && data.length > 0) {
            setAllEmployees(data as Profile[]);
            setSelectedEmpForSalary((data[0] as Profile) || null);
          }
        }
      } else {
        if (profile) setSelectedEmpForSalary(profile);
      }
    }
    loadEmployees();
  }, [isAdmin, companyId, profile]);

  // Load payslips for selected period
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch payslips
      const fetchedSlips = await fetchPayslips({
        companyId,
        payrollPeriod: selectedPeriod,
        userId: isAdmin ? undefined : profile?.id,
      });
      setPayslips(fetchedSlips);

      // 2. Fetch salary structure
      const targetUserId = isAdmin
        ? (selectedEmpForSalary?.id || profile?.id || '')
        : (profile?.id || '');

      if (targetUserId) {
        const structure = await fetchSalaryStructure(targetUserId);
        setSalaryStructure(structure);
      }
    } catch (err: unknown) {
      console.error('Error loading payroll data:', err);
      showBanner('error', 'Failed to load payroll data from database.');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, selectedPeriod, isAdmin, profile?.id, selectedEmpForSalary?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Trigger Payroll Generation (Authoritative Backend RPC)
  const handleRunPayroll = async () => {
    setIsGenerating(true);
    try {
      const result = await generateMonthlyPayroll(companyId, selectedPeriod);
      if (result.success) {
        showBanner(
          'success',
          result.message || `Authoritative payroll computed for ${selectedPeriod}!`
        );
        // Refresh payslips from database
        await loadData();
      } else {
        showBanner('error', result.error || 'Failed to generate payroll.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating monthly payslips';
      showBanner('error', msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Update Payslip Status
  const handleUpdateStatus = async (payslipId: string, newStatus: PayslipStatus) => {
    try {
      const updated = await updatePayslipStatus(payslipId, newStatus);
      setPayslips((prev) => prev.map((p) => (p.id === payslipId ? updated : p)));
      if (viewingSlip && viewingSlip.id === payslipId) {
        setViewingSlip(updated);
      }
      showBanner('success', `Payslip status updated to ${newStatus}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update payslip status';
      showBanner('error', msg);
    }
  };

  const navTabs = [
    {
      id: 'payslips',
      label: isAdmin ? 'Monthly Pay Runs' : 'My Payslips',
      icon: <FileText className="w-4 h-4" />,
      count: payslips.length,
    },
    {
      id: 'structure',
      label: isAdmin ? 'Salary Structure Manager' : 'My Salary Structure',
      icon: <Layers className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Payroll & Compensation
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            {isAdmin
              ? 'Attendance-linked payroll processing, loss-of-pay deductions, and monthly salary disbursement'
              : 'View monthly compensation statements, attendance deductions, and salary breakdown'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PayrollPeriodSelector
            selectedPeriod={selectedPeriod}
            onChange={(p) => setSelectedPeriod(p)}
          />

          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Sparkles className="w-4 h-4 text-purple-400" />}
                onClick={() => setIsConfigModalOpen(true)}
              >
                Configure Wage
              </Button>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<DollarSign className="w-4 h-4" />}
                onClick={handleRunPayroll}
                isLoading={isGenerating}
              >
                Run Monthly Payroll
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Banner Feedback */}
      {bannerMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs animate-in fade-in ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/50 border-rose-800/60 text-rose-300'
          }`}
        >
          {bannerMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{bannerMessage.text}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <Tabs tabs={navTabs} activeTab={activeViewTab} onChange={setActiveViewTab} />

      {/* Tab 1: Monthly Payslips View */}
      {activeViewTab === 'payslips' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <PayrollSummaryCards payslips={payslips} isLoading={isLoading} />

          {/* Payslips Table */}
          {isLoading ? (
            <LoadingState message="Loading monthly payslips from database..." />
          ) : (
            <PayrollTable
              payslips={payslips}
              isAdmin={isAdmin}
              onViewSlip={(slip) => setViewingSlip(slip)}
              onUpdateStatus={handleUpdateStatus}
            />
          )}
        </div>
      )}

      {/* Tab 2: Salary Structure View */}
      {activeViewTab === 'structure' && (
        <div className="space-y-6">
          {isAdmin && allEmployees.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl">
              <div className="flex items-center gap-2 text-neutral-300 text-xs font-semibold uppercase tracking-wider">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Select Employee to Inspect:</span>
              </div>
              <select
                value={selectedEmpForSalary?.id || ''}
                onChange={async (e) => {
                  const emp = allEmployees.find((p) => p.id === e.target.value) || null;
                  setSelectedEmpForSalary(emp);
                  if (emp) {
                    const st = await fetchSalaryStructure(emp.id);
                    setSalaryStructure(st);
                  }
                }}
                className="bg-neutral-950 text-white text-xs font-medium px-3 py-2 rounded-lg border border-neutral-700 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {allEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-neutral-900 text-white">
                    {emp.first_name} {emp.last_name} ({emp.login_id}) — {emp.department || 'General'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isLoading ? (
            <LoadingState message="Loading salary structure..." />
          ) : (
            <SalaryStructure
              salaryStructure={salaryStructure}
              employee={isAdmin ? selectedEmpForSalary : profile}
              isAdmin={isAdmin}
              companyId={companyId}
              onStructureUpdated={(saved) => {
                setSalaryStructure(saved);
                showBanner('success', 'Salary structure saved and computed successfully.');
              }}
            />
          )}
        </div>
      )}

      {/* Payslip Viewer Modal */}
      <PayslipViewer
        isOpen={Boolean(viewingSlip)}
        onClose={() => setViewingSlip(null)}
        payslip={viewingSlip}
        companyName={company?.name || 'Dayflow Organization'}
        isAdmin={isAdmin}
        onStatusUpdated={(updated) => {
          setViewingSlip(updated);
          setPayslips((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          showBanner('success', `Payslip marked as ${updated.status}.`);
        }}
      />

      {/* Global Salary Structure Config Modal */}
      <SalaryStructureModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        companyId={companyId}
        allEmployees={allEmployees}
        employee={selectedEmpForSalary}
        initialStructure={salaryStructure}
        onSuccess={(saved) => {
          setSalaryStructure(saved);
          showBanner('success', 'Salary structure updated successfully.');
        }}
      />
    </div>
  );
};
