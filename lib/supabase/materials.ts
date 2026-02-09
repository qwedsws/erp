import { createClient } from './client'
import type {
  Supplier,
  Material,
  Stock,
  StockMovement,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequest,
  MaterialPrice,
  SteelTag,
} from '@/domain/shared/entities'

const supabase = createClient()

type PurchaseOrderRow = PurchaseOrder & { purchase_order_items?: PurchaseOrderItem[] | null }

function mapPurchaseOrderRow(po: PurchaseOrderRow): PurchaseOrder {
  return {
    ...po,
    items: (po.purchase_order_items || []) as PurchaseOrderItem[],
    purchase_order_items: undefined,
  } as PurchaseOrder
}

// ============ FETCH (SELECT) ============

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from('suppliers').select('*').order('created_at')
  if (error) throw error
  return data as Supplier[]
}

export async function fetchSupplierById(id: string): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as Supplier | null) ?? null
}

export async function fetchMaterials(): Promise<Material[]> {
  const { data, error } = await supabase.from('materials').select('*').order('material_code')
  if (error) throw error
  return data as Material[]
}

export async function fetchMaterialById(id: string): Promise<Material | null> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as Material | null) ?? null
}

export async function fetchStocks(): Promise<Stock[]> {
  const { data, error } = await supabase.from('stocks').select('*')
  if (error) throw error
  return data as Stock[]
}

export async function fetchStockByMaterialId(materialId: string): Promise<Stock | null> {
  const { data, error } = await supabase
    .from('stocks')
    .select('*')
    .eq('material_id', materialId)
    .maybeSingle()
  if (error) throw error
  return (data as Stock | null) ?? null
}

export async function fetchStockMovements(): Promise<StockMovement[]> {
  const { data, error } = await supabase.from('stock_movements').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as StockMovement[]
}

export async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, purchase_order_items(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data || []) as PurchaseOrderRow[]).map(mapPurchaseOrderRow)
}

export async function fetchPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, purchase_order_items(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapPurchaseOrderRow(data as PurchaseOrderRow)
}

export async function fetchPurchaseRequests(): Promise<PurchaseRequest[]> {
  const { data, error } = await supabase.from('purchase_requests').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as PurchaseRequest[]
}

export async function fetchPurchaseRequestById(id: string): Promise<PurchaseRequest | null> {
  const { data, error } = await supabase
    .from('purchase_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as PurchaseRequest | null) ?? null
}

export async function fetchMaterialPrices(): Promise<MaterialPrice[]> {
  const { data, error } = await supabase.from('material_prices').select('*').order('effective_date', { ascending: false })
  if (error) throw error
  return data as MaterialPrice[]
}

export async function fetchMaterialPricesByMaterial(materialId: string): Promise<MaterialPrice[]> {
  const { data, error } = await supabase
    .from('material_prices')
    .select('*')
    .eq('material_id', materialId)
    .order('effective_date', { ascending: false })
  if (error) throw error
  return data as MaterialPrice[]
}

// ============ MUTATIONS ============

// -- Suppliers --
export async function insertSupplier(supplier: Supplier) {
  const { error } = await supabase.from('suppliers').insert(supplier)
  if (error) console.error('insertSupplier error:', error)
}

export async function updateSupplierDB(id: string, data: Partial<Supplier>) {
  const { error } = await supabase.from('suppliers').update(data).eq('id', id)
  if (error) console.error('updateSupplier error:', error)
}

export async function deleteSupplierDB(id: string) {
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) console.error('deleteSupplier error:', error)
}

// -- Materials --
export async function insertMaterial(material: Material) {
  const { error } = await supabase.from('materials').insert(material)
  if (error) console.error('insertMaterial error:', error)
}

export async function updateMaterialDB(id: string, data: Partial<Material>) {
  const { error } = await supabase.from('materials').update(data).eq('id', id)
  if (error) console.error('updateMaterial error:', error)
}

export async function deleteMaterialDB(id: string) {
  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) console.error('deleteMaterial error:', error)
}

// -- Stocks --
export async function upsertStock(stock: Stock) {
  const { error } = await supabase.from('stocks').upsert(stock, { onConflict: 'id' })
  if (error) console.error('upsertStock error:', error)
}

// -- Stock Movements --
export async function insertStockMovement(sm: StockMovement) {
  const { error } = await supabase.from('stock_movements').insert(sm)
  if (error) console.error('insertStockMovement error:', error)
}

// -- Purchase Orders --
export async function insertPurchaseOrder(po: PurchaseOrder) {
  const { items, ...poData } = po
  const { error: poError } = await supabase.from('purchase_orders').insert(poData)
  if (poError) { console.error('insertPO error:', poError); return }
  if (items.length > 0) {
    const itemRows = items.map(item => ({ ...item, purchase_order_id: po.id }))
    const { error: itemError } = await supabase.from('purchase_order_items').insert(itemRows)
    if (itemError) console.error('insertPOItems error:', itemError)
  }
}

export async function updatePurchaseOrderDB(id: string, data: Partial<PurchaseOrder>) {
  const { items, ...rest } = data as Partial<PurchaseOrder> & { items?: PurchaseOrderItem[] }
  const { error } = await supabase.from('purchase_orders').update(rest).eq('id', id)
  if (error) console.error('updatePO error:', error)

  if (items && items.length > 0) {
    const rows = items.map(item => ({ ...item, purchase_order_id: id }))
    const { error: itemError } = await supabase
      .from('purchase_order_items')
      .upsert(rows, { onConflict: 'id' })
    if (itemError) console.error('updatePOItems error:', itemError)
  }
}

export async function deletePurchaseOrderDB(id: string) {
  const { error } = await supabase.from('purchase_orders').delete().eq('id', id)
  if (error) console.error('deletePO error:', error)
}

// -- Purchase Requests --
export async function insertPurchaseRequest(pr: PurchaseRequest) {
  const { error } = await supabase.from('purchase_requests').insert(pr)
  if (error) console.error('insertPR error:', error)
}

export async function updatePurchaseRequestDB(id: string, data: Partial<PurchaseRequest>) {
  const { error } = await supabase.from('purchase_requests').update(data).eq('id', id)
  if (error) console.error('updatePR error:', error)
}

// -- Steel Tags --
export async function fetchSteelTags(): Promise<SteelTag[]> {
  const { data, error } = await supabase.from('steel_tags').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as SteelTag[]
}

export async function fetchSteelTagById(id: string): Promise<SteelTag | null> {
  const { data, error } = await supabase
    .from('steel_tags')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as SteelTag | null) ?? null
}

export async function insertSteelTag(tag: SteelTag) {
  const { error } = await supabase.from('steel_tags').insert(tag)
  if (error) console.error('insertSteelTag error:', error)
}

export async function updateSteelTagDB(id: string, data: Partial<SteelTag>) {
  const { error } = await supabase.from('steel_tags').update(data).eq('id', id)
  if (error) console.error('updateSteelTag error:', error)
}

export async function deleteSteelTagDB(id: string) {
  const { error } = await supabase.from('steel_tags').delete().eq('id', id)
  if (error) console.error('deleteSteelTag error:', error)
}

// -- Material Prices --
export async function insertMaterialPrice(mp: MaterialPrice) {
  const { error } = await supabase.from('material_prices').insert(mp)
  if (error) console.error('insertMaterialPrice error:', error)
}

export async function deleteMaterialPriceDB(id: string) {
  const { error } = await supabase.from('material_prices').delete().eq('id', id)
  if (error) console.error('deleteMaterialPrice error:', error)
}
