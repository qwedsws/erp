import type {
  IMaterialRepository,
  IStockRepository,
  IStockMovementRepository,
  IMaterialPriceRepository,
  ISteelTagRepository,
} from '@/domain/materials/ports';
import type { Material, Stock, StockMovement, MaterialPrice, SteelTag } from '@/domain/materials/entities';
import { generateId, type QueryRangeOptions, type MaterialPageQuery, type PageResult, type InventoryStats } from '@/domain/shared/types';
import {
  mockMaterials,
  mockStocks,
  mockStockMovements,
  mockMaterialPrices,
  initialSteelTags,
} from '@/lib/mock-data';

export class InMemoryMaterialRepository implements IMaterialRepository {
  private data: Material[] = [...mockMaterials];

  async findAll(options?: QueryRangeOptions): Promise<Material[]> {
    if (!options?.limit) return this.data;
    const from = options.offset ?? 0;
    return this.data.slice(from, from + options.limit);
  }

  async findById(id: string): Promise<Material | null> {
    return this.data.find(m => m.id === id) ?? null;
  }

  async findByIds(ids: string[]): Promise<Material[]> {
    if (ids.length === 0) return [];
    const idSet = new Set(ids);
    return this.data.filter((material) => idSet.has(material.id));
  }

  async create(data: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Promise<Material> {
    const now = new Date().toISOString();
    const material: Material = { ...data, id: generateId(), created_at: now, updated_at: now };
    this.data.push(material);
    return material;
  }

  async update(id: string, data: Partial<Material>): Promise<Material> {
    const idx = this.data.findIndex(m => m.id === id);
    if (idx === -1) throw new Error(`Material not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(m => m.id !== id);
  }

  async findPage(query: MaterialPageQuery): Promise<PageResult<Material>> {
    let filtered = this.data;
    if (query.lowStockOnly) {
      const stockByMaterialId = new Map(mockStocks.map(s => [s.material_id, s]));
      filtered = filtered.filter(m => {
        const stock = stockByMaterialId.get(m.id);
        return (stock?.quantity ?? 0) < (m.safety_stock ?? 0);
      });
    }
    if (query.search) {
      const lower = query.search.toLowerCase();
      filtered = filtered.filter(m => m.material_code.toLowerCase().includes(lower) || m.name.toLowerCase().includes(lower));
    }
    if (query.category) {
      filtered = filtered.filter(m => m.category === query.category);
    }
    const total = filtered.length;
    const from = (query.page - 1) * query.pageSize;
    const items = filtered.slice(from, from + query.pageSize);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async getInventoryStats(): Promise<InventoryStats> {
    const stockByMaterialId = new Map(mockStocks.map(s => [s.material_id, s]));
    let lowStockCount = 0;
    let totalValue = 0;
    for (const m of this.data) {
      const stock = stockByMaterialId.get(m.id);
      const qty = stock?.quantity ?? 0;
      const price = stock?.avg_unit_price ?? m.unit_price ?? 0;
      if (qty < (m.safety_stock ?? 0)) lowStockCount++;
      totalValue += qty * price;
    }
    return { totalItems: this.data.length, lowStockCount, totalValue };
  }
}

export class InMemoryStockRepository implements IStockRepository {
  private data: Stock[] = [...mockStocks];

  async findAll(options?: QueryRangeOptions): Promise<Stock[]> {
    if (!options?.limit) return this.data;
    const from = options.offset ?? 0;
    return this.data.slice(from, from + options.limit);
  }

  async findByMaterialId(materialId: string): Promise<Stock | null> {
    return this.data.find(s => s.material_id === materialId) ?? null;
  }

  async findByMaterialIds(materialIds: string[]): Promise<Stock[]> {
    if (materialIds.length === 0) return [];
    const materialIdSet = new Set(materialIds);
    return this.data.filter((stock) => materialIdSet.has(stock.material_id));
  }

  async upsert(stock: Stock): Promise<Stock> {
    const idx = this.data.findIndex(s => s.id === stock.id);
    if (idx !== -1) {
      this.data[idx] = { ...stock, updated_at: new Date().toISOString() };
      return this.data[idx];
    }
    this.data.push(stock);
    return stock;
  }

  async upsertMany(stocks: Stock[]): Promise<Stock[]> {
    const result: Stock[] = [];
    for (const stock of stocks) {
      result.push(await this.upsert(stock));
    }
    return result;
  }
}

export class InMemoryStockMovementRepository implements IStockMovementRepository {
  private data: StockMovement[] = [...mockStockMovements];

  async findAll(options?: QueryRangeOptions): Promise<StockMovement[]> {
    if (!options?.limit) return this.data;
    const from = options.offset ?? 0;
    return this.data.slice(from, from + options.limit);
  }

  async create(data: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement> {
    const now = new Date().toISOString();
    const movement: StockMovement = { ...data, id: generateId(), created_at: now };
    this.data.push(movement);
    return movement;
  }

  async createMany(data: Omit<StockMovement, 'id' | 'created_at'>[]): Promise<StockMovement[]> {
    const now = new Date().toISOString();
    const movements = data.map((item) => ({ ...item, id: generateId(), created_at: now }));
    this.data.push(...movements);
    return movements;
  }
}

export class InMemoryMaterialPriceRepository implements IMaterialPriceRepository {
  private data: MaterialPrice[] = [...mockMaterialPrices];

  async findAll(options?: QueryRangeOptions): Promise<MaterialPrice[]> {
    if (!options?.limit) return this.data;
    const from = options.offset ?? 0;
    return this.data.slice(from, from + options.limit);
  }

  async findByMaterial(materialId: string): Promise<MaterialPrice[]> {
    return this.data.filter(mp => mp.material_id === materialId);
  }

  async findByMaterialsAndSupplier(materialIds: string[], supplierId: string): Promise<MaterialPrice[]> {
    if (materialIds.length === 0) return [];
    const materialIdSet = new Set(materialIds);
    return this.data
      .filter(
        (price) =>
          materialIdSet.has(price.material_id) && price.supplier_id === supplierId,
      )
      .sort((a, b) => b.effective_date.localeCompare(a.effective_date));
  }

  async create(data: Omit<MaterialPrice, 'id' | 'created_at'>): Promise<MaterialPrice> {
    const now = new Date().toISOString();
    const price: MaterialPrice = { ...data, id: generateId(), created_at: now };
    this.data.push(price);
    return price;
  }

  async createMany(data: Omit<MaterialPrice, 'id' | 'created_at'>[]): Promise<MaterialPrice[]> {
    const now = new Date().toISOString();
    const prices = data.map((item) => ({ ...item, id: generateId(), created_at: now }));
    this.data.push(...prices);
    return prices;
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(mp => mp.id !== id);
  }
}

export class InMemorySteelTagRepository implements ISteelTagRepository {
  private data: SteelTag[] = [...initialSteelTags];

  async findAll(options?: QueryRangeOptions): Promise<SteelTag[]> {
    if (!options?.limit) return this.data;
    const from = options.offset ?? 0;
    return this.data.slice(from, from + options.limit);
  }

  async findById(id: string): Promise<SteelTag | null> {
    return this.data.find(t => t.id === id) ?? null;
  }

  async create(data: Omit<SteelTag, 'id' | 'created_at' | 'updated_at'>): Promise<SteelTag> {
    const now = new Date().toISOString();
    const tag: SteelTag = { ...data, id: generateId(), created_at: now, updated_at: now };
    this.data.push(tag);
    return tag;
  }

  async update(id: string, data: Partial<SteelTag>): Promise<SteelTag> {
    const idx = this.data.findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`SteelTag not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(t => t.id !== id);
  }
}
