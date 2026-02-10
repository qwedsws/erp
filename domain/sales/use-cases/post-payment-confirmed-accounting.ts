import type { Payment } from '../entities';
import type { IOrderRepository } from '../ports';
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

export class PostPaymentConfirmedAccountingUseCase {
  private readonly postAccountingEventUseCase: PostAccountingEventUseCase;

  constructor(
    private readonly orderRepo: IOrderRepository,
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

  async execute(payment: Payment): Promise<Result<PostAccountingEventResult | null>> {
    if (payment.status !== 'CONFIRMED') return success(null);
    if (!payment.amount || payment.amount <= 0) return success(null);

    const order = await this.orderRepo.findById(payment.order_id);
    if (!order?.customer_id) return success(null);

    return this.postAccountingEventUseCase.execute({
      source_type: 'PAYMENT',
      source_id: payment.id,
      source_no: order.order_no || payment.order_id,
      event_type: 'PAYMENT_CONFIRMED',
      payload: {
        amount: payment.amount,
        customer_id: order.customer_id,
        order_id: payment.order_id,
        order_no: order.order_no || '',
      },
    });
  }
}
