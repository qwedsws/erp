'use client';

import { useCallback, useState } from 'react';

interface AsyncActionState {
  isLoading: boolean;
  error: string | null;
}

export type AsyncResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * 비동기 액션의 isLoading/error/try-catch-finally 보일러플레이트를 제거하는 유틸 훅.
 *
 * @example
 * const { run, isLoading, error } = useAsyncAction();
 * const stockOut = (id: string) => run(async () => {
 *   const result = await useCase.execute({ id });
 *   if (!result.ok) throw result.error;
 *   updateCache(result.value);
 * });
 */
export function useAsyncAction() {
  const [state, setState] = useState<AsyncActionState>({
    isLoading: false,
    error: null,
  });

  const run = useCallback(async <T>(action: () => Promise<T>): Promise<AsyncResult<T>> => {
    setState({ isLoading: true, error: null });
    try {
      const result = await action();
      setState({ isLoading: false, error: null });
      return { ok: true, value: result };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setState({ isLoading: false, error: message });
      return { ok: false, error: message };
    }
  }, []);

  return { run, isLoading: state.isLoading, error: state.error };
}
