'use client';

import { useERPStore } from '@/store';
import { getWorkLogRepository } from '@/infrastructure/di/container';

export function useWorkLogs() {
  const workLogs = useERPStore((s) => s.workLogs);
  const addToCache = useERPStore((s) => s.addWorkLogToCache);

  const repo = getWorkLogRepository();

  const addWorkLog = async (data: Parameters<typeof repo.create>[0]) => {
    const log = await repo.create(data);
    addToCache(log);
    return log;
  };

  return { workLogs, addWorkLog };
}
