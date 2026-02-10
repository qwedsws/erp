import type { IProfileRepository } from '@/domain/admin/ports';
import type { Profile } from '@/domain/admin/entities';
import * as sb from '@/lib/supabase/admin';

export class SupabaseProfileRepository implements IProfileRepository {
  async findAll(): Promise<Profile[]> {
    return sb.fetchProfiles();
  }

  async findById(id: string): Promise<Profile | null> {
    return sb.fetchProfileById(id);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(_data: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile> {
    // Profiles are auto-created by the auth trigger when a user signs up.
    // This method is not used for Supabase-backed profiles.
    throw new Error('Profiles are created automatically via Supabase Auth trigger');
  }

  async update(id: string, data: Partial<Profile>): Promise<Profile> {
    const updated = { ...data, updated_at: new Date().toISOString() };
    await sb.updateProfileDB(id, updated);
    const profile = await sb.fetchProfileById(id);
    if (!profile) throw new Error(`Profile not found: ${id}`);
    return profile;
  }
}
