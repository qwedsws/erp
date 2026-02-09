'use client';

import { useMemo } from 'react';
import { useCustomers } from '@/hooks/sales/useCustomers';
import { useOrders } from '@/hooks/sales/useOrders';
import { usePayments } from '@/hooks/sales/usePayments';
import { PAYMENT_TYPE_MAP, PAYMENT_METHOD_MAP } from '@/types/display';

// ---------------------------------------------------------------------------
// Return-type interfaces
// ---------------------------------------------------------------------------

export interface SalesKPI {
  totalOrderAmount: number;
  totalPaidAmount: number;
  outstandingAmount: number;
  collectionRate: number;
  orderCount: number;
  confirmedPaymentCount: number;
}

export interface MonthlyDatum {
  month: string;
  수주액: number;
  입금액: number;
}

export interface CustomerRankingDatum {
  name: string;
  금액: number;
}

export interface PieSlice {
  name: string;
  value: number;
}

export interface OrderCollectionRow {
  order_no: string;
  customer_name: string;
  total: number;
  paid: number;
  remaining: number;
  rate: number;
}

export interface CustomerOutstandingRow {
  customer_name: string;
  total: number;
  paid: number;
  outstanding: number;
  rate: number;
}

export interface SalesStatisticsData {
  kpi: SalesKPI;
  monthlyData: MonthlyDatum[];
  customerRanking: CustomerRankingDatum[];
  paymentTypeData: PieSlice[];
  paymentMethodData: PieSlice[];
  orderCollectionData: OrderCollectionRow[];
  customerOutstandingData: CustomerOutstandingRow[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSalesStatisticsData(): SalesStatisticsData {
  const { orders } = useOrders();
  const { customers } = useCustomers();
  const { payments } = usePayments();

  // Build a Map<id, Customer> once — replaces repeated O(n) .find() calls
  const customerById = useMemo(() => {
    const map = new Map<string, (typeof customers)[number]>();
    for (const c of customers) {
      map.set(c.id, c);
    }
    return map;
  }, [customers]);

  const confirmedPayments = useMemo(
    () => payments.filter(p => p.status === 'CONFIRMED'),
    [payments],
  );

  // ---- KPI ----------------------------------------------------------------

  const totalOrderAmount = useMemo(
    () => orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    [orders],
  );

  const totalPaidAmount = useMemo(
    () => confirmedPayments.reduce((sum, p) => sum + p.amount, 0),
    [confirmedPayments],
  );

  const kpi = useMemo<SalesKPI>(
    () => ({
      totalOrderAmount,
      totalPaidAmount,
      outstandingAmount: totalOrderAmount - totalPaidAmount,
      collectionRate:
        totalOrderAmount > 0
          ? Math.round((totalPaidAmount / totalOrderAmount) * 100)
          : 0,
      orderCount: orders.length,
      confirmedPaymentCount: confirmedPayments.length,
    }),
    [totalOrderAmount, totalPaidAmount, orders.length, confirmedPayments.length],
  );

  // ---- Monthly order/payment trend (last 6 months) ------------------------

  const monthlyData = useMemo<MonthlyDatum[]>(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - 5 + i);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.getMonth() + 1}월`;
      const orderAmount = orders
        .filter(o => o.order_date.startsWith(month))
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const paidAmount = confirmedPayments
        .filter(p => p.payment_date.startsWith(month))
        .reduce((sum, p) => sum + p.amount, 0);
      return {
        month: label,
        수주액: Math.round(orderAmount / 10000),
        입금액: Math.round(paidAmount / 10000),
      };
    });
  }, [orders, confirmedPayments]);

  // ---- Top 5 customers by order amount (O(n) via Map) ---------------------

  const customerRanking = useMemo<CustomerRankingDatum[]>(() => {
    const map: Record<string, number> = {};
    for (const o of orders) {
      map[o.customer_id] = (map[o.customer_id] || 0) + (o.total_amount || 0);
    }
    return Object.entries(map)
      .map(([cid, amount]) => ({
        name: customerById.get(cid)?.name || cid,
        금액: Math.round(amount / 10000),
      }))
      .sort((a, b) => b.금액 - a.금액)
      .slice(0, 5);
  }, [orders, customerById]);

  // ---- Payment type distribution (confirmed only) -------------------------

  const paymentTypeData = useMemo<PieSlice[]>(() => {
    const map: Record<string, number> = {};
    for (const p of confirmedPayments) {
      const label = PAYMENT_TYPE_MAP[p.payment_type] || p.payment_type;
      map[label] = (map[label] || 0) + p.amount;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [confirmedPayments]);

  // ---- Payment method distribution (confirmed only) -----------------------

  const paymentMethodData = useMemo<PieSlice[]>(() => {
    const map: Record<string, number> = {};
    for (const p of confirmedPayments) {
      const label = PAYMENT_METHOD_MAP[p.payment_method] || p.payment_method;
      map[label] = (map[label] || 0) + p.amount;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [confirmedPayments]);

  // ---- Collection status per order (O(n) via Map) -------------------------

  const orderCollectionData = useMemo<OrderCollectionRow[]>(() => {
    // Pre-aggregate confirmed payments by order_id → O(m) instead of O(n*m)
    const paidByOrder = new Map<string, number>();
    for (const p of confirmedPayments) {
      paidByOrder.set(p.order_id, (paidByOrder.get(p.order_id) ?? 0) + p.amount);
    }

    return orders
      .map(o => {
        const total = o.total_amount || 0;
        const paid = paidByOrder.get(o.id) ?? 0;
        const remaining = total - paid;
        const rate = total > 0 ? Math.round((paid / total) * 100) : 0;
        return {
          order_no: o.order_no,
          customer_name: customerById.get(o.customer_id)?.name || '-',
          total,
          paid,
          remaining,
          rate,
        };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [orders, customerById, confirmedPayments]);

  // ---- Outstanding balance per customer (O(n) via Map) --------------------

  const customerOutstandingData = useMemo<CustomerOutstandingRow[]>(() => {
    // 1. Group orders by customer_id -> sum total_amount
    const customerTotalMap = new Map<string, number>();
    const orderToCustomerMap = new Map<string, string>();

    for (const o of orders) {
      customerTotalMap.set(
        o.customer_id,
        (customerTotalMap.get(o.customer_id) ?? 0) + (o.total_amount ?? 0),
      );
      orderToCustomerMap.set(o.id, o.customer_id);
    }

    // 2. Confirmed payments -> customer paid
    const customerPaidMap = new Map<string, number>();
    for (const p of confirmedPayments) {
      const customerId = orderToCustomerMap.get(p.order_id);
      if (customerId) {
        customerPaidMap.set(
          customerId,
          (customerPaidMap.get(customerId) ?? 0) + p.amount,
        );
      }
    }

    // 3. outstanding = total - paid
    const result: CustomerOutstandingRow[] = [];
    for (const [customerId, total] of customerTotalMap) {
      const paid = customerPaidMap.get(customerId) ?? 0;
      const outstanding = total - paid;
      const rate = total > 0 ? Math.round((paid / total) * 100) : 0;
      result.push({
        customer_name: customerById.get(customerId)?.name ?? customerId,
        total,
        paid,
        outstanding,
        rate,
      });
    }

    // 4. Sort by outstanding descending
    return result.sort((a, b) => b.outstanding - a.outstanding);
  }, [orders, customerById, confirmedPayments]);

  return {
    kpi,
    monthlyData,
    customerRanking,
    paymentTypeData,
    paymentMethodData,
    orderCollectionData,
    customerOutstandingData,
  };
}
