import type { ICustomerRepository, IOrderRepository, IPaymentRepository } from '@/domain/sales/ports';
import type { IProjectRepository, IProcessStepRepository } from '@/domain/projects/ports';
import type { IWorkOrderRepository, IWorkLogRepository } from '@/domain/production/ports';
import type {
  IMaterialRepository,
  IStockRepository,
  IStockMovementRepository,
  IMaterialPriceRepository,
  ISteelTagRepository,
} from '@/domain/materials/ports';
import type {
  ISupplierRepository,
  IPurchaseOrderRepository,
  IPurchaseRequestRepository,
} from '@/domain/procurement/ports';
import type { IInspectionRepository, ITryoutRepository, IDefectRepository } from '@/domain/quality/ports';
import type { IProfileRepository } from '@/domain/admin/ports';
import type {
  IGLAccountRepository,
  IJournalEntryRepository,
  IAROpenItemRepository,
  IAPOpenItemRepository,
  IAccountingEventRepository,
} from '@/domain/accounting/ports';

// In-Memory implementations
import { InMemoryCustomerRepository, InMemoryOrderRepository, InMemoryPaymentRepository } from '../repositories/in-memory/sales';
import { InMemoryProjectRepository, InMemoryProcessStepRepository } from '../repositories/in-memory/projects';
import { InMemoryWorkOrderRepository, InMemoryWorkLogRepository } from '../repositories/in-memory/production';
import {
  InMemoryMaterialRepository,
  InMemoryStockRepository,
  InMemoryStockMovementRepository,
  InMemoryMaterialPriceRepository,
  InMemorySteelTagRepository,
} from '../repositories/in-memory/materials';
import {
  InMemorySupplierRepository,
  InMemoryPurchaseOrderRepository,
  InMemoryPurchaseRequestRepository,
} from '../repositories/in-memory/procurement';
import { InMemoryInspectionRepository, InMemoryTryoutRepository, InMemoryDefectRepository } from '../repositories/in-memory/quality';
import { InMemoryProfileRepository } from '../repositories/in-memory/admin';
import {
  InMemoryGLAccountRepository,
  InMemoryJournalEntryRepository,
  InMemoryAROpenItemRepository,
  InMemoryAPOpenItemRepository,
  InMemoryAccountingEventRepository,
} from '../repositories/in-memory/accounting';
import {
  SupabaseMaterialRepository,
  SupabaseStockRepository,
  SupabaseStockMovementRepository,
  SupabaseMaterialPriceRepository,
  SupabaseSteelTagRepository,
} from '../repositories/supabase/materials';
import {
  SupabaseSupplierRepository,
  SupabasePurchaseOrderRepository,
  SupabasePurchaseRequestRepository,
} from '../repositories/supabase/procurement';

const USE_SUPABASE_REPOS = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
);

// --- Singletons ---

// Sales
let customerRepo: ICustomerRepository | null = null;
let orderRepo: IOrderRepository | null = null;
let paymentRepo: IPaymentRepository | null = null;

// Projects
let projectRepo: IProjectRepository | null = null;
let processStepRepo: IProcessStepRepository | null = null;

// Production
let workOrderRepo: IWorkOrderRepository | null = null;
let workLogRepo: IWorkLogRepository | null = null;

// Materials
let materialRepo: IMaterialRepository | null = null;
let stockRepo: IStockRepository | null = null;
let stockMovementRepo: IStockMovementRepository | null = null;
let materialPriceRepo: IMaterialPriceRepository | null = null;
let steelTagRepo: ISteelTagRepository | null = null;

// Procurement
let supplierRepo: ISupplierRepository | null = null;
let purchaseOrderRepo: IPurchaseOrderRepository | null = null;
let purchaseRequestRepo: IPurchaseRequestRepository | null = null;

// Quality
let inspectionRepo: IInspectionRepository | null = null;
let tryoutRepo: ITryoutRepository | null = null;
let defectRepo: IDefectRepository | null = null;

// Admin
let profileRepo: IProfileRepository | null = null;

// Accounting
let glAccountRepo: IGLAccountRepository | null = null;
let journalEntryRepo: IJournalEntryRepository | null = null;
let arOpenItemRepo: IAROpenItemRepository | null = null;
let apOpenItemRepo: IAPOpenItemRepository | null = null;
let accountingEventRepo: IAccountingEventRepository | null = null;

// --- Sales ---

export function getCustomerRepository(): ICustomerRepository {
  if (!customerRepo) customerRepo = new InMemoryCustomerRepository();
  return customerRepo;
}

export function getOrderRepository(): IOrderRepository {
  if (!orderRepo) orderRepo = new InMemoryOrderRepository();
  return orderRepo;
}

export function getPaymentRepository(): IPaymentRepository {
  if (!paymentRepo) paymentRepo = new InMemoryPaymentRepository();
  return paymentRepo;
}

// --- Projects ---

export function getProjectRepository(): IProjectRepository {
  if (!projectRepo) projectRepo = new InMemoryProjectRepository();
  return projectRepo;
}

export function getProcessStepRepository(): IProcessStepRepository {
  if (!processStepRepo) processStepRepo = new InMemoryProcessStepRepository();
  return processStepRepo;
}

// --- Production ---

