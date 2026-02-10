'use client';

import React, { Suspense, useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { useProjects } from '@/hooks/projects/useProjects';
import { PageHeader } from '@/components/common/page-header';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { ArrowLeft } from 'lucide-react';
import { usePurchaseOrders } from '@/hooks/procurement/usePurchaseOrders';
import { useSteelTags } from '@/hooks/procurement/useSteelTags';
import { useReceivingWorkflows } from '@/hooks/materials/useReceivingWorkflows';
import { useSteelTagAutoGeneration } from '@/hooks/materials/useSteelTagAutoGeneration';
import type { ReceiveItemForm } from '@/hooks/materials/receiving-types';
import { POReceivingSection } from './_components/po-receiving-section';
import { DirectReceivingSection } from './_components/direct-receiving-section';

export default function NewReceivingPage() {
  return (
    <Suspense>
      <NewReceivingContent />
    </Suspense>
  );
}

function NewReceivingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { materials } = useMaterials();
  const { suppliers } = useSuppliers();
  const { projects } = useProjects();
  const { purchaseOrders } = usePurchaseOrders();
  const { steelTags } = useSteelTags();
  const { receiveFromPurchaseOrder, receiveDirectStockWithSteelTags } = useReceivingWorkflows();
  const { showError, showSuccess } = useFeedbackToast();

  const [activeTab, setActiveTab] = useState<'po' | 'direct'>('po');

  // === 발주 기반 입고 state ===
  const [selectedPOId, setSelectedPOId] = useState('');
  const [poReceiveDate, setPOReceiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiveItems, setReceiveItems] = useState<ReceiveItemForm[]>([]);
  // === 직접 입고 state ===
  const [directForm, setDirectForm] = useState({
    material_id: '',
    quantity: '',
    unit_price: '',
    project_id: '',
    reason: '',
  });

  const materialById = useMemo(() => {
    return new Map(materials.map((material) => [material.id, material]));
  }, [materials]);

  const supplierById = useMemo(() => {
    return new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  }, [suppliers]);

  const purchaseOrderById = useMemo(() => {
    return new Map(purchaseOrders.map((purchaseOrder) => [purchaseOrder.id, purchaseOrder]));
  }, [purchaseOrders]);

  const steelTagCountByMaterialId = useMemo(() => {
    const map = new Map<string, number>();
    for (const steelTag of steelTags) {
      map.set(steelTag.material_id, (map.get(steelTag.material_id) ?? 0) + 1);
    }
    return map;
  }, [steelTags]);

  // 입고 가능한 발주서 필터
  const receivablePOs = useMemo(() => {
    return purchaseOrders.filter(
      po => po.status === 'IN_PROGRESS'
    );
  }, [purchaseOrders]);

  // URL 쿼리 파라미터로 PO 자동 선택
  useEffect(() => {
    const poParam = searchParams.get('po');
    if (poParam && receivablePOs.some(po => po.id === poParam)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPOId(poParam);
      setActiveTab('po');
    }
  }, [searchParams, receivablePOs]);

  // 발주서 선택 시 items 테이블 업데이트
  useEffect(() => {
    if (!selectedPOId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReceiveItems([]);
      return;
    }
    const po = purchaseOrderById.get(selectedPOId);
    if (!po) return;

    setReceiveItems(
      po.items.map(item => {
        const remaining = item.quantity - (item.received_quantity || 0);
        return {
          id: item.id,
          material_id: item.material_id,
          quantity: item.quantity,
          received_quantity: item.received_quantity || 0,
          receiveQty: remaining,
          unit_price: item.unit_price,
        };
      })
    );
  }, [selectedPOId, purchaseOrderById]);

  const updateReceiveQty = (itemId: string, value: number) => {
    setReceiveItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        const remaining = item.quantity - item.received_quantity;
        const clamped = Math.max(0, Math.min(value, remaining));
        return { ...item, receiveQty: clamped };
      })
    );
  };

  // STEEL tag auto-generation (PO-based + direct receiving)
  const { steelTagEntries, setSteelTagEntries, directSteelTags, setDirectSteelTags } =
    useSteelTagAutoGeneration({
      receiveItems,
      materialById,
      steelTagCountByMaterialId,
      directMaterialId: directForm.material_id,
      directQuantity: directForm.quantity,
      purchaseOrderById,
      selectedPOId,
    });

  // 발주 기반 입고 저장
  const handlePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await receiveFromPurchaseOrder({
        poId: selectedPOId,
        receivedAt: poReceiveDate,
        items: receiveItems.map((item) => ({
          item_id: item.id,
          material_id: item.material_id,
          quantity: item.receiveQty,
        })),
        steelTagEntriesByItem: steelTagEntries,
      });

      showSuccess('입고 처리가 완료되었습니다.');
      router.push('/materials/receiving');
    } catch (err) {
      showError(err instanceof Error ? err.message : '입고 처리 중 오류가 발생했습니다.');
    }
  };

  // [Issue 2 fix] 직접 입고 저장 — STEEL 태그 포함
  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await receiveDirectStockWithSteelTags({
        material_id: directForm.material_id,
        quantity: Number(directForm.quantity),
        unit_price: Number(directForm.unit_price) || undefined,
        project_id: directForm.project_id || undefined,
        reason: directForm.reason || undefined,
        receivedAt: new Date().toISOString().split('T')[0],
        steelTags: directSteelTags,
      });

      showSuccess('직접 입고 처리가 완료되었습니다.');
      router.push('/materials/receiving');
    } catch (err) {
      showError(err instanceof Error ? err.message : '직접 입고 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.push('/materials/receiving')} className="p-1 rounded hover:bg-accent">
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm text-muted-foreground">입고 관리</span>
      </div>
      <PageHeader title="입고 등록" />

      {/* Tab Toggle */}
      <div className="flex gap-1 mb-6 p-1 bg-muted rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('po')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'po'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          발주 기반 입고
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('direct')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'direct'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          직접 입고
        </button>
      </div>

      {/* Tab 1: 발주 기반 입고 */}
      {activeTab === 'po' && (
        <POReceivingSection
          selectedPOId={selectedPOId}
          setSelectedPOId={setSelectedPOId}
          poReceiveDate={poReceiveDate}
          setPOReceiveDate={setPOReceiveDate}
          receiveItems={receiveItems}
          updateReceiveQty={updateReceiveQty}
          steelTagEntries={steelTagEntries}
          setSteelTagEntries={setSteelTagEntries}
          receivablePOs={receivablePOs}
          materialById={materialById}
          supplierById={supplierById}
          purchaseOrderById={purchaseOrderById}
          onSubmit={handlePOSubmit}
        />
      )}

      {/* Tab 2: 직접 입고 */}
      {activeTab === 'direct' && (
        <DirectReceivingSection
          directForm={directForm}
          setDirectForm={setDirectForm}
          directSteelTags={directSteelTags}
          setDirectSteelTags={setDirectSteelTags}
          materials={materials}
          materialById={materialById}
          projects={projects}
          onSubmit={handleDirectSubmit}
        />
      )}
    </div>
  );
}
