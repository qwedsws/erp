import { createClient } from './client'
import { throwSupabaseError, isMissingRelationError, applyRange } from './utils'
import type {
  Material,
  Stock,
  StockMovement,
  MaterialPrice,
  SteelTag,
} from '@/domain/shared/entities'
import type { MaterialDependencies, MaterialDependencyItem } from '@/domain/materials/ports'
import type {
  QueryRangeOptions,
  PageResult,
  MaterialPageQuery,
  InventoryStats,
} from '@/domain/shared/types'

// Re-export procurement functions for backward compatibility
export {
  fetchSuppliers,
  fetchSupplierById,
  fetchSuppliersPage,
  insertSupplier,
  updateSupplierDB,
  deleteSupplierDB,
  fetchPurchaseOrders,
  fetchPurchaseOrderById,
  fetchPurchaseOrdersPage,
  insertPurchaseOrder,
  updatePurchaseOrderDB,
  deletePurchaseOrderDB,
  fetchPurchaseRequests,
  fetchPurchaseRequestById,
  fetchPurchaseRequestsByIds,
  fetchPurchaseRequestsPage,
  insertPurchaseRequest,
  insertPurchaseRequests,
  updatePurchaseRequestDB,
  deletePurchaseRequestDB,
} from './procurement'

const supabase = createClient()

// ============ MATERIAL FETCH ============

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

// ============ STOCK FETCH ============

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

// ============ STOCK MOVEMENT FETCH ============

export async function fetchStockMovements(options?: QueryRangeOptions): Promise<StockMovement[]> {
  let query = supabase.from('stock_movements').select('*').order('created_at', { ascending: false })
  query = applyRange(query, options)
  const { data, error } = await query
  if (error) throw error
  return data as StockMovement[]
}

// ============ MATERIAL PRICE FETCH ============

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

// ============ STEEL TAG FETCH ============

export async function fetchSteelTags(options?: QueryRangeOptions): Promise<SteelTag[]> {
  let query = supabase.from('steel_tags').select('*').order('created_at', { ascending: false })
  query = applyRange(query, options)
  const { data, error } = await query
  if (error) {
    if (isMissingRelationError(error)) {
      console.warn('fetchSteelTags: steel_tags relation is missing; returning empty list')
      return []
    }
    throwSupabaseError('fetchSteelTags', error)
  }
  return data as SteelTag[]
}

export async function fetchSteelTagById(id: string): Promise<SteelTag | null> {
  const { data, error } = await supabase
    .from('steel_tags')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) {
    if (isMissingRelationError(error)) {
      console.warn('fetchSteelTagById: steel_tags relation is missing; returning null')
      return null
    }
    throwSupabaseError('fetchSteelTagById', error)
  }
  return (data as SteelTag | null) ?? null
}

// ============ PAGINATED QUERIES ============

export async function fetchMaterialsPage(query: MaterialPageQuery): Promise<PageResult<Material>> {
  let supabaseQuery = supabase
    .from('materials')
    .select('*', { count: 'exact' })

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

  if (query.search) {
    const search = query.search.trim()
    supabaseQuery = supabaseQuery.or(`material_code.ilike.%${search}%,name.ilike.%${search}%`)
  }

  if (query.category) {
    supabaseQuery = supabaseQuery.eq('category', query.category)
  }

  const sortField = query.sortField || 'material_code'
  const sortDirection = query.sortDirection === 'desc' ? { ascending: false } : { ascending: true }
  supabaseQuery = supabaseQuery.order(sortField, sortDirection)

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

// ============ MATERIAL MUTATIONS ============

export async function insertMaterial(material: Material) {
  const { error } = await supabase.from('materials').insert(material)
  if (error) throwSupabaseError('insertMaterial', error)
}

export async function updateMaterialDB(id: string, data: Partial<Material>) {
  const { error } = await supabase.from('materials').update(data).eq('id', id)
  if (error) throwSupabaseError('updateMaterial', error)
}

export async function deleteMaterialDB(id: string) {
  const { data, error } = await supabase.from('materials').delete().eq('id', id).select('id').maybeSingle()
  if (error) throwSupabaseError('deleteMaterial', error)
  if (!data) throw new Error(`Material not found or not deletable: ${id}`)
}

// ============ STOCK MUTATIONS ============

export async function upsertStock(stock: Stock) {
  const { error } = await supabase.from('stocks').upsert(stock, { onConflict: 'id' })
  if (error) throwSupabaseError('upsertStock', error)
}

export async function upsertStocks(stocks: Stock[]) {
  if (stocks.length === 0) return
  const { error } = await supabase.from('stocks').upsert(stocks, { onConflict: 'id' })
  if (error) throwSupabaseError('upsertStocks', error)
}

// ============ STOCK MOVEMENT MUTATIONS ============

export async function insertStockMovement(sm: StockMovement) {
  const { error } = await supabase.from('stock_movements').insert(sm)
  if (error) throwSupabaseError('insertStockMovement', error)
}

export async function insertStockMovements(movements: StockMovement[]) {
  if (movements.length === 0) return
  const { error } = await supabase.from('stock_movements').insert(movements)
  if (error) throwSupabaseError('insertStockMovements', error)
}

// ============ STEEL TAG MUTATIONS ============

export async function insertSteelTag(tag: SteelTag) {
  const { error } = await supabase.from('steel_tags').insert(tag)
  if (error) throwSupabaseError('insertSteelTag', error)
}

export async function updateSteelTagDB(id: string, data: Partial<SteelTag>) {
  const { error } = await supabase.from('steel_tags').update(data).eq('id', id)
  if (error) throwSupabaseError('updateSteelTag', error)
}

export async function deleteSteelTagDB(id: string) {
  const { data, error } = await supabase.from('steel_tags').delete().eq('id', id).select('id').maybeSingle()
  if (error) throwSupabaseError('deleteSteelTag', error)
  if (!data) throw new Error(`SteelTag not found or not deletable: ${id}`)
}

// ============ MATERIAL PRICE MUTATIONS ============

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
  const { data, error } = await supabase.from('material_prices').delete().eq('id', id).select('id').maybeSingle()
  if (error) throwSupabaseError('deleteMaterialPrice', error)
  if (!data) throw new Error(`MaterialPrice not found or not deletable: ${id}`)
}

// ============ DEPENDENCY CHECK ============

export async function fetchMaterialDependencies(materialId: string): Promise<MaterialDependencies> {
  const [stockRes, movementRes, prRes, poItemRes, priceRes, tagRes] = await Promise.all([
    supabase.from('stocks').select('id', { count: 'exact', head: true }).eq('material_id', materialId),
    supabase.from('stock_movements').select('id, type, quantity', { count: 'exact' }).eq('material_id', materialId).order('created_at', { ascending: false }).limit(5),
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
    const samples = (movementRes.data ?? []).map(m => `${m.type} ${m.quantity}`)
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
