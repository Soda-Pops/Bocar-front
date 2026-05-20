import { z } from 'zod';

const jwtPayloadSchema = z.looseObject({
  exp: z.number().optional(),
  iat: z.number().optional(),
  user_id: z.union([z.number(), z.string()]).optional(),
  email: z.email().optional(),
  role: z.string().optional(),
  is_admin: z.boolean().optional(),
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;

function decodeBase64Url(segment: string): string | null {
  try {
    const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
    const paddingNeeded = (4 - (padded.length % 4)) % 4;
    const fullyPadded = padded + '='.repeat(paddingNeeded);
    const binary = atob(fullyPadded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return null;
  }
}

export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const payloadJson = decodeBase64Url(parts[1]!);
  if (!payloadJson) {
    return null;
  }
  try {
    const parsed = jwtPayloadSchema.safeParse(JSON.parse(payloadJson));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, skewSeconds = 30): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) {
    return false;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds + skewSeconds;
}
