import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, Clock, XCircle, Plane, AlertCircle } from 'lucide-react';
import type { AttendanceStatus, LeaveStatus, LeaveType, PayslipStatus, UserRole } from '../../types';

export type BadgeVariant =
  | AttendanceStatus
  | LeaveStatus
  | LeaveType
  | PayslipStatus
  | UserRole
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  label,
  children,
  className,
  showIcon = true,
}) => {
  const getBadgeConfig = () => {
    switch (variant) {
      case 'present':
      case 'approved':
      case 'paid':
      case 'success':
        return {
          styles: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
          defaultLabel: variant === 'present' ? 'Present' : variant === 'approved' ? 'Approved' : 'Paid',
        };
      case 'half_day':
      case 'pending':
      case 'warning':
        return {
          styles: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: <Clock className="w-3 h-3 text-amber-400" />,
          defaultLabel: variant === 'half_day' ? 'Half Day' : 'Pending',
        };
      case 'absent':
        return {
          styles: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: <AlertCircle className="w-3 h-3 text-amber-400" />,
          defaultLabel: 'Absent',
        };
      case 'on_leave':
      case 'sick':
      case 'info':
        return {
          styles: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          icon: variant === 'on_leave' ? <Plane className="w-3 h-3 text-sky-400" /> : null,
          defaultLabel: variant === 'on_leave' ? 'On Leave' : variant === 'sick' ? 'Sick Leave' : 'Info',
        };
      case 'unpaid':
      case 'rejected':
      case 'danger':
        return {
          styles: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: variant === 'rejected' ? <XCircle className="w-3 h-3 text-rose-400" /> : null,
          defaultLabel: variant === 'unpaid' ? 'Unpaid' : 'Rejected',
        };
      case 'admin':
        return {
          styles: 'bg-purple-500/10 text-purple-400 border-purple-500/30 font-semibold',
          icon: null,
          defaultLabel: 'HR Admin',
        };
      case 'employee':
        return {
          styles: 'bg-neutral-800 text-neutral-300 border-neutral-700',
          icon: null,
          defaultLabel: 'Employee',
        };
      case 'finalized':
        return {
          styles: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          icon: null,
          defaultLabel: 'Finalized',
        };
      default:
        return {
          styles: 'bg-neutral-800 text-neutral-300 border-neutral-700',
          icon: null,
          defaultLabel: 'Default',
        };
    }
  };

  const config = getBadgeConfig();
  const displayContent = children || label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize select-none shrink-0',
        config.styles,
        className
      )}
    >
      {showIcon && config.icon}
      <span>{displayContent}</span>
    </span>
  );
};
