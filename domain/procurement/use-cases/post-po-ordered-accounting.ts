import type { PurchaseOrder } from '../entities';
import type {
  IGLAccountRepository,
  IJournalEntryRepository,
  IAROpenItemRepository,
  IAPOpenItemRepository,
  IAccountingEventRepository,
} from '../../accounting/ports';
import { type Result, success } from '@/domain/shared/types';
import {
  PostAccountingEventUseCase,
  type PostAccountingEventResult,
} from '@/domain/accounting/use-cases/post-accounting-event';

export class PostPOOrderedAccountingUseCase {
  private readonly postAccountingEventUseCase: PostAccountingEventUseCase;

  constructor(
    glAccountRepo: IGLAccountRepository,
    journalEntryRepo: IJournalEntryRepository,
    arRepo: IAROpenItemRepository,
    apRepo: IAPOpenItemRepository,
    eventRepo: IAccountingEventRepository,
  ) {
    this.postAccountingEventUseCase = new PostAccountingEventUseCase(
      glAccountRepo,
      journalEntryRepo,
      arRepo,
      apRepo,
      eventRepo,
    );
  }

  async execute(po: PurchaseOrder): Promise<Result<PostAccountingEventResult | null>> {
    if (po.status !== 'IN_PROGRESS') return success(null);
    if (!po.supplier_id) return success(null);
    if (!po.total_amount || po.total_amount <= 0) return success(null);

    return this.postAccountingEventUseCase.execute({
      source_type: 'PURCHASE_ORDER',
      source_id: po.id,
      source_no: po.po_no,
      event_type: 'PO_ORDERED',
      payload: {
        amount: po.total_amount,
        supplier_id: po.supplier_id,
        project_id: po.project_id,
        po_no: po.po_no,
        due_date: po.due_date || '',
      },
    });
  }
}
