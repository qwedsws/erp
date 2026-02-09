'use client';

import { useERPStore } from '@/store';

export function useGLAccounts() {
  const glAccounts = useERPStore((s) => s.glAccounts);

  return { glAccounts };
}
