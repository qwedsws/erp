import type { StateCreator } from 'zustand';
import type { Customer, Order, Payment } from '@/domain/sales/entities';
import { mockCustomers, mockOrders, mockPayments } from '@/lib/mock-data';

export interface SalesSlice {
  customers: Customer[];
  orders: Order[];
  payments: Payment[];

  // Cache setters
  setCustomers: (customers: Customer[]) => void;
  addCustomerToCache: (c: Customer) => void;
  updateCustomerInCache: (id: string, data: Partial<Customer>) => void;
  removeCustomerFromCache: (id: string) => void;

  setOrders: (orders: Order[]) => void;
  addOrderToCache: (o: Order) => void;
  updateOrderInCache: (id: string, data: Partial<Order>) => void;

  setPayments: (payments: Payment[]) => void;
  addPaymentToCache: (p: Payment) => void;
  updatePaymentInCache: (id: string, data: Partial<Payment>) => void;
  removePaymentFromCache: (id: string) => void;
}

export const createSalesSlice: StateCreator<SalesSlice, [], [], SalesSlice> = (set) => ({
  customers: mockCustomers,
  orders: mockOrders,
  payments: mockPayments,

  setCustomers: (customers) => set({ customers }),
  addCustomerToCache: (c) => set((s) => ({ customers: [...s.customers, c] })),
  updateCustomerInCache: (id, data) =>
    set((s) => ({
      customers: s.customers.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),
  removeCustomerFromCache: (id) =>
    set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

  setOrders: (orders) => set({ orders }),
  addOrderToCache: (o) => set((s) => ({ orders: [...s.orders, o] })),
  updateOrderInCache: (id, data) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? { ...o, ...data } : o)),
    })),

  setPayments: (payments) => set({ payments }),
  addPaymentToCache: (p) => set((s) => ({ payments: [...s.payments, p] })),
  updatePaymentInCache: (id, data) =>
    set((s) => ({
      payments: s.payments.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),
  removePaymentFromCache: (id) =>
    set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),
});
