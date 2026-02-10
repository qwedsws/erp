// Result type for use case return values
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface QueryRangeOptions {
  limit?: number;
  offset?: number;
}

// ---- Server-side pagination/search/filter contracts ----

export interface PageQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Resource-specific page queries

export interface MaterialPageQuery extends PageQuery {
  category?: string;
  lowStockOnly?: boolean;
}

export interface InventoryStats {
  totalItems: number;
  lowStockCount: number;
  totalValue: number;
}

export interface PurchaseOrderPageQuery extends PageQuery {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PurchaseRequestPageQuery extends PageQuery {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export type SupplierPageQuery = PageQuery;

export function success<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function failure<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// ID generation
export function generateId(): string {
  return crypto.randomUUID();
}

// Document number generation
export function generateDocumentNo(
  prefix: string,
  existingNumbers: string[],
  padLen: number = 3,
): string {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-`;
  const existing = existingNumbers.filter(no => no.startsWith(pattern));
  const maxNum = existing.reduce((max, no) => {
    const num = parseInt(no.replace(pattern, ''));
    return num > max ? num : max;
  }, 0);
  return `${pattern}${String(maxNum + 1).padStart(padLen, '0')}`;
}
