import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Configuração global da aplicação, compartilhada entre main.ts e testes e2e.
 * CORS não é habilitado: o frontend acessa a API pelo proxy do Vite (/api).
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
}
