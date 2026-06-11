import { listExtensionRequests } from '@/features/purchasing/services/comercializacionService';
import { useResource } from '@/shared/hooks/useResource';

/**
 * Carga las solicitudes de desbloqueo (extensión de tiempo) pendientes que
 * enviaron los proveedores. Alimenta el widget "PENDING UNLOCK REQUESTS".
 */
export function useSolicitudesExtension() {
  return useResource((signal) => listExtensionRequests(signal), []);
}
