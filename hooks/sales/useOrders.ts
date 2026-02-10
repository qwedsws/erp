'use client';

import { useERPStore } from '@/store';
import {
  getOrderRepository,
  getProjectRepository,
  getProcessStepRepository,
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
import { PostOrderConfirmedAccountingUseCase } from '@/domain/sales/use-cases/post-order-confirmed-accounting';

export function useOrders() {
  const orders = useERPStore((s) => s.orders);
  const addToCache = useERPStore((s) => s.addOrderToCache);
  const updateInCache = useERPStore((s) => s.updateOrderInCache);
  const addProjectToCache = useERPStore((s) => s.addProjectToCache);
  const addProcessStepToCache = useERPStore((s) => s.addProcessStepToCache);
  // Accounting cache
  const addJournalEntryToCache = useERPStore((s) => s.addJournalEntryToCache);
  const addAccountingEventToCache = useERPStore((s) => s.addAccountingEventToCache);
  const addAROpenItemToCache = useERPStore((s) => s.addAROpenItemToCache);

  const orderRepo = getOrderRepository();
  const projectRepo = getProjectRepository();
  const stepRepo = getProcessStepRepository();
  const createOrderWithProjectUseCase = new CreateOrderWithProjectUseCase(
    orderRepo,
    projectRepo,
    stepRepo,
  );
  const createProjectFromOrderUseCase = new CreateProjectFromOrderUseCase(projectRepo);
  const postOrderConfirmedAccountingUseCase = new PostOrderConfirmedAccountingUseCase(
    getGLAccountRepository(),
    getJournalEntryRepository(),
    getAROpenItemRepository(),
    getAPOpenItemRepository(),
    getAccountingEventRepository(),
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
    for (const step of result.value.designSteps) {
      addProcessStepToCache(step);
    }

    const accountingResult = await postOrderConfirmedAccountingUseCase.execute(result.value.order);
    if (accountingResult.ok && accountingResult.value) {
      addJournalEntryToCache(accountingResult.value.journalEntry);
      addAccountingEventToCache(accountingResult.value.event);
      if (accountingResult.value.arItem) {
        addAROpenItemToCache(accountingResult.value.arItem);
      }
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
