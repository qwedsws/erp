import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Calendar,
  DollarSign,
  History,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { Material, MaterialPrice, Supplier } from '@/types';
import type {
  PriceStats,
  SupplierPriceRow,
} from '@/hooks/materials/useMaterialDetailViewModel';

interface PriceSectionProps {
  material: Material;
  supplierPrices: SupplierPriceRow[];
  priceStats: PriceStats;
  priceHistory: MaterialPrice[];
  selectedSupplier: string | null;
  supplierById: Map<string, Supplier>;
  onSelectSupplier: (supplierId: string | null) => void;
  getPriceChangePercent: (current: number, prev?: number) => number | null;
}

export function PriceSection({
  material,
  supplierPrices,
  priceStats,
  priceHistory,
  selectedSupplier,
  supplierById,
  onSelectSupplier,
  getPriceChangePercent,
}: PriceSectionProps) {
  return (
    <>
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <DollarSign size={16} />
            공급처별 단가 비교
          </h3>
          <span className="text-xs text-muted-foreground">입고 시 자동 갱신</span>
        </div>

        {supplierPrices.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="rounded-md bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">공급처 수</p>
              <p className="text-lg font-bold mt-0.5">{priceStats.supplierCount}</p>
            </div>
            <div className="rounded-md bg-green-50 dark:bg-green-950/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">최저가</p>
              <p className="text-lg font-bold mt-0.5 text-green-600">
                {priceStats.min.toLocaleString()}
              </p>
            </div>
            <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">최고가</p>
              <p className="text-lg font-bold mt-0.5 text-red-600">
                {priceStats.max.toLocaleString()}
              </p>
            </div>
            <div className="rounded-md bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">평균가</p>
              <p className="text-lg font-bold mt-0.5">{priceStats.avg.toLocaleString()}</p>
            </div>
          </div>
        )}

        {supplierPrices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            등록된 공급처별 단가가 없습니다.
          </p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    공급처
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    현재 단가
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    변동
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    기준가 대비
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    적용일
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    이력
                  </th>
                </tr>
              </thead>
              <tbody>
                {supplierPrices.map((row, index) => {
                  const changePercent = getPriceChangePercent(
                    row.currentPrice,
                    row.prevPrice,
                  );
                  const vsBase = material.unit_price
                    ? ((row.currentPrice - material.unit_price) / material.unit_price) * 100
                    : null;
                  const isLowest = index === 0;

                  return (
                    <tr
                      key={row.supplier_id}
                      className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                        selectedSupplier === row.supplier_id
                          ? 'bg-primary/5'
                          : 'hover:bg-muted/30'
                      } ${isLowest ? 'bg-green-50/50 dark:bg-green-950/10' : ''}`}
                      onClick={() =>
                        onSelectSupplier(
                          selectedSupplier === row.supplier_id ? null : row.supplier_id,
                        )
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-muted-foreground shrink-0" />
                          <span className="font-medium">{row.supplierName}</span>
                          {row.isMain && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                              주 공급처
                            </span>
                          )}
                          {isLowest && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                              최저가
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {row.currentPrice.toLocaleString()}원
                      </td>
                      <td className="px-4 py-3 text-right">
                        {changePercent !== null ? (
                          <span
                            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                              changePercent > 0
                                ? 'text-red-500'
                                : changePercent < 0
                                  ? 'text-green-500'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {changePercent > 0 ? (
                              <ArrowUpRight size={12} />
                            ) : changePercent < 0 ? (
                              <ArrowDownRight size={12} />
                            ) : (
                              <Minus size={12} />
                            )}
                            {Math.abs(changePercent).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {vsBase !== null ? (
                          <span
                            className={`text-xs font-medium ${
                              vsBase > 0
                                ? 'text-red-500'
                                : vsBase < 0
                                  ? 'text-green-500'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {vsBase > 0 ? '+' : ''}
                            {vsBase.toFixed(1)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {row.effectiveDate}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-muted-foreground">{row.priceCount}건</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <History size={16} />
            단가 변경 이력
            {selectedSupplier && (
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({supplierById.get(selectedSupplier)?.name ?? ''})
              </span>
            )}
          </h3>
          {selectedSupplier && (
            <button
              onClick={() => onSelectSupplier(null)}
              className="text-xs text-primary hover:underline"
            >
              전체 보기
            </button>
          )}
        </div>

        {priceHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            단가 변경 이력이 없습니다.
          </p>
        ) : (
          <div className="space-y-0">
            {priceHistory.map((history, index) => {
              const supplier = supplierById.get(history.supplier_id);
              const changePercent = getPriceChangePercent(
                history.unit_price,
                history.prev_price,
              );
              const isLatest = index === 0;

              return (
                <div key={history.id} className="flex items-start gap-4 relative">
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${
                        isLatest
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/30 bg-card'
                      }`}
                    />
                    {index < priceHistory.length - 1 && (
                      <div className="w-px flex-1 bg-border min-h-[48px]" />
                    )}
                  </div>

                  <div className={`flex-1 pb-4 ${isLatest ? '' : 'opacity-75'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">
                          {history.unit_price.toLocaleString()}원
                        </span>
                        {changePercent !== null && (
                          <span
                            className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
                              changePercent > 0
                                ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                                : 'bg-green-100 text-green-600 dark:bg-green-900/30'
                            }`}
                          >
                            {changePercent > 0 ? (
                              <TrendingUp size={10} />
                            ) : (
                              <TrendingDown size={10} />
                            )}
                            {changePercent > 0 ? '+' : ''}
                            {changePercent.toFixed(1)}%
                          </span>
                        )}
                        {history.prev_price && (
                          <span className="text-xs text-muted-foreground line-through">
                            {history.prev_price.toLocaleString()}원
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {history.effective_date}
                      </span>
                      {!selectedSupplier && supplier && (
                        <span className="flex items-center gap-1">
                          <Building2 size={10} />
                          {supplier.name}
                        </span>
                      )}
                      {history.notes && (
                        <span className="text-muted-foreground/70">{history.notes}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
