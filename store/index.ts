import { create } from 'zustand';
import { createMaterialsSlice, type MaterialsSlice } from './materials-slice';
import { createProcurementSlice, type ProcurementSlice } from './procurement-slice';
import { createSalesSlice, type SalesSlice } from './sales-slice';
import { createProjectsSlice, type ProjectsSlice } from './projects-slice';
import { createProductionSlice, type ProductionSlice } from './production-slice';
import { createQualitySlice, type QualitySlice } from './quality-slice';
import { createAdminSlice, type AdminSlice } from './admin-slice';
import { createAccountingSlice, type AccountingSlice } from './accounting-slice';

export type ERPStore =
  MaterialsSlice &
  ProcurementSlice &
  SalesSlice &
  ProjectsSlice &
  ProductionSlice &
  QualitySlice &
  AdminSlice &
  AccountingSlice;

export const useERPStore = create<ERPStore>()((...a) => ({
  ...createMaterialsSlice(...a),
  ...createProcurementSlice(...a),
  ...createSalesSlice(...a),
  ...createProjectsSlice(...a),
  ...createProductionSlice(...a),
  ...createQualitySlice(...a),
  ...createAdminSlice(...a),
  ...createAccountingSlice(...a),
}));
