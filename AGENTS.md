# AGENTS.md — Guia para agentes e desenvolvedores

Este arquivo orienta qualquer agente de IA ou pessoa que trabalhe no projeto **Ditado**.
A fonte da verdade funcional é [`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md). Em caso de conflito, a especificação vence.

## Visão rápida

Aplicação web de transcrição de áudio: landing page → cadastro/login → upload de áudio → texto transcrito pela Groq (Whisper) → histórico pessoal. Um usuário `admin` lista e exclui contas.

## Estrutura do monorepo

```
.
├── backend/            # API NestJS (porta 3000, prefixo /api)
├── frontend/           # React + Vite (porta 5173, proxy /api → :3000)
├── docs/ESPECIFICACAO.md
├── scripts/            # setup.sh, db-up.sh, db-down.sh, dev.sh
├── docker-compose.yml  # PostgreSQL 17 (127.0.0.1:5433)
├── .env.example        # modelo do .env da raiz (backend + compose)
└── AGENTS.md
```

## Stack

| Camada   | Tecnologias |
|----------|-------------|
| Backend  | NestJS, TypeScript, TypeORM, PostgreSQL, JWT (`@nestjs/jwt` + `passport-jwt`), `bcryptjs`, `class-validator`, `groq-sdk` |
| Frontend | React, Vite, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), `react-router-dom`, TanStack Query, Zustand, `axios` |
| Infra    | Docker Compose com `postgres:17-alpine` |

## Comandos

```bash
./scripts/setup.sh        # cria .env (gera JWT_SECRET) e instala dependências
./scripts/db-up.sh        # sobe o PostgreSQL e espera ficar saudável
./scripts/db-down.sh      # para o banco (--purge apaga o volume)
./scripts/dev.sh          # banco + backend + frontend

# backend/
npm run start:dev         # API em modo watch
npm test                  # testes unitários (Vitest)
npm run test:e2e          # testes e2e (exigem o banco; a Groq é simulada, sem gastar cota)
npm run lint              # oxlint

# frontend/
npm run dev               # Vite em http://localhost:5173 (proxy /api → :3000)
npm test                  # testes (Vitest + jsdom)
npm run build             # tsc strict + build de produção
npm run lint              # oxlint
```

> **npm:** o npm 10 falha ao instalar as dependências do NestJS 12 (`reading 'edgesOut'`). Use npm ≥ 11 — ex.: `npx -y npm@11 install <pacote>`. O `setup.sh` já faz isso.
>
> **Backend em ESM:** imports relativos terminam em `.js` (ex.: `import { X } from './x.js'`).
>
> **Estilo:** backend com ponto e vírgula (Prettier do Nest); frontend sem ponto e vírgula (padrão do template Vite). Siga o estilo do arquivo que estiver editando.

## Regras invioláveis

1. **Segredos só no backend.** `GROQ_API_KEY`, `JWT_SECRET` e senhas vivem apenas no `.env` da raiz. O frontend **não tem `.env`** e nunca usa variáveis `VITE_*` com credenciais.
2. **Nunca commitar `.env`.** Apenas `.env.example` (com valores fictícios) é versionado.
3. **`passwordHash` nunca sai em resposta HTTP.** Use DTOs/serialização de resposta; nunca retorne a entidade `User` crua.
4. **`role` não é aceito no cadastro.** `CreateUserDto` não possui `role`; o `ValidationPipe` global usa `whitelist` + `forbidNonWhitelisted`. O admin é criado apenas a partir de `ADMIN_*` no `.env`, na inicialização.
5. **Isolamento de dados.** Toda consulta de transcrição filtra por `userId` do `@CurrentUser()`. Recurso de outro usuário responde `404`.
6. **Frontend chama sempre `/api` relativo**, por meio da instância única do axios. Nada de URLs absolutas no código do navegador.
7. **Banco só em loopback.** A porta do PostgreSQL é publicada em `127.0.0.1`, nunca em `0.0.0.0`. No host usamos a **5433** (a especificação cita 5432, mas ela é usada por outro projeto local); dentro do container continua 5432.
8. **`synchronize: true` apenas em desenvolvimento** (`NODE_ENV=development`).
9. **Áudio não é persistido.** O upload é processado em memória, enviado à Groq e descartado; somente o texto é salvo.

## Convenções

### Backend
- Um módulo por domínio: `users`, `auth`, `transcriptions` (+ `groq` como provider de integração).
- Estrutura por módulo: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `entities/`, `dto/`.
- Guards: `JwtAuthGuard` para rotas autenticadas; `RolesGuard` + `@Roles('admin')` para rotas administrativas.
- Erros via exceções HTTP do Nest (`ConflictException`, `UnauthorizedException`, `NotFoundException`...). Mensagens de login são genéricas.
- Chaves e tokens nunca aparecem em logs.

### Frontend
- Pastas em `src/`: `lib/` (axios, queryClient), `stores/` (Zustand), `api/` (funções por domínio), `hooks/`, `pages/`, `components/`, `routes/`, `types/`.
- **Zustand** guarda somente a sessão (token + usuário). **TanStack Query** guarda todo dado vindo do servidor. Não duplicar dados do servidor no Zustand.
- Interceptor do axios (`src/lib/api.ts`): injeta `Authorization: Bearer <token>`; em `401` (exceto no próprio login) limpa a sessão e o cache do Query e redireciona para `/entrar` via `src/lib/navigation.ts`.
- Requisições sempre pela instância `api` de `src/lib/api.ts`, através das funções em `src/api/*.api.ts`. Nunca `fetch`/`axios` direto nos componentes.
- Mensagens de erro para o usuário: `getErrorMessage(error)` de `src/lib/api.ts`.
- Tailwind v4: tokens (ex.: cores `brand-*`) ficam no `@theme` de `src/index.css`; não existe `tailwind.config.js`.
- Rotas: `/` (landing), `/entrar` (login/cadastro), `/app` (protegida), `/admin` (somente `role = 'admin'`).
- Após cadastro bem-sucedido, o usuário é autenticado automaticamente.

### Geral
- TypeScript em modo `strict`.
- Nomes de código em inglês; textos de interface em português.
- Commits pequenos, uma fase/passo por vez, conforme o plano aprovado.

## Plano de implementação (fases)

1. Preparação e artefatos — monorepo, docs, `.env.example`, Docker Compose.
2. Fundação do backend e autenticação — NestJS, TypeORM, `users`, `auth`, JWT, roles, seed do admin.
3. Transcrições e Groq — upload multipart, integração Groq, histórico, exclusão, rotas admin.
4. Fundação do frontend — Vite, Tailwind v4, proxy, axios + interceptors, Zustand, TanStack Query.
5. Telas e integração — landing, `/entrar`, `/app`, `/admin`.
