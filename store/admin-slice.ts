import type { StateCreator } from 'zustand';
import type { Profile } from '@/domain/admin/entities';

export interface AdminSlice {
  profiles: Profile[];
  isHydrated: boolean;

  // Cache setters
  setProfiles: (profiles: Profile[]) => void;
  setHydrated: (hydrated: boolean) => void;
  addProfileToCache: (p: Profile) => void;
  updateProfileInCache: (id: string, data: Partial<Profile>) => void;
}

export const createAdminSlice: StateCreator<AdminSlice, [], [], AdminSlice> = (set) => ({
  profiles: [],
  isHydrated: false,

  setProfiles: (profiles) => set({ profiles }),
  setHydrated: (hydrated) => set({ isHydrated: hydrated }),
  addProfileToCache: (p) =>
    set((s) => ({ profiles: [...s.profiles, p] })),
  updateProfileInCache: (id, data) =>
    set((s) => ({
      profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),
});
