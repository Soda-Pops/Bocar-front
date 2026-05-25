import { z } from 'zod';

export const loginRequestDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const userDto = z.object({
  id: z.number().int(),
  email: z.string().email(),
  username: z.string().min(1),
  role: z.enum(['SinRol', 'Ind', 'Com', 'Pro']),
  is_admin: z.boolean(),
});

export const loginResponseDto = z.object({
  message: z.string(),
  user: userDto,
});

export const messageResponseDto = z.object({
  message: z.string(),
});

export type LoginRequestDto = z.infer<typeof loginRequestDto>;
export type UserDto = z.infer<typeof userDto>;
export type LoginResponseDto = z.infer<typeof loginResponseDto>;
export type BackendRole = UserDto['role'];
