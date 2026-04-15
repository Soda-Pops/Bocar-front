// No se usa en las pantallas activas por ahora; reservado para integracion futura.
export const env = {
  appName: 'Sistema de Cotizaciones BOCAR',
  mode: import.meta.env.MODE,
} as const;
// This file centralizes environment variables and configuration constants for the application.
// Evita tener que acceder directamente a import.meta.env en múltiples lugares del código, lo que facilita la gestión y el mantenimiento de las variables de entorno.