'use client';

import { useERPStore } from '@/store';
import {
  getOrderRepository,
  getProjectRepository,
  getGLAccountRepository,
  getJournalEntryRepository,
  getAROpenItemRepository,
  getAPOpenItemRepository,
  getAccountingEventRepository,
} from '@/infrastructure/di/container';
import {
  CreateOrderWithProjectUseCase,
  type CreateOrderWithProjectInput,
} from '@/domain/sales/use-cases/create-order-with-project';
import {
  CreateProjectFromOrderUseCase,
  type CreateProjectFromOrderInput,
} from '@/domain/sales/use-cases/create-project-from-order';
import { PostAccountingEventUseCase } from '@/domain/accounting/use-cases/post-accounting-event';

export function useOrders() {
  const orders = useERPStore((s) => s.orders);
  const addToCache = useERPStore((s) => s.addOrderToCache);
  const updateInCache = useERPStore((s) => s.updateOrderInCache);
  const addProjectToCache = useERPStore((s) => s.addProjectToCache);
  // Accounting cache
  const addJournalEntryToCache = useERPStore((s) => s.addJournalEntryToCache);
  const addAccountingEventToCache = useERPStore((s) => s.addAccountingEventToCache);
  const addAROpenItemToCache = useERPStore((s) => s.addAROpenItemToCache);

  const orderRepo = getOrderRepository();
  const projectRepo = getProjectRepository();
  const createOrderWithProjectUseCase = new CreateOrderWithProjectUseCase(
    orderRepo,
    projectRepo,
  );
  const createProjectFromOrderUseCase = new CreateProjectFromOrderUseCase(projectRepo);
  const postAccountingEventUseCase = new PostAccountingEventUseCase(
    getGLAccountRepository(), getJournalEntryRepository(), getAROpenItemRepository(), getAPOpenItemRepository(), getAccountingEventRepository(),
  );

  const addOrder = async (data: Parameters<typeof orderRepo.create>[0]) => {
    const order = await orderRepo.create(data);
    addToCache(order);
    return order;
  };

  const updateOrder = async (id: string, data: Parameters<typeof orderRepo.update>[1]) => {
    const updated = await orderRepo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  const createOrderWithProject = async (input: CreateOrderWithProjectInput) => {
    const result = await createOrderWithProjectUseCase.execute(input);
    if (!result.ok) throw result.error;

    addToCache(result.value.order);
    if (result.value.project) {
      addProjectToCache(result.value.project);
    }

    // Auto-journaling: ORDER_CONFIRMED
    try {
      const postResult = await postAccountingEventUseCase.execute({
        source_type: 'ORDER',
        source_id: result.value.order.id,
        source_no: result.value.order.order_no,
        event_type: 'ORDER_CONFIRMED',
        payload: {
          amount: result.value.order.total_amount || 0,
          customer_id: result.value.order.customer_id,
          order_no: result.value.order.order_no,
          due_date: result.value.order.delivery_date,
        },
      });
      if (postResult.ok) {
        addJournalEntryToCache(postResult.value.journalEntry);
        addAccountingEventToCache(postResult.value.event);
        if (postResult.value.arItem) addAROpenItemToCache(postResult.value.arItem);
      }
    } catch {
      // Silent fail — accounting should not block order creation
    }

    return result.value;
  };

  const createProjectFromOrder = async (input: CreateProjectFromOrderInput) => {
    const result = await createProjectFromOrderUseCase.execute(input);
    if (!result.ok) throw result.error;

    addProjectToCache(result.value);
    return result.value;
  };

  return {
    orders,
    addOrder,
    updateOrder,
    createOrderWithProject,
    createProjectFromOrder,
  };
}
