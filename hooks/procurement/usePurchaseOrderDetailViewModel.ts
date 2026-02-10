'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePurchaseOrders } from '@/hooks/procurement/usePurchaseOrders';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { useStocks } from '@/hooks/materials/useStocks';
import { useFeedbackToast } from '@/hooks/shared/useFeedbackToast';
import { getPurchaseOrderRepository } from '@/infrastructure/di/container';
import type { Material, Supplier, Profile, PurchaseOrder, PurchaseOrderItem, StockMovement } from '@/domain/shared/entities';

// ── Derived types ──────────────────────────────────────────────────────

export interface ItemWithDetails extends PurchaseOrderItem {
  material: Material | undefined;
  received: number;
  remaining: number;
  subtotal: number;
}

export interface ItemTotals {
  quantity: number;
  amount: number;
  received: number;
  remaining: number;
}

export interface EditFormState {
  supplier_id: string;
  order_date: string;
  due_date: string;
  notes: string;
}

// ── Hook return type ───────────────────────────────────────────────────

export interface PurchaseOrderDetailViewModel {
  isLoading: boolean;

  // Core data
  po: PurchaseOrder | undefined;
  supplier: Supplier | null;
  creator: Profile | null;
  suppliers: Supplier[];
  itemsWithDetails: ItemWithDetails[];
  totals: ItemTotals;
  receivingHistory: StockMovement[];
  materialById: Map<string, Material>;

  // Edit state
  isEditing: boolean;
  editForm: EditFormState;

  // Confirm dialog state
  confirmAction: 'cancel' | 'delete' | null;
  setConfirmAction: (action: 'cancel' | 'delete' | null) => void;

  // Handlers
  handleConfirmOrder: () => Promise<void>;
  handleCancelOrder: () => void;
  handleDelete: () => void;
  handleConfirmAction: () => Promise<void>;
  handleStartEdit: () => void;
  handleCancelEdit: () => void;
  handleSaveEdit: () => Promise<void>;
  handleEditChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  navigateToList: () => void;
}

// ── Hook implementation ────────────────────────────────────────────────

