'use client';

import { useERPStore } from '@/store';

export function useAPItems() {
  const apOpenItems = useERPStore((s) => s.apOpenItems);

  return { apOpenItems };
}
