import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto.js';
import { User } from './entities/user.entity.js';
import { UserRole } from './entities/user-role.enum.js';

const BCRYPT_ROUNDS = 10;
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Cria um usuário com a senha já transformada em hash.
   * `role` só é definido internamente (ex.: seed do admin), nunca pelo DTO.
   */
  async create(
    dto: CreateUserDto,
    role: UserRole = UserRole.USER,
  ): Promise<User> {
    const email = dto.email.trim().toLowerCase();

    if (await this.usersRepository.existsBy({ email })) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const user = this.usersRepository.create({
      name: dto.name.trim(),
      email,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      role,
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      // Corrida entre a verificação acima e o INSERT.
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw error;
    }
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  /** Único ponto que carrega o `passwordHash` — uso exclusivo do login. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.trim().toLowerCase() })
      .getOne();
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.usersRepository.existsBy({ email: email.trim().toLowerCase() });
  }

  existsAdmin(): Promise<boolean> {
    return this.usersRepository.existsBy({ role: UserRole.ADMIN });
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * Exclusão feita por um admin. As transcrições do usuário são removidas
   * em cascata (onDelete: CASCADE).
   */
  async removeByAdmin(adminId: string, id: string): Promise<void> {
    if (adminId === id) {
      throw new BadRequestException('Você não pode excluir a própria conta');
    }

    const result = await this.usersRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException('Usuário não encontrado');
    }
  }
}
