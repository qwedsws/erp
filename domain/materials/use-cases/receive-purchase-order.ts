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

    const updatedItems: PurchaseOrderItem[] = po.items.map(item => {
      const received = input.items.find(ri => ri.item_id === item.id);
      if (!received || received.quantity <= 0) return item;
      return { ...item, received_quantity: (item.received_quantity || 0) + received.quantity };
    });

    const allReceived = updatedItems.every(item => (item.received_quantity || 0) >= item.quantity);
    const anyReceived = updatedItems.some(item => (item.received_quantity || 0) > 0);
    const newStatus = allReceived ? ('RECEIVED' as const) : anyReceived ? ('PARTIAL_RECEIVED' as const) : po.status;

    const movements: StockMovement[] = [];
    const updatedStocks: Stock[] = [];

    for (const ri of input.items) {
      if (ri.quantity <= 0) continue;
      const poItem = po.items.find(i => i.id === ri.item_id);
      if (!poItem) continue;

      const movement = await this.movementRepo.create({
        material_id: poItem.material_id,
        type: 'IN',
        quantity: ri.quantity,
        unit_price: poItem.unit_price,
        purchase_order_id: input.poId,
      });
      movements.push(movement);

      const existingStock = await this.stockRepo.findByMaterialId(poItem.material_id);
      let updatedStock: Stock;

      if (existingStock) {
        const newQty = existingStock.quantity + ri.quantity;
        const newAvg =
          (existingStock.quantity * existingStock.avg_unit_price + ri.quantity * poItem.unit_price) / newQty;
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
          quantity: ri.quantity,
          avg_unit_price: poItem.unit_price,
          updated_at: now,
        });
      }
      updatedStocks.push(updatedStock);
    }

    const newPrices: MaterialPrice[] = [];
    const existingAllPrices = await this.priceRepo.findAll();

    for (const ri of input.items) {
      if (ri.quantity <= 0) continue;
      const poItem = po.items.find(i => i.id === ri.item_id);
      if (!poItem) continue;

      const existingPrices = existingAllPrices
        .filter(mp => mp.material_id === poItem.material_id && mp.supplier_id === po.supplier_id)
        .sort((a, b) => b.effective_date.localeCompare(a.effective_date));

      const latestPrice = existingPrices[0];

      if (!latestPrice || latestPrice.unit_price !== poItem.unit_price) {
        if (!newPrices.some(np => np.material_id === poItem.material_id && np.supplier_id === po.supplier_id)) {
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
