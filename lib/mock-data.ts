import type {
  Customer,
  Order,
  Project,
  ProcessStep,
  WorkOrder,
  WorkLog,
  Machine,
  Profile,
  QualityInspection,
  Tryout,
  Defect,
  Payment,
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

