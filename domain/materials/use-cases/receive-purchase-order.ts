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

    const movementInputs: Omit<StockMovement, 'id' | 'created_at'>[] = [];
    const receivedByMaterialId = new Map<string, { quantity: number; totalAmount: number; unitPrice: number }>();

    for (const [itemId, receivedQty] of receivedItemEntries) {
      const poItem = poItemById.get(itemId);
      if (!poItem) continue;

      movementInputs.push({
        material_id: poItem.material_id,
        type: 'IN',
        quantity: receivedQty,
        unit_price: poItem.unit_price,
        purchase_order_id: input.poId,
        project_id: po.project_id,
      });

      const agg = receivedByMaterialId.get(poItem.material_id) ?? {
        quantity: 0,
        totalAmount: 0,
        unitPrice: poItem.unit_price,
      };
      agg.quantity += receivedQty;
      agg.totalAmount += receivedQty * poItem.unit_price;
      agg.unitPrice = poItem.unit_price;
      receivedByMaterialId.set(poItem.material_id, agg);
    }

    const movements = this.movementRepo.createMany
      ? await this.movementRepo.createMany(movementInputs)
      : await Promise.all(movementInputs.map((movementInput) => this.movementRepo.create(movementInput)));

    const uniqueMaterialIds = [...receivedByMaterialId.keys()];
    const existingStocks = this.stockRepo.findByMaterialIds
      ? await this.stockRepo.findByMaterialIds(uniqueMaterialIds)
      : await Promise.all(
        uniqueMaterialIds.map(async (materialId) => this.stockRepo.findByMaterialId(materialId)),
      ).then((stocks) => stocks.filter((stock): stock is Stock => Boolean(stock)));
    const stockByMaterialId = new Map(
      existingStocks.map((stock) => [stock.material_id, stock] as const),
    );

    const stockUpsertPayloads: Stock[] = uniqueMaterialIds.map((materialId) => {
      const existingStock = stockByMaterialId.get(materialId) ?? null;
      const agg = receivedByMaterialId.get(materialId);
      if (!agg) {
        throw new Error(`Received quantity aggregation is missing for material: ${materialId}`);
      }

      if (existingStock) {
        const newQty = existingStock.quantity + agg.quantity;
        const newAvg =
          (existingStock.quantity * existingStock.avg_unit_price + agg.totalAmount) / newQty;
        return {
          ...existingStock,
          quantity: newQty,
          avg_unit_price: Math.round(newAvg),
          updated_at: now,
        };
      }

      return {
        id: generateId(),
        material_id: materialId,
        quantity: agg.quantity,
        avg_unit_price: Math.round(agg.totalAmount / agg.quantity),
        updated_at: now,
      };
    });

    const updatedStocks = this.stockRepo.upsertMany
      ? await this.stockRepo.upsertMany(stockUpsertPayloads)
      : await Promise.all(stockUpsertPayloads.map((stockPayload) => this.stockRepo.upsert(stockPayload)));

    const newPrices: MaterialPrice[] = [];
    const existingSupplierPrices = await this.priceRepo.findByMaterialsAndSupplier(
      uniqueMaterialIds,
      po.supplier_id,
    );
    const latestPriceByMaterialId = new Map<string, MaterialPrice>();
    for (const price of existingSupplierPrices) {
      const latest = latestPriceByMaterialId.get(price.material_id);
      const isLatest =
        !latest ||
        price.effective_date > latest.effective_date ||
        (
          price.effective_date === latest.effective_date &&
          (price.created_at ?? '') > (latest.created_at ?? '')
        );
      if (isLatest) {
        latestPriceByMaterialId.set(price.material_id, price);
      }
    }

    const materialPriceInputs: Omit<MaterialPrice, 'id' | 'created_at'>[] = [];
    for (const materialId of uniqueMaterialIds) {
      const agg = receivedByMaterialId.get(materialId);
      if (!agg) continue;

      const latestPrice = latestPriceByMaterialId.get(materialId);
      if (!latestPrice || latestPrice.unit_price !== agg.unitPrice) {
        materialPriceInputs.push({
          material_id: materialId,
          supplier_id: po.supplier_id,
          unit_price: agg.unitPrice,
          prev_price: latestPrice?.unit_price,
          effective_date: today,
          notes: `입고 자동 등록 (${po.po_no})`,
        });
      }
    }

    if (materialPriceInputs.length > 0) {
      if (this.priceRepo.createMany) {
        const createdPrices = await this.priceRepo.createMany(materialPriceInputs);
        newPrices.push(...createdPrices);
      } else {
        const createdPrices = await Promise.all(
          materialPriceInputs.map((priceInput) => this.priceRepo.create(priceInput)),
        );
        newPrices.push(...createdPrices);
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
