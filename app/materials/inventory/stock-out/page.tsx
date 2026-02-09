'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PackageMinus } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { useProjects } from '@/hooks/projects/useProjects';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useStocks } from '@/hooks/materials/useStocks';

export default function StockOutPage() {
  const router = useRouter();
  const { projects } = useProjects();
  const { materials } = useMaterials();
  const { stocks, stockOut } = useStocks();
  const { showError, showSuccess } = useFeedbackToast();

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');

  const materialById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  );
  const stockByMaterialId = useMemo(
    () => new Map(stocks.map((stock) => [stock.material_id, stock])),
    [stocks],
  );

  const selectedMaterial = materialById.get(selectedMaterialId);
  const selectedStock = stockByMaterialId.get(selectedMaterialId);
  const currentStock = selectedStock?.quantity ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProjectId) {
      showError('프로젝트를 선택해주세요.');
      return;
    }
    if (!selectedMaterialId) {
      showError('자재를 선택해주세요.');
      return;
    }
    if (quantity <= 0) {
      showError('출고 수량은 0보다 커야 합니다.');
      return;
    }
    if (quantity > currentStock) {
      showError('출고 수량이 현재 재고를 초과합니다.');
      return;
    }

    const result = await stockOut(selectedMaterialId, quantity, selectedProjectId, reason || undefined);
    if (result.ok) {
      showSuccess('출고 처리가 완료되었습니다.');
      router.push('/materials/inventory');
    } else {
      showError(result.error);
    }
  };

  const inputClass =
    'w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/materials/inventory"
          className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader
          title="자재 출고"
          description="프로젝트에 자재를 출고합니다"
        />
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        {/* Project Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            프로젝트 <span className="text-destructive">*</span>
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">프로젝트를 선택하세요</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Material Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            자재 <span className="text-destructive">*</span>
          </label>
          <select
            value={selectedMaterialId}
            onChange={(e) => {
              setSelectedMaterialId(e.target.value);
              setQuantity(0);
            }}
            className={inputClass}
            required
          >
            <option value="">자재를 선택하세요</option>
            {materials.map((material) => {
              const stock = stockByMaterialId.get(material.id);
              const stockQty = stock?.quantity ?? 0;
              return (
                <option key={material.id} value={material.id}>
                  {material.name} (재고: {stockQty} {material.unit})
                </option>
              );
            })}
          </select>
        </div>

        {/* Current Stock Display */}
        <div className="space-y-2">
          <label className="text-sm font-medium">현재 재고</label>
          <input
            type="text"
            value={
              selectedMaterial
                ? `${currentStock} ${selectedMaterial.unit}`
                : '-'
            }
            readOnly
            className={`${inputClass} bg-muted cursor-not-allowed`}
          />
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            출고 수량 <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            value={quantity || ''}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min={1}
            max={currentStock}
            placeholder="출고할 수량을 입력하세요"
            className={inputClass}
            required
          />
          {selectedMaterial && (
            <p className="text-xs text-muted-foreground">
              최대 출고 가능: {currentStock} {selectedMaterial.unit}
            </p>
          )}
        </div>

        {/* Reason Textarea */}
        <div className="space-y-2">
          <label className="text-sm font-medium">출고 사유</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="출고 사유를 입력하세요 (선택)"
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="inline-flex items-center gap-2 h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <PackageMinus className="h-4 w-4" />
          출고 처리
        </button>
      </form>
    </div>
  );
}
