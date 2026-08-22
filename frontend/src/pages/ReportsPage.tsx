import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs } from '../components/common/Tabs';
import { LoadingState } from '../components/common/LoadingState';
import { PayrollPeriodSelector } from '../components/payroll/PayrollPeriodSelector';
import { AttendanceSummary } from '../components/reports/AttendanceSummary';
import { LeaveSummary } from '../components/reports/LeaveSummary';
import { PayrollSummary } from '../components/reports/PayrollSummary';
import {
  fetchComprehensiveHRReport,
  type ComprehensiveHRReport,
} from '../services/reportsService';
import {
  CalendarCheck,
  Plane,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { company } = useAuth();
  const companyId = company?.id || 'c1111111-1111-1111-1111-111111111111';

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<string>('attendance');

  // Target Period
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [reportData, setReportData] = useState<ComprehensiveHRReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchComprehensiveHRReport(companyId, selectedPeriod);
      setReportData(data);
    } catch (err: unknown) {
      console.error('Error loading reports analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, selectedPeriod]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const reportTabs = [
    {
      id: 'attendance',
      label: 'Workforce Attendance',
      icon: <CalendarCheck className="w-4 h-4" />,
    },
    {
      id: 'leaves',
      label: 'Time-Off Analytics',
      icon: <Plane className="w-4 h-4" />,
    },
    {
      id: 'payroll',
      label: 'Payroll & Compensation Expenses',
      icon: <DollarSign className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              HR Reports & Analytics Dashboard
            </h1>
            <span className="p-1 rounded-md bg-purple-500/20 text-purple-400 text-xs font-semibold flex items-center gap-1 border border-purple-500/30">
              <TrendingUp className="w-3 h-3" />
              <span>Live DB Metrics</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Executive insights on workforce presence, department time-off trends, and monthly payroll expenses
          </p>
        </div>

        <PayrollPeriodSelector
          selectedPeriod={selectedPeriod}
          onChange={(p) => setSelectedPeriod(p)}
        />
      </div>

      {/* Tabs */}
      <Tabs tabs={reportTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Content */}
      {isLoading || !reportData ? (
        <LoadingState message="Aggregating database reports and workforce metrics..." />
      ) : (
        <div className="space-y-6">
          {activeTab === 'attendance' && (
            <AttendanceSummary data={reportData.attendance} />
          )}

          {activeTab === 'leaves' && (
            <LeaveSummary data={reportData.leaves} />
          )}

          {activeTab === 'payroll' && (
            <PayrollSummary data={reportData.payroll} />
          )}
        </div>
      )}
    </div>
  );
};
