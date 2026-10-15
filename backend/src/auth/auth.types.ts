import { UserRole } from '../users/entities/user-role.enum.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';

/** Conteúdo assinado no JWT. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

/** Usuário autenticado anexado a `request.user` pela JwtStrategy. */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  user: UserResponseDto;
  accessToken: string;
}
