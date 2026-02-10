import type { Order } from '../entities';
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

export class PostOrderConfirmedAccountingUseCase {
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

  async execute(order: Order): Promise<Result<PostAccountingEventResult | null>> {
    if (!order.customer_id) return success(null);
    if (!order.total_amount || order.total_amount <= 0) return success(null);

    return this.postAccountingEventUseCase.execute({
      source_type: 'ORDER',
      source_id: order.id,
      source_no: order.order_no,
      event_type: 'ORDER_CONFIRMED',
      payload: {
        amount: order.total_amount,
        customer_id: order.customer_id,
        order_no: order.order_no,
        due_date: order.delivery_date,
      },
    });
  }
}
