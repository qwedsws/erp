import type {
  IMaterialRepository,
  IStockRepository,
  IStockMovementRepository,
  IMaterialPriceRepository,
  ISteelTagRepository,
} from '@/domain/materials/ports';
import type { Material, Stock, StockMovement, MaterialPrice, SteelTag } from '@/domain/materials/entities';
import { generateId } from '@/domain/shared/types';
import {
  mockMaterials,
  mockStocks,
  mockStockMovements,
  mockMaterialPrices,
  initialSteelTags,
} from '@/lib/mock-data';

export class InMemoryMaterialRepository implements IMaterialRepository {
  private data: Material[] = [...mockMaterials];

  async findAll(): Promise<Material[]> {
    return this.data;
  }

  async findById(id: string): Promise<Material | null> {
    return this.data.find(m => m.id === id) ?? null;
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
}

export class InMemoryStockRepository implements IStockRepository {
  private data: Stock[] = [...mockStocks];

  async findAll(): Promise<Stock[]> {
    return this.data;
  }

  async findByMaterialId(materialId: string): Promise<Stock | null> {
    return this.data.find(s => s.material_id === materialId) ?? null;
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
}

export class InMemoryStockMovementRepository implements IStockMovementRepository {
  private data: StockMovement[] = [...mockStockMovements];

  async findAll(): Promise<StockMovement[]> {
    return this.data;
  }

  async create(data: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement> {
    const now = new Date().toISOString();
    const movement: StockMovement = { ...data, id: generateId(), created_at: now };
    this.data.push(movement);
    return movement;
  }
}

export class InMemoryMaterialPriceRepository implements IMaterialPriceRepository {
  private data: MaterialPrice[] = [...mockMaterialPrices];

  async findAll(): Promise<MaterialPrice[]> {
    return this.data;
  }

  async findByMaterial(materialId: string): Promise<MaterialPrice[]> {
    return this.data.filter(mp => mp.material_id === materialId);
  }

  async create(data: Omit<MaterialPrice, 'id' | 'created_at'>): Promise<MaterialPrice> {
    const now = new Date().toISOString();
    const price: MaterialPrice = { ...data, id: generateId(), created_at: now };
    this.data.push(price);
    return price;
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(mp => mp.id !== id);
  }
}

export class InMemorySteelTagRepository implements ISteelTagRepository {
  private data: SteelTag[] = [...initialSteelTags];

  async findAll(): Promise<SteelTag[]> {
    return this.data;
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
