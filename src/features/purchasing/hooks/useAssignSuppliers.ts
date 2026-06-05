import { createAsignaciones } from '@/features/purchasing/services/comercializacionService';
import { useMutation } from '@/shared/hooks/useMutation';

export function useAssignSuppliers() {
  return useMutation(createAsignaciones);
}

