import type {
  IMaterialRepository,
  IStockRepository,
  IStockMovementRepository,
  IMaterialPriceRepository,
  ISteelTagRepository,
} from '@/domain/materials/ports';
import type { Material, Stock, StockMovement, MaterialPrice, SteelTag } from '@/domain/materials/entities';
import * as sb from '@/lib/supabase/materials';

export class SupabaseMaterialRepository implements IMaterialRepository {
  async findAll(): Promise<Material[]> {
    return sb.fetchMaterials();
  }

  async findById(id: string): Promise<Material | null> {
    return sb.fetchMaterialById(id);
  }

  async create(input: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Promise<Material> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).substring(2);
    const material: Material = { ...input, id, created_at: now, updated_at: now } as Material;
    await sb.insertMaterial(material);
    return material;
  }

  async update(id: string, data: Partial<Material>): Promise<Material> {
    const updated = { ...data, updated_at: new Date().toISOString() };
    await sb.updateMaterialDB(id, updated);
    return { ...updated, id } as Material;
  }

  async delete(id: string): Promise<void> {
    await sb.deleteMaterialDB(id);
  }
}

export class SupabaseStockRepository implements IStockRepository {
  async findAll(): Promise<Stock[]> {
    return sb.fetchStocks();
  }

  async findByMaterialId(materialId: string): Promise<Stock | null> {
    return sb.fetchStockByMaterialId(materialId);
  }

  async upsert(stock: Stock): Promise<Stock> {
    await sb.upsertStock(stock);
    return stock;
  }
}

export class SupabaseStockMovementRepository implements IStockMovementRepository {
  async findAll(): Promise<StockMovement[]> {
    return sb.fetchStockMovements();
  }

  async create(data: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).substring(2);
    const movement: StockMovement = { ...data, id, created_at: now } as StockMovement;
    await sb.insertStockMovement(movement);
    return movement;
  }
}

export class SupabaseMaterialPriceRepository implements IMaterialPriceRepository {
  async findAll(): Promise<MaterialPrice[]> {
    return sb.fetchMaterialPrices();
  }

  async findByMaterial(materialId: string): Promise<MaterialPrice[]> {
    return sb.fetchMaterialPricesByMaterial(materialId);
  }

  async create(data: Omit<MaterialPrice, 'id' | 'created_at'>): Promise<MaterialPrice> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).substring(2);
    const price: MaterialPrice = { ...data, id, created_at: now } as MaterialPrice;
    await sb.insertMaterialPrice(price);
    return price;
  }

  async delete(id: string): Promise<void> {
    await sb.deleteMaterialPriceDB(id);
  }
}

export class SupabaseSteelTagRepository implements ISteelTagRepository {
  async findAll(): Promise<SteelTag[]> {
    return sb.fetchSteelTags();
  }

  async findById(id: string): Promise<SteelTag | null> {
    return sb.fetchSteelTagById(id);
  }

  async create(input: Omit<SteelTag, 'id' | 'created_at' | 'updated_at'>): Promise<SteelTag> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).substring(2);
    const tag: SteelTag = { ...input, id, created_at: now, updated_at: now } as SteelTag;
    await sb.insertSteelTag(tag);
    return tag;
  }

  async update(id: string, data: Partial<SteelTag>): Promise<SteelTag> {
    const updated = { ...data, updated_at: new Date().toISOString() };
    await sb.updateSteelTagDB(id, updated);
    return { ...updated, id } as SteelTag;
  }

  async delete(id: string): Promise<void> {
    await sb.deleteSteelTagDB(id);
  }
}
