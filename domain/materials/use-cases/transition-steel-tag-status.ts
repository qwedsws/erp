import type { SteelTag, SteelTagStatus } from '../entities';
import type { ISteelTagRepository } from '../ports';
import { NotFoundError, ValidationError } from '@/domain/shared/errors';
import { type Result, success, failure } from '@/domain/shared/types';

export type SteelTagAction = 'ALLOCATE' | 'ISSUE' | 'COMPLETE' | 'SCRAP';

export interface TransitionSteelTagStatusInput {
  tagId: string;
  action: SteelTagAction;
  projectId?: string;
}

export interface TransitionSteelTagStatusResult {
  updatedTag: SteelTag;
}

const STEEL_TAG_ALLOWED_TRANSITIONS: Record<SteelTagStatus, SteelTagAction[]> = {
  AVAILABLE: ['ALLOCATE'],
  ALLOCATED: ['ISSUE'],
  IN_USE: ['COMPLETE', 'SCRAP'],
  USED: [],
  SCRAP: [],
};

export function getAvailableSteelTagActions(status: SteelTagStatus): SteelTagAction[] {
  return STEEL_TAG_ALLOWED_TRANSITIONS[status];
}

function canTransition(status: SteelTagStatus, action: SteelTagAction): boolean {
  return STEEL_TAG_ALLOWED_TRANSITIONS[status].includes(action);
}

export class TransitionSteelTagStatusUseCase {
  constructor(private readonly steelTagRepo: ISteelTagRepository) {}

  async execute(
    input: TransitionSteelTagStatusInput,
  ): Promise<Result<TransitionSteelTagStatusResult>> {
    const currentTag = await this.steelTagRepo.findById(input.tagId);
    if (!currentTag) {
      return failure(new NotFoundError('SteelTag', input.tagId));
    }

    if (!canTransition(currentTag.status, input.action)) {
      return failure(
        new ValidationError(
          `Invalid steel tag transition: ${currentTag.status} -> ${input.action}`,
          'status',
        ),
      );
    }

    if (input.action === 'ALLOCATE' && !input.projectId) {
      return failure(
        new ValidationError('projectId is required to allocate a steel tag', 'projectId'),
      );
    }

    const now = new Date().toISOString();

    const patch: Partial<SteelTag> =
      input.action === 'ALLOCATE'
        ? {
            status: 'ALLOCATED',
            project_id: input.projectId,
          }
        : input.action === 'ISSUE'
          ? {
              status: 'IN_USE',
              issued_at: now,
            }
          : input.action === 'COMPLETE'
            ? {
                status: 'USED',
              }
            : {
                status: 'SCRAP',
              };

    const updatedTag = await this.steelTagRepo.update(input.tagId, patch);
    return success({ updatedTag });
  }
}
