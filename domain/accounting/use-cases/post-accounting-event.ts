import type { AccountingEvent, JournalEntry, AROpenItem, APOpenItem, AccountingSourceType, AccountingEventType } from '../entities';
import type { IGLAccountRepository, IJournalEntryRepository, IAROpenItemRepository, IAPOpenItemRepository, IAccountingEventRepository } from '../ports';
import { generateId, generateDocumentNo, type Result, success, failure } from '@/domain/shared/types';
import { generatePostingFromEvent } from '../services';

export interface PostAccountingEventInput {
  source_type: AccountingSourceType;
  source_id: string;
  source_no: string;
  event_type: AccountingEventType;
  payload: Record<string, unknown>;
}

export interface PostAccountingEventResult {
  event: AccountingEvent;
  journalEntry: JournalEntry;
  arItem?: AROpenItem;
  apItem?: APOpenItem;
}

export class PostAccountingEventUseCase {
  constructor(
    private readonly glAccountRepo: IGLAccountRepository,
    private readonly journalEntryRepo: IJournalEntryRepository,
    private readonly arRepo: IAROpenItemRepository,
    private readonly apRepo: IAPOpenItemRepository,
    private readonly eventRepo: IAccountingEventRepository,
  ) {}

  async execute(input: PostAccountingEventInput): Promise<Result<PostAccountingEventResult>> {
    try {
      // 1. Create accounting event
      const event = await this.eventRepo.create({
        source_type: input.source_type,
        source_id: input.source_id,
        event_type: input.event_type,
        occurred_at: new Date().toISOString(),
        payload: input.payload,
        status: 'POSTED',
      });

      // 2. Get GL accounts
      const allAccounts = await this.glAccountRepo.findAll();
      const accountByCode = new Map(allAccounts.map(a => [a.code, a]));

      // 3. Generate posting via AutoPostingService
      const posting = generatePostingFromEvent(
        { eventType: input.event_type, sourceId: input.source_id, payload: input.payload },
        accountByCode,
      );

      if (!posting) {
        await this.eventRepo.update(event.id, { status: 'ERROR' });
        return failure(new Error(`Failed to generate posting for event type: ${input.event_type}`));
      }

      // 4. Create journal entry
      const existingEntries = await this.journalEntryRepo.findAll();
      const journalNo = generateDocumentNo('JE', existingEntries.map(e => e.journal_no));
      const today = new Date().toISOString().split('T')[0];

      const journalEntry = await this.journalEntryRepo.create({
        journal_no: journalNo,
        posting_date: today,
        source_type: input.source_type,
        source_id: input.source_id,
        source_no: input.source_no,
        description: posting.description,
        status: 'POSTED',
        lines: posting.lines.map(line => ({
          ...line,
          id: generateId(),
          journal_entry_id: '', // will be set by repo
        })),
      });

      // 5. Update event with journal entry ID
      await this.eventRepo.update(event.id, { journal_entry_id: journalEntry.id });
      const updatedEvent = { ...event, journal_entry_id: journalEntry.id };

      // 6. Handle AR/AP side effects
      let arItem: AROpenItem | undefined;
      let apItem: APOpenItem | undefined;

      if (posting.arItem) {
        arItem = await this.arRepo.create(posting.arItem);
      }

      if (input.event_type === 'PAYMENT_CONFIRMED') {
        // Reduce AR balance for the order
        const orderId = input.payload.order_id as string;
        const amount = input.payload.amount as number;
        if (orderId && amount) {
          const existingAR = await this.arRepo.findByOrderId(orderId);
          if (existingAR) {
            const newBalance = Math.max(0, existingAR.balance_amount - amount);
            const newStatus = newBalance <= 0 ? 'CLOSED' as const : 'PARTIAL' as const;
            arItem = await this.arRepo.update(existingAR.id, {
              balance_amount: newBalance,
              status: newStatus,
            });
          }
        }
      }

      if (posting.apItem) {
        apItem = await this.apRepo.create(posting.apItem);
      }

      return success({ event: updatedEvent, journalEntry, arItem, apItem });
    } catch (err) {
      return failure(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
