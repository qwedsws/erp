/**
 * Backward-compatible re-export.
 * The actual store is at store/index.ts with sliced architecture.
 * Keep presentation code on domain hooks; avoid direct store usage in pages.
 */
export { useERPStore } from '@/store';
export type { ERPStore } from '@/store';
