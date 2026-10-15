import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from './entities/user-role.enum.js';
import { UsersService } from './users.service.js';

/**
 * Garante que exista um administrador, criado a partir de ADMIN_* do .env.
 * É a única forma de um usuário receber role 'admin'.
 */
@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (await this.usersService.existsAdmin()) {
      return;
    }

    const email = this.config.getOrThrow<string>('ADMIN_EMAIL');

    if (await this.usersService.existsByEmail(email)) {
      this.logger.warn(
        `Nenhum admin existe, mas ${email} já está cadastrado como usuário comum. ` +
          'Ajuste ADMIN_EMAIL no .env para criar o administrador.',
      );
      return;
    }

    await this.usersService.create(
      {
        name: this.config.getOrThrow<string>('ADMIN_NAME'),
        email,
        password: this.config.getOrThrow<string>('ADMIN_PASSWORD'),
      },
      UserRole.ADMIN,
    );
    this.logger.log(`Administrador inicial criado: ${email}`);
  }
}
