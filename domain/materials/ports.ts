import type { Material, Stock, StockMovement, MaterialPrice, SteelTag } from './entities';
import type { QueryRangeOptions } from '@/domain/shared/types';

export interface IMaterialRepository {
  findAll(options?: QueryRangeOptions): Promise<Material[]>;
  findById(id: string): Promise<Material | null>;
  create(data: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Promise<Material>;
  update(id: string, data: Partial<Material>): Promise<Material>;
  delete(id: string): Promise<void>;
}

export interface IStockRepository {
  findAll(options?: QueryRangeOptions): Promise<Stock[]>;
  findByMaterialId(materialId: string): Promise<Stock | null>;
  findByMaterialIds?(materialIds: string[]): Promise<Stock[]>;
  upsert(stock: Stock): Promise<Stock>;
  upsertMany?(stocks: Stock[]): Promise<Stock[]>;
}

export interface IStockMovementRepository {
  findAll(options?: QueryRangeOptions): Promise<StockMovement[]>;
  create(data: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement>;
  createMany?(data: Omit<StockMovement, 'id' | 'created_at'>[]): Promise<StockMovement[]>;
}

export interface IMaterialPriceRepository {
  findAll(options?: QueryRangeOptions): Promise<MaterialPrice[]>;
  findByMaterial(materialId: string): Promise<MaterialPrice[]>;
  create(data: Omit<MaterialPrice, 'id' | 'created_at'>): Promise<MaterialPrice>;
  createMany?(data: Omit<MaterialPrice, 'id' | 'created_at'>[]): Promise<MaterialPrice[]>;
  delete(id: string): Promise<void>;
}

export interface ISteelTagRepository {
  findAll(options?: QueryRangeOptions): Promise<SteelTag[]>;
  findById(id: string): Promise<SteelTag | null>;
  create(data: Omit<SteelTag, 'id' | 'created_at' | 'updated_at'>): Promise<SteelTag>;
  update(id: string, data: Partial<SteelTag>): Promise<SteelTag>;
  delete(id: string): Promise<void>;
}
