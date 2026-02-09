import type { Profile } from './entities';

export interface IProfileRepository {
  findAll(): Promise<Profile[]>;
  findById(id: string): Promise<Profile | null>;
  create(data: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile>;
  update(id: string, data: Partial<Profile>): Promise<Profile>;
}
