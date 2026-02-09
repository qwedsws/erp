import type { StateCreator } from 'zustand';
import type { Supplier, PurchaseOrder, PurchaseRequest } from '@/domain/procurement/entities';
import { mockSuppliers, mockPurchaseOrders, mockPurchaseRequests } from '@/lib/mock-data';

export interface ProcurementSlice {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  purchaseRequests: PurchaseRequest[];

  // Cache setters
  setSuppliers: (suppliers: Supplier[]) => void;
  addSupplierToCache: (s: Supplier) => void;
  updateSupplierInCache: (id: string, data: Partial<Supplier>) => void;
  removeSupplierFromCache: (id: string) => void;

  setPurchaseOrders: (pos: PurchaseOrder[]) => void;
  addPurchaseOrderToCache: (po: PurchaseOrder) => void;
  updatePurchaseOrderInCache: (id: string, data: Partial<PurchaseOrder>) => void;
  removePurchaseOrderFromCache: (id: string) => void;

  setPurchaseRequests: (prs: PurchaseRequest[]) => void;
  addPurchaseRequestToCache: (pr: PurchaseRequest) => void;
  updatePurchaseRequestInCache: (id: string, data: Partial<PurchaseRequest>) => void;
}

export const createProcurementSlice: StateCreator<ProcurementSlice, [], [], ProcurementSlice> = (set) => ({
  suppliers: mockSuppliers,
  purchaseOrders: mockPurchaseOrders,
  purchaseRequests: mockPurchaseRequests,

  setSuppliers: (suppliers) => set({ suppliers }),
  addSupplierToCache: (s) => set((state) => ({ suppliers: [...state.suppliers, s] })),
  updateSupplierInCache: (id, data) =>
    set((state) => ({
      suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...data } : s)),
    })),
  removeSupplierFromCache: (id) =>
    set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) })),

  setPurchaseOrders: (pos) => set({ purchaseOrders: pos }),
  addPurchaseOrderToCache: (po) =>
    set((state) => ({ purchaseOrders: [...state.purchaseOrders, po] })),
  updatePurchaseOrderInCache: (id, data) =>
    set((state) => ({
      purchaseOrders: state.purchaseOrders.map((po) =>
        po.id === id ? { ...po, ...data } : po,
      ),
    })),
  removePurchaseOrderFromCache: (id) =>
    set((state) => ({ purchaseOrders: state.purchaseOrders.filter((po) => po.id !== id) })),

  setPurchaseRequests: (prs) => set({ purchaseRequests: prs }),
  addPurchaseRequestToCache: (pr) =>
    set((state) => ({ purchaseRequests: [...state.purchaseRequests, pr] })),
  updatePurchaseRequestInCache: (id, data) =>
    set((state) => ({
      purchaseRequests: state.purchaseRequests.map((pr) =>
        pr.id === id ? { ...pr, ...data } : pr,
      ),
    })),
});
