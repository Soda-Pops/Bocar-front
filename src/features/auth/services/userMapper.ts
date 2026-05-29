import type { BackendRole, UserDto } from '@/features/auth/services/authDtos';
import type { AppRole, AuthenticatedUser } from '@/features/auth/types';

const ROLE_BY_BACKEND: Record<Exclude<BackendRole, 'SinRol'>, AppRole> = {
  Ind: 'industrializacion',
  Com: 'compras',
  Pro: 'proveedor',
};

function pickRole(value: BackendRole): AppRole {
  if (value === 'SinRol') {
    throw new Error('Cuenta sin rol asignado');
  }
  return ROLE_BY_BACKEND[value];
}

export function mapUserDtoToAuthenticatedUser(dto: UserDto): AuthenticatedUser {
  return {
    id: dto.id,
    email: dto.email,
    username: dto.username,
    role: pickRole(dto.role),
    isAdmin: dto.is_admin,
  };
}
