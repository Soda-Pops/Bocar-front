import { z } from 'zod';

export const loginRequestDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const tokenPairDto = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1),
});

export const refreshRequestDto = z.object({
  refresh: z.string().min(1),
});

export const refreshResponseDto = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1).optional(),
});

export const logoutRequestDto = z.object({
  refresh: z.string().min(1),
});

export type LoginRequestDto = z.infer<typeof loginRequestDto>;
export type TokenPairDto = z.infer<typeof tokenPairDto>;
export type RefreshResponseDto = z.infer<typeof refreshResponseDto>;
