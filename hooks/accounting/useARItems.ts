'use client';

import { useERPStore } from '@/store';

export function useARItems() {
  const arOpenItems = useERPStore((s) => s.arOpenItems);

  return { arOpenItems };
}
