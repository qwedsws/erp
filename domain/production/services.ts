import type { WorkOrder, WorkLog } from './entities';
import type { IWorkOrderRepository, IWorkLogRepository } from './ports';

export class WorkOrderService {
  constructor(private readonly workOrderRepo: IWorkOrderRepository) {}

  async getAll(): Promise<WorkOrder[]> {
    return this.workOrderRepo.findAll();
  }

  async getById(id: string): Promise<WorkOrder | null> {
    return this.workOrderRepo.findById(id);
  }

  async create(data: Omit<WorkOrder, 'id' | 'work_order_no' | 'created_at' | 'updated_at'>): Promise<WorkOrder> {
    return this.workOrderRepo.create(data);
  }

  async update(id: string, data: Partial<WorkOrder>): Promise<WorkOrder> {
    return this.workOrderRepo.update(id, data);
  }
}

export class WorkLogService {
  constructor(private readonly workLogRepo: IWorkLogRepository) {}

  async getAll(): Promise<WorkLog[]> {
    return this.workLogRepo.findAll();
  }

  async getByWorkOrderId(workOrderId: string): Promise<WorkLog[]> {
    return this.workLogRepo.findByWorkOrderId(workOrderId);
  }

  async create(data: Omit<WorkLog, 'id' | 'created_at'>): Promise<WorkLog> {
    return this.workLogRepo.create(data);
  }
}
