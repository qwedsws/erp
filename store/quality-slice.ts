import type { StateCreator } from 'zustand';
import type { QualityInspection, Tryout, Defect } from '@/domain/quality/entities';
import { mockInspections, mockTryouts, mockDefects } from '@/lib/mock-data';

export interface QualitySlice {
  inspections: QualityInspection[];
  tryouts: Tryout[];
  defects: Defect[];

  // Cache setters
  setInspections: (inspections: QualityInspection[]) => void;
  addInspectionToCache: (qi: QualityInspection) => void;
  updateInspectionInCache: (id: string, data: Partial<QualityInspection>) => void;

  setTryouts: (tryouts: Tryout[]) => void;
  addTryoutToCache: (t: Tryout) => void;
  updateTryoutInCache: (id: string, data: Partial<Tryout>) => void;

  setDefects: (defects: Defect[]) => void;
  addDefectToCache: (d: Defect) => void;
  updateDefectInCache: (id: string, data: Partial<Defect>) => void;
}

export const createQualitySlice: StateCreator<QualitySlice, [], [], QualitySlice> = (set) => ({
  inspections: mockInspections,
  tryouts: mockTryouts,
  defects: mockDefects,

  setInspections: (inspections) => set({ inspections }),
  addInspectionToCache: (qi) =>
    set((s) => ({ inspections: [...s.inspections, qi] })),
  updateInspectionInCache: (id, data) =>
    set((s) => ({
      inspections: s.inspections.map((qi) => (qi.id === id ? { ...qi, ...data } : qi)),
    })),

  setTryouts: (tryouts) => set({ tryouts }),
  addTryoutToCache: (t) =>
    set((s) => ({ tryouts: [...s.tryouts, t] })),
  updateTryoutInCache: (id, data) =>
    set((s) => ({
      tryouts: s.tryouts.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),

  setDefects: (defects) => set({ defects }),
  addDefectToCache: (d) =>
    set((s) => ({ defects: [...s.defects, d] })),
  updateDefectInCache: (id, data) =>
    set((s) => ({
      defects: s.defects.map((d) => (d.id === id ? { ...d, ...data } : d)),
    })),
});
