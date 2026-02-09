export class DomainError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RepositoryError extends DomainError {
  constructor(message: string, public readonly cause?: unknown) {
    super(message, 'REPOSITORY_ERROR');
    this.name = 'RepositoryError';
  }
}

export class InsufficientStockError extends DomainError {
  constructor(materialId: string, requested: number, available: number) {
    super(
      `Insufficient stock for material ${materialId}: requested ${requested}, available ${available}`,
      'INSUFFICIENT_STOCK',
    );
    this.name = 'InsufficientStockError';
  }
}
