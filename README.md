# Ditado

Aplicação web full stack de **transcrição de áudio**. O usuário cria uma conta, envia um arquivo de áudio e recebe o texto transcrito pela API da [Groq](https://groq.com) (modelo Whisper). As transcrições ficam em um histórico pessoal, e um usuário administrador pode listar e excluir contas.

| Camada | Tecnologias |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, React Router, TanStack Query, Zustand, axios |
| Backend | NestJS, TypeScript, TypeORM, JWT (passport-jwt), bcryptjs, groq-sdk |
| Banco | PostgreSQL 17 em Docker |

---

## Sumário

1. [Pré-requisitos](#1-pré-requisitos)
2. [Passo a passo (Linux, macOS ou WSL)](#2-passo-a-passo-linux-macos-ou-wsl)
3. [Passo a passo manual (sem os scripts / Windows)](#3-passo-a-passo-manual-sem-os-scripts--windows)
4. [Variáveis de ambiente](#4-variáveis-de-ambiente)
5. [Comandos do dia a dia](#5-comandos-do-dia-a-dia)
6. [Testes](#6-testes)
7. [Estrutura do projeto](#7-estrutura-do-projeto)
8. [API](#8-api)
9. [Solução de problemas](#9-solução-de-problemas)
10. [Segurança](#10-segurança)

---

## 1. Pré-requisitos

Instale na máquina:

| Ferramenta | Versão | Como conferir |
|---|---|---|
| [Git](https://git-scm.com/) | qualquer recente | `git --version` |
| [Node.js](https://nodejs.org/) | **22.13+** (LTS 22) ou **24.11+** | `node -v` |
| npm | **11+** recomendado (veja a nota abaixo) | `npm -v` |
| [Docker](https://docs.docker.com/get-docker/) + Docker Compose v2 | Docker 24+ | `docker --version` e `docker compose version` |

Você também precisa de uma **chave de API da Groq** (gratuita):

1. Acesse <https://console.groq.com/keys> e entre com Google, GitHub ou e-mail.
2. Clique em **Create API Key** e copie a chave, que começa com `gsk_`. Ela só é exibida uma vez.

> **Nota sobre o npm:** o npm 10, que vem com algumas instalações do Node 22, falha ao instalar as dependências do backend com o erro `Cannot read properties of null (reading 'edgesOut')`. O `scripts/setup.sh` já contorna isso usando o npm 11 via `npx`. Se for instalar manualmente, use `npx -y npm@11 install` ou atualize o npm global com `npm install -g npm@11`.

> **Dica:** com [nvm](https://github.com/nvm-sh/nvm), basta rodar `nvm install && nvm use` na raiz do projeto. O arquivo `.nvmrc` já indica o Node 22.

**Portas usadas** (precisam estar livres):

| Porta | Serviço |
|---|---|
| `5173` | Frontend (Vite) |
| `3000` | Backend (NestJS) |
| `5433` | PostgreSQL (somente em `127.0.0.1`; configurável no `.env`) |

---

## 2. Passo a passo (Linux, macOS ou WSL)

### 2.1 Clonar o repositório

```bash
git clone <URL-DO-REPOSITORIO> ditado
cd ditado
```

### 2.2 Criar o `.env` e instalar as dependências

```bash
./scripts/setup.sh
```

Esse script:
- cria o arquivo `.env` na raiz a partir do `.env.example`;
- gera um `JWT_SECRET` aleatório;
- instala as dependências do `backend/` e do `frontend/`.

> Se aparecer `Permission denied`, dê permissão de execução aos scripts: `chmod +x scripts/*.sh`.

### 2.3 Preencher o `.env`

Abra o arquivo `.env` da raiz num editor e ajuste **pelo menos**:

```dotenv
GROQ_API_KEY=gsk_...sua_chave...          # obrigatório
POSTGRES_PASSWORD=uma-senha-forte         # troque o valor de exemplo
ADMIN_EMAIL=voce@exemplo.com              # login do administrador
ADMIN_PASSWORD=outra-senha-forte          # mínimo de 8 caracteres
```

A descrição de todas as variáveis está na [seção 4](#4-variáveis-de-ambiente).

> ⚠️ Faça isso **antes** de subir o banco pela primeira vez. O PostgreSQL grava a senha só na criação do volume; para trocá-la depois, veja a [solução de problemas](#9-solução-de-problemas).

### 2.4 Subir o banco de dados

```bash
./scripts/db-up.sh
```

O comando sobe o container `ditado_db` (PostgreSQL 17) e espera ele ficar saudável. As tabelas são criadas automaticamente pelo backend na primeira execução.

### 2.5 Rodar a aplicação

```bash
./scripts/dev.sh
```

Esse comando sobe o banco (se ainda não estiver no ar), o backend em <http://localhost:3000> e o frontend em <http://localhost:5173>. Para parar, use `Ctrl+C`; o banco continua rodando.

### 2.6 Usar

1. Abra **<http://localhost:5173>**.
2. Clique em **Criar conta grátis** para criar um usuário comum, **ou** entre com o `ADMIN_EMAIL` e o `ADMIN_PASSWORD` do `.env`. O administrador é criado automaticamente quando o backend sobe.
3. Em **Nova transcrição**, escolha um áudio (MP3, WAV, M4A, OGG, WEBM, FLAC… até 25 MB) e clique em **Transcrever**.

---

## 3. Passo a passo manual (sem os scripts / Windows)

Os scripts `.sh` precisam de bash. No **Windows**, use o [WSL](https://learn.microsoft.com/windows/wsl/install) e siga a seção 2, ou rode os comandos abaixo no PowerShell ou no Git Bash. Em PowerShell, troque `cp` por `Copy-Item`.

```bash
# 1. Clonar
git clone <URL-DO-REPOSITORIO> ditado
cd ditado

# 2. Criar o .env e editá-lo (veja a seção 2.3)
cp .env.example .env
#    Gere um JWT_SECRET com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Instalar dependências
cd backend  && npx -y npm@11 install && cd ..
cd frontend && npx -y npm@11 install && cd ..

# 4. Subir o banco
docker compose up -d --wait db

# 5. Backend (terminal 1)
cd backend
npm run start:dev

# 6. Frontend (terminal 2)
cd frontend
npm run dev
```

Depois, abra <http://localhost:5173>.

---

## 4. Variáveis de ambiente

Existe **um único `.env`, na raiz**, usado pelo backend e pelo Docker Compose. O frontend **não tem `.env`**: ele acessa a API pelo caminho relativo `/api`, que o Vite repassa ao backend.

| Variável | Obrigatória | Padrão (`.env.example`) | Descrição |
|---|---|---|---|
| `NODE_ENV` | não | `development` | Em `development`, o TypeORM cria e atualiza as tabelas automaticamente (`synchronize`). |
| `POSTGRES_USER` | sim | `ditado` | Usuário do PostgreSQL. |
| `POSTGRES_PASSWORD` | sim | `troque-esta-senha` | Senha do PostgreSQL. **Troque.** |
| `POSTGRES_DB` | sim | `ditado` | Nome do banco. |
| `DB_HOST` | não | `127.0.0.1` | Host do banco visto pelo backend. |
| `DB_PORT` | não | `5433` | Porta do banco no host. Mude se a 5433 estiver ocupada. |
| `PORT` | não | `3000` | Porta do backend. Se mudar, ajuste também o proxy em `frontend/vite.config.ts`. |
| `JWT_SECRET` | sim | (gerado pelo `setup.sh`) | Segredo de assinatura dos tokens. Mínimo de 32 caracteres. |
| `JWT_EXPIRES_IN` | não | `1d` | Validade do token (ex.: `1h`, `7d`). |
| `GROQ_API_KEY` | sim | — | Chave da API da Groq (`gsk_...`). |
| `GROQ_MODEL` | não | `whisper-large-v3-turbo` | Modelo de transcrição (`whisper-large-v3-turbo` ou `whisper-large-v3`). |
| `ADMIN_NAME` | não | `Administrador` | Nome do admin criado automaticamente. |
| `ADMIN_EMAIL` | sim | `admin@ditado.local` | E-mail de login do admin. |
| `ADMIN_PASSWORD` | sim | `troque-esta-senha-admin` | Senha do admin (mínimo de 8). **Troque.** |

O backend valida essas variáveis ao iniciar e **não sobe** se alguma obrigatória estiver ausente ou inválida; a mensagem de erro indica qual.

> O administrador só é criado se **ainda não existir nenhum** admin no banco. Mudar `ADMIN_EMAIL` ou `ADMIN_PASSWORD` depois disso não altera o admin existente.

---

## 5. Comandos do dia a dia

Na **raiz**:

| Comando | O que faz |
|---|---|
| `./scripts/setup.sh` | Cria o `.env` (se não existir) e instala as dependências. |
| `./scripts/dev.sh` | Sobe banco, backend e frontend. |
| `./scripts/db-up.sh` | Sobe só o banco. |
| `./scripts/db-down.sh` | Para o banco, **mantendo os dados**. |
| `./scripts/db-down.sh --purge` | Para o banco e **apaga todos os dados** (volume). |

Em **`backend/`**:

| Comando | O que faz |
|---|---|
| `npm run start:dev` | API em modo watch (recarrega ao salvar). |
| `npm run build` | Compila para `dist/`. |
| `npm run start:prod` | Roda a versão compilada. |
| `npm test` | Testes unitários. |
| `npm run test:e2e` | Testes de integração (exigem o banco rodando). |
| `npm run lint` | Lint (oxlint). |

Em **`frontend/`**:

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento em <http://localhost:5173>. |
| `npm run build` | Checagem de tipos + build de produção em `dist/`. |
| `npm test` | Testes (Vitest + jsdom). |
| `npm run lint` | Lint (oxlint). |

---

## 6. Testes

```bash
# Backend: unitários
cd backend && npm test

# Backend: integração (sobe a API em memória contra o banco local)
./scripts/db-up.sh            # a partir da raiz, se o banco não estiver rodando
cd backend && npm run test:e2e

# Frontend
cd frontend && npm test
```

- Nos testes e2e, a **Groq é simulada**, então eles não gastam a cota da sua chave.
- Os testes e2e usam o banco de desenvolvimento e **apagam os usuários que criam** ao final.

---

## 7. Estrutura do projeto

```
.
├── backend/                 # API NestJS (porta 3000, prefixo /api)
│   ├── src/
│   │   ├── auth/            # login, JWT, guards (JwtAuthGuard, RolesGuard), decorators
│   │   ├── users/           # cadastro, entidade User, rotas de admin, criação do admin
│   │   ├── transcriptions/  # upload de áudio, histórico, exclusão
│   │   ├── groq/            # integração com a API da Groq
│   │   └── config/          # validação do .env
│   └── test/                # testes e2e
├── frontend/                # React + Vite (porta 5173)
│   └── src/
│       ├── api/             # funções de chamada à API por domínio
│       ├── components/      # layout, upload, histórico, componentes de UI
│       ├── hooks/           # hooks do TanStack Query (dados do servidor)
│       ├── lib/             # instância do axios (interceptors), queryClient
│       ├── pages/           # Landing, Entrar, Dashboard, Admin
│       ├── routes/          # rotas e guards (protegida / admin / visitante)
│       └── stores/          # Zustand (sessão)
├── docs/ESPECIFICACAO.md    # especificação funcional
├── scripts/                 # setup, db-up, db-down, dev
├── docker-compose.yml       # PostgreSQL 17 (127.0.0.1:5433)
├── .env.example             # modelo do .env
└── AGENTS.md                # convenções para agentes de IA e desenvolvedores
```

**Rotas do frontend:**

| Rota | Acesso | Tela |
|---|---|---|
| `/` | pública | Landing page |
| `/entrar` | visitante | Login e cadastro |
| `/app` | logado | Upload de áudio e histórico |
| `/admin` | admin | Gestão de usuários |

---

## 8. API

Base: `http://localhost:3000/api`. No navegador, use `/api` (via proxy do Vite). As rotas protegidas exigem o header `Authorization: Bearer <token>`.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/users` | público | Cadastro (`name`, `email`, `password`). Sempre cria com perfil `user`. |
| `POST` | `/auth/login` | público | Login (`email`, `password`). Retorna `{ user, accessToken }`. |
| `GET` | `/auth/me` | logado | Dados do usuário do token. |
| `POST` | `/transcriptions` | logado | `multipart/form-data`: `file` (áudio) e `language` opcional (ex.: `pt`). |
| `GET` | `/transcriptions` | logado | Lista as transcrições do próprio usuário. |
| `DELETE` | `/transcriptions/:id` | logado | Exclui uma transcrição própria. |
| `GET` | `/users` | admin | Lista todas as contas. |
| `DELETE` | `/users/:id` | admin | Exclui uma conta e suas transcrições. |

Exemplo com `curl`:

```bash
# Login
TOKEN=$(curl -s -H 'Content-Type: application/json' \
  -d '{"email":"voce@exemplo.com","password":"sua-senha"}' \
  http://localhost:3000/api/auth/login | node -pe 'JSON.parse(require("fs").readFileSync(0)).accessToken')

# Transcrever
curl -H "Authorization: Bearer $TOKEN" \
  -F "file=@gravacao.mp3" -F "language=pt" \
  http://localhost:3000/api/transcriptions
```

---

## 9. Solução de problemas

<details>
<summary><b><code>Cannot read properties of null (reading 'edgesOut')</code> ao instalar</b></summary>

É um bug do npm 10. Instale com o npm 11: `npx -y npm@11 install` (o `setup.sh` já faz isso), ou atualize com `npm install -g npm@11`.
</details>

<details>
<summary><b>A porta 5433 (ou 3000 / 5173) já está em uso</b></summary>

Descubra quem está usando: `ss -tlnp | grep 5433` (Linux) ou `lsof -i :5433` (macOS).
Para o banco, basta mudar `DB_PORT` no `.env` (ex.: `5434`) e rodar `./scripts/db-up.sh` de novo.
</details>

<details>
<summary><b>Erro de autenticação no PostgreSQL depois de trocar <code>POSTGRES_PASSWORD</code></b></summary>

A senha só é aplicada quando o volume é criado. Se o banco ainda não tem dados importantes, recrie-o:

```bash
./scripts/db-down.sh --purge
./scripts/db-up.sh
```
</details>

<details>
<summary><b>O backend não sobe: <code>Config validation error</code></b></summary>

Alguma variável obrigatória do `.env` está faltando ou é inválida (ex.: `JWT_SECRET` com menos de 32 caracteres, `GROQ_API_KEY` vazia). A mensagem indica qual variável corrigir.
</details>

<details>
<summary><b><code>permission denied while trying to connect to the Docker daemon</code></b></summary>

No Linux, adicione seu usuário ao grupo `docker` e abra um novo terminal:

```bash
sudo usermod -aG docker $USER
```
</details>

<details>
<summary><b>Erro ao transcrever: "Serviço de transcrição indisponível" (502)</b></summary>

Normalmente é a `GROQ_API_KEY` inválida ou revogada. Gere uma nova em <https://console.groq.com/keys>, atualize o `.env` e reinicie o backend. Também pode ser instabilidade da Groq: confira <https://groqstatus.com>.
</details>

<details>
<summary><b>"Limite de transcrições atingido" (429)</b></summary>

O plano gratuito da Groq tem limite de requisições por minuto e por dia. Aguarde alguns instantes e tente de novo.
</details>

<details>
<summary><b>Não consigo criar conta na Groq (<code>signup_blocked</code>)</b></summary>

Bloqueio antifraude da Groq. Desligue VPN ou proxy, troque de rede (ex.: 4G), use outro método de login ou uma aba anônima. Se persistir, contate o suporte da Groq informando o `trace_id` exibido.
</details>

<details>
<summary><b>Fui deslogado de repente</b></summary>

O token expirou (`JWT_EXPIRES_IN`, padrão de 1 dia) ou a conta foi excluída por um admin. Basta entrar de novo.
</details>

---

## 10. Segurança

- **Nunca commite o `.env`.** Ele já está no `.gitignore`; só o `.env.example`, com valores fictícios, é versionado.
- A **chave da Groq fica só no backend**. Ela não aparece no código do navegador, nas respostas da API nem nos logs.
- **Senhas** são salvas apenas como hash (bcrypt), e o hash nunca é retornado pela API.
- O **banco só escuta em `127.0.0.1`** e não fica exposto na rede.
- O **áudio enviado não é armazenado**: é processado em memória, enviado à Groq e descartado. Só o texto é salvo.
- Cada usuário só acessa as **próprias transcrições**. Tentar acessar a de outra pessoa retorna `404`.
- `synchronize: true` (criação automática de tabelas) só fica ativo em `NODE_ENV=development`. Para produção, use migrations.
