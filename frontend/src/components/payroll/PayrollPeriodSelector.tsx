import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../common/Button';

interface PayrollPeriodSelectorProps {
  selectedPeriod: string; // Format: YYYY-MM (e.g. '2026-08')
  onChange: (period: string) => void;
  availablePeriods?: string[];
}

export const PayrollPeriodSelector: React.FC<PayrollPeriodSelectorProps> = ({
  selectedPeriod,
  onChange,
  availablePeriods,
}) => {
  // Generate default list of recent 12 months if not provided
  const generateMonths = () => {
    const list: { value: string; label: string }[] = [];
    const [currY, currM] = selectedPeriod.split('-').map(Number);
    const centerDate = new Date(Date.UTC(currY || 2026, (currM || 8) - 1, 1));

    for (let i = -6; i <= 6; i++) {
      const d = new Date(Date.UTC(centerDate.getUTCFullYear(), centerDate.getUTCMonth() + i, 1));
      const val = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
      list.push({ value: val, label });
    }
    return list;
  };

  const months = generateMonths();

  const handlePrev = () => {
    const [year, month] = selectedPeriod.split('-').map(Number);
    const prev = new Date(Date.UTC(year, month - 2, 1));
    const nextVal = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`;
    onChange(nextVal);
  };

  const handleNext = () => {
    const [year, month] = selectedPeriod.split('-').map(Number);
    const next = new Date(Date.UTC(year, month, 1));
    const nextVal = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
    onChange(nextVal);
  };

  const formatPeriodLabel = (period: string) => {
    try {
      const [year, month] = period.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, 1));
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch {
      return period;
    }
  };

  return (
    <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1.5 rounded-xl shadow-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePrev}
        className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
        title="Previous Month"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="relative flex items-center gap-2 px-2">
        <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
        <select
          value={selectedPeriod}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer pr-4"
        >
          {availablePeriods && availablePeriods.length > 0
            ? availablePeriods.map((p) => (
                <option key={p} value={p} className="bg-neutral-900 text-white">
                  {formatPeriodLabel(p)}
                </option>
              ))
            : months.map((m) => (
                <option key={m.value} value={m.value} className="bg-neutral-900 text-white">
                  {m.label}
                </option>
              ))}
        </select>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleNext}
        className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
        title="Next Month"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};
