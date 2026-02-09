'use client';

import { useERPStore } from '@/store';
import { getOrderRepository, getProjectRepository } from '@/infrastructure/di/container';
import {
  CreateOrderWithProjectUseCase,
  type CreateOrderWithProjectInput,
} from '@/domain/sales/use-cases/create-order-with-project';
import {
  CreateProjectFromOrderUseCase,
  type CreateProjectFromOrderInput,
} from '@/domain/sales/use-cases/create-project-from-order';

export function useOrders() {
  const orders = useERPStore((s) => s.orders);
  const addToCache = useERPStore((s) => s.addOrderToCache);
  const updateInCache = useERPStore((s) => s.updateOrderInCache);
  const addProjectToCache = useERPStore((s) => s.addProjectToCache);

  const orderRepo = getOrderRepository();
  const projectRepo = getProjectRepository();
  const createOrderWithProjectUseCase = new CreateOrderWithProjectUseCase(
    orderRepo,
    projectRepo,
  );
  const createProjectFromOrderUseCase = new CreateProjectFromOrderUseCase(projectRepo);

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
