import type {
  AccountingEvent,
  JournalEntry,
  AROpenItem,
  APOpenItem,
  AccountingSourceType,
  AccountingEventType,
} from '../entities';
import type {
  IGLAccountRepository,
  IJournalEntryRepository,
  IAROpenItemRepository,
  IAPOpenItemRepository,
  IAccountingEventRepository,
} from '../ports';
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
    let trackingEvent: AccountingEvent | null = null;

    try {
      const existingResult = await this.findExistingPostedResult(input);
      if (existingResult) return success(existingResult);

      trackingEvent = await this.prepareTrackingEvent(input);

      const allAccounts = await this.glAccountRepo.findAll();
      const accountByCode = new Map(allAccounts.map((a) => [a.code, a]));

      const posting = generatePostingFromEvent(
        { eventType: input.event_type, sourceId: input.source_id, payload: input.payload },
        accountByCode,
      );
      if (!posting) {
        throw new Error(`Failed to generate posting for event type: ${input.event_type}`);
      }

      const existingEntries = await this.journalEntryRepo.findAll();
      const journalNo = generateDocumentNo('JE', existingEntries.map((e) => e.journal_no));
      const today = new Date().toISOString().split('T')[0];

      const journalEntry = await this.journalEntryRepo.create({
        journal_no: journalNo,
        posting_date: today,
        source_type: input.source_type,
        source_id: input.source_id,
        source_no: input.source_no,
        description: posting.description,
        status: 'POSTED',
        lines: posting.lines.map((line) => ({
          ...line,
          id: generateId(),
          journal_entry_id: '',
        })),
      });

      let arItem: AROpenItem | undefined;
      let apItem: APOpenItem | undefined;

      if (posting.arItem) {
        arItem = await this.arRepo.create(posting.arItem);
      }

      if (input.event_type === 'PAYMENT_CONFIRMED') {
        const orderId = input.payload.order_id as string;
        const amount = input.payload.amount as number;
        if (orderId && amount) {
          const existingAR = await this.arRepo.findByOrderId(orderId);
          if (existingAR) {
            const newBalance = Math.max(0, existingAR.balance_amount - amount);
            const newStatus = newBalance <= 0 ? ('CLOSED' as const) : ('PARTIAL' as const);
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

      const event = await this.eventRepo.update(trackingEvent.id, {
        status: 'POSTED',
        journal_entry_id: journalEntry.id,
        occurred_at: new Date().toISOString(),
        payload: input.payload,
      });

      return success({ event, journalEntry, arItem, apItem });
    } catch (err) {
      if (trackingEvent) {
        try {
          await this.eventRepo.update(trackingEvent.id, {
            status: 'ERROR',
            payload: this.withErrorPayload(input.payload, err),
            occurred_at: new Date().toISOString(),
          });
        } catch {
          // Ignore secondary failure while marking ERROR.
          // TODO: Full DB transaction requires Supabase RPC — partial journal/AR/AP writes may remain
        }
      }
      return failure(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private async prepareTrackingEvent(input: PostAccountingEventInput): Promise<AccountingEvent> {
    const relatedEvents = await this.findRelatedEvents(input);
    const latestErrorEvent = relatedEvents.find((event) => event.status === 'ERROR');
    if (latestErrorEvent) {
      return this.eventRepo.update(latestErrorEvent.id, {
        status: 'ERROR',
        occurred_at: new Date().toISOString(),
        payload: input.payload,
      });
    }

    return this.eventRepo.create({
      source_type: input.source_type,
      source_id: input.source_id,
      event_type: input.event_type,
      occurred_at: new Date().toISOString(),
      payload: input.payload,
      status: 'ERROR',
    });
  }

  private async findExistingPostedResult(
    input: PostAccountingEventInput,
  ): Promise<PostAccountingEventResult | null> {
    const relatedEvents = await this.findRelatedEvents(input);
    const postedEvent = relatedEvents.find((event) => event.status === 'POSTED' && event.journal_entry_id);

    if (postedEvent?.journal_entry_id) {
      const journalEntry = await this.journalEntryRepo.findById(postedEvent.journal_entry_id);
      if (journalEntry) {
        const { arItem, apItem } = await this.resolveOpenItems(input);
        return { event: postedEvent, journalEntry, arItem, apItem };
      }
    }

    const existingJournalEntries = await this.journalEntryRepo.findBySourceId(input.source_id);
    const existingJournalEntry = existingJournalEntries.find(
      (entry) => entry.source_type === input.source_type,
    );
    if (!existingJournalEntry) {
      return null;
    }

    const event = postedEvent
      ? postedEvent
      : relatedEvents[0]
        ? await this.eventRepo.update(relatedEvents[0].id, {
            status: 'POSTED',
            journal_entry_id: existingJournalEntry.id,
            occurred_at: new Date().toISOString(),
            payload: input.payload,
          })
        : await this.eventRepo.create({
            source_type: input.source_type,
            source_id: input.source_id,
            event_type: input.event_type,
            occurred_at: new Date().toISOString(),
            payload: input.payload,
            status: 'POSTED',
            journal_entry_id: existingJournalEntry.id,
          });

    const { arItem, apItem } = await this.resolveOpenItems(input);
    return { event, journalEntry: existingJournalEntry, arItem, apItem };
  }

  private async findRelatedEvents(input: PostAccountingEventInput): Promise<AccountingEvent[]> {
    const events = await this.eventRepo.findBySourceId(input.source_id);
    return events
      .filter((event) => event.event_type === input.event_type)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  private async resolveOpenItems(input: PostAccountingEventInput): Promise<{
    arItem?: AROpenItem;
    apItem?: APOpenItem;
  }> {
    if (input.event_type === 'ORDER_CONFIRMED') {
      const arItem = await this.arRepo.findByOrderId(input.source_id);
      return { arItem: arItem ?? undefined };
    }

    if (input.event_type === 'PAYMENT_CONFIRMED') {
      const orderId = input.payload.order_id as string | undefined;
      if (!orderId) return {};
      const arItem = await this.arRepo.findByOrderId(orderId);
      return { arItem: arItem ?? undefined };
    }

    if (input.event_type === 'PO_ORDERED') {
      const apItem = await this.apRepo.findByPurchaseOrderId(input.source_id);
      return { apItem: apItem ?? undefined };
    }

    return {};
  }

  private withErrorPayload(
    payload: Record<string, unknown>,
    err: unknown,
  ): Record<string, unknown> {
    return {
      ...payload,
      error_message: err instanceof Error ? err.message : String(err),
    };
  }
}
