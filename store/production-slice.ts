import type { StateCreator } from 'zustand';
import type { Machine, WorkOrder, WorkLog } from '@/domain/production/entities';
import { mockMachines, mockWorkOrders, mockWorkLogs } from '@/lib/mock-data';

export interface ProductionSlice {
  machines: Machine[];
  workOrders: WorkOrder[];
  workLogs: WorkLog[];

  // Cache setters
  setMachines: (machines: Machine[]) => void;
  setWorkOrders: (wos: WorkOrder[]) => void;
  addWorkOrderToCache: (wo: WorkOrder) => void;
  updateWorkOrderInCache: (id: string, data: Partial<WorkOrder>) => void;

  setWorkLogs: (logs: WorkLog[]) => void;
  addWorkLogToCache: (log: WorkLog) => void;
}

export const createProductionSlice: StateCreator<ProductionSlice, [], [], ProductionSlice> = (set) => ({
  machines: mockMachines,
  workOrders: mockWorkOrders,
  workLogs: mockWorkLogs,

  setMachines: (machines) => set({ machines }),
  setWorkOrders: (wos) => set({ workOrders: wos }),
  addWorkOrderToCache: (wo) =>
    set((s) => ({ workOrders: [...s.workOrders, wo] })),
  updateWorkOrderInCache: (id, data) =>
    set((s) => ({
      workOrders: s.workOrders.map((wo) => (wo.id === id ? { ...wo, ...data } : wo)),
    })),

  setWorkLogs: (logs) => set({ workLogs: logs }),
  addWorkLogToCache: (log) =>
    set((s) => ({ workLogs: [...s.workLogs, log] })),
});