export function usePurchaseOrderDetailViewModel(): PurchaseOrderDetailViewModel {
  const params = useParams();
  const router = useRouter();
  const { updatePurchaseOrder, deletePurchaseOrder } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { materials } = useMaterials();
  const { profiles } = useProfiles();
  const { stockMovements } = useStocks({ includeStocks: false, includeMovements: true });
  const { showError, showInfo, showSuccess } = useFeedbackToast();

  const poId = typeof params.id === 'string' ? params.id : params.id?.[0];

  // ── Local state ────────────────────────────────────────────────────

  const [isEditing, setIsEditing] = useState(false);
  const [resolvedPO, setResolvedPO] = useState<PurchaseOrder | null | undefined>(undefined);
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'delete' | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    supplier_id: '',
    order_date: '',
    due_date: '',
    notes: '',
  });

  useEffect(() => {
    let mounted = true;

    if (!poId) {
      return () => {
        mounted = false;
      };
    }

    const repo = getPurchaseOrderRepository();
    void repo
      .findById(poId)
      .then((purchaseOrder) => {
        if (!mounted) return;
        setResolvedPO(purchaseOrder);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('[usePurchaseOrderDetailViewModel] failed to load purchase order:', err);
        setResolvedPO(null);
      });

    return () => {
      mounted = false;
    };
  }, [poId]);

  const isLoading = Boolean(poId) && resolvedPO === undefined;

  // ── Memoised lookups ───────────────────────────────────────────────

  const supplierById = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s])),
    [suppliers],
  );
  const profileById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );
  const materialById = useMemo(
    () => new Map(materials.map((m) => [m.id, m])),
    [materials],
  );

  const po = resolvedPO ?? undefined;

  const supplier = useMemo(() => {
    if (!po) return null;
    return supplierById.get(po.supplier_id) ?? null;
  }, [po, supplierById]);

  const creator = useMemo(() => {
    if (!po?.created_by) return null;
    return profileById.get(po.created_by) ?? null;
  }, [po, profileById]);

  const itemsWithDetails = useMemo<ItemWithDetails[]>(() => {
    if (!po) return [];
    return po.items.map((item) => {
      const mat = materialById.get(item.material_id);
      const receivedQty = item.received_quantity || 0;
      const remainingQty = item.quantity - receivedQty;
      const subtotal = item.quantity * item.unit_price;
      return { ...item, material: mat, received: receivedQty, remaining: remainingQty, subtotal };
    });
  }, [po, materialById]);

  const totals = useMemo<ItemTotals>(() => {
    return itemsWithDetails.reduce(
      (acc, item) => ({
        quantity: acc.quantity + item.quantity,
        amount: acc.amount + item.subtotal,
        received: acc.received + item.received,
        remaining: acc.remaining + item.remaining,
      }),
      { quantity: 0, amount: 0, received: 0, remaining: 0 },
    );
  }, [itemsWithDetails]);

  const receivingHistory = useMemo(() => {
    if (!po) return [];
    return stockMovements
      .filter((sm) => sm.purchase_order_id === po.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [po, stockMovements]);

  // ── Handlers ───────────────────────────────────────────────────────

  const navigateToList = useCallback(() => {
    router.push('/materials/purchase-orders');
  }, [router]);

  const handleConfirmOrder = useCallback(async () => {
    if (!po) return;
    const result = await updatePurchaseOrder(po.id, { status: 'ORDERED' });
    if (result.ok) {
      setResolvedPO(result.value);
      showSuccess('발주를 확정했습니다.');
    } else {
      showError(result.error);
    }
  }, [po, updatePurchaseOrder, showSuccess, showError]);

  const handleCancelOrder = useCallback(() => {
    setConfirmAction('cancel');
  }, []);

  const handleDelete = useCallback(() => {
    setConfirmAction('delete');
  }, []);

  const handleConfirmAction = useCallback(async () => {
    if (!confirmAction || !po) return;
    if (confirmAction === 'cancel') {
      const result = await updatePurchaseOrder(po.id, { status: 'CANCELLED' });
      if (result.ok) {
        setResolvedPO(result.value);
        showSuccess('발주를 취소했습니다.');
        setConfirmAction(null);
      } else {
        showError(result.error);
      }
    } else {
      const result = await deletePurchaseOrder(po.id);
      if (result.ok) {
        showSuccess('발주를 삭제했습니다.');
        setConfirmAction(null);
        router.push('/materials/purchase-orders');
      } else {
        showError(result.error);
      }
    }
  }, [confirmAction, po, updatePurchaseOrder, deletePurchaseOrder, router, showSuccess, showError]);

  const handleStartEdit = useCallback(() => {
    if (!po) return;
    setEditForm({
      supplier_id: po.supplier_id,
      order_date: po.order_date,
      due_date: po.due_date || '',
      notes: po.notes || '',
    });
    setIsEditing(true);
  }, [po]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!po) return;
    if (!editForm.supplier_id) {
      showInfo('공급처를 선택하세요.');
      return;
    }
    if (!editForm.order_date) {
      showInfo('발주일을 입력하세요.');
      return;
    }
    const result = await updatePurchaseOrder(po.id, {
      supplier_id: editForm.supplier_id,
      order_date: editForm.order_date,
      due_date: editForm.due_date || undefined,
      notes: editForm.notes || undefined,
    });
    if (result.ok) {
      setResolvedPO(result.value);
      setIsEditing(false);
      showSuccess('발주 정보를 저장했습니다.');
    } else {
      showError(result.error);
    }
  }, [po, editForm, updatePurchaseOrder, showInfo, showSuccess, showError]);

  const handleEditChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    [],
  );

  return {
    isLoading,
    po,
    supplier,
    creator,
    suppliers,
    itemsWithDetails,
    totals,
    receivingHistory,
    materialById,
    isEditing,
    editForm,
    confirmAction,
    setConfirmAction,
    handleConfirmOrder,
    handleCancelOrder,
    handleDelete,
    handleConfirmAction,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleEditChange,
    navigateToList,
  };
}
