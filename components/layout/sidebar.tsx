'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  FolderKanban,
  Pencil,
  Factory,
  Package,
  ClipboardCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navigation = [
  { name: '대시보드', href: '/', icon: LayoutDashboard },
  { name: '영업 관리', href: '/sales', icon: ShoppingCart, children: [
    { name: '고객 관리', href: '/sales/customers' },
    { name: '수주 관리', href: '/sales/orders' },
    { name: '영업 통계', href: '/sales/statistics' },
  ]},
  { name: '프로젝트', href: '/projects', icon: FolderKanban },
  { name: '설계 관리', href: '/design', icon: Pencil, children: [
    { name: '설계 공정 현황', href: '/design/processes' },
    { name: '설계 공정 관리', href: '/design/manage' },
    { name: '업무 배정', href: '/design/assignments' },
    { name: '설계 통계', href: '/design/workload' },
  ]},
  { name: '생산 관리', href: '/production', icon: Factory, children: [
    { name: '작업 지시', href: '/production/work-orders' },
    { name: '현장 대시보드', href: '/production/dashboard' },
  ]},
  { name: '자재/구매', href: '/materials', icon: Package, children: [
    { name: '재고 현황', href: '/materials/inventory' },
    { name: '자재 마스터', href: '/materials/items' },
    { name: '거래처 관리', href: '/materials/suppliers' },
    { name: '발주 관리', href: '/materials/purchase-orders' },
    { name: '입고 관리', href: '/materials/receiving' },
    { name: '구매 요청', href: '/materials/purchase-requests' },
    { name: '자재 통계', href: '/materials/statistics' },
  ]},
  { name: '품질 관리', href: '/quality', icon: ClipboardCheck, children: [
    { name: '검사 관리', href: '/quality/inspections' },
    { name: '트라이아웃', href: '/quality/tryouts' },
    { name: '불량/클레임', href: '/quality/claims' },
  ]},
  { name: '시스템 관리', href: '/admin', icon: Settings, children: [
    { name: '사용자 관리', href: '/admin/users' },
    { name: '역할/권한', href: '/admin/roles' },
    { name: '공통 코드', href: '/admin/codes' },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (name: string) => {
    setOpenMenus(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

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
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = openMenus.includes(item.name);

          return (
            <div key={item.name}>
              {hasChildren ? (
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                    active
                      ? 'text-primary bg-primary/5 font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon size={20} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.name}</span>
                      <ChevronRight
                        size={14}
                        className={cn('transition-transform', isOpen && 'rotate-90')}
                      />
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
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
              )}
              {hasChildren && isOpen && !collapsed && (
                <div className="ml-4 border-l border-border">
                  {item.children!.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'flex items-center gap-3 pl-7 pr-4 py-2 text-sm transition-colors',
                        isActive(child.href)
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
