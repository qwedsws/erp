'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navigation } from '@/lib/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-card transition-all duration-300 h-screen sticky top-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 border-b border-border">
        {!collapsed && (
          <Link href="/" className="font-bold text-lg text-primary">
            MoldERP
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-accent text-muted-foreground"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          const linkHref = item.children?.length ? item.children[0].href : item.href;

          return (
            <Link
              key={item.name}
              href={linkHref}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                active
                  ? 'text-primary bg-primary/5 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
