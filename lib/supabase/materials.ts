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
import type { MaterialDependencies, MaterialDependencyItem } from '@/domain/materials/ports'
import type {
  QueryRangeOptions,
  PageResult,
  MaterialPageQuery,
  PurchaseOrderPageQuery,
  PurchaseRequestPageQuery,
  SupplierPageQuery,
  InventoryStats,
} from '@/domain/shared/types'

const supabase = createClient()

function logSupabaseError(label: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
  console.error(`${label}:`, error.message ?? 'unknown', `[code=${error.code}]`, error.details ?? '', error.hint ?? '')
}

function throwSupabaseError(label: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
  logSupabaseError(label, error)
  throw error
}

type PurchaseOrderRow = PurchaseOrder & { purchase_order_items?: PurchaseOrderItem[] | null }

function mapPurchaseOrderRow(po: PurchaseOrderRow): PurchaseOrder {
  return {
    ...po,
    items: (po.purchase_order_items || []) as PurchaseOrderItem[],
    purchase_order_items: undefined,
  } as PurchaseOrder
}

function applyRange<T extends { range: (from: number, to: number) => T }>(
  query: T,
  options?: QueryRangeOptions,
): T {
  if (typeof options?.limit !== 'number') return query
  const from = options.offset ?? 0
  const to = from + options.limit - 1
  return query.range(from, to)
}

// ============ FETCH (SELECT) ============

