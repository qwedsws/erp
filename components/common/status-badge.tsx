import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  statusMap: Record<string, { label: string; color: string }>;
}

export function StatusBadge({ status, statusMap }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
