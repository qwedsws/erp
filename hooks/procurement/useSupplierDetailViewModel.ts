'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { useFeedbackToast } from '@/hooks/shared/useFeedbackToast';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { usePurchaseOrders } from '@/hooks/procurement/usePurchaseOrders';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';

type SupplierType = '' | 'MATERIAL' | 'OUTSOURCE' | 'BOTH';

interface SupplierEditForm {
  name: string;
  business_no: string;
  supplier_type: SupplierType;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const DEFAULT_EDIT_FORM: SupplierEditForm = {
  name: '',
  business_no: '',
  supplier_type: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

export function useSupplierDetailViewModel(supplierId?: string) {
  const { suppliers, updateSupplier, deleteSupplier } = useSuppliers();
  const { purchaseOrders } = usePurchaseOrders();
  const { materials } = useMaterials();
  const { showError, showSuccess } = useFeedbackToast();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<SupplierEditForm>(DEFAULT_EDIT_FORM);

  const supplierById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier])),
    [suppliers],
  );
  const supplier = supplierId ? supplierById.get(supplierId) : undefined;

  const supplierPOs = useMemo(() => {
    if (!supplier) return [];
    return purchaseOrders
      .filter((purchaseOrder) => purchaseOrder.supplier_id === supplier.id)
      .sort((a, b) => b.order_date.localeCompare(a.order_date));
  }, [purchaseOrders, supplier]);

  const supplierMaterials = useMemo(() => {
    if (!supplier) return [];
    return materials.filter((material) => material.supplier_id === supplier.id);
  }, [materials, supplier]);

  const stats = useMemo(() => {
    const totalOrders = supplierPOs.length;
    const totalAmount = supplierPOs.reduce((sum, purchaseOrder) => sum + (purchaseOrder.total_amount || 0), 0);
    const receivedCount = supplierPOs.filter((purchaseOrder) => purchaseOrder.status === 'COMPLETED').length;
    return { totalOrders, totalAmount, receivedCount };
  }, [supplierPOs]);

  const handleStartEdit = () => {
    if (!supplier) return;
    setEditForm({
      name: supplier.name,
      business_no: supplier.business_no || '',
      supplier_type: (supplier.supplier_type || '') as SupplierType,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!supplier) return false;
    if (!editForm.name.trim()) {
      showError('업체명을 입력하세요');
      return false;
    }
    try {
      await updateSupplier(supplier.id, {
        name: editForm.name,
        business_no: editForm.business_no || undefined,
        supplier_type: editForm.supplier_type || undefined,
        contact_person: editForm.contact_person || undefined,
        phone: editForm.phone || undefined,
        email: editForm.email || undefined,
        address: editForm.address || undefined,
        notes: editForm.notes || undefined,
      });
      showSuccess('거래처 정보가 수정되었습니다.');
      setIsEditing(false);
      return true;
    } catch (err) {
      showError(err instanceof Error ? err.message : '거래처 수정 중 오류가 발생했습니다.');
      return false;
    }
  };

  const handleEditChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setEditForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleDelete = async () => {
    if (!supplier) return false;
    try {
      await deleteSupplier(supplier.id);
      showSuccess('거래처가 삭제되었습니다.');
      return true;
    } catch (err) {
      showError(err instanceof Error ? err.message : '거래처 삭제 중 오류가 발생했습니다.');
      return false;
    }
  };

  return {
    supplier,
    supplierPOs,
    supplierMaterials,
    stats,
    isEditing,
    editForm,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleEditChange,
    handleDelete,
  };
}
