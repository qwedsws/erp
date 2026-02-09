import type { IProfileRepository } from '@/domain/admin/ports';
import type { Profile } from '@/domain/admin/entities';
import { generateId } from '@/domain/shared/types';
import { mockProfiles } from '@/lib/mock-data';

export class InMemoryProfileRepository implements IProfileRepository {
  private data: Profile[] = [...mockProfiles];

  async findAll(): Promise<Profile[]> {
    return this.data;
  }

  async findById(id: string): Promise<Profile | null> {
    return this.data.find(p => p.id === id) ?? null;
  }

  async create(data: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile> {
    const now = new Date().toISOString();
    const profile: Profile = { ...data, id: generateId(), created_at: now, updated_at: now };
    this.data.push(profile);
    return profile;
  }

  async update(id: string, data: Partial<Profile>): Promise<Profile> {
    const idx = this.data.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Profile not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }
}
