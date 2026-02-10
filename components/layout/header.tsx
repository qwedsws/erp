'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getActiveSection } from '@/lib/navigation';
import { useAuth } from '@/hooks/shared/useAuth';

export function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const activeSection = getActiveSection(pathname);

  // Find the most specific matching child (longest href match)
  const activeChildHref = activeSection?.children?.reduce<string | null>((best, child) => {
    const matches = pathname === child.href || pathname.startsWith(child.href + '/');
    if (!matches) return best;
    if (!best || child.href.length > best.length) return child.href;
    return best;
  }, null);

  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="h-14 flex items-center justify-between px-6">
        <div className="flex items-center gap-4 flex-1">
          {activeSection?.children && (
            <nav className="flex items-center gap-1">
              {activeSection.children.map(child => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    child.href === activeChildHref
                      ? 'text-primary bg-primary/10 font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {child.name}
                </Link>
              ))}
            </nav>
          )}
          <div className="relative max-w-md flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="검색..."
              className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-md hover:bg-accent text-muted-foreground">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
            <div className="text-sm">
              <p className="font-medium">{user?.email?.split('@')[0] ?? '-'}</p>
              <p className="text-xs text-muted-foreground">{user?.email ?? ''}</p>
            </div>
            <button
              onClick={() => void signOut()}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
              title="로그아웃"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
