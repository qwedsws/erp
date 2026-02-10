import type { StateCreator } from 'zustand';
import type { Material, Stock, StockMovement, MaterialPrice, SteelTag } from '@/domain/materials/entities';

export interface MaterialsSlice {
  materials: Material[];
  stocks: Stock[];
  stockMovements: StockMovement[];
  materialPrices: MaterialPrice[];
  steelTags: SteelTag[];

  // Cache setters
  setMaterials: (materials: Material[]) => void;
  addMaterialToCache: (m: Material) => void;
  updateMaterialInCache: (id: string, data: Partial<Material>) => void;
  removeMaterialFromCache: (id: string) => void;

  setStocks: (stocks: Stock[]) => void;
  upsertStockInCache: (stock: Stock) => void;

  setStockMovements: (movements: StockMovement[]) => void;
  addStockMovementToCache: (sm: StockMovement) => void;

  setMaterialPrices: (prices: MaterialPrice[]) => void;
  addMaterialPriceToCache: (mp: MaterialPrice) => void;
  removeMaterialPriceFromCache: (id: string) => void;

  setSteelTags: (tags: SteelTag[]) => void;
  addSteelTagToCache: (tag: SteelTag) => void;
  updateSteelTagInCache: (id: string, data: Partial<SteelTag>) => void;
  removeSteelTagFromCache: (id: string) => void;
}

export const createMaterialsSlice: StateCreator<MaterialsSlice, [], [], MaterialsSlice> = (set) => ({
  materials: [],
  stocks: [],
  stockMovements: [],
  materialPrices: [],
  steelTags: [],

  setMaterials: (materials) => set({ materials }),
  addMaterialToCache: (m) => set((s) => ({ materials: [...s.materials, m] })),
  updateMaterialInCache: (id, data) =>
    set((s) => ({
      materials: s.materials.map((m) => (m.id === id ? { ...m, ...data } : m)),
    })),
  removeMaterialFromCache: (id) =>
    set((s) => ({
      materials: s.materials.filter((m) => m.id !== id),
      stocks: s.stocks.filter((stk) => stk.material_id !== id),
      materialPrices: s.materialPrices.filter((mp) => mp.material_id !== id),
    })),

  setStocks: (stocks) => set({ stocks }),
  upsertStockInCache: (stock) =>
    set((s) => {
      const idx = s.stocks.findIndex((stk) => stk.material_id === stock.material_id);
      if (idx >= 0) {
        const newStocks = [...s.stocks];
        newStocks[idx] = stock;
        return { stocks: newStocks };
      }
      return { stocks: [...s.stocks, stock] };
    }),

  setStockMovements: (movements) => set({ stockMovements: movements }),
  addStockMovementToCache: (sm) =>
    set((s) => ({ stockMovements: [...s.stockMovements, sm] })),

  setMaterialPrices: (prices) => set({ materialPrices: prices }),
  addMaterialPriceToCache: (mp) =>
    set((s) => ({ materialPrices: [...s.materialPrices, mp] })),
  removeMaterialPriceFromCache: (id) =>
    set((s) => ({ materialPrices: s.materialPrices.filter((mp) => mp.id !== id) })),

  setSteelTags: (tags) => set({ steelTags: tags }),
  addSteelTagToCache: (tag) =>
    set((s) => ({ steelTags: [...s.steelTags, tag] })),
  updateSteelTagInCache: (id, data) =>
    set((s) => ({
      steelTags: s.steelTags.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),
  removeSteelTagFromCache: (id) =>
    set((s) => ({ steelTags: s.steelTags.filter((t) => t.id !== id) })),
});
