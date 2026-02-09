import type { GLAccount, JournalEntry, JournalLine, AROpenItem, APOpenItem, AccountingEvent } from '@/domain/shared/entities';

export const mockGLAccounts: GLAccount[] = [
  { id: 'gl1', code: '1010', name: '보통예금', type: 'ASSET', is_active: true },
  { id: 'gl2', code: '1100', name: '매출채권', type: 'ASSET', is_active: true },
  { id: 'gl3', code: '1200', name: '원재료', type: 'ASSET', is_active: true },
  { id: 'gl4', code: '1300', name: '재공품', type: 'ASSET', is_active: true },
  { id: 'gl5', code: '2100', name: '매입채무', type: 'LIABILITY', is_active: true },
  { id: 'gl6', code: '3100', name: '자본금', type: 'EQUITY', is_active: true },
  { id: 'gl7', code: '4100', name: '매출', type: 'REVENUE', is_active: true },
  { id: 'gl8', code: '5100', name: '원재료비', type: 'EXPENSE', is_active: true },
];

// Helper to make line arrays
function makeLines(jeId: string, lines: Omit<JournalLine, 'id' | 'journal_entry_id'>[]): JournalLine[] {
  return lines.map((l, i) => ({ ...l, id: `jl-${jeId}-${i + 1}`, journal_entry_id: jeId }));
}

