import { listProveedores } from '@/features/purchasing/services/proveedoresService';
import { useResource } from '@/shared/hooks/useResource';

export function useProveedores() {
  return useResource((signal) => listProveedores(signal), []);
}

