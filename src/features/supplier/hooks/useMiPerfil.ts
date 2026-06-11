import { fetchMiPerfil } from '@/features/supplier/services/proveedorService';
import { useResource } from '@/shared/hooks/useResource';

export function useMiPerfil() {
  return useResource((signal) => fetchMiPerfil(signal), []);
}