export function getWorkOrderRepository(): IWorkOrderRepository {
  if (!workOrderRepo) workOrderRepo = new InMemoryWorkOrderRepository();
  return workOrderRepo;
}

export function getWorkLogRepository(): IWorkLogRepository {
  if (!workLogRepo) workLogRepo = new InMemoryWorkLogRepository();
  return workLogRepo;
}

// --- Materials ---

export function getMaterialRepository(): IMaterialRepository {
  if (!materialRepo) {
    materialRepo = USE_SUPABASE_REPOS
      ? new SupabaseMaterialRepository()
      : new InMemoryMaterialRepository();
  }
  return materialRepo;
}

export function getStockRepository(): IStockRepository {
  if (!stockRepo) {
    stockRepo = USE_SUPABASE_REPOS
      ? new SupabaseStockRepository()
      : new InMemoryStockRepository();
  }
  return stockRepo;
}

export function getStockMovementRepository(): IStockMovementRepository {
  if (!stockMovementRepo) {
    stockMovementRepo = USE_SUPABASE_REPOS
      ? new SupabaseStockMovementRepository()
      : new InMemoryStockMovementRepository();
  }
  return stockMovementRepo;
}

export function getMaterialPriceRepository(): IMaterialPriceRepository {
  if (!materialPriceRepo) {
    materialPriceRepo = USE_SUPABASE_REPOS
      ? new SupabaseMaterialPriceRepository()
      : new InMemoryMaterialPriceRepository();
  }
  return materialPriceRepo;
}

export function getSteelTagRepository(): ISteelTagRepository {
  if (!steelTagRepo) {
    steelTagRepo = USE_SUPABASE_REPOS
      ? new SupabaseSteelTagRepository()
      : new InMemorySteelTagRepository();
  }
  return steelTagRepo;
}

// --- Procurement ---

export function getSupplierRepository(): ISupplierRepository {
  if (!supplierRepo) {
    supplierRepo = USE_SUPABASE_REPOS
      ? new SupabaseSupplierRepository()
      : new InMemorySupplierRepository();
  }
  return supplierRepo;
}

export function getPurchaseOrderRepository(): IPurchaseOrderRepository {
  if (!purchaseOrderRepo) {
    purchaseOrderRepo = USE_SUPABASE_REPOS
      ? new SupabasePurchaseOrderRepository()
      : new InMemoryPurchaseOrderRepository();
  }
  return purchaseOrderRepo;
}

export function getPurchaseRequestRepository(): IPurchaseRequestRepository {
  if (!purchaseRequestRepo) {
    purchaseRequestRepo = USE_SUPABASE_REPOS
      ? new SupabasePurchaseRequestRepository()
      : new InMemoryPurchaseRequestRepository();
  }
  return purchaseRequestRepo;
}

// --- Quality ---

export function getInspectionRepository(): IInspectionRepository {
  if (!inspectionRepo) inspectionRepo = new InMemoryInspectionRepository();
  return inspectionRepo;
}

export function getTryoutRepository(): ITryoutRepository {
  if (!tryoutRepo) tryoutRepo = new InMemoryTryoutRepository();
  return tryoutRepo;
}

export function getDefectRepository(): IDefectRepository {
  if (!defectRepo) defectRepo = new InMemoryDefectRepository();
  return defectRepo;
}

// --- Admin ---

export function getProfileRepository(): IProfileRepository {
  if (!profileRepo) profileRepo = new InMemoryProfileRepository();
  return profileRepo;
}

// --- Accounting ---

export function getGLAccountRepository(): IGLAccountRepository {
  if (!glAccountRepo) glAccountRepo = new InMemoryGLAccountRepository();
  return glAccountRepo;
}

export function getJournalEntryRepository(): IJournalEntryRepository {
  if (!journalEntryRepo) journalEntryRepo = new InMemoryJournalEntryRepository();
  return journalEntryRepo;
}

export function getAROpenItemRepository(): IAROpenItemRepository {
  if (!arOpenItemRepo) arOpenItemRepo = new InMemoryAROpenItemRepository();
  return arOpenItemRepo;
}

export function getAPOpenItemRepository(): IAPOpenItemRepository {
  if (!apOpenItemRepo) apOpenItemRepo = new InMemoryAPOpenItemRepository();
  return apOpenItemRepo;
}

export function getAccountingEventRepository(): IAccountingEventRepository {
  if (!accountingEventRepo) accountingEventRepo = new InMemoryAccountingEventRepository();
  return accountingEventRepo;
}

// --- Reset (for testing) ---

export function resetRepositories(): void {
  customerRepo = null;
  orderRepo = null;
  paymentRepo = null;
  projectRepo = null;
  processStepRepo = null;
  workOrderRepo = null;
  workLogRepo = null;
  materialRepo = null;
  stockRepo = null;
  stockMovementRepo = null;
  materialPriceRepo = null;
  steelTagRepo = null;
  supplierRepo = null;
  purchaseOrderRepo = null;
  purchaseRequestRepo = null;
  inspectionRepo = null;
  tryoutRepo = null;
  defectRepo = null;
  profileRepo = null;
  glAccountRepo = null;
  journalEntryRepo = null;
  arOpenItemRepo = null;
  apOpenItemRepo = null;
  accountingEventRepo = null;
}
