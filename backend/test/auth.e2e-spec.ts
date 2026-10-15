import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { Like, Repository } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { User } from '../src/users/entities/user.entity.js';

// Usa o banco de desenvolvimento (docker compose). Todos os usuários criados
// aqui usam este domínio e são removidos ao final.
const TEST_DOMAIN = '@e2e.ditado.test';

describe('Auth e Users (e2e)', () => {
  let app: INestApplication<App>;
  let usersRepository: Repository<User>;

  const email = `user-${randomUUID()}${TEST_DOMAIN}`;
  const password = 'senha-segura-123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    usersRepository = moduleRef.get(getRepositoryToken(User));
  });

  afterAll(async () => {
    await usersRepository.delete({ email: Like(`%${TEST_DOMAIN}`) });
    await app.close();
  });

  describe('POST /api/users', () => {
    it('cadastra com role "user" e sem passwordHash (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .send({ name: 'Teste', email: email.toUpperCase(), password })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'Teste', email, role: 'user' });
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('password');
    });

    it('rejeita e-mail duplicado (409)', () =>
      request(app.getHttpServer())
        .post('/api/users')
        .send({ name: 'Outro', email, password })
        .expect(409));

    it('rejeita o campo role no cadastro (400)', () =>
      request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Intruso',
          email: `intruso-${randomUUID()}${TEST_DOMAIN}`,
          password,
          role: 'admin',
        })
        .expect(400));

    it('rejeita dados inválidos (400)', () =>
      request(app.getHttpServer())
        .post('/api/users')
        .send({ name: '', email: 'nao-e-email', password: '123' })
        .expect(400));
  });

  describe('POST /api/auth/login', () => {
    it('retorna user + accessToken sem passwordHash (200)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.user).toMatchObject({ email, role: 'user' });
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });

    it('senha errada e e-mail inexistente dão a mesma resposta (401)', async () => {
      const wrongPassword = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'senha-errada-123' })
        .expect(401);
      const unknownEmail = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: `ninguem${TEST_DOMAIN}`, password })
        .expect(401);

      expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    });
  });

  describe('GET /api/auth/me', () => {
    it('retorna o usuário do token (200)', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password });

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .expect(200);

      expect(res.body.email).toBe(email);
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('sem token (401)', () =>
      request(app.getHttpServer()).get('/api/auth/me').expect(401));

    it('token inválido (401)', () =>
      request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token.invalido.aqui')
        .expect(401));
  });
});
