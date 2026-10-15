import { User } from '../entities/user.entity.js';
import { UserRole } from '../entities/user-role.enum.js';

/** Formato público de um usuário. Nunca contém `passwordHash`. */
export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;

  static from(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.role = user.role;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