export const mockJournalEntries: JournalEntry[] = [
  // ORDER_CONFIRMED for o1~o6
  { id: 'je1', journal_no: 'JE-2026-001', posting_date: '2026-01-05', source_type: 'ORDER', source_id: 'o1', source_no: 'SO-2026-001', description: '수주 확정 - SO-2026-001', status: 'POSTED', lines: makeLines('je1', [
    { line_no: 1, account_id: 'gl2', dr_amount: 85000000, cr_amount: 0, customer_id: 'c1', memo: '매출채권 발생' },
    { line_no: 2, account_id: 'gl7', dr_amount: 0, cr_amount: 85000000, customer_id: 'c1', memo: '매출 인식' },
  ]), created_at: '2026-01-05T00:00:00Z' },
  { id: 'je2', journal_no: 'JE-2026-002', posting_date: '2026-01-10', source_type: 'ORDER', source_id: 'o2', source_no: 'SO-2026-002', description: '수주 확정 - SO-2026-002', status: 'POSTED', lines: makeLines('je2', [
    { line_no: 1, account_id: 'gl2', dr_amount: 120000000, cr_amount: 0, customer_id: 'c2', memo: '매출채권 발생' },
    { line_no: 2, account_id: 'gl7', dr_amount: 0, cr_amount: 120000000, customer_id: 'c2', memo: '매출 인식' },
  ]), created_at: '2026-01-10T00:00:00Z' },
  { id: 'je3', journal_no: 'JE-2026-003', posting_date: '2026-01-20', source_type: 'ORDER', source_id: 'o3', source_no: 'SO-2026-003', description: '수주 확정 - SO-2026-003', status: 'POSTED', lines: makeLines('je3', [
    { line_no: 1, account_id: 'gl2', dr_amount: 65000000, cr_amount: 0, customer_id: 'c3', memo: '매출채권 발생' },
    { line_no: 2, account_id: 'gl7', dr_amount: 0, cr_amount: 65000000, customer_id: 'c3', memo: '매출 인식' },
  ]), created_at: '2026-01-20T00:00:00Z' },
  { id: 'je4', journal_no: 'JE-2026-004', posting_date: '2026-01-25', source_type: 'ORDER', source_id: 'o4', source_no: 'SO-2026-004', description: '수주 확정 - SO-2026-004', status: 'POSTED', lines: makeLines('je4', [
    { line_no: 1, account_id: 'gl2', dr_amount: 95000000, cr_amount: 0, customer_id: 'c1', memo: '매출채권 발생' },
    { line_no: 2, account_id: 'gl7', dr_amount: 0, cr_amount: 95000000, customer_id: 'c1', memo: '매출 인식' },
  ]), created_at: '2026-01-25T00:00:00Z' },
  { id: 'je5', journal_no: 'JE-2026-005', posting_date: '2026-02-01', source_type: 'ORDER', source_id: 'o5', source_no: 'SO-2026-005', description: '수주 확정 - SO-2026-005', status: 'POSTED', lines: makeLines('je5', [
    { line_no: 1, account_id: 'gl2', dr_amount: 150000000, cr_amount: 0, customer_id: 'c4', memo: '매출채권 발생' },
    { line_no: 2, account_id: 'gl7', dr_amount: 0, cr_amount: 150000000, customer_id: 'c4', memo: '매출 인식' },
  ]), created_at: '2026-02-01T00:00:00Z' },
  { id: 'je6', journal_no: 'JE-2025-001', posting_date: '2025-09-15', source_type: 'ORDER', source_id: 'o6', source_no: 'SO-2025-010', description: '수주 확정 - SO-2025-010', status: 'POSTED', lines: makeLines('je6', [
    { line_no: 1, account_id: 'gl2', dr_amount: 78000000, cr_amount: 0, customer_id: 'c5', memo: '매출채권 발생' },
    { line_no: 2, account_id: 'gl7', dr_amount: 0, cr_amount: 78000000, customer_id: 'c5', memo: '매출 인식' },
  ]), created_at: '2025-09-15T00:00:00Z' },

  // PAYMENT_CONFIRMED (pay1: 25.5M, pay2: 48M, pay3: 36M, pay4: 47.5M, pay6: 23.4M, pay7: 23.4M, pay8: 31.2M)
  { id: 'je7', journal_no: 'JE-2026-006', posting_date: '2026-01-10', source_type: 'PAYMENT', source_id: 'pay1', source_no: 'SO-2026-001', description: '입금 확정 - SO-2026-001', status: 'POSTED', lines: makeLines('je7', [
    { line_no: 1, account_id: 'gl1', dr_amount: 25500000, cr_amount: 0, customer_id: 'c1', memo: '보통예금 입금' },
    { line_no: 2, account_id: 'gl2', dr_amount: 0, cr_amount: 25500000, customer_id: 'c1', memo: '매출채권 회수' },
  ]), created_at: '2026-01-10T01:00:00Z' },
  { id: 'je8', journal_no: 'JE-2026-007', posting_date: '2026-01-15', source_type: 'PAYMENT', source_id: 'pay2', source_no: 'SO-2026-002', description: '입금 확정 - SO-2026-002', status: 'POSTED', lines: makeLines('je8', [
    { line_no: 1, account_id: 'gl1', dr_amount: 48000000, cr_amount: 0, customer_id: 'c2', memo: '보통예금 입금' },
    { line_no: 2, account_id: 'gl2', dr_amount: 0, cr_amount: 48000000, customer_id: 'c2', memo: '매출채권 회수' },
  ]), created_at: '2026-01-15T01:00:00Z' },
  { id: 'je9', journal_no: 'JE-2026-008', posting_date: '2026-02-01', source_type: 'PAYMENT', source_id: 'pay3', source_no: 'SO-2026-002', description: '입금 확정 - SO-2026-002', status: 'POSTED', lines: makeLines('je9', [
    { line_no: 1, account_id: 'gl1', dr_amount: 36000000, cr_amount: 0, customer_id: 'c2', memo: '보통예금 입금' },
    { line_no: 2, account_id: 'gl2', dr_amount: 0, cr_amount: 36000000, customer_id: 'c2', memo: '매출채권 회수' },
  ]), created_at: '2026-02-01T01:00:00Z' },
  { id: 'je10', journal_no: 'JE-2026-009', posting_date: '2026-01-28', source_type: 'PAYMENT', source_id: 'pay4', source_no: 'SO-2026-004', description: '입금 확정 - SO-2026-004', status: 'POSTED', lines: makeLines('je10', [
    { line_no: 1, account_id: 'gl1', dr_amount: 47500000, cr_amount: 0, customer_id: 'c1', memo: '보통예금 입금' },
    { line_no: 2, account_id: 'gl2', dr_amount: 0, cr_amount: 47500000, customer_id: 'c1', memo: '매출채권 회수' },
  ]), created_at: '2026-01-28T01:00:00Z' },
  { id: 'je11', journal_no: 'JE-2025-002', posting_date: '2025-09-20', source_type: 'PAYMENT', source_id: 'pay6', source_no: 'SO-2025-010', description: '입금 확정 - SO-2025-010', status: 'POSTED', lines: makeLines('je11', [
    { line_no: 1, account_id: 'gl1', dr_amount: 23400000, cr_amount: 0, customer_id: 'c5', memo: '보통예금 입금' },
    { line_no: 2, account_id: 'gl2', dr_amount: 0, cr_amount: 23400000, customer_id: 'c5', memo: '매출채권 회수' },
  ]), created_at: '2025-09-20T01:00:00Z' },
  { id: 'je12', journal_no: 'JE-2025-003', posting_date: '2025-11-01', source_type: 'PAYMENT', source_id: 'pay7', source_no: 'SO-2025-010', description: '입금 확정 - SO-2025-010', status: 'POSTED', lines: makeLines('je12', [
    { line_no: 1, account_id: 'gl1', dr_amount: 23400000, cr_amount: 0, customer_id: 'c5', memo: '보통예금 입금' },
    { line_no: 2, account_id: 'gl2', dr_amount: 0, cr_amount: 23400000, customer_id: 'c5', memo: '매출채권 회수' },
  ]), created_at: '2025-11-01T01:00:00Z' },
  { id: 'je13', journal_no: 'JE-2025-004', posting_date: '2025-12-20', source_type: 'PAYMENT', source_id: 'pay8', source_no: 'SO-2025-010', description: '입금 확정 - SO-2025-010', status: 'POSTED', lines: makeLines('je13', [
    { line_no: 1, account_id: 'gl1', dr_amount: 31200000, cr_amount: 0, customer_id: 'c5', memo: '보통예금 입금' },
    { line_no: 2, account_id: 'gl2', dr_amount: 0, cr_amount: 31200000, customer_id: 'c5', memo: '매출채권 회수' },
  ]), created_at: '2025-12-20T01:00:00Z' },

  // PO_ORDERED for po1~po3
  { id: 'je14', journal_no: 'JE-2026-010', posting_date: '2026-01-15', source_type: 'PURCHASE_ORDER', source_id: 'po1', source_no: 'PO-2026-001', description: '발주 확정 - PO-2026-001', status: 'POSTED', lines: makeLines('je14', [
    { line_no: 1, account_id: 'gl3', dr_amount: 5000000, cr_amount: 0, supplier_id: 'sup1', memo: '원재료 입고' },
    { line_no: 2, account_id: 'gl5', dr_amount: 0, cr_amount: 5000000, supplier_id: 'sup1', memo: '매입채무 발생' },
  ]), created_at: '2026-01-15T02:00:00Z' },
  { id: 'je15', journal_no: 'JE-2026-011', posting_date: '2026-01-20', source_type: 'PURCHASE_ORDER', source_id: 'po2', source_no: 'PO-2026-002', description: '발주 확정 - PO-2026-002', status: 'POSTED', lines: makeLines('je15', [
    { line_no: 1, account_id: 'gl3', dr_amount: 4400000, cr_amount: 0, supplier_id: 'sup2', memo: '원재료 입고' },
    { line_no: 2, account_id: 'gl5', dr_amount: 0, cr_amount: 4400000, supplier_id: 'sup2', memo: '매입채무 발생' },
  ]), created_at: '2026-01-20T02:00:00Z' },
  { id: 'je16', journal_no: 'JE-2026-012', posting_date: '2026-02-01', source_type: 'PURCHASE_ORDER', source_id: 'po3', source_no: 'PO-2026-003', description: '발주 확정 - PO-2026-003', status: 'POSTED', lines: makeLines('je16', [
    { line_no: 1, account_id: 'gl3', dr_amount: 8500000, cr_amount: 0, supplier_id: 'sup4', memo: '원재료 입고' },
    { line_no: 2, account_id: 'gl5', dr_amount: 0, cr_amount: 8500000, supplier_id: 'sup4', memo: '매입채무 발생' },
  ]), created_at: '2026-02-01T02:00:00Z' },

  // STOCK_OUT for sm2, sm4, sm6
  { id: 'je17', journal_no: 'JE-2026-013', posting_date: '2026-01-25', source_type: 'STOCK_MOVEMENT', source_id: 'sm2', source_no: 'SM-2026-002', description: '자재 출고 - PJ-2026-001 자재 출고', status: 'POSTED', lines: makeLines('je17', [
    { line_no: 1, account_id: 'gl4', dr_amount: 2500000, cr_amount: 0, project_id: 'pj1', material_id: 'mat1', memo: '재공품 대체' },
    { line_no: 2, account_id: 'gl3', dr_amount: 0, cr_amount: 2500000, material_id: 'mat1', memo: '원재료 출고' },
  ]), created_at: '2026-01-25T03:00:00Z' },
  { id: 'je18', journal_no: 'JE-2026-014', posting_date: '2026-02-01', source_type: 'STOCK_MOVEMENT', source_id: 'sm4', source_no: 'SM-2026-004', description: '자재 출고 - PJ-2026-001 이젝터 핀 출고', status: 'POSTED', lines: makeLines('je18', [
    { line_no: 1, account_id: 'gl4', dr_amount: 700000, cr_amount: 0, project_id: 'pj1', material_id: 'mat4', memo: '재공품 대체' },
    { line_no: 2, account_id: 'gl3', dr_amount: 0, cr_amount: 700000, material_id: 'mat4', memo: '원재료 출고' },
  ]), created_at: '2026-02-01T03:00:00Z' },
  { id: 'je19', journal_no: 'JE-2026-015', posting_date: '2026-02-03', source_type: 'STOCK_MOVEMENT', source_id: 'sm6', source_no: 'SM-2026-006', description: '자재 출고 - 와이어 가공용 출고', status: 'POSTED', lines: makeLines('je19', [
    { line_no: 1, account_id: 'gl4', dr_amount: 360000, cr_amount: 0, project_id: 'pj1', material_id: 'mat8', memo: '재공품 대체' },
    { line_no: 2, account_id: 'gl3', dr_amount: 0, cr_amount: 360000, material_id: 'mat8', memo: '원재료 출고' },
  ]), created_at: '2026-02-03T03:00:00Z' },
];

