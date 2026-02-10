'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FeedbackToastContext,
  type FeedbackToastContextValue,
  type ToastOptions,
  type ToastVariant,
  useFeedbackToast,
} from '@/hooks/shared/useFeedbackToast';
import { cn } from '@/lib/utils';

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

const TOAST_DURATION_MS = 3200;

export function FeedbackToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);
  const timerMapRef = useRef<Map<number, number>>(new Map());

  const dismissToast = useCallback((id: number) => {
    const timerId = timerMapRef.current.get(id);
    if (timerId) {
      window.clearTimeout(timerId);
      timerMapRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, variant = 'info', durationMs = TOAST_DURATION_MS }: ToastOptions) => {
      const id = nextIdRef.current++;
      setToasts((prev) => [...prev, { id, title, description, variant }]);

      const timerId = window.setTimeout(() => {
        dismissToast(id);
      }, durationMs);

      timerMapRef.current.set(id, timerId);
    },
    [dismissToast],
  );

  useEffect(() => {
    const timerMap = timerMapRef.current;
    return () => {
      for (const timerId of timerMap.values()) {
        window.clearTimeout(timerId);
      }
      timerMap.clear();
    };
  }, []);

  const value = useMemo<FeedbackToastContextValue>(
    () => ({
      showToast,
      showSuccess: (description, title = '완료') =>
        showToast({ title, description, variant: 'success' }),
      showError: (description, title = '오류') =>
        showToast({ title, description, variant: 'error' }),
      showInfo: (description, title = '안내') =>
        showToast({ title, description, variant: 'info' }),
    }),
    [showToast],
  );

  return (
    <FeedbackToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[120] pointer-events-none flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto rounded-md border bg-card shadow-md px-3 py-2',
              toast.variant === 'success' && 'border-green-300',
              toast.variant === 'error' && 'border-red-300',
              toast.variant === 'info' && 'border-blue-300',
            )}
          >
            <div className="flex items-start gap-2">
              <span className="pt-0.5">
                {toast.variant === 'success' && (
                  <CheckCircle2 size={14} className="text-green-600" />
                )}
                {toast.variant === 'error' && <XCircle size={14} className="text-red-600" />}
                {toast.variant === 'info' && <Info size={14} className="text-blue-600" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 break-words">
                    {toast.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => dismissToast(toast.id)}
                className="h-5 w-5"
              >
                <X size={12} />
                <span className="sr-only">닫기</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </FeedbackToastContext.Provider>
  );
}

export { useFeedbackToast };
