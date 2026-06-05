import {
  actualizarCotizacion,
  enviarCotizacion,
  responderCotizacion,
} from '@/features/supplier/services/asignacionesService';
import { useMutation } from '@/shared/hooks/useMutation';

export function useResponderCotizacion() {
  return {
    responder: useMutation(responderCotizacion),
    actualizar: useMutation(actualizarCotizacion),
    enviar: useMutation(enviarCotizacion),
  };
}

