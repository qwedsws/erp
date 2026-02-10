'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Save, Trash2, TrendingUp, X, Loader2, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { MATERIAL_CATEGORY_MAP } from '@/types';
import { useMaterialDetailViewModel } from '@/hooks/materials/useMaterialDetailViewModel';
import { useMaterialDelete } from '@/hooks/materials/useMaterialDelete';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { MaterialInfoSection } from './_components/material-info-section';
import { SteelTagSection } from './_components/steel-tag-section';
import { PriceSection } from './_components/price-section';
import { MovementSection } from './_components/movement-section';

export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showError, showInfo, showSuccess } = useFeedbackToast();
  const materialId = typeof params.id === 'string' ? params.id : params.id?.[0];

  const {
    material,
    stock,
    suppliers,
    supplierById,
    projectById,
    mainSupplier,
    materialTags,
    tagStats,
    movements,
    supplierPrices,
    priceHistory,
    priceStats,
    selectedSupplier,
    isEditing,
    editForm,
    setSelectedSupplier,
    handleStartEdit,
    handleCancelEdit,
    handleEditChange,
    handleSaveEdit,
    getPriceChangePercent,
  } = useMaterialDetailViewModel(materialId);

  const {
    deleteTargets,
    blockedItems,
    isChecking,
    isDeleting,
    isConfirmOpen,
    isDependencyModalOpen,
    requestDelete,
    confirmDelete,
    cancelDelete,
    setIsConfirmOpen,
    setIsDependencyModalOpen,
  } = useMaterialDelete({
    onDeleted: () => { showSuccess('자재를 삭제했습니다.'); router.push('/materials/items'); },
    onError: (msg) => showError(msg),
  });

  const handleSave = async () => {
    const result = await handleSaveEdit();
    if (!result.ok) {
      const message = result.errorMessage ?? '자재 저장 중 오류가 발생했습니다.';
      if (result.errorType === 'validation') {
        showInfo(message);
      } else {
        showError(message);
      }
      return;
    }
    showSuccess('자재 정보를 저장했습니다.');
  };

  if (!material) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">자재를 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push('/materials/items')}
          className="mt-4 text-primary hover:underline text-sm"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => router.push('/materials/items')}
          className="p-1 rounded hover:bg-accent"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm text-muted-foreground">자재 마스터</span>
      </div>

      <PageHeader
        title={material.name}
        description={material.material_code}
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
              {MATERIAL_CATEGORY_MAP[material.category]}
            </span>
            {isEditing ? (
              <>
                <button
                  onClick={() => void handleSave()}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                >
                  <Save size={14} /> 저장
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent"
                >
                  <X size={14} /> 취소
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent"
                >
                  <Pencil size={14} /> 편집
                </button>
                <button
                  onClick={() => material && requestDelete(material)}
                  disabled={isChecking}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-destructive text-destructive rounded-md text-sm hover:bg-destructive/10 disabled:opacity-50"
                >
                  {isChecking ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} 삭제
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <MaterialInfoSection
            material={material}
            suppliers={suppliers}
            mainSupplier={mainSupplier}
            isEditing={isEditing}
            editForm={editForm}
            onEditChange={handleEditChange}
          />

          {material.category === 'STEEL' && (
            <SteelTagSection
              materialTags={materialTags}
              tagStats={tagStats}
              projectById={projectById}
            />
          )}

          <PriceSection
            material={material}
            supplierPrices={supplierPrices}
            priceStats={priceStats}
            priceHistory={priceHistory}
            selectedSupplier={selectedSupplier}
            supplierById={supplierById}
            onSelectSupplier={setSelectedSupplier}
            getPriceChangePercent={getPriceChangePercent}
          />

          <MovementSection
            movements={movements}
            projectById={projectById}
            onProjectNavigate={(projectId) => router.push(`/projects/${projectId}`)}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">재고 정보</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">현재 수량</dt>
                <dd
                  className={`font-bold text-lg ${
                    stock &&
                    material.safety_stock != null &&
                    stock.quantity < material.safety_stock
                      ? 'text-red-600'
                      : ''
                  }`}
                >
                  {stock?.quantity != null ? stock.quantity.toLocaleString() : '0'}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    {material.unit}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">위치</dt>
                <dd className="font-medium">{stock?.location_code || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">평균 단가</dt>
                <dd className="font-medium">
                  {stock?.avg_unit_price
                    ? `${stock.avg_unit_price.toLocaleString()}원`
                    : '-'}
                </dd>
              </div>
              {stock &&
                material.safety_stock != null &&
                stock.quantity < material.safety_stock && (
                  <div className="mt-3 p-3 rounded-md bg-red-50 border border-red-200">
                    <p className="text-xs text-red-700 font-medium">재고 부족 경고</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      안전재고({material.safety_stock.toLocaleString()}) 미만입니다.
                    </p>
                  </div>
                )}
            </dl>
          </div>

          {supplierPrices.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={16} />
                단가 요약
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">등록 공급처</dt>
                  <dd className="font-bold">{priceStats.supplierCount}곳</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">최저가</dt>
                  <dd className="font-bold text-green-600">
                    {priceStats.min.toLocaleString()}원
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">최고가</dt>
                  <dd className="font-bold text-red-600">
                    {priceStats.max.toLocaleString()}원
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">가격차이</dt>
                  <dd className="font-bold">
                    {(priceStats.max - priceStats.min).toLocaleString()}원
                  </dd>
                </div>
                {priceStats.supplierCount > 1 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">공급처별 가격 분포</p>
                    {supplierPrices.map((supplierPrice) => {
                      const range = priceStats.max - priceStats.min;
                      const position =
                        range > 0
                          ? ((supplierPrice.currentPrice - priceStats.min) / range) * 100
                          : 50;

                      return (
                        <div
                          key={supplierPrice.supplier_id}
                          className="flex items-center gap-2 mb-1.5"
                        >
                          <span className="text-xs w-16 truncate text-muted-foreground">
                            {supplierPrice.supplierName.length > 6
                              ? `${supplierPrice.supplierName.substring(0, 6)}..`
                              : supplierPrice.supplierName}
                          </span>
                          <div className="flex-1 h-2 bg-muted rounded-full relative">
                            <div
                              className={`absolute top-0 w-2 h-2 rounded-full ${
                                supplierPrice.isMain ? 'bg-primary' : 'bg-orange-400'
                              }`}
                              style={{ left: `calc(${position}% - 4px)` }}
                            />
                          </div>
                          <span className="text-xs font-mono w-20 text-right">
                            {supplierPrice.currentPrice.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="자재 삭제"
        description={`"${deleteTargets[0]?.name ?? ''}" 자재를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        confirmVariant="destructive"
        confirmDisabled={isDeleting}
        onConfirm={confirmDelete}
      />

      <AlertDialog open={isDependencyModalOpen} onOpenChange={setIsDependencyModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-destructive" />
              자재 삭제 불가
            </AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{blockedItems[0]?.material.name}&quot; 자재가 다른 데이터에서 사용 중이므로 삭제할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {blockedItems.length > 0 && (
            <div className="space-y-2 text-sm">
              {blockedItems[0].dependencies.items.map((dep) => (
                <div key={dep.type} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                  <span className="font-medium shrink-0">{dep.label}</span>
                  <span className="text-muted-foreground">{dep.count}건</span>
                  {dep.samples.length > 0 && (
                    <span className="text-xs text-muted-foreground truncate">
                      ({dep.samples.join(', ')})
                    </span>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-1">
                관련 데이터를 먼저 삭제한 후 자재를 삭제해 주세요.
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>닫기</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
