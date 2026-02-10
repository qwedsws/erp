import { createClient } from './client'
import type { Profile } from '@/domain/shared/entities'

const supabase = createClient()

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function fetchProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as Profile | null
}

export async function updateProfileDB(id: string, data: Partial<Profile>): Promise<void> {
  const { error } = await supabase.from('profiles').update(data).eq('id', id)
  if (error) throw error
}
