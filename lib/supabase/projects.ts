import { createClient } from './client'
import type { Project, ProcessStep } from '@/domain/shared/entities'

const supabase = createClient()

// ============ PROJECTS ============

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Project[]
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as Project | null
}

export async function insertProject(project: Project): Promise<void> {
  const { error } = await supabase.from('projects').insert(project)
  if (error) throw error
}

export async function updateProjectDB(id: string, data: Partial<Project>): Promise<void> {
  const { error } = await supabase.from('projects').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteProjectDB(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

// ============ PROCESS STEPS ============

export async function fetchProcessSteps(): Promise<ProcessStep[]> {
  const { data, error } = await supabase
    .from('process_steps')
    .select('*')
    .order('sequence')
  if (error) throw error
  return (data ?? []) as ProcessStep[]
}

export async function fetchProcessStepsByProjectId(projectId: string): Promise<ProcessStep[]> {
  const { data, error } = await supabase
    .from('process_steps')
    .select('*')
    .eq('project_id', projectId)
    .order('sequence')
  if (error) throw error
  return (data ?? []) as ProcessStep[]
}

export async function fetchProcessStepById(id: string): Promise<ProcessStep | null> {
  const { data, error } = await supabase
    .from('process_steps')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as ProcessStep | null
}

export async function insertProcessStep(step: ProcessStep): Promise<void> {
  const { error } = await supabase.from('process_steps').insert(step)
  if (error) throw error
}

export async function insertProcessSteps(steps: ProcessStep[]): Promise<void> {
  if (steps.length === 0) return
  const { error } = await supabase.from('process_steps').insert(steps)
  if (error) throw error
}

export async function updateProcessStepDB(id: string, data: Partial<ProcessStep>): Promise<void> {
  const { error } = await supabase.from('process_steps').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteProcessStepDB(id: string): Promise<void> {
  const { error } = await supabase.from('process_steps').delete().eq('id', id)
  if (error) throw error
}
