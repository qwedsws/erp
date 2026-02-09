import type { Project, ProcessStep, WorkOrder, WorkLog, Order, Customer, Profile } from '@/types';

export interface ProjectDetailContext {
  project: Project;
  order: Order | null;
  customer: Customer | null;
  manager: Profile | null;
  steps: ProcessStep[];
  projectWOs: WorkOrder[];
  projectLogs: WorkLog[];
  profileById: Map<string, Profile>;
}
