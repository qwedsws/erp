import type { Project, StockMovement } from '@/types';

interface MovementSectionProps {
  movements: StockMovement[];
  projectById: Map<string, Project>;
  onProjectNavigate: (projectId: string) => void;
}

const movementTypeMap: Record<string, { label: string; color: string }> = {
  IN: { label: '입고', color: 'text-green-600' },
  OUT: { label: '출고', color: 'text-red-600' },
  ADJUST: { label: '조정', color: 'text-yellow-600' },
};

export function MovementSection({
  movements,
  projectById,
  onProjectNavigate,
}: MovementSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-semibold mb-4">입출고 이력</h3>
      {movements.length === 0 ? (
        <p className="text-sm text-muted-foreground">입출고 이력이 없습니다.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  일시
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  유형
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  수량
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  단가
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  프로젝트
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  사유
                </th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => {
                const typeInfo = movementTypeMap[movement.type] || {
                  label: movement.type,
                  color: '',
                };
                const project = movement.project_id
                  ? projectById.get(movement.project_id) ?? null
                  : null;

                return (
                  <tr key={movement.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-xs">
                      {new Date(movement.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span className={typeInfo.color}>
                        {movement.type === 'OUT'
                          ? '-'
                          : movement.type === 'IN'
                            ? '+'
                            : ''}
                        {movement.quantity.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {movement.unit_price
                        ? `${movement.unit_price.toLocaleString()}원`
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {project ? (
                        <button
                          onClick={() => onProjectNavigate(project.id)}
                          className="text-xs font-mono text-primary hover:underline"
                        >
                          {project.project_no}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {movement.reason || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
