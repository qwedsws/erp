'use client';

import { useMemo } from 'react';
import { useERPStore } from '@/store';

export function useAccountingDashboardData() {
  const journalEntries = useERPStore((s) => s.journalEntries);
  const arOpenItems = useERPStore((s) => s.arOpenItems);
  const apOpenItems = useERPStore((s) => s.apOpenItems);

  const totalReceivables = useMemo(
    () => arOpenItems.filter(a => a.status !== 'CLOSED').reduce((sum, a) => sum + a.balance_amount, 0),
    [arOpenItems],
  );

  const totalPayables = useMemo(
    () => apOpenItems.filter(a => a.status !== 'CLOSED').reduce((sum, a) => sum + a.balance_amount, 0),
    [apOpenItems],
  );

  const totalJournalCount = journalEntries.length;

  const collectionRate = useMemo(() => {
    const totalOriginal = arOpenItems.reduce((sum, a) => sum + a.original_amount, 0);
    const totalCollected = arOpenItems.reduce((sum, a) => sum + (a.original_amount - a.balance_amount), 0);
    return totalOriginal > 0 ? Math.round((totalCollected / totalOriginal) * 100) : 0;
  }, [arOpenItems]);

  // Monthly debit totals for chart
  const monthlyDebits = useMemo(() => {
    const map = new Map<string, number>();
    for (const je of journalEntries) {
      const month = je.posting_date.substring(0, 7); // YYYY-MM
      const debitTotal = je.lines.reduce((sum, l) => sum + l.dr_amount, 0);
      map.set(month, (map.get(month) ?? 0) + debitTotal);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({ month, amount }));
  }, [journalEntries]);

  // Recent 10 journal entries
  const recentJournals = useMemo(
    () => [...journalEntries].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10),
    [journalEntries],
  );

  return {
    totalReceivables,
    totalPayables,
    totalJournalCount,
    collectionRate,
    monthlyDebits,
    recentJournals,
  };
}
