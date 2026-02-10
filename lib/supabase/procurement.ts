import { createClient } from './client'
import { logSupabaseError, throwSupabaseError, applyRange } from './utils'
import type {
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequest,
} from '@/domain/shared/entities'
import type {
  QueryRangeOptions,
  PageResult,
  PurchaseOrderPageQuery,
  PurchaseRequestPageQuery,
  SupplierPageQuery,
} from '@/domain/shared/types'

const supabase = createClient()

type PurchaseOrderRow = PurchaseOrder & { purchase_order_items?: PurchaseOrderItem[] | null }

function mapPurchaseOrderRow(po: PurchaseOrderRow): PurchaseOrder {
  return {
    ...po,
    items: (po.purchase_order_items || []) as PurchaseOrderItem[],
    purchase_order_items: undefined,
  } as PurchaseOrder
}

// ============ SUPPLIER FETCH ============

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

export async function fetchSuppliersPage(query: SupplierPageQuery): Promise<PageResult<Supplier>> {
  let supabaseQuery = supabase
    .from('suppliers')
    .select('*', { count: 'exact' })

  if (query.search) {
    const search = query.search.trim()
    supabaseQuery = supabaseQuery.or(`name.ilike.%${search}%,business_no.ilike.%${search}%`)
  }

  const sortField = query.sortField || 'created_at'
  const sortDirection = query.sortDirection === 'desc' ? { ascending: false } : { ascending: true }
  supabaseQuery = supabaseQuery.order(sortField, sortDirection)

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

// ============ SUPPLIER MUTATIONS ============

export async function insertSupplier(supplier: Supplier) {
  const { error } = await supabase.from('suppliers').insert(supplier)
  if (error) throwSupabaseError('insertSupplier', error)
}

export async function updateSupplierDB(id: string, data: Partial<Supplier>) {
  const { error } = await supabase.from('suppliers').update(data).eq('id', id)
  if (error) throwSupabaseError('updateSupplier', error)
}

export async function deleteSupplierDB(id: string) {
  const { data, error } = await supabase.from('suppliers').delete().eq('id', id).select('id').maybeSingle()
  if (error) throwSupabaseError('deleteSupplier', error)
  if (!data) throw new Error(`Supplier not found or not deletable: ${id}`)
}

// ============ PURCHASE ORDER FETCH ============

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

export async function fetchPurchaseOrdersPage(
  query: PurchaseOrderPageQuery,
): Promise<PageResult<PurchaseOrder>> {
  let supabaseQuery = supabase
    .from('purchase_orders')
    .select('*, purchase_order_items(*)', { count: 'exact' })

  if (query.search) {
    const search = query.search.trim()
    supabaseQuery = supabaseQuery.or(`po_no.ilike.%${search}%`)
  }

  if (query.status) {
    supabaseQuery = supabaseQuery.eq('status', query.status)
  }

  if (query.dateFrom) {
    supabaseQuery = supabaseQuery.gte('order_date', query.dateFrom)
  }
  if (query.dateTo) {
    supabaseQuery = supabaseQuery.lte('order_date', query.dateTo)
  }

  const sortField = query.sortField || 'created_at'
  const sortDirection = query.sortDirection === 'asc' ? { ascending: true } : { ascending: false }
  supabaseQuery = supabaseQuery.order(sortField, sortDirection)

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

// ============ PURCHASE ORDER MUTATIONS ============

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

  if (items !== undefined) {
    if (items.length === 0) {
      const { error: delError } = await supabase
        .from('purchase_order_items')
        .delete()
        .eq('purchase_order_id', id)
      if (delError) throwSupabaseError('deletePOItems', delError)
    } else {
      const keepIds = items.map(item => item.id).filter(Boolean)
      if (keepIds.length > 0) {
        const { error: delError } = await supabase
          .from('purchase_order_items')
          .delete()
          .eq('purchase_order_id', id)
          .not('id', 'in', `(${keepIds.join(',')})`)
        if (delError) throwSupabaseError('deleteOrphanPOItems', delError)
      }
      const rows = items.map(item => ({ ...item, purchase_order_id: id }))
      const { error: itemError } = await supabase
        .from('purchase_order_items')
        .upsert(rows, { onConflict: 'id' })
      if (itemError) throwSupabaseError('updatePOItems', itemError)
    }
  }
}

export async function deletePurchaseOrderDB(id: string) {
  const { data, error } = await supabase.from('purchase_orders').delete().eq('id', id).select('id').maybeSingle()
  if (error) throwSupabaseError('deletePO', error)
  if (!data) throw new Error(`PurchaseOrder not found or not deletable: ${id}`)
}

// ============ PURCHASE REQUEST FETCH ============

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

export async function fetchPurchaseRequestsPage(
  query: PurchaseRequestPageQuery,
): Promise<PageResult<PurchaseRequest>> {
  let supabaseQuery = supabase
    .from('purchase_requests')
    .select('*', { count: 'exact' })

  if (query.search) {
    const search = query.search.trim()
    supabaseQuery = supabaseQuery.or(`pr_no.ilike.%${search}%`)
  }

  if (query.status) {
    supabaseQuery = supabaseQuery.eq('status', query.status)
  }

  const sortField = query.sortField || 'created_at'
  const sortDirection = query.sortDirection === 'asc' ? { ascending: true } : { ascending: false }
  supabaseQuery = supabaseQuery.order(sortField, sortDirection)

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

// ============ PURCHASE REQUEST MUTATIONS ============

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
  const { data, error } = await supabase.from('purchase_requests').delete().eq('id', id).select('id').maybeSingle()
  if (error) throwSupabaseError('deletePR', error)
  if (!data) throw new Error(`PurchaseRequest not found or not deletable: ${id}`)
}
