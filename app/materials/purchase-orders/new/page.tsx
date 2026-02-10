'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { ArrowLeft } from 'lucide-react';
import { usePurchaseOrderForm } from '@/hooks/procurement/usePurchaseOrderForm';
import { PRImportPanel } from './_components/pr-import-panel';
import { POItemsTable } from './_components/po-items-table';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const {
    form,
    setForm,
    items,
    materials,
    suppliers,
    materialById,
    profileById,
    totalAmount,
    addItem,
    removeItem,
    updateItem,
    handleSubmit,
    calcSteelItem,
    // PR import
    availablePRs,
    prsLoading,
    selectedPrIds,
    importedPrIds,
    importNotice,
    setImportNotice,
    togglePrSelection,
    toggleAllPrs,
    importPRs,
  } = usePurchaseOrderForm();

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.push('/materials/purchase-orders')} className="p-1 rounded hover:bg-accent">
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm text-muted-foreground">발주 관리</span>
      </div>
      <PageHeader title="발주 등록" description="새로운 구매 발주를 등록합니다" />

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4 mb-6">
          <h3 className="text-sm font-semibold">기본 정보</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">공급처 *</label>
              <select
                value={form.supplier_id}
                onChange={(e) => setForm(prev => ({ ...prev, supplier_id: e.target.value }))}
                required
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">선택하세요</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">발주일 *</label>
              <input
                type="date"
                value={form.order_date}
                onChange={(e) => setForm(prev => ({ ...prev, order_date: e.target.value }))}
                required
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">납기일</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">비고</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        <PRImportPanel
          availablePRs={availablePRs}
          prsLoading={prsLoading}
          selectedPrIds={selectedPrIds}
          importedPrIds={importedPrIds}
          importNotice={importNotice}
          setImportNotice={setImportNotice}
          togglePrSelection={togglePrSelection}
          toggleAllPrs={toggleAllPrs}
          importPRs={importPRs}
          materialById={materialById}
          profileById={profileById}
        />

        <POItemsTable
          items={items}
          materials={materials}
          materialById={materialById}
          calcSteelItem={calcSteelItem}
          updateItem={updateItem}
          removeItem={removeItem}
          addItem={addItem}
          totalAmount={totalAmount}
        />

        <div className="flex items-center gap-3">
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
            저장
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent">
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
