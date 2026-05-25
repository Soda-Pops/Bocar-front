import {
  loginRequestDto,
  loginResponseDto,
  messageResponseDto,
  userDto,
  type LoginRequestDto,
  type LoginResponseDto,
  type UserDto,
} from '@/features/auth/services/authDtos';
import { request } from '@/shared/http/httpClient';

const ENDPOINTS = {
  login: '/auth/login/',
  refresh: '/auth/refresh/',
  logout: '/auth/logout/',
  me: '/auth/me/',
} as const;

export async function login(credentials: LoginRequestDto): Promise<LoginResponseDto> {
  const body = loginRequestDto.parse(credentials);
  return request(ENDPOINTS.login, {
    method: 'POST',
    body,
    auth: false,
    schema: loginResponseDto,
  });
}

export async function refreshSession(): Promise<void> {
  await request(ENDPOINTS.refresh, {
    method: 'POST',
    auth: false,
    schema: messageResponseDto,
  });
}

export async function logout(): Promise<void> {
  await request(ENDPOINTS.logout, {
    method: 'POST',
    auth: true,
    schema: messageResponseDto,
  });
}

export async function fetchCurrentUser(): Promise<UserDto> {
  return request(ENDPOINTS.me, {
    method: 'GET',
    auth: true,
    schema: userDto,
  });
}
