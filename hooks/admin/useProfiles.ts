'use client';

import { useEffect } from 'react';
import { useERPStore } from '@/store';
import { getProfileRepository } from '@/infrastructure/di/container';

const loaded = { current: false };

export function useProfiles() {
  const profiles = useERPStore((s) => s.profiles);
  const setProfiles = useERPStore((s) => s.setProfiles);
  const addToCache = useERPStore((s) => s.addProfileToCache);
  const updateInCache = useERPStore((s) => s.updateProfileInCache);

  const repo = getProfileRepository();

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    void repo.findAll().then(setProfiles);
  }, [repo, setProfiles]);

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

  const refreshProfiles = async () => {
    const all = await repo.findAll();
    setProfiles(all);
  };

  return { profiles, addProfile, updateProfile, refreshProfiles };
}
