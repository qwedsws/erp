import type { Customer, Order, Payment } from './entities';
import type { ICustomerRepository, IOrderRepository, IPaymentRepository } from './ports';

export class CustomerService {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async getAll(): Promise<Customer[]> {
    return this.customerRepo.findAll();
  }

  async getById(id: string): Promise<Customer | null> {
    return this.customerRepo.findById(id);
  }

  async create(data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    return this.customerRepo.create(data);
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    return this.customerRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.customerRepo.delete(id);
  }
}

export class OrderService {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async getAll(): Promise<Order[]> {
    return this.orderRepo.findAll();
  }

  async getById(id: string): Promise<Order | null> {
    return this.orderRepo.findById(id);
  }

  async create(data: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'>): Promise<Order> {
    return this.orderRepo.create(data);
  }

  async update(id: string, data: Partial<Order>): Promise<Order> {
    return this.orderRepo.update(id, data);
  }
}

export class PaymentService {
  constructor(private readonly paymentRepo: IPaymentRepository) {}

  async getAll(): Promise<Payment[]> {
    return this.paymentRepo.findAll();
  }

  async getByOrderId(orderId: string): Promise<Payment[]> {
    return this.paymentRepo.findByOrderId(orderId);
  }

  async create(data: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment> {
    return this.paymentRepo.create(data);
  }

  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    return this.paymentRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.paymentRepo.delete(id);
  }
}
