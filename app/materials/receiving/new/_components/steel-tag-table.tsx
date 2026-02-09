'use client';

export interface SteelTagEntry {
  tag_no: string;
  weight: string; // input value
  location: string;
}

export function SteelTagTable({
  entries,
  weightMethod,
  onUpdate,
}: {
  entries: SteelTagEntry[];
  weightMethod: string;
  onUpdate: (idx: number, field: keyof SteelTagEntry, val: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="px-4 py-2.5 text-center font-medium text-muted-foreground w-12">#</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">태그 번호</th>
            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-36">중량(kg)</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-40">보관 위치</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={idx} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 text-center text-muted-foreground">{idx + 1}</td>
              <td className="px-4 py-2.5">
                <input
                  type="text"
                  value={entry.tag_no}
                  onChange={(e) => onUpdate(idx, 'tag_no', e.target.value)}
                  className="w-full h-8 px-2 rounded border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </td>
              <td className="px-4 py-2.5">
                <input
                  type="number"
                  step="0.01"
                  value={entry.weight}
                  onChange={(e) => onUpdate(idx, 'weight', e.target.value)}
                  readOnly={weightMethod === 'CALCULATED'}
                  className={`w-full h-8 px-2 rounded border border-input bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring ${
                    weightMethod === 'CALCULATED' ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''
                  }`}
                />
              </td>
              <td className="px-4 py-2.5">
                <input
                  type="text"
                  value={entry.location}
                  onChange={(e) => onUpdate(idx, 'location', e.target.value)}
                  placeholder="예: A-1-3"
                  className="w-full h-8 px-2 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WeightSummary({
  weightMethod,
  totalMeasured,
  theoreticalTotal,
}: {
  weightMethod: string;
  totalMeasured: number;
  theoreticalTotal: number;
}) {
  const diff = totalMeasured - theoreticalTotal;
  const isOverThreshold = Math.abs(diff) > theoreticalTotal * 0.05;

  return (
    <div className="text-sm text-right">
      {weightMethod === 'MEASURED' ? (
        <span>
          총 실측: <span className="font-semibold">{totalMeasured.toFixed(2)} kg</span>
          {' '}(이론: {theoreticalTotal.toFixed(2)} kg, 차이:{' '}
          <span className={isOverThreshold ? 'text-destructive font-semibold' : ''}>
            {diff >= 0 ? '+' : ''}{diff.toFixed(2)} kg
          </span>)
        </span>
      ) : (
        <span>
          총 중량: <span className="font-semibold">{totalMeasured.toFixed(2)} kg</span> (이론값 자동 적용)
        </span>
      )}
    </div>
  );
}
