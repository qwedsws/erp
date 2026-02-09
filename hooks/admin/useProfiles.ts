'use client';

import { useERPStore } from '@/store';
import { getProfileRepository } from '@/infrastructure/di/container';

export function useProfiles() {
  const profiles = useERPStore((s) => s.profiles);
  const addToCache = useERPStore((s) => s.addProfileToCache);
  const updateInCache = useERPStore((s) => s.updateProfileInCache);

  const repo = getProfileRepository();

  const addProfile = async (data: Parameters<typeof repo.create>[0]) => {
    const profile = await repo.create(data);
    addToCache(profile);
    return profile;
  };

  const updateProfile = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  return { profiles, addProfile, updateProfile };
}
