import type { ICustomerRepository, IOrderRepository, IPaymentRepository } from '@/domain/sales/ports';
import type { Customer, Order, Payment } from '@/domain/sales/entities';
import { generateId, generateDocumentNo } from '@/domain/shared/types';
import { mockCustomers, mockOrders, mockPayments } from '@/lib/mock-data';

export class InMemoryCustomerRepository implements ICustomerRepository {
  private data: Customer[] = [...mockCustomers];

  async findAll(): Promise<Customer[]> {
    return this.data;
  }

  async findById(id: string): Promise<Customer | null> {
    return this.data.find(c => c.id === id) ?? null;
  }

  async create(data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const now = new Date().toISOString();
    const customer: Customer = { ...data, id: generateId(), created_at: now, updated_at: now };
    this.data.push(customer);
    return customer;
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const idx = this.data.findIndex(c => c.id === id);
    if (idx === -1) throw new Error(`Customer not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(c => c.id !== id);
  }
}

export class InMemoryOrderRepository implements IOrderRepository {
  private data: Order[] = [...mockOrders];

  async findAll(): Promise<Order[]> {
    return this.data;
  }

  async findById(id: string): Promise<Order | null> {
    return this.data.find(o => o.id === id) ?? null;
  }

  async create(data: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'>): Promise<Order> {
    const now = new Date().toISOString();
    const order_no = generateDocumentNo('SO', this.data.map(o => o.order_no));
    const order: Order = { ...data, id: generateId(), order_no, created_at: now, updated_at: now };
    this.data.push(order);
    return order;
  }

  async update(id: string, data: Partial<Order>): Promise<Order> {
    const idx = this.data.findIndex(o => o.id === id);
    if (idx === -1) throw new Error(`Order not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }
}

export class InMemoryPaymentRepository implements IPaymentRepository {
  private data: Payment[] = [...mockPayments];

  async findAll(): Promise<Payment[]> {
    return this.data;
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    return this.data.filter(p => p.order_id === orderId);
  }

  async create(data: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment> {
    const now = new Date().toISOString();
    const payment: Payment = { ...data, id: generateId(), created_at: now, updated_at: now };
    this.data.push(payment);
    return payment;
  }

  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    const idx = this.data.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Payment not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(p => p.id !== id);
  }
}
