import type { WorkOrder, WorkLog } from './entities';

export interface IWorkOrderRepository {
  findAll(): Promise<WorkOrder[]>;
  findById(id: string): Promise<WorkOrder | null>;
  create(data: Omit<WorkOrder, 'id' | 'work_order_no' | 'created_at' | 'updated_at'>): Promise<WorkOrder>;
  update(id: string, data: Partial<WorkOrder>): Promise<WorkOrder>;
}

export interface IWorkLogRepository {
  findAll(): Promise<WorkLog[]>;
  findByWorkOrderId(workOrderId: string): Promise<WorkLog[]>;
  create(data: Omit<WorkLog, 'id' | 'created_at'>): Promise<WorkLog>;
}
