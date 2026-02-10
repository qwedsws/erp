import {
  LayoutDashboard,
  ShoppingCart,
  FolderKanban,
  Pencil,
  Factory,
  Package,
  ClipboardCheck,
  Calculator,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavChild {
  name: string;
  href: string;
}

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
}

export const navigation: NavItem[] = [
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
  { name: '회계', href: '/accounting', icon: Calculator, children: [
    { name: '회계 대시보드', href: '/accounting' },
    { name: '분개 장부', href: '/accounting/journals' },
    { name: '매출채권', href: '/accounting/receivables' },
    { name: '매입채무', href: '/accounting/payables' },
  ]},
  { name: '시스템 관리', href: '/admin', icon: Settings, children: [
    { name: '사용자 관리', href: '/admin/users' },
    { name: '역할/권한', href: '/admin/roles' },
    { name: '공통 코드', href: '/admin/codes' },
    { name: '데이터 정합성', href: '/admin/data-integrity' },
  ]},
];

export function getActiveSection(pathname: string): NavItem | null {
  return navigation.find(item => {
    if (item.href === '/') return pathname === '/';
    return pathname.startsWith(item.href);
  }) || null;
}
