import type { QueryRangeOptions } from '@/domain/shared/types'

export function logSupabaseError(label: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
  console.error(`${label}:`, error.message ?? 'unknown', `[code=${error.code}]`, error.details ?? '', error.hint ?? '')
}

export function throwSupabaseError(label: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
  logSupabaseError(label, error)
  throw error
}

export function isMissingRelationError(error: { message?: string; code?: string; details?: string }) {
  const message = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase()
  return (
    error.code === '42P01' || // PostgreSQL: relation does not exist
    error.code === 'PGRST205' || // PostgREST: table/view not found in schema cache
    (message.includes('relation') && message.includes('does not exist'))
  )
}

export function applyRange<T extends { range: (from: number, to: number) => T }>(
  query: T,
  options?: QueryRangeOptions,
): T {
  if (typeof options?.limit !== 'number') return query
  const from = options.offset ?? 0
  const to = from + options.limit - 1
  return query.range(from, to)
}