export async function fetchSuppliers(options?: QueryRangeOptions): Promise<Supplier[]> {
  let query = supabase.from('suppliers').select('*').order('created_at')
  query = applyRange(query, options)
  const { data, error } = await query
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

export async function fetchMaterials(options?: QueryRangeOptions): Promise<Material[]> {
  let query = supabase.from('materials').select('*').order('material_code')
  query = applyRange(query, options)
  const { data, error } = await query
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

export async function fetchMaterialsByIds(ids: string[]): Promise<Material[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .in('id', ids)
  if (error) throw error
  return data as Material[]
}

export async function fetchStocks(options?: QueryRangeOptions): Promise<Stock[]> {
  let query = supabase.from('stocks').select('*')
  query = applyRange(query, options)
  const { data, error } = await query
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

export async function fetchStocksByMaterialIds(materialIds: string[]): Promise<Stock[]> {
  if (materialIds.length === 0) return []
  const { data, error } = await supabase
    .from('stocks')
    .select('*')
    .in('material_id', materialIds)
  if (error) throw error
  return data as Stock[]
}

export async function fetchStockMovements(options?: QueryRangeOptions): Promise<StockMovement[]> {
  let query = supabase.from('stock_movements').select('*').order('created_at', { ascending: false })
  query = applyRange(query, options)
  const { data, error } = await query
  if (error) throw error
  return data as StockMovement[]
}

export async function fetchPurchaseOrders(options?: QueryRangeOptions): Promise<PurchaseOrder[]> {
  let query = supabase
    .from('purchase_orders')
    .select('*, purchase_order_items(*)')
    .order('created_at', { ascending: false })
  query = applyRange(query, options)
  const { data, error } = await query
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

export async function fetchPurchaseRequests(options?: QueryRangeOptions): Promise<PurchaseRequest[]> {
  let query = supabase.from('purchase_requests').select('*').order('created_at', { ascending: false })
  query = applyRange(query, options)
  const { data, error } = await query
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

export async function fetchPurchaseRequestsByIds(ids: string[]): Promise<PurchaseRequest[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('purchase_requests')
    .select('*')
    .in('id', ids)
  if (error) throw error
  return data as PurchaseRequest[]
}

export async function fetchMaterialPrices(options?: QueryRangeOptions): Promise<MaterialPrice[]> {
  let query = supabase.from('material_prices').select('*').order('effective_date', { ascending: false })
  query = applyRange(query, options)
  const { data, error } = await query
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

export async function fetchMaterialPricesByMaterialsAndSupplier(
  materialIds: string[],
  supplierId: string,
): Promise<MaterialPrice[]> {
  if (materialIds.length === 0) return []
  const { data, error } = await supabase
    .from('material_prices')
    .select('*')
    .eq('supplier_id', supplierId)
    .in('material_id', materialIds)
    .order('effective_date', { ascending: false })
  if (error) throw error
  return data as MaterialPrice[]
}

// ============ PAGINATED QUERIES ============

export async function fetchMaterialsPage(query: MaterialPageQuery): Promise<PageResult<Material>> {
  let supabaseQuery = supabase
    .from('materials')
    .select('*', { count: 'exact' })

  // Low stock filter (cross-table: stock.quantity < material.safety_stock)
  if (query.lowStockOnly) {
    const [matRes, stockRes] = await Promise.all([
      supabase.from('materials').select('id, safety_stock'),
      supabase.from('stocks').select('material_id, quantity'),
    ])
    const stockMap = new Map((stockRes.data ?? []).map(s => [s.material_id, s.quantity as number]))
    const lowStockIds = (matRes.data ?? [])
      .filter(m => (stockMap.get(m.id) ?? 0) < (m.safety_stock ?? 0))
      .map(m => m.id)
    if (lowStockIds.length === 0) {
      return { items: [], total: 0, page: query.page, pageSize: query.pageSize }
    }
    supabaseQuery = supabaseQuery.in('id', lowStockIds)
  }

  // Search filter
  if (query.search) {
    const search = query.search.trim()
    supabaseQuery = supabaseQuery.or(`material_code.ilike.%${search}%,name.ilike.%${search}%`)
  }

  // Category filter
  if (query.category) {
    supabaseQuery = supabaseQuery.eq('category', query.category)
  }

  // Sort
  const sortField = query.sortField || 'material_code'
  const sortDirection = query.sortDirection === 'desc' ? { ascending: false } : { ascending: true }
  supabaseQuery = supabaseQuery.order(sortField, sortDirection)

  // Pagination
  const from = (query.page - 1) * query.pageSize
  const to = from + query.pageSize - 1
  supabaseQuery = supabaseQuery.range(from, to)

  const { data, error, count } = await supabaseQuery
  if (error) throw error

  return {
    items: (data || []) as Material[],
    total: count || 0,
    page: query.page,
    pageSize: query.pageSize,
  }
}

export async function fetchInventoryStats(): Promise<InventoryStats> {
  const [matRes, stockRes] = await Promise.all([
    supabase.from('materials').select('id, safety_stock, unit_price', { count: 'exact' }),
    supabase.from('stocks').select('material_id, quantity, avg_unit_price'),
  ])
  if (matRes.error) throw matRes.error
  if (stockRes.error) throw stockRes.error

  const stockMap = new Map(
    (stockRes.data ?? []).map(s => [s.material_id, s] as const),
  )

  let lowStockCount = 0
  let totalValue = 0
  for (const m of matRes.data ?? []) {
    const stock = stockMap.get(m.id)
    const qty = (stock?.quantity as number) ?? 0
    const price = (stock?.avg_unit_price as number) ?? (m.unit_price as number) ?? 0
    if (qty < ((m.safety_stock as number) ?? 0)) lowStockCount++
    totalValue += qty * price
  }

  return {
    totalItems: matRes.count || 0,
    lowStockCount,
    totalValue,
  }
}

export async function fetchPurchaseOrdersPage(
  query: PurchaseOrderPageQuery,
): Promise<PageResult<PurchaseOrder>> {
  let supabaseQuery = supabase
    .from('purchase_orders')
    .select('*, purchase_order_items(*)', { count: 'exact' })

  // Search filter
  if (query.search) {
    const search = query.search.trim()
    supabaseQuery = supabaseQuery.or(`po_no.ilike.%${search}%`)
  }

  // Status filter
  if (query.status) {
    supabaseQuery = supabaseQuery.eq('status', query.status)
  }

  // Date range filters
  if (query.dateFrom) {
    supabaseQuery = supabaseQuery.gte('order_date', query.dateFrom)
  }
  if (query.dateTo) {
    supabaseQuery = supabaseQuery.lte('order_date', query.dateTo)
  }

  // Sort
  const sortField = query.sortField || 'created_at'
  const sortDirection = query.sortDirection === 'asc' ? { ascending: true } : { ascending: false }
  supabaseQuery = supabaseQuery.order(sortField, sortDirection)

  // Pagination
  const from = (query.page - 1) * query.pageSize
  const to = from + query.pageSize - 1
  supabaseQuery = supabaseQuery.range(from, to)

  const { data, error, count } = await supabaseQuery
  if (error) throw error

  const items = ((data || []) as PurchaseOrderRow[]).map(mapPurchaseOrderRow)

  return {
    items,
    total: count || 0,
    page: query.page,
    pageSize: query.pageSize,
  }
}

export async function fetchPurchaseRequestsPage(
  query: PurchaseRequestPageQuery,
): Promise<PageResult<PurchaseRequest>> {
  let supabaseQuery = supabase
    .from('purchase_requests')
    .select('*', { count: 'exact' })

  // Search filter
  if (query.search) {
    const search = query.search.trim()
    supabaseQuery = supabaseQuery.or(`pr_no.ilike.%${search}%`)
  }

  // Status filter
  if (query.status) {
    supabaseQuery = supabaseQuery.eq('status', query.status)
  }

  // Sort (default: created_at desc)
  const sortField = query.sortField || 'created_at'
  const sortDirection = query.sortDirection === 'asc' ? { ascending: true } : { ascending: false }
  supabaseQuery = supabaseQuery.order(sortField, sortDirection)

  // Pagination
  const from = (query.page - 1) * query.pageSize
  const to = from + query.pageSize - 1
  supabaseQuery = supabaseQuery.range(from, to)

  const { data, error, count } = await supabaseQuery
  if (error) throw error

  return {
    items: (data || []) as PurchaseRequest[],
    total: count || 0,
    page: query.page,
    pageSize: query.pageSize,
  }
}

export async function fetchSuppliersPage(query: SupplierPageQuery): Promise<PageResult<Supplier>> {
  let supabaseQuery = supabase
    .from('suppliers')
    .select('*', { count: 'exact' })

  // Search filter
  if (query.search) {
    const search = query.search.trim()
    supabaseQuery = supabaseQuery.or(`name.ilike.%${search}%,business_no.ilike.%${search}%`)
  }

  // Sort (default: created_at)
  const sortField = query.sortField || 'created_at'
  const sortDirection = query.sortDirection === 'desc' ? { ascending: false } : { ascending: true }
  supabaseQuery = supabaseQuery.order(sortField, sortDirection)

  // Pagination
  const from = (query.page - 1) * query.pageSize
  const to = from + query.pageSize - 1
  supabaseQuery = supabaseQuery.range(from, to)

  const { data, error, count } = await supabaseQuery
  if (error) throw error

  return {
    items: (data || []) as Supplier[],
    total: count || 0,
    page: query.page,
    pageSize: query.pageSize,
  }
}

// ============ MUTATIONS ============

// -- Suppliers --
export async function insertSupplier(supplier: Supplier) {
  const { error } = await supabase.from('suppliers').insert(supplier)
  if (error) throwSupabaseError('insertSupplier', error)
}

export async function updateSupplierDB(id: string, data: Partial<Supplier>) {
  const { error } = await supabase.from('suppliers').update(data).eq('id', id)
  if (error) throwSupabaseError('updateSupplier', error)
}

export async function deleteSupplierDB(id: string) {
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) throwSupabaseError('deleteSupplier', error)
}

// -- Materials --
export async function insertMaterial(material: Material) {
  const { error } = await supabase.from('materials').insert(material)
  if (error) throwSupabaseError('insertMaterial', error)
}

export async function updateMaterialDB(id: string, data: Partial<Material>) {
  const { error } = await supabase.from('materials').update(data).eq('id', id)
  if (error) throwSupabaseError('updateMaterial', error)
}

export async function deleteMaterialDB(id: string) {
  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) throwSupabaseError('deleteMaterial', error)
}

// -- Stocks --
export async function upsertStock(stock: Stock) {
  const { error } = await supabase.from('stocks').upsert(stock, { onConflict: 'id' })
  if (error) throwSupabaseError('upsertStock', error)
}

export async function upsertStocks(stocks: Stock[]) {
  if (stocks.length === 0) return
  const { error } = await supabase.from('stocks').upsert(stocks, { onConflict: 'id' })
  if (error) throwSupabaseError('upsertStocks', error)
}

// -- Stock Movements --
export async function insertStockMovement(sm: StockMovement) {
  const { error } = await supabase.from('stock_movements').insert(sm)
  if (error) throwSupabaseError('insertStockMovement', error)
}

export async function insertStockMovements(movements: StockMovement[]) {
  if (movements.length === 0) return
  const { error } = await supabase.from('stock_movements').insert(movements)
  if (error) throwSupabaseError('insertStockMovements', error)
}

// -- Purchase Orders --
export async function insertPurchaseOrder(po: PurchaseOrder) {
  const { items, ...poData } = po
  const { error: poError } = await supabase.from('purchase_orders').insert(poData)
  if (poError) throwSupabaseError('insertPO', poError)
  if (items.length > 0) {
    const itemRows = items.map(item => ({ ...item, purchase_order_id: po.id }))
    const { error: itemError } = await supabase.from('purchase_order_items').insert(itemRows)
    if (itemError) throwSupabaseError('insertPOItems', itemError)
  }
}

export async function updatePurchaseOrderDB(id: string, data: Partial<PurchaseOrder>) {
  const { items, ...rest } = data as Partial<PurchaseOrder> & { items?: PurchaseOrderItem[] }
  const { error } = await supabase.from('purchase_orders').update(rest).eq('id', id)
  if (error) throwSupabaseError('updatePO', error)

  if (items && items.length > 0) {
    const rows = items.map(item => ({ ...item, purchase_order_id: id }))
    const { error: itemError } = await supabase
      .from('purchase_order_items')
      .upsert(rows, { onConflict: 'id' })
    if (itemError) throwSupabaseError('updatePOItems', itemError)
  }
}

export async function deletePurchaseOrderDB(id: string) {
  const { error } = await supabase.from('purchase_orders').delete().eq('id', id)
  if (error) throwSupabaseError('deletePO', error)
}

// -- Purchase Requests --
export async function insertPurchaseRequest(pr: PurchaseRequest) {
  const { error } = await supabase.from('purchase_requests').insert(pr)
  if (error) { logSupabaseError('insertPR', error); throw error }
}

export async function insertPurchaseRequests(prs: PurchaseRequest[]) {
  if (prs.length === 0) return
  const { error } = await supabase.from('purchase_requests').insert(prs)
  if (error) { logSupabaseError('insertPRs', error); throw error }
}

export async function updatePurchaseRequestDB(id: string, data: Partial<PurchaseRequest>) {
  const { error } = await supabase.from('purchase_requests').update(data).eq('id', id)
  if (error) throwSupabaseError('updatePR', error)
}

export async function deletePurchaseRequestDB(id: string) {
  const { error } = await supabase.from('purchase_requests').delete().eq('id', id)
  if (error) throwSupabaseError('deletePR', error)
}

// -- Steel Tags --
export async function fetchSteelTags(options?: QueryRangeOptions): Promise<SteelTag[]> {
  let query = supabase.from('steel_tags').select('*').order('created_at', { ascending: false })
  query = applyRange(query, options)
  const { data, error } = await query
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
  if (error) throwSupabaseError('insertSteelTag', error)
}

export async function updateSteelTagDB(id: string, data: Partial<SteelTag>) {
  const { error } = await supabase.from('steel_tags').update(data).eq('id', id)
  if (error) throwSupabaseError('updateSteelTag', error)
}

export async function deleteSteelTagDB(id: string) {
  const { error } = await supabase.from('steel_tags').delete().eq('id', id)
  if (error) throwSupabaseError('deleteSteelTag', error)
}

// -- Material Prices --
export async function insertMaterialPrice(mp: MaterialPrice) {
  const { error } = await supabase.from('material_prices').insert(mp)
  if (error) throwSupabaseError('insertMaterialPrice', error)
}

export async function insertMaterialPrices(prices: MaterialPrice[]) {
  if (prices.length === 0) return
  const { error } = await supabase.from('material_prices').insert(prices)
  if (error) throwSupabaseError('insertMaterialPrices', error)
}

export async function deleteMaterialPriceDB(id: string) {
  const { error } = await supabase.from('material_prices').delete().eq('id', id)
  if (error) throwSupabaseError('deleteMaterialPrice', error)
}

// ============ DEPENDENCY CHECK ============

export async function fetchMaterialDependencies(materialId: string): Promise<MaterialDependencies> {
  const [stockRes, movementRes, prRes, poItemRes, priceRes, tagRes] = await Promise.all([
    supabase.from('stocks').select('id', { count: 'exact', head: true }).eq('material_id', materialId),
    supabase.from('stock_movements').select('id, movement_type, quantity', { count: 'exact' }).eq('material_id', materialId).order('created_at', { ascending: false }).limit(5),
    supabase.from('purchase_requests').select('id, pr_no', { count: 'exact' }).eq('material_id', materialId).order('created_at', { ascending: false }).limit(5),
    supabase.from('purchase_order_items').select('id, purchase_order_id', { count: 'exact' }).eq('material_id', materialId).limit(5),
    supabase.from('material_prices').select('id', { count: 'exact', head: true }).eq('material_id', materialId),
    supabase.from('steel_tags').select('id, tag_no', { count: 'exact' }).eq('material_id', materialId).order('created_at', { ascending: false }).limit(5),
  ])

  const items: MaterialDependencyItem[] = []

  const stockCount = stockRes.count ?? 0
  if (stockCount > 0) {
    items.push({ type: 'stock', label: '재고', count: stockCount, samples: [] })
  }

  const movementCount = movementRes.count ?? 0
  if (movementCount > 0) {
    const samples = (movementRes.data ?? []).map(m => `${m.movement_type} ${m.quantity}`)
    items.push({ type: 'stock_movement', label: '재고이동', count: movementCount, samples })
  }

  const prCount = prRes.count ?? 0
  if (prCount > 0) {
    const samples = (prRes.data ?? []).map(p => p.pr_no as string).filter(Boolean)
    items.push({ type: 'purchase_request', label: '구매요청', count: prCount, samples })
  }

  const poItemCount = poItemRes.count ?? 0
  if (poItemCount > 0) {
    const poIds = [...new Set((poItemRes.data ?? []).map(i => i.purchase_order_id as string))]
    let poSamples: string[] = []
    if (poIds.length > 0) {
      const { data: pos } = await supabase.from('purchase_orders').select('po_no').in('id', poIds).limit(5)
      poSamples = (pos ?? []).map(p => p.po_no as string).filter(Boolean)
    }
    items.push({ type: 'purchase_order_item', label: '구매발주 품목', count: poItemCount, samples: poSamples })
  }

  const priceCount = priceRes.count ?? 0
  if (priceCount > 0) {
    items.push({ type: 'material_price', label: '가격이력', count: priceCount, samples: [] })
  }

  const tagCount = tagRes.count ?? 0
  if (tagCount > 0) {
    const samples = (tagRes.data ?? []).map(t => t.tag_no as string).filter(Boolean)
    items.push({ type: 'steel_tag', label: '강재태그', count: tagCount, samples })
  }

  const totalCount = items.reduce((sum, item) => sum + item.count, 0)

  return {
    hasDependencies: totalCount > 0,
    totalCount,
    items,
  }
}
