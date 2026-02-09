import type { Customer, Order, Payment } from './entities';

export interface ICustomerRepository {
  findAll(): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
  create(data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer>;
  update(id: string, data: Partial<Customer>): Promise<Customer>;
  delete(id: string): Promise<void>;
}

export interface IOrderRepository {
  findAll(): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  create(data: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'>): Promise<Order>;
  update(id: string, data: Partial<Order>): Promise<Order>;
}

export interface IPaymentRepository {
  findAll(): Promise<Payment[]>;
  findByOrderId(orderId: string): Promise<Payment[]>;
  create(data: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment>;
  update(id: string, data: Partial<Payment>): Promise<Payment>;
  delete(id: string): Promise<void>;
}
