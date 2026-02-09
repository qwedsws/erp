export type UserRole =
  | 'ADMIN'
  | 'SALES'
  | 'ENGINEER'
  | 'PRODUCTION'
  | 'WORKER'
  | 'PURCHASE'
  | 'QC'
  | 'ACCOUNTING';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  hourly_rate?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Customer {
  id: string;
  name: string;
  business_no?: string;
  representative?: string;
  address?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  contact_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_no: string;
  quote_id?: string;
  customer_id: string;
  customer?: Customer;
  title: string;
  status: OrderStatus;
  order_date: string;
  delivery_date: string;
  total_amount?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type MoldType = 'INJECTION' | 'PRESS' | 'DIE_CASTING' | 'BLOW' | 'OTHER';
export type ProjectStatus =
  | 'CONFIRMED'
  | 'DESIGNING'
  | 'DESIGN_COMPLETE'
  | 'MATERIAL_PREP'
  | 'MACHINING'
  | 'ASSEMBLING'
  | 'TRYOUT'
  | 'REWORK'
  | 'FINAL_INSPECTION'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'AS_SERVICE';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type ProcessCategory = 'DESIGN' | 'PRODUCTION' | 'ASSEMBLY' | 'QUALITY';
export type ProcessStepStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'ON_HOLD';

export interface Project {
  id: string;
  project_no: string;
  order_id?: string;
  order?: Order;
  name: string;
  mold_type: MoldType;
  status: ProjectStatus;
  priority: Priority;
  manager_id?: string;
  manager?: Profile;
  start_date?: string;
  due_date: string;
  completed_date?: string;
  description?: string;
  specifications?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProcessStep {
  id: string;
  project_id: string;
  category: ProcessCategory;
  process_code: string;
  process_name: string;
  sequence: number;
  estimated_hours?: number;
  machine_id?: string;
  assignee_id?: string;
  assignee?: Profile;
  status: ProcessStepStatus;
  start_date?: string;
  end_date?: string;
  predecessor_id?: string;
  outputs?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type WorkOrderStatus = 'PLANNED' | 'READY' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface WorkOrder {
  id: string;
  work_order_no: string;
  process_step_id?: string;
  process_step?: ProcessStep;
  project_id: string;
  project?: Project;
  machine_id?: string;
  worker_id?: string;
  worker?: Profile;
  status: WorkOrderStatus;
  planned_start?: string;
  planned_end?: string;
  actual_start?: string;
  actual_end?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkLog {
  id: string;
  work_order_id: string;
  worker_id: string;
  worker?: Profile;
  machine_id?: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  description?: string;
  issues?: string;
  created_at: string;
}

export interface Machine {
  id: string;
  machine_code: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  status: 'RUNNING' | 'IDLE' | 'MAINTENANCE' | 'BREAKDOWN';
  location?: string;
  hourly_rate?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type MaterialCategory = 'STEEL' | 'TOOL' | 'CONSUMABLE' | 'STANDARD_PART' | 'PURCHASED';
export type PurchaseOrderStatus = 'DRAFT' | 'ORDERED' | 'PARTIAL_RECEIVED' | 'RECEIVED' | 'CANCELLED';
export type StockMovementType = 'IN' | 'OUT' | 'ADJUST';
export type ToolType =
  | 'END_MILL'
  | 'DRILL'
  | 'TAP'
  | 'INSERT'
  | 'ELECTRODE'
  | 'GRINDING_WHEEL'
  | 'REAMER'
  | 'TOOL_OTHER';
export type SteelWeightMethod = 'MEASURED' | 'CALCULATED';
export type SteelTagStatus = 'AVAILABLE' | 'ALLOCATED' | 'IN_USE' | 'USED' | 'SCRAP';

export interface Supplier {
  id: string;
  name: string;
  business_no?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  supplier_type?: 'MATERIAL' | 'OUTSOURCE' | 'BOTH';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  material_code: string;
  name: string;
  category: MaterialCategory;
  specification?: string;
  unit: string;
  inventory_unit?: string;
  unit_price?: number;
  safety_stock?: number;
  lead_time?: number;
  supplier_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  steel_grade?: string;
  density?: number;
  dimension_w?: number;
  dimension_l?: number;
  dimension_h?: number;
  weight?: number;
  price_per_kg?: number;
  weight_method?: SteelWeightMethod;
  tool_type?: ToolType;
  tool_diameter?: number;
  tool_length?: number;
  max_usage_count?: number;
  regrind_max?: number;
  min_order_qty?: number;
}

export interface SteelTag {
  id: string;
  material_id: string;
  tag_no: string;
  weight: number;
  status: SteelTagStatus;
  project_id?: string;
  purchase_order_id?: string;
  location?: string;
  received_at: string;
  issued_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: string;
  material_id: string;
  location_code?: string;
  quantity: number;
  avg_unit_price: number;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  material_id: string;
  type: StockMovementType;
  quantity: number;
  unit_price?: number;
  project_id?: string;
  purchase_order_id?: string;
  reason?: string;
  created_by?: string;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  received_quantity?: number;
}

export interface PurchaseOrder {
  id: string;
  po_no: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  order_date: string;
  due_date?: string;
  total_amount?: number;
  items: PurchaseOrderItem[];
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialPrice {
  id: string;
  material_id: string;
  supplier_id: string;
  unit_price: number;
  prev_price?: number;
  effective_date: string;
  notes?: string;
  created_at: string;
}

export type PurchaseRequestStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED';

export interface PurchaseRequest {
  id: string;
  pr_no: string;
  material_id: string;
  quantity: number;
  required_date: string;
  reason: string;
  requested_by: string;
  status: PurchaseRequestStatus;
  approved_by?: string;
  approved_at?: string;
  reject_reason?: string;
  po_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type InspectionType = 'INCOMING' | 'IN_PROCESS' | 'FINAL' | 'TRYOUT';
export type InspectionStatus = 'PLANNED' | 'IN_PROGRESS' | 'PASS' | 'FAIL' | 'CONDITIONAL';
export type TryoutStatus = 'PLANNED' | 'COMPLETED' | 'APPROVED';
export type DefectType = 'DESIGN' | 'MACHINING' | 'ASSEMBLY' | 'MATERIAL' | 'OTHER';

export interface QualityInspection {
  id: string;
  inspection_no: string;
  project_id: string;
  type: InspectionType;
  status: InspectionStatus;
  inspector_id?: string;
  inspection_date?: string;
  results?: Record<string, unknown>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Tryout {
  id: string;
  project_id: string;
  tryout_no: number;
  date?: string;
  machine?: string;
  conditions?: Record<string, unknown>;
  results?: string;
  issues?: string;
  corrections?: string;
  status: TryoutStatus;
  created_at: string;
  updated_at: string;
}

export interface Defect {
  id: string;
  project_id: string;
  defect_type: DefectType;
  title: string;
  description: string;
  cause?: string;
  countermeasure?: string;
  reported_by?: string;
  reported_date: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  updated_at: string;
}

export type PaymentType = 'ADVANCE' | 'INTERIM' | 'BALANCE' | 'OTHER';
export type PaymentMethod = 'BANK_TRANSFER' | 'CHECK' | 'CASH' | 'NOTE';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Payment {
  id: string;
  order_id: string;
  payment_type: PaymentType;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  confirmed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
