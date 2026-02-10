'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : authError.message,
      );
      setIsLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">MoldERP</h1>
          <p className="text-sm text-muted-foreground mt-1">
            금형 제조 ERP 시스템
          </p>
        </div>

        {/* Login form */}
        <div className="border border-border bg-card p-6">
          <h2 className="text-sm font-semibold mb-4">로그인</h2>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium mb-1.5"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                placeholder="name@company.com"
                className="w-full h-9 px-3 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium mb-1.5"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="비밀번호 입력"
                className="w-full h-9 px-3 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          계정이 없으시면 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  );
}
