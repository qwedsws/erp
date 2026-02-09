import type { MaterialPrice, Stock, StockMovement } from '../entities';
import type { PurchaseOrder, PurchaseOrderItem } from '../../procurement/entities';
import type { IStockRepository, IStockMovementRepository, IMaterialPriceRepository } from '../ports';
import type { IPurchaseOrderRepository } from '../../procurement/ports';
import { generateId, type Result, success, failure } from '@/domain/shared/types';
import { NotFoundError } from '@/domain/shared/errors';

export interface ReceivePOInput {
  poId: string;
  items: { item_id: string; quantity: number }[];
}

export interface ReceivePOResult {
  purchaseOrder: PurchaseOrder;
  movements: StockMovement[];
  stocks: Stock[];
  prices: MaterialPrice[];
}

export class ReceivePurchaseOrderUseCase {
  constructor(
    private readonly poRepo: IPurchaseOrderRepository,
    private readonly stockRepo: IStockRepository,
    private readonly movementRepo: IStockMovementRepository,
    private readonly priceRepo: IMaterialPriceRepository,
  ) {}

  async execute(input: ReceivePOInput): Promise<Result<ReceivePOResult>> {
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const po = await this.poRepo.findById(input.poId);
    if (!po) {
      return failure(new NotFoundError('PurchaseOrder', input.poId));
    }

    const poItemById = new Map(po.items.map((item) => [item.id, item]));
    const receivedQtyByItemId = new Map<string, number>();
    for (const ri of input.items) {
      if (ri.quantity <= 0) continue;
      receivedQtyByItemId.set(ri.item_id, (receivedQtyByItemId.get(ri.item_id) ?? 0) + ri.quantity);
    }
    const receivedItemEntries = [...receivedQtyByItemId.entries()];

    const updatedItems: PurchaseOrderItem[] = po.items.map(item => {
      const receivedQty = receivedQtyByItemId.get(item.id) ?? 0;
      if (receivedQty <= 0) return item;
      return { ...item, received_quantity: (item.received_quantity || 0) + receivedQty };
    });

    const allReceived = updatedItems.every(item => (item.received_quantity || 0) >= item.quantity);
    const anyReceived = updatedItems.some(item => (item.received_quantity || 0) > 0);
    const newStatus = allReceived ? ('RECEIVED' as const) : anyReceived ? ('PARTIAL_RECEIVED' as const) : po.status;

    const movements: StockMovement[] = [];
    const updatedStocks: Stock[] = [];

    const uniqueMaterialIds = [
      ...new Set(
        receivedItemEntries
          .map(([itemId]) => poItemById.get(itemId)?.material_id)
          .filter((materialId): materialId is string => Boolean(materialId)),
      ),
    ];
    const stockEntries = await Promise.all(
      uniqueMaterialIds.map(async (materialId) => {
        const stock = await this.stockRepo.findByMaterialId(materialId);
        return [materialId, stock] as const;
      }),
    );
    const stockByMaterialId = new Map(stockEntries);

    for (const [itemId, receivedQty] of receivedItemEntries) {
      const poItem = poItemById.get(itemId);
      if (!poItem) continue;

      const movement = await this.movementRepo.create({
        material_id: poItem.material_id,
        type: 'IN',
        quantity: receivedQty,
        unit_price: poItem.unit_price,
        purchase_order_id: input.poId,
      });
      movements.push(movement);

      const existingStock = stockByMaterialId.get(poItem.material_id) ?? null;
      let updatedStock: Stock;

      if (existingStock) {
        const newQty = existingStock.quantity + receivedQty;
        const newAvg =
          (existingStock.quantity * existingStock.avg_unit_price + receivedQty * poItem.unit_price) / newQty;
        updatedStock = await this.stockRepo.upsert({
          ...existingStock,
          quantity: newQty,
          avg_unit_price: Math.round(newAvg),
          updated_at: now,
        });
      } else {
        updatedStock = await this.stockRepo.upsert({
          id: generateId(),
          material_id: poItem.material_id,
          quantity: receivedQty,
          avg_unit_price: poItem.unit_price,
          updated_at: now,
        });
      }
      stockByMaterialId.set(poItem.material_id, updatedStock);
      updatedStocks.push(updatedStock);
    }

    const newPrices: MaterialPrice[] = [];
    const existingAllPrices = await this.priceRepo.findAll();
    const latestPriceByMaterialSupplier = new Map<string, MaterialPrice>();
    for (const price of existingAllPrices) {
      const key = `${price.material_id}::${price.supplier_id}`;
      const latest = latestPriceByMaterialSupplier.get(key);
      if (!latest || price.effective_date > latest.effective_date) {
        latestPriceByMaterialSupplier.set(key, price);
      }
    }
    const processedMaterialIds = new Set<string>();

    for (const [itemId] of receivedItemEntries) {
      const poItem = poItemById.get(itemId);
      if (!poItem) continue;
      if (processedMaterialIds.has(poItem.material_id)) continue;
      processedMaterialIds.add(poItem.material_id);

      const latestPrice = latestPriceByMaterialSupplier.get(`${poItem.material_id}::${po.supplier_id}`);

      if (!latestPrice || latestPrice.unit_price !== poItem.unit_price) {
        const price = await this.priceRepo.create({
          material_id: poItem.material_id,
          supplier_id: po.supplier_id,
          unit_price: poItem.unit_price,
          prev_price: latestPrice?.unit_price,
          effective_date: today,
          notes: `입고 자동 등록 (${po.po_no})`,
        });
        newPrices.push(price);
      }
    }

    const updatedPO = await this.poRepo.update(input.poId, {
      items: updatedItems,
      status: newStatus,
    });

    return success({
      purchaseOrder: updatedPO,
      movements,
      stocks: updatedStocks,
      prices: newPrices,
    });
  }
}
