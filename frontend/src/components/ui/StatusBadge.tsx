'use client';

import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-[#FEF3C7] text-amber-700',
  approved: 'bg-[#D1FAE5] text-green-700',
  cancelled: 'bg-[#FEE2E2] text-red-700',
  under_review: 'bg-[#DBEAFE] text-blue-700',
  expired: 'bg-[#F3F4F6] text-gray-600',
  completed: 'bg-[#D1FAE5] text-green-700',
  allocated: 'bg-[#E0E7FF] text-indigo-700',
  available: 'bg-[#D1FAE5] text-green-700',
  reserved: 'bg-[#FEF3C7] text-amber-700',
  occupied: 'bg-[#F3F4F6] text-gray-600',
  active: 'bg-[#D1FAE5] text-green-700',
  inactive: 'bg-[#FEE2E2] text-red-700',
  maintenance: 'bg-[#FEF3C7] text-amber-700',
  scheduled: 'bg-[#DBEAFE] text-blue-700',
  in_progress: 'bg-[#FEF3C7] text-amber-700',
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/-/g, '_').replace(/ /g, '_');
  const style = statusStyles[normalizedStatus] || 'bg-gray-100 text-gray-600';
  const displayText = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={clsx('badge', style, className)}>
      {displayText}
    </span>
  );
}
