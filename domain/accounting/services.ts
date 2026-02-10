import type {
  GLAccount,
  JournalLine,
  AccountingEventType,
  AROpenItem,
  APOpenItem,
} from './entities';

interface PostingInput {
  eventType: AccountingEventType;
  sourceId: string;
  payload: Record<string, unknown>;
}

interface PostingResult {
  lines: Omit<JournalLine, 'id' | 'journal_entry_id'>[];
  description: string;
  arItem?: Omit<AROpenItem, 'id' | 'created_at' | 'updated_at'>;
  apItem?: Omit<APOpenItem, 'id' | 'created_at' | 'updated_at'>;
}

export function generatePostingFromEvent(
  input: PostingInput,
  accountByCode: Map<string, GLAccount>,
): PostingResult | null {
  switch (input.eventType) {
    case 'ORDER_CONFIRMED':
      return handleOrderConfirmed(input, accountByCode);
    case 'PAYMENT_CONFIRMED':
      return handlePaymentConfirmed(input, accountByCode);
    case 'PO_ORDERED':
      return handlePOOrdered(input, accountByCode);
    case 'STOCK_OUT':
      return handleStockOut(input, accountByCode);
    default:
      return null;
  }
}

function handleOrderConfirmed(input: PostingInput, accountByCode: Map<string, GLAccount>): PostingResult | null {
  const amount = input.payload.amount as number;
  const customerId = input.payload.customer_id as string;
  const orderNo = input.payload.order_no as string;
  const dueDate = input.payload.due_date as string;
  if (!amount || !customerId) return null;

  const arAccount = accountByCode.get('1100');
  const revenueAccount = accountByCode.get('4100');
  if (!arAccount || !revenueAccount) return null;

  return {
    description: `수주 확정 - ${orderNo || input.sourceId}`,
    lines: [
      { line_no: 1, account_id: arAccount.id, dr_amount: amount, cr_amount: 0, customer_id: customerId, memo: '매출채권 발생' },
      { line_no: 2, account_id: revenueAccount.id, dr_amount: 0, cr_amount: amount, customer_id: customerId, memo: '매출 인식' },
    ],
    arItem: {
      order_id: input.sourceId,
      customer_id: customerId,
      due_date: dueDate || new Date().toISOString().split('T')[0],
      original_amount: amount,
      balance_amount: amount,
      status: 'OPEN',
    },
  };
}

function handlePaymentConfirmed(input: PostingInput, accountByCode: Map<string, GLAccount>): PostingResult | null {
  const amount = input.payload.amount as number;
  const customerId = input.payload.customer_id as string;
  const orderNo = input.payload.order_no as string;
  if (!amount || !customerId) return null;

  const cashAccount = accountByCode.get('1010');
  const arAccount = accountByCode.get('1100');
  if (!cashAccount || !arAccount) return null;

  return {
    description: `입금 확정 - ${orderNo || input.sourceId}`,
    lines: [
      { line_no: 1, account_id: cashAccount.id, dr_amount: amount, cr_amount: 0, customer_id: customerId, memo: '보통예금 입금' },
      { line_no: 2, account_id: arAccount.id, dr_amount: 0, cr_amount: amount, customer_id: customerId, memo: '매출채권 회수' },
    ],
  };
}

function handlePOOrdered(input: PostingInput, accountByCode: Map<string, GLAccount>): PostingResult | null {
  const amount = input.payload.amount as number;
  const supplierId = input.payload.supplier_id as string;
  const projectId = input.payload.project_id as string | undefined;
  const poNo = input.payload.po_no as string;
  const dueDate = input.payload.due_date as string;
  if (!amount || !supplierId) return null;

  const materialAccount = accountByCode.get('1200');
  const apAccount = accountByCode.get('2100');
  if (!materialAccount || !apAccount) return null;

  return {
    description: `발주 확정 - ${poNo || input.sourceId}`,
    lines: [
      { line_no: 1, account_id: materialAccount.id, dr_amount: amount, cr_amount: 0, supplier_id: supplierId, project_id: projectId, memo: '원재료 입고' },
      { line_no: 2, account_id: apAccount.id, dr_amount: 0, cr_amount: amount, supplier_id: supplierId, project_id: projectId, memo: '매입채무 발생' },
    ],
    apItem: {
      purchase_order_id: input.sourceId,
      supplier_id: supplierId,
      due_date: dueDate || new Date().toISOString().split('T')[0],
      original_amount: amount,
      balance_amount: amount,
      status: 'OPEN',
    },
  };
}

function handleStockOut(input: PostingInput, accountByCode: Map<string, GLAccount>): PostingResult | null {
  const amount = input.payload.amount as number;
  const materialId = input.payload.material_id as string;
  const projectId = input.payload.project_id as string;
  if (!amount) return null;

  const wipAccount = accountByCode.get('1300');
  const materialAccount = accountByCode.get('1200');
  if (!wipAccount || !materialAccount) return null;

  return {
    description: `자재 출고 - ${input.payload.reason || input.sourceId}`,
    lines: [
      { line_no: 1, account_id: wipAccount.id, dr_amount: amount, cr_amount: 0, project_id: projectId, material_id: materialId, memo: '재공품 대체' },
      { line_no: 2, account_id: materialAccount.id, dr_amount: 0, cr_amount: amount, material_id: materialId, memo: '원재료 출고' },
    ],
  };
}
