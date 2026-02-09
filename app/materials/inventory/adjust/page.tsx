'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings2 } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { useFeedbackToast } from '@/components/common/feedback-toast-provider'
import { useMaterials } from '@/hooks/materials/useMaterials'
import { useStocks } from '@/hooks/materials/useStocks'

export default function StockAdjustPage() {
  const router = useRouter()
  const { materials } = useMaterials()
  const { stocks, adjustStock } = useStocks()
  const { showError, showSuccess } = useFeedbackToast()

  const [selectedMaterialId, setSelectedMaterialId] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')

  const materialById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  )
  const stockByMaterialId = useMemo(
    () => new Map(stocks.map((stock) => [stock.material_id, stock])),
    [stocks],
  )

  const selectedMaterial = materialById.get(selectedMaterialId)
  const selectedStock = stockByMaterialId.get(selectedMaterialId)
  const currentStock = selectedStock?.quantity ?? 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMaterialId) {
      showError('자재를 선택해주세요.')
      return
    }

    const qty = Number(quantity)
    if (!quantity || qty <= 0) {
      showError('수량은 0보다 큰 값을 입력해주세요.')
      return
    }

    if (!reason.trim()) {
      showError('조정 사유를 입력해주세요.')
      return
    }

    if (adjustmentType === 'decrease' && qty > currentStock) {
      showError(`감소 수량(${qty})이 현재 재고(${currentStock})보다 많습니다.`)
      return
    }

    const finalQuantity = adjustmentType === 'decrease' ? -qty : qty
    const result = await adjustStock(selectedMaterialId, finalQuantity, reason.trim())
    if (result.ok) {
      showSuccess('재고 조정이 완료되었습니다.')
      router.push('/materials/inventory')
    } else {
      showError(result.error)
    }
  }

  const inputClassName =
    'w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/materials/inventory')}
          className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader
          title="재고 조정"
          description="재고 수량을 조정합니다"
        />
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        {/* Material Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            자재 선택 <span className="text-destructive">*</span>
          </label>
          <select
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className={inputClassName}
          >
            <option value="">자재를 선택하세요</option>
            {materials.map((material) => {
              const stock = stockByMaterialId.get(material.id)
              const stockQty = stock?.quantity ?? 0
              return (
                <option key={material.id} value={material.id}>
                  {material.name} (현재 재고: {stockQty} {material.unit})
                </option>
              )
            })}
          </select>
        </div>

        {/* Current Stock Display */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">현재 재고</label>
          <input
            type="text"
            readOnly
            value={
              selectedMaterial
                ? `${currentStock} ${selectedMaterial.unit}`
                : '-'
            }
            className={`${inputClassName} bg-muted cursor-not-allowed`}
          />
        </div>

        {/* Adjustment Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            조정 유형 <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="adjustmentType"
                value="increase"
                checked={adjustmentType === 'increase'}
                onChange={() => setAdjustmentType('increase')}
                className="h-4 w-4 accent-primary"
              />
              증가 (+)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="adjustmentType"
                value="decrease"
                checked={adjustmentType === 'decrease'}
                onChange={() => setAdjustmentType('decrease')}
                className="h-4 w-4 accent-primary"
              />
              감소 (-)
            </label>
          </div>
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            수량 <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="조정 수량을 입력하세요"
            className={inputClassName}
          />
        </div>

        {/* Reason Textarea */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            조정 사유 <span className="text-destructive">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="예: 파손, 분실, 오입력 수정"
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Settings2 className="h-4 w-4" />
          조정 처리
        </button>
      </form>
    </div>
  )
}