// AR Open Items: o1~o6 with payment deductions
// o1: 85M - pay1(25.5M) = 59.5M PARTIAL
// o2: 120M - pay2(48M) - pay3(36M) = 36M PARTIAL
// o3: 65M - 0 = 65M OPEN
// o4: 95M - pay4(47.5M) = 47.5M PARTIAL
// o5: 150M - 0 = 150M OPEN
// o6: 78M - pay6(23.4M) - pay7(23.4M) - pay8(31.2M) = 0 CLOSED
export const mockAROpenItems: AROpenItem[] = [
  { id: 'ar1', order_id: 'o1', customer_id: 'c1', due_date: '2026-03-15', original_amount: 85000000, balance_amount: 59500000, status: 'PARTIAL', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-10T01:00:00Z' },
  { id: 'ar2', order_id: 'o2', customer_id: 'c2', due_date: '2026-04-20', original_amount: 120000000, balance_amount: 36000000, status: 'PARTIAL', created_at: '2026-01-10T00:00:00Z', updated_at: '2026-02-01T01:00:00Z' },
  { id: 'ar3', order_id: 'o3', customer_id: 'c3', due_date: '2026-05-30', original_amount: 65000000, balance_amount: 65000000, status: 'OPEN', created_at: '2026-01-20T00:00:00Z', updated_at: '2026-01-20T00:00:00Z' },
  { id: 'ar4', order_id: 'o4', customer_id: 'c1', due_date: '2026-03-30', original_amount: 95000000, balance_amount: 47500000, status: 'PARTIAL', created_at: '2026-01-25T00:00:00Z', updated_at: '2026-01-28T01:00:00Z' },
  { id: 'ar5', order_id: 'o5', customer_id: 'c4', due_date: '2026-06-15', original_amount: 150000000, balance_amount: 150000000, status: 'OPEN', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
  { id: 'ar6', order_id: 'o6', customer_id: 'c5', due_date: '2025-12-20', original_amount: 78000000, balance_amount: 0, status: 'CLOSED', created_at: '2025-09-15T00:00:00Z', updated_at: '2025-12-20T01:00:00Z' },
];

// AP Open Items: po1~po3
// po1: 5M, RECEIVED (assume paid) → CLOSED
// po2: 4.4M, RECEIVED → OPEN (unpaid)
// po3: 8.5M, ORDERED → OPEN
export const mockAPOpenItems: APOpenItem[] = [
  { id: 'ap1', purchase_order_id: 'po1', supplier_id: 'sup1', due_date: '2026-01-22', original_amount: 5000000, balance_amount: 0, status: 'CLOSED', created_at: '2026-01-15T02:00:00Z', updated_at: '2026-01-25T00:00:00Z' },
  { id: 'ap2', purchase_order_id: 'po2', supplier_id: 'sup2', due_date: '2026-01-25', original_amount: 4400000, balance_amount: 4400000, status: 'OPEN', created_at: '2026-01-20T02:00:00Z', updated_at: '2026-01-20T02:00:00Z' },
  { id: 'ap3', purchase_order_id: 'po3', supplier_id: 'sup4', due_date: '2026-02-22', original_amount: 8500000, balance_amount: 8500000, status: 'OPEN', created_at: '2026-02-01T02:00:00Z', updated_at: '2026-02-01T02:00:00Z' },
];

// Accounting Events
export const mockAccountingEvents: AccountingEvent[] = mockJournalEntries.map((je, i) => ({
  id: `ae${i + 1}`,
  source_type: je.source_type,
  source_id: je.source_id,
  event_type: (je.source_type === 'ORDER' ? 'ORDER_CONFIRMED' :
    je.source_type === 'PAYMENT' ? 'PAYMENT_CONFIRMED' :
    je.source_type === 'PURCHASE_ORDER' ? 'PO_ORDERED' : 'STOCK_OUT') as AccountingEvent['event_type'],
  occurred_at: je.created_at,
  payload: {},
  status: 'POSTED' as const,
  journal_entry_id: je.id,
  created_at: je.created_at,
}));
