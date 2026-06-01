import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .url('VITE_API_BASE_URL debe ser una URL valida (ej: http://localhost:8000)'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `- ${issue.path.join('.')}: ${issue.message}`).join('\n');
  throw new Error(`Invalid environment variables:\n${issues}\n\nReview your .env.local file.`);
}

const apiBaseUrl = parsed.data.VITE_API_BASE_URL.replace(/\/+$/, '');

export const env = {
  appName: 'Sistema de Cotizaciones BOCAR',
  mode: import.meta.env.MODE,
  apiBaseUrl,
} as const;
