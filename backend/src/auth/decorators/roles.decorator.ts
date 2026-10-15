import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user-role.enum.js';

export const ROLES_KEY = 'roles';

/** Restringe a rota às roles informadas. Use junto com JwtAuthGuard + RolesGuard. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
