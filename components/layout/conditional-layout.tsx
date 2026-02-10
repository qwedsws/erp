'use client';

import { usePathname } from 'next/navigation';
import { AppLayout } from './app-layout';

const NO_LAYOUT_PATHS = ['/login', '/auth'];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const skipLayout = NO_LAYOUT_PATHS.some((p) => pathname.startsWith(p));

  if (skipLayout) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}
