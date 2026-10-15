# Especificação do Projeto: Ditado

## 1. Visão Geral (O que construir)
O **Ditado** é uma aplicação web full stack de transcrição de áudio. O fluxo esperado é: o visitante conhece o produto numa landing page, cria uma conta e, na área interna, envia um arquivo de áudio e recebe o texto transcrito[cite: 35]. As transcrições devem ficar salvas em um histórico pessoal do usuário[cite: 35]. Além disso, deve existir um usuário administrador capaz de gerenciar as contas[cite: 35].

## 2. Pilha de Tecnologias (Como construir)
*   **Frontend:** React executado no navegador, empacotado via Vite (porta 5173), com TypeScript[cite: 27]. Estilização com Tailwind CSS v4, roteamento com `react-router-dom`, gerenciamento de estado do servdor com TanStack Query e estado de sessão/cliente com Zustand[cite: 27, 28]. Chamadas de API via `axios`[cite: 27].
*   **Backend:** API REST construída com NestJS (porta 3000), TypeScript, TypeORM e banco de dados PostgreSQL rodando em Docker (porta local 5432)[cite: 17, 20]. Autenticação baseada em JWT e senhas com hash via `bcryptjs`[cite: 20].
*   **Serviço Externo:** API da Groq (modelo Whisper) para processamento da transcrição de áudio[cite: 1, 14, 36].

## 3. Modelo de Dados
A aplicação utilizará o TypeORM com `synchronize: true` para gerar as tabelas no ambiente de desenvolvimento[cite: 21].

*   **Entidade User:**
    *   `id`: UUID (Chave Primária)
    *   `name`: string
    *   `email`: string (Único)
    *   `passwordHash`: string (A senha bruta nunca deve ser salva no banco[cite: 20])
    *   `role`: enum ('user', 'admin') - *O padrão no cadastro deve ser 'user', e o DTO de criação deve rejeitar a inserção manual deste campo[cite: 23].*

*   **Entidade Transcription:**
    *   `id`: UUID (Chave Primária)
    *   `text`: text (O texto retornado pela Groq)
    *   `userId`: Relacionamento (Muitos-para-Um com `User`)
    *   `createdAt`: timestamp

## 4. Contratos da API (REST)
O backend não guarda estado de sessão (stateless); todas as rotas protegidas exigem o token no cabeçalho `Authorization: Bearer <token>`[cite: 25].

*   **Autenticação e Usuários:**
    *   `POST /api/auth/login`: Recebe JSON com `email` e `password`. Retorna `200 OK` com os dados do usuário (sem o `passwordHash`) e o `accessToken`[cite: 21, 22].
    *   `POST /api/users`: Recebe JSON de cadastro. Retorna `201 Created`[cite: 20, 22].
*   **Transcrições:**
    *   `POST /api/transcriptions`: Rota protegida. Recebe o áudio via `multipart/form-data`[cite: 21]. O backend repassa o áudio à Groq, grava o texto no banco vinculado ao `@CurrentUser()` e retorna o JSON com o resultado[cite: 24, 25].
    *   `GET /api/transcriptions`: Rota protegida. Retorna `200 OK` com a lista de transcrições pertencentes ao usuário logado[cite: 20].

## 5. Estrutura de Telas (Frontend)
Todas as requisições HTTP do frontend devem usar o caminho relativo `/api` para que o proxy do Vite direcione para o backend (`localhost:3000`), evitando endereços absolutos no código do navegador[cite: 17, 19].

*   **`/`**: Landing Page de apresentação.
*   **`/entrar`**: Tela de Login e Cadastro (interação com AuthContext/Zustand para guardar o token)[cite: 27, 28].
*   **`/app`**: Área logada (Dashboard). Contém o formulário de upload de áudio e a exibição do histórico usando TanStack Query[cite: 28].
*   **`/admin`**: Tela restrita para gerenciar usuários (exclusiva para contas com `role = 'admin'`).

## 6. Critérios de Aceite Globais e Segurança (Para Revisão)
*   **Segurança de Credenciais:** O frontend não possui arquivos `.env` e nenhuma credencial ou chave da Groq deve vazar para o código do navegador[cite: 25]. A chave da Groq fica exclusivamente no backend[cite: 25].
*   **Vazamento de Dados:** O DTO e a camada de resposta devem garantir que o `passwordHash` jamais seja retornado em respostas HTTP[cite: 23].
*   **Isolamento de Dados:** Um usuário não pode acessar, listar ou excluir transcrições de outro usuário.
*   **Tratamento de Sessão:** O interceptador do `axios` deve capturar erros `401 Unauthorized`, limpar o token do `Zustand` e redirecionar o usuário para a rota `/entrar`[cite: 33].