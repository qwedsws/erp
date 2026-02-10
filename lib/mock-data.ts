import type {
  Customer,
  Order,
  Project,
  ProcessStep,
  WorkOrder,
  WorkLog,
  Machine,
  Profile,
  Supplier,
  Material,
  Stock,
  StockMovement,
  PurchaseOrder,
  QualityInspection,
  Tryout,
  Defect,
  Payment,
  MaterialPrice,
  PurchaseRequest,
  SteelTag,
} from '@/domain/shared/entities';

export const mockProfiles: Profile[] = [
  { id: 'p1', email: 'admin@example.com', name: '김관리', role: 'ADMIN', department: '경영지원', phone: '010-1111-0001', hourly_rate: 50000, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'p2', email: 'sales@example.com', name: '이영업', role: 'SALES', department: '영업부', phone: '010-1111-0002', hourly_rate: 45000, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'p3', email: 'engineer@example.com', name: '박설계', role: 'ENGINEER', department: '설계부', phone: '010-1111-0003', hourly_rate: 55000, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'p4', email: 'production@example.com', name: '최생산', role: 'PRODUCTION', department: '생산관리', phone: '010-1111-0004', hourly_rate: 40000, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'p5', email: 'worker1@example.com', name: '정가공', role: 'WORKER', department: '가공팀', phone: '010-1111-0005', hourly_rate: 35000, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'p6', email: 'worker2@example.com', name: '한가공', role: 'WORKER', department: '가공팀', phone: '010-1111-0006', hourly_rate: 35000, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'p7', email: 'engineer2@example.com', name: '김설계', role: 'ENGINEER', department: '설계부', phone: '010-1111-0007', hourly_rate: 50000, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

export const mockCustomers: Customer[] = [
  { id: 'c1', name: '(주)현대모비스', business_no: '123-45-67890', representative: '김대표', address: '경기도 화성시 삼성1로 20', phone: '031-1234-5678', email: 'contact@hyundai.com', contact_person: '박담당', contact_phone: '010-2222-0001', notes: 'VIP 고객', created_at: '2024-01-15T00:00:00Z', updated_at: '2024-01-15T00:00:00Z' },
  { id: 'c2', name: '삼성전자(주)', business_no: '234-56-78901', representative: '이대표', address: '경기도 수원시 영통구 삼성로 129', phone: '031-2345-6789', email: 'mold@samsung.com', contact_person: '김주임', contact_phone: '010-2222-0002', created_at: '2024-02-01T00:00:00Z', updated_at: '2024-02-01T00:00:00Z' },
  { id: 'c3', name: '(주)LG전자', business_no: '345-67-89012', representative: '박대표', address: '서울특별시 영등포구 여의대로 128', phone: '02-3456-7890', email: 'parts@lg.com', contact_person: '최과장', contact_phone: '010-2222-0003', created_at: '2024-03-10T00:00:00Z', updated_at: '2024-03-10T00:00:00Z' },
  { id: 'c4', name: '한화솔루션(주)', business_no: '456-78-90123', representative: '최대표', address: '서울특별시 중구 청계천로 86', phone: '02-4567-8901', email: 'order@hanwha.com', contact_person: '정대리', contact_phone: '010-2222-0004', created_at: '2024-04-05T00:00:00Z', updated_at: '2024-04-05T00:00:00Z' },
  { id: 'c5', name: '(주)만도', business_no: '567-89-01234', representative: '정대표', address: '경기도 평택시 모세로 204', phone: '031-5678-9012', email: 'procurement@mando.com', contact_person: '윤사원', contact_phone: '010-2222-0005', created_at: '2024-05-20T00:00:00Z', updated_at: '2024-05-20T00:00:00Z' },
];

export const mockOrders: Order[] = [
  { id: 'o1', order_no: 'SO-2026-001', customer_id: 'c1', title: '커넥터 하우징 사출금형', status: 'IN_PROGRESS', order_date: '2026-01-05', delivery_date: '2026-03-15', total_amount: 85000000, created_by: 'p2', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'o2', order_no: 'SO-2026-002', customer_id: 'c2', title: '배터리 케이스 프레스금형', status: 'IN_PROGRESS', order_date: '2026-01-10', delivery_date: '2026-04-20', total_amount: 120000000, created_by: 'p2', created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' },
  { id: 'o3', order_no: 'SO-2026-003', customer_id: 'c3', title: '에어컨 팬 블레이드 사출금형', status: 'CONFIRMED', order_date: '2026-01-20', delivery_date: '2026-05-30', total_amount: 65000000, created_by: 'p2', created_at: '2026-01-20T00:00:00Z', updated_at: '2026-01-20T00:00:00Z' },
  { id: 'o4', order_no: 'SO-2026-004', customer_id: 'c1', title: '범퍼 가니쉬 사출금형', status: 'IN_PROGRESS', order_date: '2026-01-25', delivery_date: '2026-03-30', total_amount: 95000000, created_by: 'p2', created_at: '2026-01-25T00:00:00Z', updated_at: '2026-01-25T00:00:00Z' },
  { id: 'o5', order_no: 'SO-2026-005', customer_id: 'c4', title: '태양광 프레임 다이캐스팅금형', status: 'CONFIRMED', order_date: '2026-02-01', delivery_date: '2026-06-15', total_amount: 150000000, created_by: 'p2', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
  { id: 'o6', order_no: 'SO-2025-010', customer_id: 'c5', title: '브레이크 캘리퍼 금형', status: 'COMPLETED', order_date: '2025-09-15', delivery_date: '2025-12-20', total_amount: 78000000, created_by: 'p2', created_at: '2025-09-15T00:00:00Z', updated_at: '2025-12-18T00:00:00Z' },
];

export const mockProjects: Project[] = [
  { id: 'pj1', project_no: 'PJ-2026-001', order_id: 'o1', name: '커넥터 하우징 금형', mold_type: 'INJECTION', status: 'MACHINING', priority: 'HIGH', manager_id: 'p4', start_date: '2026-01-10', due_date: '2026-03-15', description: '2캐비티 커넥터 하우징 사출금형', specifications: { cavity_count: 2, material: 'NAK80', size: '400x300x350' }, created_at: '2026-01-05T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
  { id: 'pj2', project_no: 'PJ-2026-002', order_id: 'o2', name: '배터리 케이스 금형', mold_type: 'PRESS', status: 'DESIGNING', priority: 'HIGH', manager_id: 'p4', start_date: '2026-01-15', due_date: '2026-04-20', description: '배터리 팩 케이스 프레스 금형', specifications: { material: 'SKD11', size: '800x600x400' }, created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-20T00:00:00Z' },
  { id: 'pj3', project_no: 'PJ-2026-003', order_id: 'o3', name: '에어컨 팬 블레이드 금형', mold_type: 'INJECTION', status: 'CONFIRMED', priority: 'MEDIUM', manager_id: 'p4', start_date: '2026-02-01', due_date: '2026-05-30', description: '4캐비티 팬 블레이드 사출금형', specifications: { cavity_count: 4, material: 'NAK80', size: '500x400x380' }, created_at: '2026-01-20T00:00:00Z', updated_at: '2026-01-20T00:00:00Z' },
  { id: 'pj4', project_no: 'PJ-2026-004', order_id: 'o4', name: '범퍼 가니쉬 금형', mold_type: 'INJECTION', status: 'ASSEMBLING', priority: 'HIGH', manager_id: 'p4', start_date: '2026-01-28', due_date: '2026-03-30', description: '범퍼 가니쉬 사출금형', specifications: { cavity_count: 1, material: 'NAK80', size: '1200x800x600' }, created_at: '2026-01-25T00:00:00Z', updated_at: '2026-02-05T00:00:00Z' },
  { id: 'pj5', project_no: 'PJ-2026-005', order_id: 'o5', name: '태양광 프레임 금형', mold_type: 'DIE_CASTING', status: 'CONFIRMED', priority: 'MEDIUM', manager_id: 'p4', due_date: '2026-06-15', description: '태양광 패널 프레임 다이캐스팅 금형', specifications: { material: 'SKD61', size: '600x500x350' }, created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
  { id: 'pj6', project_no: 'PJ-2025-010', order_id: 'o6', name: '브레이크 캘리퍼 금형', mold_type: 'DIE_CASTING', status: 'DELIVERED', priority: 'MEDIUM', manager_id: 'p4', start_date: '2025-09-20', due_date: '2025-12-20', completed_date: '2025-12-18', description: '브레이크 캘리퍼 다이캐스팅 금형', created_at: '2025-09-15T00:00:00Z', updated_at: '2025-12-18T00:00:00Z' },
];

// Process steps for project pj1 (커넥터 하우징 - currently MACHINING)
export const mockProcessSteps: ProcessStep[] = [
  { id: 'ps1', project_id: 'pj1', category: 'DESIGN', process_code: 'DESIGN_3D', process_name: '3D 모델링', sequence: 1, estimated_hours: 40, assignee_id: 'p3', status: 'COMPLETED', start_date: '2026-01-10', end_date: '2026-01-17', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-17T00:00:00Z' },
  { id: 'ps2', project_id: 'pj1', category: 'DESIGN', process_code: 'DESIGN_2D', process_name: '2D 도면 작성', sequence: 2, estimated_hours: 24, assignee_id: 'p3', status: 'COMPLETED', start_date: '2026-01-18', end_date: '2026-01-22', predecessor_id: 'ps1', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-22T00:00:00Z' },
  { id: 'ps3', project_id: 'pj1', category: 'DESIGN', process_code: 'DESIGN_REVIEW', process_name: '설계 검토', sequence: 3, estimated_hours: 8, assignee_id: 'p3', status: 'COMPLETED', start_date: '2026-01-23', end_date: '2026-01-23', predecessor_id: 'ps2', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-23T00:00:00Z' },
  { id: 'ps4', project_id: 'pj1', category: 'DESIGN', process_code: 'DESIGN_BOM', process_name: 'BOM 확정', sequence: 4, estimated_hours: 4, assignee_id: 'p3', status: 'COMPLETED', start_date: '2026-01-24', end_date: '2026-01-24', predecessor_id: 'ps3', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-24T00:00:00Z' },
  { id: 'ps5', project_id: 'pj1', category: 'PRODUCTION', process_code: 'MATERIAL_PREP', process_name: '자재 준비', sequence: 5, estimated_hours: 16, assignee_id: 'p4', status: 'COMPLETED', start_date: '2026-01-25', end_date: '2026-01-28', predecessor_id: 'ps4', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-28T00:00:00Z' },
  { id: 'ps6', project_id: 'pj1', category: 'PRODUCTION', process_code: 'ROUGHING', process_name: '황삭', sequence: 6, estimated_hours: 32, machine_id: 'm1', assignee_id: 'p5', status: 'COMPLETED', start_date: '2026-01-29', end_date: '2026-02-03', predecessor_id: 'ps5', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-02-03T00:00:00Z' },
  { id: 'ps7', project_id: 'pj1', category: 'PRODUCTION', process_code: 'MCT', process_name: 'MCT 가공', sequence: 7, estimated_hours: 48, machine_id: 'm2', assignee_id: 'p5', status: 'IN_PROGRESS', start_date: '2026-02-04', predecessor_id: 'ps6', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-02-04T00:00:00Z' },
  { id: 'ps8', project_id: 'pj1', category: 'PRODUCTION', process_code: 'EDM', process_name: '방전 가공', sequence: 8, estimated_hours: 24, machine_id: 'm3', assignee_id: 'p6', status: 'PLANNED', predecessor_id: 'ps7', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'ps9', project_id: 'pj1', category: 'PRODUCTION', process_code: 'WIRE', process_name: '와이어 가공', sequence: 9, estimated_hours: 16, machine_id: 'm4', assignee_id: 'p6', status: 'PLANNED', predecessor_id: 'ps7', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'ps10', project_id: 'pj1', category: 'PRODUCTION', process_code: 'GRINDING', process_name: '연마', sequence: 10, estimated_hours: 16, machine_id: 'm5', assignee_id: 'p5', status: 'PLANNED', predecessor_id: 'ps8', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'ps11', project_id: 'pj1', category: 'ASSEMBLY', process_code: 'ASSEMBLY', process_name: '조립', sequence: 11, estimated_hours: 24, assignee_id: 'p5', status: 'PLANNED', predecessor_id: 'ps10', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'ps12', project_id: 'pj1', category: 'QUALITY', process_code: 'TRYOUT', process_name: '트라이아웃', sequence: 12, estimated_hours: 16, assignee_id: 'p4', status: 'PLANNED', predecessor_id: 'ps11', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'ps13', project_id: 'pj1', category: 'QUALITY', process_code: 'FINAL_INSPECTION', process_name: '최종검사', sequence: 13, estimated_hours: 8, assignee_id: 'p4', status: 'PLANNED', predecessor_id: 'ps12', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  // Process steps for pj2 (배터리 케이스 - DESIGNING)
  { id: 'ps_pj2_1', project_id: 'pj2', category: 'DESIGN', process_code: 'DESIGN_3D', process_name: '3D 모델링', sequence: 1, estimated_hours: 48, assignee_id: 'p7', status: 'COMPLETED', start_date: '2026-01-16', end_date: '2026-01-24', created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-24T00:00:00Z' },
  { id: 'ps_pj2_2', project_id: 'pj2', category: 'DESIGN', process_code: 'DESIGN_2D', process_name: '2D 도면 작성', sequence: 2, estimated_hours: 32, assignee_id: 'p7', status: 'IN_PROGRESS', start_date: '2026-01-25', predecessor_id: 'ps_pj2_1', created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-25T00:00:00Z' },
  { id: 'ps_pj2_3', project_id: 'pj2', category: 'DESIGN', process_code: 'DESIGN_REVIEW', process_name: '설계 검토', sequence: 3, estimated_hours: 8, assignee_id: 'p3', status: 'PLANNED', predecessor_id: 'ps_pj2_2', created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' },
  { id: 'ps_pj2_4', project_id: 'pj2', category: 'DESIGN', process_code: 'DESIGN_BOM', process_name: 'BOM 확정', sequence: 4, estimated_hours: 4, assignee_id: 'p7', status: 'PLANNED', predecessor_id: 'ps_pj2_3', created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' },
  // pj4 steps (범퍼 가니쉬 - ASSEMBLING)
  { id: 'ps18', project_id: 'pj4', category: 'ASSEMBLY', process_code: 'ASSEMBLY', process_name: '조립', sequence: 11, estimated_hours: 32, assignee_id: 'p5', status: 'IN_PROGRESS', start_date: '2026-02-03', created_at: '2026-01-25T00:00:00Z', updated_at: '2026-02-03T00:00:00Z' },
  { id: 'ps19', project_id: 'pj4', category: 'QUALITY', process_code: 'TRYOUT', process_name: '트라이아웃', sequence: 12, estimated_hours: 16, assignee_id: 'p4', status: 'PLANNED', predecessor_id: 'ps18', created_at: '2026-01-25T00:00:00Z', updated_at: '2026-01-25T00:00:00Z' },
];

export const mockWorkOrders: WorkOrder[] = [
  { id: 'wo1', work_order_no: 'WO-2026-00001', process_step_id: 'ps7', project_id: 'pj1', machine_id: 'm2', worker_id: 'p5', status: 'IN_PROGRESS', planned_start: '2026-02-04T08:00:00Z', planned_end: '2026-02-10T17:00:00Z', actual_start: '2026-02-04T08:30:00Z', description: 'PJ-2026-001 MCT 가공', created_at: '2026-02-03T00:00:00Z', updated_at: '2026-02-04T00:00:00Z' },
  { id: 'wo2', work_order_no: 'WO-2026-00002', process_step_id: 'ps8', project_id: 'pj1', machine_id: 'm3', worker_id: 'p6', status: 'PLANNED', planned_start: '2026-02-11T08:00:00Z', planned_end: '2026-02-14T17:00:00Z', description: 'PJ-2026-001 방전 가공', created_at: '2026-02-03T00:00:00Z', updated_at: '2026-02-03T00:00:00Z' },
  { id: 'wo3', work_order_no: 'WO-2026-00003', process_step_id: 'ps9', project_id: 'pj1', machine_id: 'm4', worker_id: 'p6', status: 'PLANNED', planned_start: '2026-02-11T08:00:00Z', planned_end: '2026-02-13T17:00:00Z', description: 'PJ-2026-001 와이어 가공', created_at: '2026-02-03T00:00:00Z', updated_at: '2026-02-03T00:00:00Z' },
  { id: 'wo4', work_order_no: 'WO-2026-00004', process_step_id: 'ps_pj2_1', project_id: 'pj2', worker_id: 'p7', status: 'IN_PROGRESS', planned_start: '2026-01-20T08:00:00Z', planned_end: '2026-02-07T17:00:00Z', actual_start: '2026-01-20T09:00:00Z', description: 'PJ-2026-002 3D 모델링', created_at: '2026-01-18T00:00:00Z', updated_at: '2026-01-20T00:00:00Z' },
  { id: 'wo5', work_order_no: 'WO-2026-00005', process_step_id: 'ps18', project_id: 'pj4', worker_id: 'p5', status: 'IN_PROGRESS', planned_start: '2026-02-03T08:00:00Z', planned_end: '2026-02-07T17:00:00Z', actual_start: '2026-02-03T08:00:00Z', description: 'PJ-2026-004 조립', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-03T00:00:00Z' },
  { id: 'wo6', work_order_no: 'WO-2026-00006', process_step_id: 'ps6', project_id: 'pj1', machine_id: 'm1', worker_id: 'p5', status: 'COMPLETED', planned_start: '2026-01-29T08:00:00Z', planned_end: '2026-02-03T17:00:00Z', actual_start: '2026-01-29T08:00:00Z', actual_end: '2026-02-03T16:30:00Z', description: 'PJ-2026-001 황삭', created_at: '2026-01-28T00:00:00Z', updated_at: '2026-02-03T00:00:00Z' },
];

export const mockWorkLogs: WorkLog[] = [
  { id: 'wl1', work_order_id: 'wo1', worker_id: 'p5', machine_id: 'm2', start_time: '2026-02-04T08:30:00Z', end_time: '2026-02-04T17:00:00Z', duration: 510, description: 'CORE 측 MCT 가공 진행', created_at: '2026-02-04T17:00:00Z' },
  { id: 'wl2', work_order_id: 'wo1', worker_id: 'p5', machine_id: 'm2', start_time: '2026-02-05T08:00:00Z', end_time: '2026-02-05T17:00:00Z', duration: 540, description: 'CAVITY 측 MCT 가공 진행', created_at: '2026-02-05T17:00:00Z' },
  { id: 'wl3', work_order_id: 'wo4', worker_id: 'p7', start_time: '2026-02-05T09:00:00Z', end_time: '2026-02-05T18:00:00Z', duration: 540, description: '배터리 케이스 3D 모델링 - 코어 부 설계', created_at: '2026-02-05T18:00:00Z' },
  { id: 'wl4', work_order_id: 'wo5', worker_id: 'p5', start_time: '2026-02-05T08:00:00Z', end_time: '2026-02-05T12:00:00Z', duration: 240, description: '범퍼 가니쉬 금형 코어/캐비티 조립', created_at: '2026-02-05T12:00:00Z' },
  { id: 'wl5', work_order_id: 'wo6', worker_id: 'p5', machine_id: 'm1', start_time: '2026-01-29T08:00:00Z', end_time: '2026-01-29T17:00:00Z', duration: 540, description: '커넥터 하우징 금형 CORE 황삭', created_at: '2026-01-29T17:00:00Z' },
];

export const mockMachines: Machine[] = [
  { id: 'm1', machine_code: 'MCT-001', name: 'MCT 1호기', type: 'MCT', manufacturer: '두산', model: 'DNM 650II', status: 'IDLE', location: 'A동 1라인', hourly_rate: 80000, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'm2', machine_code: 'MCT-002', name: 'MCT 2호기', type: 'MCT', manufacturer: '두산', model: 'DNM 750L', status: 'RUNNING', location: 'A동 1라인', hourly_rate: 90000, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'm3', machine_code: 'EDM-001', name: '방전기 1호기', type: 'EDM', manufacturer: '소딕', model: 'AG60L', status: 'IDLE', location: 'A동 2라인', hourly_rate: 70000, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'm4', machine_code: 'WIRE-001', name: '와이어 1호기', type: 'WIRE_EDM', manufacturer: '미쓰비시', model: 'MV1200R', status: 'IDLE', location: 'B동 1라인', hourly_rate: 75000, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'm5', machine_code: 'GRD-001', name: '연마기 1호기', type: 'GRINDING', manufacturer: '오카모토', model: 'PSG-63DX', status: 'IDLE', location: 'B동 2라인', hourly_rate: 50000, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

// --- Materials & Procurement Mock Data ---

export const mockSuppliers: Supplier[] = [
  { id: 'sup1', name: '(주)대한특수강', business_no: '111-22-33333', contact_person: '김철강', phone: '031-111-2222', email: 'steel@daehan.com', address: '경기도 시흥시 공단1대로 100', supplier_type: 'MATERIAL', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'sup2', name: '미스미코리아(주)', business_no: '222-33-44444', contact_person: '이부품', phone: '02-222-3333', email: 'order@misumi.kr', address: '서울특별시 금천구 가산디지털1로 100', supplier_type: 'MATERIAL', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'sup3', name: '(주)삼진열처리', business_no: '333-44-55555', contact_person: '박열처', phone: '031-333-4444', email: 'ht@samjin.com', address: '경기도 안산시 단원구 산단로 200', supplier_type: 'OUTSOURCE', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'sup4', name: '유도(주)', business_no: '444-55-66666', contact_person: '최핫러너', phone: '031-444-5555', email: 'sales@yudo.com', address: '경기도 화성시 동탄기흥로 500', supplier_type: 'MATERIAL', created_at: '2024-03-01T00:00:00Z', updated_at: '2024-03-01T00:00:00Z' },
];

export const mockMaterials: Material[] = [
  // STEEL — 이중 단위 (구매: KG, 재고: EA 태그)
  { id: 'mat1', material_code: 'STL-NAK80-001', name: 'NAK80 강재', category: 'STEEL', specification: '400x300x350mm', unit: 'KG', inventory_unit: 'EA', unit_price: 2500000, safety_stock: 2, lead_time: 7, supplier_id: 'sup1', steel_grade: 'NAK80', density: 7.85, dimension_w: 400, dimension_l: 300, dimension_h: 350, weight: 329.7, price_per_kg: 7584, weight_method: 'MEASURED', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'mat2', material_code: 'STL-SKD11-001', name: 'SKD11 강재', category: 'STEEL', specification: '500x400x300mm', unit: 'KG', inventory_unit: 'EA', unit_price: 3200000, safety_stock: 1, lead_time: 10, supplier_id: 'sup1', steel_grade: 'SKD11', density: 7.70, dimension_w: 500, dimension_l: 400, dimension_h: 300, weight: 462.0, price_per_kg: 6926, weight_method: 'MEASURED', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'mat3', material_code: 'STL-SKD61-001', name: 'SKD61 강재', category: 'STEEL', specification: '600x500x350mm', unit: 'KG', inventory_unit: 'EA', unit_price: 4100000, safety_stock: 1, lead_time: 10, supplier_id: 'sup1', steel_grade: 'SKD61', density: 7.76, dimension_w: 600, dimension_l: 500, dimension_h: 350, weight: 814.8, price_per_kg: 5032, weight_method: 'CALCULATED', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  // STANDARD_PART
  { id: 'mat4', material_code: 'STP-EP-001', name: '이젝터 핀 세트', category: 'STANDARD_PART', specification: 'Φ3~Φ10 혼합 50pcs', unit: 'SET', unit_price: 350000, safety_stock: 5, lead_time: 3, supplier_id: 'sup2', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'mat5', material_code: 'STP-GP-001', name: '가이드 핀/부시 세트', category: 'STANDARD_PART', specification: 'Φ20x100 4set', unit: 'SET', unit_price: 280000, safety_stock: 3, lead_time: 3, supplier_id: 'sup2', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'mat6', material_code: 'STP-SPR-001', name: '리턴 스프링', category: 'STANDARD_PART', specification: 'Φ25x50 10pcs', unit: 'SET', unit_price: 120000, safety_stock: 10, lead_time: 2, supplier_id: 'sup2', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  // PURCHASED
  { id: 'mat7', material_code: 'PUR-HR-001', name: '핫러너 시스템', category: 'PURCHASED', specification: '2-drop valve gate', unit: 'SET', unit_price: 8500000, safety_stock: 0, lead_time: 21, supplier_id: 'sup4', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  // CONSUMABLE
  { id: 'mat8', material_code: 'CON-CUT-001', name: '와이어 (황동)', category: 'CONSUMABLE', specification: 'Φ0.25mm 10kg', unit: 'ROLL', unit_price: 180000, safety_stock: 5, lead_time: 2, supplier_id: 'sup2', min_order_qty: 5, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  // TOOL — 공구 신규
  { id: 'mat9', material_code: 'TL-EM-010', name: '초경 엔드밀 Φ10', category: 'TOOL', specification: 'Φ10 × 75L 4날', unit: 'EA', unit_price: 45000, safety_stock: 10, lead_time: 3, supplier_id: 'sup2', tool_type: 'END_MILL', tool_diameter: 10, tool_length: 75, max_usage_count: 500, regrind_max: 3, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'mat10', material_code: 'TL-DR-085', name: 'HSS 드릴 Φ8.5', category: 'TOOL', specification: 'Φ8.5 × 117L', unit: 'EA', unit_price: 12000, safety_stock: 20, lead_time: 2, supplier_id: 'sup2', tool_type: 'DRILL', tool_diameter: 8.5, tool_length: 117, max_usage_count: 200, regrind_max: 5, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'mat11', material_code: 'TL-EDM-CU-01', name: '동 전극 (커넥터 리브)', category: 'TOOL', specification: '가공용 동 전극', unit: 'EA', unit_price: 85000, safety_stock: 0, lead_time: 5, supplier_id: 'sup1', tool_type: 'ELECTRODE', max_usage_count: 50, regrind_max: 0, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'mat12', material_code: 'TL-INS-CNMG', name: 'CNMG 인서트 (선반용)', category: 'TOOL', specification: 'CNMG120408 VP15TF', unit: 'EA', unit_price: 8500, safety_stock: 30, lead_time: 3, supplier_id: 'sup2', tool_type: 'INSERT', max_usage_count: 100, regrind_max: 0, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  // CONSUMABLE — 소모품 신규
  { id: 'mat13', material_code: 'CON-OIL-001', name: '수용성 절삭유', category: 'CONSUMABLE', specification: '20L 드럼', unit: 'L', unit_price: 5500, safety_stock: 40, lead_time: 2, supplier_id: 'sup2', min_order_qty: 20, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'mat14', material_code: 'CON-FIL-001', name: '오일미스트 필터', category: 'CONSUMABLE', specification: '300×300×50mm HEPA', unit: 'EA', unit_price: 35000, safety_stock: 5, lead_time: 5, supplier_id: 'sup2', min_order_qty: 5, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  // STEEL — AL6061 알루미늄 (v2: 치수 없이 강종 마스터만 등록)
  { id: 'mat15', material_code: 'STL-AL6061', name: 'AL6061 알루미늄', category: 'STEEL', specification: '알루미늄 합금 6061', unit: 'KG', inventory_unit: 'EA', safety_stock: 5, lead_time: 5, supplier_id: 'sup1', steel_grade: 'AL6061', density: 2.71, price_per_kg: 12000, weight_method: 'MEASURED', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

export const mockStocks: Stock[] = [
  { id: 'stk1', material_id: 'mat1', location_code: 'A-1-01', quantity: 3, avg_unit_price: 2500000, updated_at: '2026-01-28T00:00:00Z' },
  { id: 'stk2', material_id: 'mat2', location_code: 'A-1-02', quantity: 1, avg_unit_price: 3200000, updated_at: '2026-01-15T00:00:00Z' },
  { id: 'stk3', material_id: 'mat3', location_code: 'A-1-03', quantity: 0, avg_unit_price: 4100000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'stk4', material_id: 'mat4', location_code: 'B-2-01', quantity: 8, avg_unit_price: 350000, updated_at: '2026-02-01T00:00:00Z' },
  { id: 'stk5', material_id: 'mat5', location_code: 'B-2-02', quantity: 4, avg_unit_price: 280000, updated_at: '2026-02-01T00:00:00Z' },
  { id: 'stk6', material_id: 'mat6', location_code: 'B-2-03', quantity: 12, avg_unit_price: 120000, updated_at: '2026-02-01T00:00:00Z' },
  { id: 'stk7', material_id: 'mat7', location_code: 'C-1-01', quantity: 0, avg_unit_price: 8500000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'stk8', material_id: 'mat8', location_code: 'B-3-01', quantity: 3, avg_unit_price: 180000, updated_at: '2026-02-01T00:00:00Z' },
  { id: 'stk9', material_id: 'mat9', location_code: 'D-1-01', quantity: 15, avg_unit_price: 45000, updated_at: '2026-02-01T00:00:00Z' },
  { id: 'stk10', material_id: 'mat10', location_code: 'D-1-02', quantity: 25, avg_unit_price: 12000, updated_at: '2026-02-01T00:00:00Z' },
  { id: 'stk11', material_id: 'mat11', location_code: 'D-2-01', quantity: 2, avg_unit_price: 85000, updated_at: '2026-02-01T00:00:00Z' },
  { id: 'stk12', material_id: 'mat12', location_code: 'D-1-03', quantity: 40, avg_unit_price: 8500, updated_at: '2026-02-01T00:00:00Z' },
  { id: 'stk13', material_id: 'mat13', location_code: 'E-1-01', quantity: 60, avg_unit_price: 5500, updated_at: '2026-02-01T00:00:00Z' },
  { id: 'stk14', material_id: 'mat14', location_code: 'E-1-02', quantity: 8, avg_unit_price: 35000, updated_at: '2026-02-01T00:00:00Z' },
  { id: 'stk15', material_id: 'mat15', location_code: 'A-3-01', quantity: 5, avg_unit_price: 0, updated_at: '2026-02-10T00:00:00Z' },
];

export const mockStockMovements: StockMovement[] = [
  { id: 'sm1', material_id: 'mat1', type: 'IN', quantity: 2, unit_price: 2500000, purchase_order_id: 'po1', created_by: 'p4', created_at: '2026-01-20T00:00:00Z' },
  { id: 'sm2', material_id: 'mat1', type: 'OUT', quantity: 1, unit_price: 2500000, project_id: 'pj1', reason: 'PJ-2026-001 자재 출고', created_by: 'p4', created_at: '2026-01-25T00:00:00Z' },
  { id: 'sm3', material_id: 'mat4', type: 'IN', quantity: 10, unit_price: 350000, purchase_order_id: 'po2', created_by: 'p4', created_at: '2026-01-28T00:00:00Z' },
  { id: 'sm4', material_id: 'mat4', type: 'OUT', quantity: 2, unit_price: 350000, project_id: 'pj1', reason: 'PJ-2026-001 이젝터 핀 출고', created_by: 'p4', created_at: '2026-02-01T00:00:00Z' },
  { id: 'sm5', material_id: 'mat8', type: 'IN', quantity: 5, unit_price: 180000, purchase_order_id: 'po2', created_by: 'p4', created_at: '2026-01-28T00:00:00Z' },
  { id: 'sm6', material_id: 'mat8', type: 'OUT', quantity: 2, unit_price: 180000, project_id: 'pj1', reason: '와이어 가공용 출고', created_by: 'p4', created_at: '2026-02-03T00:00:00Z' },
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  { id: 'po1', po_no: 'PO-2026-001', supplier_id: 'sup1', status: 'RECEIVED', order_date: '2026-01-15', due_date: '2026-01-22', total_amount: 5000000, items: [{ id: 'poi1', material_id: 'mat1', quantity: 2, unit_price: 2500000, received_quantity: 2 }], created_by: 'p4', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-22T00:00:00Z' },
  { id: 'po2', po_no: 'PO-2026-002', supplier_id: 'sup2', status: 'RECEIVED', order_date: '2026-01-20', due_date: '2026-01-25', total_amount: 4400000, items: [{ id: 'poi2', material_id: 'mat4', quantity: 10, unit_price: 350000, received_quantity: 10 }, { id: 'poi3', material_id: 'mat8', quantity: 5, unit_price: 180000, received_quantity: 5 }], created_by: 'p4', created_at: '2026-01-20T00:00:00Z', updated_at: '2026-01-28T00:00:00Z' },
  { id: 'po3', po_no: 'PO-2026-003', supplier_id: 'sup4', status: 'ORDERED', order_date: '2026-02-01', due_date: '2026-02-22', total_amount: 8500000, items: [{ id: 'poi4', material_id: 'mat7', quantity: 1, unit_price: 8500000 }], created_by: 'p4', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
  { id: 'po4', po_no: 'PO-2026-004', supplier_id: 'sup1', status: 'DRAFT', order_date: '2026-02-08', due_date: '2026-02-18', total_amount: 7300000, items: [{ id: 'poi5', material_id: 'mat2', quantity: 1, unit_price: 3200000 }, { id: 'poi6', material_id: 'mat3', quantity: 1, unit_price: 4100000 }], created_by: 'p4', created_at: '2026-02-08T00:00:00Z', updated_at: '2026-02-08T00:00:00Z' },
  { id: 'po5', po_no: 'PO-2026-005', supplier_id: 'sup1', status: 'ORDERED', order_date: '2026-02-10', due_date: '2026-02-20', total_amount: 5658480, items: [
    { id: 'poi7', material_id: 'mat15', quantity: 3, unit_price: 1365840, dimension_w: 400, dimension_l: 300, dimension_h: 350, piece_weight: 113.82, total_weight: 341.46 },
    { id: 'poi8', material_id: 'mat15', quantity: 2, unit_price: 487800, dimension_w: 500, dimension_l: 200, dimension_h: 150, piece_weight: 40.65, total_weight: 81.30 },
    { id: 'poi9', material_id: 'mat15', quantity: 1, unit_price: 585360, dimension_w: 300, dimension_l: 300, dimension_h: 200, piece_weight: 48.78, total_weight: 48.78 },
  ], created_by: 'p4', created_at: '2026-02-10T00:00:00Z', updated_at: '2026-02-10T00:00:00Z' },
];

// --- Quality Mock Data ---

export const mockInspections: QualityInspection[] = [
  { id: 'qi1', inspection_no: 'QI-2026-001', project_id: 'pj1', type: 'INCOMING', status: 'PASS', inspector_id: 'p4', inspection_date: '2026-01-25', notes: 'NAK80 강재 입고 검사 - 규격 적합', created_at: '2026-01-25T00:00:00Z', updated_at: '2026-01-25T00:00:00Z' },
  { id: 'qi2', inspection_no: 'QI-2026-002', project_id: 'pj1', type: 'IN_PROCESS', status: 'PASS', inspector_id: 'p4', inspection_date: '2026-02-03', notes: '황삭 후 치수 검사 - 공차 이내', results: { dimension_check: 'OK', surface_check: 'OK' }, created_at: '2026-02-03T00:00:00Z', updated_at: '2026-02-03T00:00:00Z' },
  { id: 'qi3', inspection_no: 'QI-2026-003', project_id: 'pj4', type: 'IN_PROCESS', status: 'IN_PROGRESS', inspector_id: 'p4', inspection_date: '2026-02-06', notes: '조립 중간 검사 진행중', created_at: '2026-02-06T00:00:00Z', updated_at: '2026-02-06T00:00:00Z' },
  { id: 'qi4', inspection_no: 'QI-2026-004', project_id: 'pj1', type: 'IN_PROCESS', status: 'PLANNED', inspector_id: 'p4', notes: 'MCT 가공 후 치수 검사 예정', created_at: '2026-02-05T00:00:00Z', updated_at: '2026-02-05T00:00:00Z' },
];

export const mockTryouts: Tryout[] = [
  { id: 'to1', project_id: 'pj6', tryout_no: 1, date: '2025-12-10', machine: '사출기 350T', conditions: { temperature: '220°C', pressure: '80MPa', cycle_time: '45s' }, results: '성형 양호, 일부 웰드라인 발생', issues: '게이트 부근 웰드라인', corrections: '게이트 위치 조정 필요', status: 'COMPLETED', created_at: '2025-12-10T00:00:00Z', updated_at: '2025-12-10T00:00:00Z' },
  { id: 'to2', project_id: 'pj6', tryout_no: 2, date: '2025-12-15', machine: '사출기 350T', conditions: { temperature: '225°C', pressure: '85MPa', cycle_time: '43s' }, results: '웰드라인 개선, 치수 적합', issues: '', corrections: '', status: 'APPROVED', created_at: '2025-12-15T00:00:00Z', updated_at: '2025-12-16T00:00:00Z' },
];

export const mockDefects: Defect[] = [
  { id: 'df1', project_id: 'pj6', defect_type: 'MACHINING', title: '코어 핀 가공 치수 초과', description: '코어 핀 3번 직경이 공차 초과 (+0.05mm)', cause: 'MCT 공구 마모', countermeasure: '공구 교체 후 재가공', reported_by: 'p5', reported_date: '2025-11-20', status: 'CLOSED', created_at: '2025-11-20T00:00:00Z', updated_at: '2025-11-22T00:00:00Z' },
  { id: 'df2', project_id: 'pj1', defect_type: 'MACHINING', title: 'CAVITY 방전면 거칠기 불량', description: 'CAVITY 내부 방전면 Ra 1.6 이상 (목표 Ra 0.8)', cause: '조사중', reported_by: 'p5', reported_date: '2026-02-05', status: 'INVESTIGATING', created_at: '2026-02-05T00:00:00Z', updated_at: '2026-02-05T00:00:00Z' },
];

export const mockPayments: Payment[] = [
  // o1: 커넥터 하우징 - 85,000,000원 - 선금 30% 입금 완료
  { id: 'pay1', order_id: 'o1', payment_type: 'ADVANCE', amount: 25500000, payment_date: '2026-01-10', payment_method: 'BANK_TRANSFER', status: 'CONFIRMED', confirmed_by: 'p2', notes: '선금 30% 입금', created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' },
  // o2: 배터리 케이스 - 120,000,000원 - 선금 40% + 중도금 30% 입금 완료
  { id: 'pay2', order_id: 'o2', payment_type: 'ADVANCE', amount: 48000000, payment_date: '2026-01-15', payment_method: 'BANK_TRANSFER', status: 'CONFIRMED', confirmed_by: 'p2', notes: '선금 40% 입금', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
  { id: 'pay3', order_id: 'o2', payment_type: 'INTERIM', amount: 36000000, payment_date: '2026-02-01', payment_method: 'NOTE', status: 'CONFIRMED', confirmed_by: 'p2', notes: '중도금 30% - 3개월 어음', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
  // o4: 범퍼 가니쉬 - 95,000,000원 - 선금 50% 입금 완료
  { id: 'pay4', order_id: 'o4', payment_type: 'ADVANCE', amount: 47500000, payment_date: '2026-01-28', payment_method: 'BANK_TRANSFER', status: 'CONFIRMED', confirmed_by: 'p2', notes: '선금 50% 입금', created_at: '2026-01-28T00:00:00Z', updated_at: '2026-01-28T00:00:00Z' },
  // o5: 태양광 프레임 - 150,000,000원 - 선금 대기중
  { id: 'pay5', order_id: 'o5', payment_type: 'ADVANCE', amount: 45000000, payment_date: '2026-02-10', payment_method: 'BANK_TRANSFER', status: 'PENDING', notes: '선금 30% 입금 예정', created_at: '2026-02-08T00:00:00Z', updated_at: '2026-02-08T00:00:00Z' },
  // o6: 브레이크 캘리퍼 - 78,000,000원 - 전액 입금 완료
  { id: 'pay6', order_id: 'o6', payment_type: 'ADVANCE', amount: 23400000, payment_date: '2025-09-20', payment_method: 'BANK_TRANSFER', status: 'CONFIRMED', confirmed_by: 'p2', notes: '선금 30%', created_at: '2025-09-20T00:00:00Z', updated_at: '2025-09-20T00:00:00Z' },
  { id: 'pay7', order_id: 'o6', payment_type: 'INTERIM', amount: 23400000, payment_date: '2025-11-01', payment_method: 'BANK_TRANSFER', status: 'CONFIRMED', confirmed_by: 'p2', notes: '중도금 30%', created_at: '2025-11-01T00:00:00Z', updated_at: '2025-11-01T00:00:00Z' },
  { id: 'pay8', order_id: 'o6', payment_type: 'BALANCE', amount: 31200000, payment_date: '2025-12-20', payment_method: 'BANK_TRANSFER', status: 'CONFIRMED', confirmed_by: 'p2', notes: '잔금 40%', created_at: '2025-12-20T00:00:00Z', updated_at: '2025-12-20T00:00:00Z' },
];

// 공급처별 단가 및 단가 변경 이력
export const mockMaterialPrices: MaterialPrice[] = [
  // NAK80 강재 (mat1) - 대한특수강(sup1) 단가 이력
  { id: 'mp1', material_id: 'mat1', supplier_id: 'sup1', unit_price: 2200000, effective_date: '2024-01-01', notes: '신규 계약', created_at: '2024-01-01T00:00:00Z' },
  { id: 'mp2', material_id: 'mat1', supplier_id: 'sup1', unit_price: 2350000, prev_price: 2200000, effective_date: '2024-07-01', notes: '원자재 가격 인상 반영', created_at: '2024-07-01T00:00:00Z' },
  { id: 'mp3', material_id: 'mat1', supplier_id: 'sup1', unit_price: 2500000, prev_price: 2350000, effective_date: '2025-01-01', notes: '연간 단가 협상', created_at: '2025-01-01T00:00:00Z' },
  // NAK80 강재 (mat1) - 다른 공급처 비교용 (가상)
  { id: 'mp4', material_id: 'mat1', supplier_id: 'sup4', unit_price: 2650000, effective_date: '2025-03-01', notes: '스팟 견적', created_at: '2025-03-01T00:00:00Z' },

  // SKD11 강재 (mat2) - 대한특수강(sup1) 단가 이력
  { id: 'mp5', material_id: 'mat2', supplier_id: 'sup1', unit_price: 2800000, effective_date: '2024-01-01', notes: '신규 계약', created_at: '2024-01-01T00:00:00Z' },
  { id: 'mp6', material_id: 'mat2', supplier_id: 'sup1', unit_price: 3000000, prev_price: 2800000, effective_date: '2024-07-01', notes: '원자재 가격 인상', created_at: '2024-07-01T00:00:00Z' },
  { id: 'mp7', material_id: 'mat2', supplier_id: 'sup1', unit_price: 3200000, prev_price: 3000000, effective_date: '2025-01-01', notes: '연간 단가 조정', created_at: '2025-01-01T00:00:00Z' },

  // SKD61 강재 (mat3) - 대한특수강(sup1) 단가 이력
  { id: 'mp8', material_id: 'mat3', supplier_id: 'sup1', unit_price: 3800000, effective_date: '2024-01-01', notes: '신규 계약', created_at: '2024-01-01T00:00:00Z' },
  { id: 'mp9', material_id: 'mat3', supplier_id: 'sup1', unit_price: 4100000, prev_price: 3800000, effective_date: '2025-01-01', notes: '연간 단가 조정', created_at: '2025-01-01T00:00:00Z' },

  // 이젝터 핀 (mat4) - 미스미(sup2) 단가 이력
  { id: 'mp10', material_id: 'mat4', supplier_id: 'sup2', unit_price: 320000, effective_date: '2024-01-01', notes: '계약 단가', created_at: '2024-01-01T00:00:00Z' },
  { id: 'mp11', material_id: 'mat4', supplier_id: 'sup2', unit_price: 350000, prev_price: 320000, effective_date: '2025-04-01', notes: '환율 변동 반영', created_at: '2025-04-01T00:00:00Z' },
  // 이젝터 핀 (mat4) - 유도(sup4) 대체 공급
  { id: 'mp12', material_id: 'mat4', supplier_id: 'sup4', unit_price: 380000, effective_date: '2025-06-01', notes: '대체 공급 견적', created_at: '2025-06-01T00:00:00Z' },

  // 가이드 핀/부시 (mat5) - 미스미(sup2)
  { id: 'mp13', material_id: 'mat5', supplier_id: 'sup2', unit_price: 260000, effective_date: '2024-01-01', notes: '계약 단가', created_at: '2024-01-01T00:00:00Z' },
  { id: 'mp14', material_id: 'mat5', supplier_id: 'sup2', unit_price: 280000, prev_price: 260000, effective_date: '2025-04-01', notes: '환율 변동 반영', created_at: '2025-04-01T00:00:00Z' },

  // 리턴 스프링 (mat6) - 미스미(sup2)
  { id: 'mp15', material_id: 'mat6', supplier_id: 'sup2', unit_price: 110000, effective_date: '2024-01-01', notes: '계약 단가', created_at: '2024-01-01T00:00:00Z' },
  { id: 'mp16', material_id: 'mat6', supplier_id: 'sup2', unit_price: 120000, prev_price: 110000, effective_date: '2025-06-01', notes: '단가 조정', created_at: '2025-06-01T00:00:00Z' },

  // 핫러너 시스템 (mat7) - 유도(sup4)
  { id: 'mp17', material_id: 'mat7', supplier_id: 'sup4', unit_price: 7800000, effective_date: '2024-01-01', notes: '신규 계약', created_at: '2024-01-01T00:00:00Z' },
  { id: 'mp18', material_id: 'mat7', supplier_id: 'sup4', unit_price: 8200000, prev_price: 7800000, effective_date: '2024-10-01', notes: '사양 업그레이드 반영', created_at: '2024-10-01T00:00:00Z' },
  { id: 'mp19', material_id: 'mat7', supplier_id: 'sup4', unit_price: 8500000, prev_price: 8200000, effective_date: '2025-03-01', notes: '연간 단가 조정', created_at: '2025-03-01T00:00:00Z' },

  // 와이어 황동 (mat8) - 미스미(sup2)
  { id: 'mp20', material_id: 'mat8', supplier_id: 'sup2', unit_price: 160000, effective_date: '2024-01-01', notes: '계약 단가', created_at: '2024-01-01T00:00:00Z' },
  { id: 'mp21', material_id: 'mat8', supplier_id: 'sup2', unit_price: 175000, prev_price: 160000, effective_date: '2024-09-01', notes: '구리 시세 인상', created_at: '2024-09-01T00:00:00Z' },
  { id: 'mp22', material_id: 'mat8', supplier_id: 'sup2', unit_price: 180000, prev_price: 175000, effective_date: '2025-02-01', notes: '분기 조정', created_at: '2025-02-01T00:00:00Z' },
];

export const mockPurchaseRequests: PurchaseRequest[] = [
  { id: 'pr1', pr_no: 'PR-2026-001', material_id: 'mat1', quantity: 3, required_date: '2026-02-20', reason: '커넥터 하우징 금형 제작용 NAK80 필요', requested_by: 'p4', status: 'APPROVED', approved_by: 'p1', approved_at: '2026-01-20T10:00:00Z', created_at: '2026-01-18T09:00:00Z', updated_at: '2026-01-20T10:00:00Z' },
  { id: 'pr2', pr_no: 'PR-2026-002', material_id: 'mat4', quantity: 50, required_date: '2026-02-15', reason: '이젝터 핀 재고 부족 보충', requested_by: 'p5', status: 'CONVERTED', approved_by: 'p1', approved_at: '2026-01-22T14:00:00Z', po_id: 'po1', created_at: '2026-01-21T11:00:00Z', updated_at: '2026-01-23T09:00:00Z' },
  { id: 'pr3', pr_no: 'PR-2026-003', material_id: 'mat7', quantity: 1, required_date: '2026-03-10', reason: '배터리 케이스 금형 핫러너 시스템 필요', requested_by: 'p4', status: 'PENDING', created_at: '2026-02-05T08:30:00Z', updated_at: '2026-02-05T08:30:00Z' },
  { id: 'pr4', pr_no: 'PR-2026-004', material_id: 'mat2', quantity: 2, required_date: '2026-03-01', reason: 'SKD11 안전재고 미달', requested_by: 'p5', status: 'PENDING', created_at: '2026-02-06T10:00:00Z', updated_at: '2026-02-06T10:00:00Z' },
  { id: 'pr5', pr_no: 'PR-2026-005', material_id: 'mat8', quantity: 20, required_date: '2026-02-28', reason: '와이어 가공 소모품 보충', requested_by: 'p6', status: 'REJECTED', reject_reason: '현재 재고 충분, 다음 달 재검토', approved_by: 'p1', approved_at: '2026-02-08T11:00:00Z', created_at: '2026-02-07T09:00:00Z', updated_at: '2026-02-08T11:00:00Z' },
  { id: 'pr6', pr_no: 'PR-2026-006', material_id: 'mat5', quantity: 30, required_date: '2026-03-15', reason: '가이드 핀/부시 정기 보충', requested_by: 'p4', status: 'DRAFT', created_at: '2026-02-09T08:00:00Z', updated_at: '2026-02-09T08:00:00Z' },
];

// Steel Tags — 강재 개별 태그 추적
export const initialSteelTags: SteelTag[] = [
  { id: 'stag1', material_id: 'mat1', tag_no: 'NAK80-2601-001', weight: 328.5, status: 'IN_USE', project_id: 'pj1', location: 'MCT-1', received_at: '2026-01-15', issued_at: '2026-01-20', dimension_w: 400, dimension_l: 300, dimension_h: 350, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-20T00:00:00Z' },
  { id: 'stag2', material_id: 'mat1', tag_no: 'NAK80-2601-002', weight: 330.1, status: 'AVAILABLE', location: 'A-1-3', received_at: '2026-01-15', dimension_w: 400, dimension_l: 300, dimension_h: 350, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
  { id: 'stag3', material_id: 'mat2', tag_no: 'SKD11-2601-001', weight: 460.8, status: 'USED', project_id: 'pj2', received_at: '2026-01-10', issued_at: '2026-01-12', dimension_w: 500, dimension_l: 400, dimension_h: 300, created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-18T00:00:00Z' },
  { id: 'stag4', material_id: 'mat2', tag_no: 'SKD11-2602-001', weight: 463.2, status: 'AVAILABLE', location: 'A-2-1', received_at: '2026-02-03', dimension_w: 500, dimension_l: 400, dimension_h: 300, created_at: '2026-02-03T00:00:00Z', updated_at: '2026-02-03T00:00:00Z' },
  { id: 'stag5', material_id: 'mat3', tag_no: 'SKD61-2601-001', weight: 813.5, status: 'ALLOCATED', project_id: 'pj3', location: 'B-1-2', received_at: '2026-01-20', dimension_w: 600, dimension_l: 500, dimension_h: 350, created_at: '2026-01-20T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
  // AL6061 태그 (PO-2026-005 입고)
  { id: 'stag6', material_id: 'mat15', tag_no: 'AL6061-2602-001', weight: 113.5, status: 'AVAILABLE' as const, purchase_order_id: 'po5', po_item_id: 'poi7', location: 'A-3-1', dimension_w: 400, dimension_l: 300, dimension_h: 350, received_at: '2026-02-12', created_at: '2026-02-12T00:00:00Z', updated_at: '2026-02-12T00:00:00Z' },
  { id: 'stag7', material_id: 'mat15', tag_no: 'AL6061-2602-002', weight: 114.1, status: 'AVAILABLE' as const, purchase_order_id: 'po5', po_item_id: 'poi7', location: 'A-3-2', dimension_w: 400, dimension_l: 300, dimension_h: 350, received_at: '2026-02-12', created_at: '2026-02-12T00:00:00Z', updated_at: '2026-02-12T00:00:00Z' },
  { id: 'stag8', material_id: 'mat15', tag_no: 'AL6061-2602-003', weight: 40.3, status: 'ALLOCATED' as const, project_id: 'pj3', purchase_order_id: 'po5', po_item_id: 'poi8', location: 'B-2-1', dimension_w: 500, dimension_l: 200, dimension_h: 150, received_at: '2026-02-12', created_at: '2026-02-12T00:00:00Z', updated_at: '2026-02-12T00:00:00Z' },
  { id: 'stag9', material_id: 'mat15', tag_no: 'AL6061-2602-004', weight: 41.0, status: 'AVAILABLE' as const, purchase_order_id: 'po5', po_item_id: 'poi8', location: 'B-2-2', dimension_w: 500, dimension_l: 200, dimension_h: 150, received_at: '2026-02-12', created_at: '2026-02-12T00:00:00Z', updated_at: '2026-02-12T00:00:00Z' },
  { id: 'stag10', material_id: 'mat15', tag_no: 'AL6061-2602-005', weight: 48.5, status: 'AVAILABLE' as const, purchase_order_id: 'po5', po_item_id: 'poi9', location: 'B-2-3', dimension_w: 300, dimension_l: 300, dimension_h: 200, received_at: '2026-02-12', created_at: '2026-02-12T00:00:00Z', updated_at: '2026-02-12T00:00:00Z' },
];
