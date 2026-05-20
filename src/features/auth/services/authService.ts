import {
  loginRequestDto,
  refreshResponseDto,
  tokenPairDto,
  type LoginRequestDto,
  type TokenPairDto,
} from '@/features/auth/services/authDtos';
import { request } from '@/shared/http/httpClient';

const ENDPOINTS = {
  login: '/auth/jwt/create/',
  refresh: '/auth/jwt/refresh/',
  logout: '/auth/jwt/logout/',
} as const;

export async function login(credentials: LoginRequestDto): Promise<TokenPairDto> {
  const body = loginRequestDto.parse(credentials);
  return request(ENDPOINTS.login, {
    method: 'POST',
    body,
    auth: false,
    schema: tokenPairDto,
  });
}

export async function refreshAccessToken(refresh: string): Promise<{ access: string; refresh: string }> {
  const response = await request(ENDPOINTS.refresh, {
    method: 'POST',
    body: { refresh },
    auth: false,
    schema: refreshResponseDto,
  });
  return { access: response.access, refresh: response.refresh ?? refresh };
}

export async function logout(refresh: string): Promise<void> {
  await request(ENDPOINTS.logout, {
    method: 'POST',
    body: { refresh },
    auth: true,
  });
}
