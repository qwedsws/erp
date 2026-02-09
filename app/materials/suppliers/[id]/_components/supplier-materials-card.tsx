'use client';

import type { Material } from '@/types';

interface SupplierMaterialsCardProps {
  supplierMaterials: Material[];
  onOpenMaterial: (materialId: string) => void;
}

export function SupplierMaterialsCard({
  supplierMaterials,
  onOpenMaterial,
}: SupplierMaterialsCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-semibold mb-4">공급 품목</h3>
      {supplierMaterials.length === 0 ? (
        <p className="text-sm text-muted-foreground">공급 품목이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {supplierMaterials.map((material) => (
            <button
              key={material.id}
              onClick={() => onOpenMaterial(material.id)}
              className="w-full text-left p-3 rounded-md border border-border hover:bg-muted/30"
            >
              <div className="text-xs font-mono text-muted-foreground">{material.material_code}</div>
              <p className="text-sm font-medium mt-0.5">{material.name}</p>
              {material.specification && (
                <p className="text-xs text-muted-foreground mt-0.5">{material.specification}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
