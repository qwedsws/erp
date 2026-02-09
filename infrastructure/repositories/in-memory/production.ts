import type { IWorkOrderRepository, IWorkLogRepository } from '@/domain/production/ports';
import type { WorkOrder, WorkLog } from '@/domain/production/entities';
import { generateId, generateDocumentNo } from '@/domain/shared/types';
import { mockWorkOrders, mockWorkLogs } from '@/lib/mock-data';

export class InMemoryWorkOrderRepository implements IWorkOrderRepository {
  private data: WorkOrder[] = [...mockWorkOrders];

  async findAll(): Promise<WorkOrder[]> {
    return this.data;
  }

  async findById(id: string): Promise<WorkOrder | null> {
    return this.data.find(wo => wo.id === id) ?? null;
  }

  async create(data: Omit<WorkOrder, 'id' | 'work_order_no' | 'created_at' | 'updated_at'>): Promise<WorkOrder> {
    const now = new Date().toISOString();
    const work_order_no = generateDocumentNo('WO', this.data.map(wo => wo.work_order_no), 5);
    const workOrder: WorkOrder = { ...data, id: generateId(), work_order_no, created_at: now, updated_at: now };
    this.data.push(workOrder);
    return workOrder;
  }

  async update(id: string, data: Partial<WorkOrder>): Promise<WorkOrder> {
    const idx = this.data.findIndex(wo => wo.id === id);
    if (idx === -1) throw new Error(`WorkOrder not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }
}

export class InMemoryWorkLogRepository implements IWorkLogRepository {
  private data: WorkLog[] = [...mockWorkLogs];

  async findAll(): Promise<WorkLog[]> {
    return this.data;
  }

  async findByWorkOrderId(workOrderId: string): Promise<WorkLog[]> {
    return this.data.filter(wl => wl.work_order_id === workOrderId);
  }

  async create(data: Omit<WorkLog, 'id' | 'created_at'>): Promise<WorkLog> {
    const now = new Date().toISOString();
    const workLog: WorkLog = { ...data, id: generateId(), created_at: now };
    this.data.push(workLog);
    return workLog;
  }
}
