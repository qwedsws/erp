'use client';

import { useERPStore } from '@/store';

export function useMachines() {
  const machines = useERPStore((s) => s.machines);
  return { machines };
}
