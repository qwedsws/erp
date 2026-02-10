'use client';

import { createContext, useContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

export interface FeedbackToastContextValue {
  showToast: (options: ToastOptions) => void;
  showSuccess: (description: string, title?: string) => void;
  showError: (description: string, title?: string) => void;
  showInfo: (description: string, title?: string) => void;
}

export const FeedbackToastContext = createContext<FeedbackToastContextValue | null>(null);

export function useFeedbackToast() {
  const context = useContext(FeedbackToastContext);
  if (!context) {
    throw new Error('useFeedbackToast must be used within FeedbackToastProvider');
  }
  return context;
}
