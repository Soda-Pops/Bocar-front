import { misAsignaciones } from '@/features/supplier/services/asignacionesService';
import { useResource } from '@/shared/hooks/useResource';

export function useMisAsignaciones() {
  return useResource((signal) => misAsignaciones(signal), []);
}

