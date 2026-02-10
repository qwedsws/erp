import type { StockMovement } from '../entities';
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

export interface PostStockOutAccountingInput {
  movement: Pick<StockMovement, 'id' | 'material_id' | 'project_id' | 'quantity' | 'reason'>;
  unitPrice: number;
}

export class PostStockOutAccountingUseCase {
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

  async execute(input: PostStockOutAccountingInput): Promise<Result<PostAccountingEventResult | null>> {
    if (!input.movement.project_id) return success(null);

    const amount = input.movement.quantity * (input.unitPrice || 0);
    if (amount <= 0) return success(null);

    return this.postAccountingEventUseCase.execute({
      source_type: 'STOCK_MOVEMENT',
      source_id: input.movement.id,
      source_no: input.movement.id,
      event_type: 'STOCK_OUT',
      payload: {
        material_id: input.movement.material_id,
        project_id: input.movement.project_id,
        amount,
        reason: input.movement.reason || '자재 출고',
      },
    });
  }
}
