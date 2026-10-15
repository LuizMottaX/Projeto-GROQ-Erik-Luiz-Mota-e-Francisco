import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { Like, Repository } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { GroqService } from '../src/groq/groq.service.js';
import { Transcription } from '../src/transcriptions/entities/transcription.entity.js';
import { UserRole } from '../src/users/entities/user-role.enum.js';
import { User } from '../src/users/entities/user.entity.js';
import { UsersService } from '../src/users/users.service.js';

// A Groq é simulada: os testes não consomem a cota da API real.
const TEST_DOMAIN = '@e2e-transcriptions.ditado.test';
const FAKE_AUDIO = Buffer.from('fake-audio-bytes');

describe('Transcriptions e Admin (e2e)', () => {
  let app: INestApplication<App>;
  let usersRepository: Repository<User>;
  let transcriptionsRepository: Repository<Transcription>;
  const groqMock = { transcribe: vi.fn() };

  const password = 'senha-segura-123';
  const anaEmail = `ana-${randomUUID()}${TEST_DOMAIN}`;
  const biaEmail = `bia-${randomUUID()}${TEST_DOMAIN}`;
  const adminEmail = `admin-${randomUUID()}${TEST_DOMAIN}`;
  let anaToken: string;
  let biaToken: string;
  let adminToken: string;

  const http = () => request(app.getHttpServer());
  const login = async (email: string) =>
    (await http().post('/api/auth/login').send({ email, password })).body
      .accessToken as string;
  const upload = (token: string, filename = 'fala.mp3') =>
    http()
      .post('/api/transcriptions')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', FAKE_AUDIO, { filename, contentType: 'audio/mpeg' });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GroqService)
      .useValue(groqMock)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    usersRepository = moduleRef.get(getRepositoryToken(User));
    transcriptionsRepository = moduleRef.get(getRepositoryToken(Transcription));

    const usersService = moduleRef.get(UsersService);
    await usersService.create({ name: 'Ana', email: anaEmail, password });
    await usersService.create({ name: 'Bia', email: biaEmail, password });
    await usersService.create(
      { name: 'Admin', email: adminEmail, password },
      UserRole.ADMIN,
    );

    anaToken = await login(anaEmail);
    biaToken = await login(biaEmail);
    adminToken = await login(adminEmail);
  });

  beforeEach(() => {
    groqMock.transcribe.mockReset();
    groqMock.transcribe.mockResolvedValue('texto simulado');
  });

  afterAll(async () => {
    await usersRepository.delete({ email: Like(`%${TEST_DOMAIN}`) });
    await app.close();
  });

  describe('POST /api/transcriptions', () => {
    it('transcreve e salva vinculado ao usuário (201)', async () => {
      const res = await upload(anaToken).field('language', 'pt').expect(201);

      expect(res.body).toMatchObject({
        text: 'texto simulado',
        originalFilename: 'fala.mp3',
      });
      expect(res.body).not.toHaveProperty('userId');
      expect(groqMock.transcribe).toHaveBeenCalledWith(
        expect.objectContaining({ filename: 'fala.mp3' }),
        'pt',
      );

      const saved = await transcriptionsRepository.findOneByOrFail({
        id: res.body.id,
      });
      expect(saved.userId).toBe(
        (await usersRepository.findOneByOrFail({ email: anaEmail })).id,
      );
    });

    it('exige autenticação (401)', () =>
      http()
        .post('/api/transcriptions')
        .attach('file', FAKE_AUDIO, 'fala.mp3')
        .expect(401));

    it('exige o arquivo (400)', () =>
      http()
        .post('/api/transcriptions')
        .set('Authorization', `Bearer ${anaToken}`)
        .field('language', 'pt')
        .expect(400));

    it('rejeita formato não suportado (400)', async () => {
      await http()
        .post('/api/transcriptions')
        .set('Authorization', `Bearer ${anaToken}`)
        .attach('file', FAKE_AUDIO, {
          filename: 'nota.txt',
          contentType: 'text/plain',
        })
        .expect(400);
      expect(groqMock.transcribe).not.toHaveBeenCalled();
    });

    it('rejeita campos extras como userId (400)', () =>
      upload(anaToken).field('userId', randomUUID()).expect(400));

    it('responde 422 quando não há fala no áudio', async () => {
      groqMock.transcribe.mockResolvedValue('');
      await upload(anaToken).expect(422);
    });
  });

  describe('isolamento entre usuários', () => {
    it('cada um lista apenas as próprias transcrições', async () => {
      await upload(anaToken, 'da-ana.mp3').expect(201);
      await upload(biaToken, 'da-bia.mp3').expect(201);

      const ana = await http()
        .get('/api/transcriptions')
        .set('Authorization', `Bearer ${anaToken}`)
        .expect(200);
      const bia = await http()
        .get('/api/transcriptions')
        .set('Authorization', `Bearer ${biaToken}`)
        .expect(200);

      const names = (list: { originalFilename: string }[]) =>
        list.map((t) => t.originalFilename);
      expect(names(ana.body)).toContain('da-ana.mp3');
      expect(names(ana.body)).not.toContain('da-bia.mp3');
      expect(names(bia.body)).toEqual(['da-bia.mp3']);
    });

    it('não permite excluir transcrição de outro usuário (404)', async () => {
      const { body } = await upload(anaToken).expect(201);

      await http()
        .delete(`/api/transcriptions/${body.id}`)
        .set('Authorization', `Bearer ${biaToken}`)
        .expect(404);
      await http()
        .delete(`/api/transcriptions/${body.id}`)
        .set('Authorization', `Bearer ${anaToken}`)
        .expect(204);
      await http()
        .delete(`/api/transcriptions/${body.id}`)
        .set('Authorization', `Bearer ${anaToken}`)
        .expect(404);
    });
  });

  describe('rotas de admin', () => {
    it('usuário comum não lista contas (403)', () =>
      http()
        .get('/api/users')
        .set('Authorization', `Bearer ${anaToken}`)
        .expect(403));

    it('admin lista contas sem passwordHash (200)', async () => {
      const res = await http()
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const emails = (res.body as { email: string }[]).map((u) => u.email);
      expect(emails).toEqual(expect.arrayContaining([anaEmail, biaEmail]));
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });

    it('admin não exclui a própria conta (400)', async () => {
      const me = await http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      await http()
        .delete(`/api/users/${me.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('excluir conta remove as transcrições e invalida o token', async () => {
      const bia = await usersRepository.findOneByOrFail({ email: biaEmail });
      expect(await transcriptionsRepository.countBy({ userId: bia.id })).toBe(
        1,
      );

      await http()
        .delete(`/api/users/${bia.id}`)
        .set('Authorization', `Bearer ${anaToken}`)
        .expect(403);
      await http()
        .delete(`/api/users/${bia.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      expect(await transcriptionsRepository.countBy({ userId: bia.id })).toBe(
        0,
      );
      await http()
        .get('/api/transcriptions')
        .set('Authorization', `Bearer ${biaToken}`)
        .expect(401);
    });
  });
});
