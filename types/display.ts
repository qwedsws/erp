// Display/presentation maps — separated from domain types
import type {
  ProjectStatus,
  OrderStatus,
  WorkOrderStatus,
  MoldType,
  Priority,
  ProcessCategory,
  MaterialCategory,
  PurchaseOrderStatus,
  InspectionType,
  InspectionStatus,
  TryoutStatus,
  DefectType,
  PaymentType,
  PaymentMethod,
  PaymentStatus,
  PurchaseRequestStatus,
  UserRole,
  ToolType,
  SteelWeightMethod,
  SteelTagStatus,
  GLAccountType,
  JournalEntryStatus,
  AROpenItemStatus,
  APOpenItemStatus,
  AccountingSourceType,
  AccountingEventStatus,
} from '@/domain/shared/entities';

export const PROJECT_STATUS_MAP: Record<ProjectStatus, { label: string; color: string }> = {
  CONFIRMED: { label: '수주확정', color: 'bg-gray-100 text-gray-800' },
  DESIGNING: { label: '설계중', color: 'bg-blue-100 text-blue-800' },
  DESIGN_COMPLETE: { label: '설계완료', color: 'bg-blue-100 text-blue-800' },
  MATERIAL_PREP: { label: '자재준비', color: 'bg-yellow-100 text-yellow-800' },
  MACHINING: { label: '가공중', color: 'bg-orange-100 text-orange-800' },
  ASSEMBLING: { label: '조립중', color: 'bg-orange-100 text-orange-800' },
  TRYOUT: { label: '트라이아웃', color: 'bg-purple-100 text-purple-800' },
  REWORK: { label: '수정보완', color: 'bg-red-100 text-red-800' },
  FINAL_INSPECTION: { label: '최종검사', color: 'bg-purple-100 text-purple-800' },
  READY_TO_SHIP: { label: '출하가능', color: 'bg-green-100 text-green-800' },
  SHIPPED: { label: '출하완료', color: 'bg-green-100 text-green-800' },
  DELIVERED: { label: '납품완료', color: 'bg-green-200 text-green-900' },
  AS_SERVICE: { label: 'A/S', color: 'bg-gray-100 text-gray-800' },
};

export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  CONFIRMED: { label: '확정', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: '진행중', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: '완료', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-800' },
};

export const WORK_ORDER_STATUS_MAP: Record<WorkOrderStatus, { label: string; color: string }> = {
  PLANNED: { label: '계획', color: 'bg-gray-100 text-gray-800' },
  READY: { label: '준비완료', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: '진행중', color: 'bg-yellow-100 text-yellow-800' },
  PAUSED: { label: '일시중지', color: 'bg-orange-100 text-orange-800' },
  COMPLETED: { label: '완료', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-800' },
};

export const MOLD_TYPE_MAP: Record<MoldType, string> = {
  INJECTION: '사출금형',
  PRESS: '프레스금형',
  DIE_CASTING: '다이캐스팅금형',
  BLOW: '블로우금형',
  OTHER: '기타',
};

export const PRIORITY_MAP: Record<Priority, { label: string; color: string }> = {
  HIGH: { label: '긴급', color: 'bg-red-100 text-red-800' },
  MEDIUM: { label: '보통', color: 'bg-yellow-100 text-yellow-800' },
  LOW: { label: '낮음', color: 'bg-gray-100 text-gray-800' },
};

export const PROCESS_CATEGORY_MAP: Record<ProcessCategory, string> = {
  DESIGN: '설계',
  PRODUCTION: '가공',
  ASSEMBLY: '조립',
  QUALITY: '품질',
};

export const SUPPLIER_TYPE_MAP: Record<string, string> = {
  MATERIAL: '자재',
  OUTSOURCE: '외주',
  BOTH: '자재/외주',
};

export const MATERIAL_CATEGORY_MAP: Record<MaterialCategory, string> = {
  STEEL: '강재',
  TOOL: '공구',
  CONSUMABLE: '소모품',
  STANDARD_PART: '표준부품',
  PURCHASED: '구매품',
};

export const PO_STATUS_MAP: Record<PurchaseOrderStatus, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-gray-100 text-gray-800' },
  ORDERED: { label: '발주완료', color: 'bg-blue-100 text-blue-800' },
  PARTIAL_RECEIVED: { label: '부분입고', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: '완료', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-800' },
};

export const INSPECTION_TYPE_MAP: Record<InspectionType, string> = {
  INCOMING: '입고검사',
  IN_PROCESS: '공정검사',
  FINAL: '최종검사',
  TRYOUT: '트라이아웃',
};

export const INSPECTION_STATUS_MAP: Record<InspectionStatus, { label: string; color: string }> = {
  PLANNED: { label: '예정', color: 'bg-gray-100 text-gray-800' },
  IN_PROGRESS: { label: '검사중', color: 'bg-blue-100 text-blue-800' },
  PASS: { label: '합격', color: 'bg-green-100 text-green-800' },
  FAIL: { label: '불합격', color: 'bg-red-100 text-red-800' },
  CONDITIONAL: { label: '조건부합격', color: 'bg-yellow-100 text-yellow-800' },
};

export const TRYOUT_STATUS_MAP: Record<TryoutStatus, { label: string; color: string }> = {
  PLANNED: { label: '예정', color: 'bg-gray-100 text-gray-800' },
  COMPLETED: { label: '완료', color: 'bg-blue-100 text-blue-800' },
  APPROVED: { label: '승인', color: 'bg-green-100 text-green-800' },
};

export const DEFECT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  OPEN: { label: '접수', color: 'bg-red-100 text-red-800' },
  INVESTIGATING: { label: '조사중', color: 'bg-yellow-100 text-yellow-800' },
  RESOLVED: { label: '해결', color: 'bg-blue-100 text-blue-800' },
  CLOSED: { label: '종결', color: 'bg-green-100 text-green-800' },
};

export const DEFECT_TYPE_MAP: Record<DefectType, string> = {
  DESIGN: '설계 불량',
  MACHINING: '가공 불량',
  ASSEMBLY: '조립 불량',
  MATERIAL: '자재 불량',
  OTHER: '기타',
};

export const PAYMENT_TYPE_MAP: Record<PaymentType, string> = {
  ADVANCE: '선금',
  INTERIM: '중도금',
  BALANCE: '잔금',
  OTHER: '기타',
};

export const PAYMENT_METHOD_MAP: Record<PaymentMethod, string> = {
  BANK_TRANSFER: '계좌이체',
  CHECK: '수표',
  CASH: '현금',
  NOTE: '어음',
};

export const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; color: string }> = {
  PENDING: { label: '대기', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: '확인', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-800' },
};

export const PR_STATUS_MAP: Record<PurchaseRequestStatus, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-gray-100 text-gray-800' },
  IN_PROGRESS: { label: '진행중', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: '승인', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: '반려', color: 'bg-red-100 text-red-800' },
  COMPLETED: { label: '완료', color: 'bg-blue-100 text-blue-800' },
};

export const USER_ROLE_MAP: Record<UserRole, string> = {
  ADMIN: '관리자',
  SALES: '영업',
  ENGINEER: '설계',
  PRODUCTION: '생산관리',
  WORKER: '현장작업',
  PURCHASE: '구매',
  QC: '품질관리',
  ACCOUNTING: '회계',
};

export const TOOL_TYPE_MAP: Record<ToolType, string> = {
  END_MILL: '엔드밀',
  DRILL: '드릴',
  TAP: '탭',
  INSERT: '인서트',
  ELECTRODE: '방전 전극',
  GRINDING_WHEEL: '연마석',
  REAMER: '리머',
  TOOL_OTHER: '기타 공구',
};

export const STEEL_WEIGHT_METHOD_MAP: Record<SteelWeightMethod, string> = {
  MEASURED: '실측 (입고 시 칭량)',
  CALCULATED: '계산 (이론 중량 적용)',
};

export const STEEL_TAG_STATUS_MAP: Record<SteelTagStatus, { label: string; color: string }> = {
  AVAILABLE: { label: '가용', color: 'bg-green-100 text-green-800' },
  ALLOCATED: { label: '할당됨', color: 'bg-blue-100 text-blue-800' },
  IN_USE: { label: '사용중', color: 'bg-yellow-100 text-yellow-800' },
  USED: { label: '사용완료', color: 'bg-gray-100 text-gray-800' },
  SCRAP: { label: '폐기', color: 'bg-red-100 text-red-800' },
};

export const JOURNAL_ENTRY_STATUS_MAP: Record<JournalEntryStatus, { label: string; color: string }> = {
  POSTED: { label: '전기', color: 'bg-green-100 text-green-800' },
  REVERSED: { label: '역분개', color: 'bg-red-100 text-red-800' },
};

export const AR_STATUS_MAP: Record<AROpenItemStatus, { label: string; color: string }> = {
  OPEN: { label: '미수', color: 'bg-red-100 text-red-800' },
  PARTIAL: { label: '부분수금', color: 'bg-yellow-100 text-yellow-800' },
  CLOSED: { label: '완료', color: 'bg-green-100 text-green-800' },
};

export const AP_STATUS_MAP: Record<APOpenItemStatus, { label: string; color: string }> = {
  OPEN: { label: '미지급', color: 'bg-red-100 text-red-800' },
  PARTIAL: { label: '부분지급', color: 'bg-yellow-100 text-yellow-800' },
  CLOSED: { label: '완료', color: 'bg-green-100 text-green-800' },
};

export const ACCOUNTING_SOURCE_TYPE_MAP: Record<AccountingSourceType, string> = {
  ORDER: '수주',
  PAYMENT: '입금',
  PURCHASE_ORDER: '발주',
  STOCK_MOVEMENT: '자재출고',
};

export const GL_ACCOUNT_TYPE_MAP: Record<GLAccountType, string> = {
  ASSET: '자산',
  LIABILITY: '부채',
  EQUITY: '자본',
  REVENUE: '수익',
  EXPENSE: '비용',
};

export const ACCOUNTING_EVENT_STATUS_MAP: Record<AccountingEventStatus, { label: string; color: string }> = {
  POSTED: { label: '전기', color: 'bg-green-100 text-green-800' },
  REVERSED: { label: '역분개', color: 'bg-red-100 text-red-800' },
  ERROR: { label: '오류', color: 'bg-red-200 text-red-900' },
};

export const STEEL_GRADE_DENSITY: Record<string, number> = {
  // 금형강 (철계)
  'NAK80': 7.85,
  'SKD11': 7.70,
  'SKD61': 7.76,
  'S45C': 7.85,
  'SUS304': 7.93,
  'SCM440': 7.85,
  'P20': 7.85,
  'STAVAX': 7.80,
  'HPM38': 7.81,
  'DC53': 7.87,
  // 알루미늄 합금
  'AL6061': 2.71,
  'AL7075': 2.81,
  'AL5052': 2.68,
  'AL2024': 2.78,
  // 동합금
  'C1100': 8.94,
  'C2801': 8.50,
  // 스테인리스
  'SUS420J2': 7.75,
  'SUS440C': 7.70,
};
