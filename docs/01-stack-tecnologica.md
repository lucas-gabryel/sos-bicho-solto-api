# 01 — Stack Tecnológica

## Resumo

| Camada                 | Escolha                             | Versão alvo                        |
| ---------------------- | ----------------------------------- | ---------------------------------- |
| Runtime                | Node.js                             | 24 LTS (fixada via `.nvmrc`)       |
| Linguagem              | TypeScript                          | 5.x                                |
| Framework              | NestJS                              | 11.x                               |
| Banco de dados         | PostgreSQL                          | 16.x                               |
| ORM                    | Prisma                              | 6.x                                |
| Autenticação           | Passport + JWT                      | `@nestjs/passport`, `passport-jwt` |
| Hash de senha          | bcrypt                              | `bcrypt`                           |
| Validação              | class-validator + class-transformer | —                                  |
| Documentação da API    | Swagger (OpenAPI)                   | `@nestjs/swagger`                  |
| Testes                 | Jest                                | (vem com NestJS)                   |
| Lint/Format            | ESLint + Prettier                   | (vem com NestJS)                   |
| Gerenciador de pacotes | pnpm                                | 9+ (10 recomendado)                |

### Versão do Node (padronizar entre os 3 devs)

Node 20 e 24 são ambos LTS; usamos o **24** por ser a LTS mais nova (melhor performance e `fetch`
nativo) e por já estar instalado no time. Para garantir que todos usem a mesma versão:

- Criar um arquivo **`.nvmrc`** na raiz com o conteúdo `24` (quem usa `nvm` roda `nvm use`).
- Declarar no `package.json`:
  ```json
  { "engines": { "node": ">=20" } }
  ```
  > `engines` é o **mínimo suportado**; a versão **fixada/recomendada** é a 24 (via `.nvmrc` e o
  > `node:24-alpine` do Dockerfile). Não é contradição: mínimo ≠ versão padrão do time.

## Justificativas

### Por que Prisma?

- Schema declarativo único (`schema.prisma`) — fácil de revisar em grupo.
- Migrations versionadas e geração automática de client tipado.
- Excelente DX para um time aprendendo backend, com menos boilerplate que TypeORM.
- O **Repository Pattern** é implementado por cima do Prisma Client (ver [02](./02-arquitetura.md)),
  então o requisito do trabalho continua atendido.

### Por que PostgreSQL?

- Padrão de mercado, gratuito e com bom suporte em hosts com free tier (Neon, Supabase, Railway, Render).
- Suporta enums nativos, índices e tipos numéricos precisos (`Decimal`).

### Por que JWT (sem refresh token)?

- Atende "autenticação de usuários" e "controle de permissões por perfil" com simplicidade.
- Refresh token adicionaria complexidade desnecessária para o escopo da disciplina.

### Por que Swagger?

- Gera documentação interativa da API a partir dos DTOs e decorators.
- Facilita a integração com o frontend (contrato visível em `/docs` da API).

## Dependências principais (instalação)

> Comandos de referência (com **pnpm**). A execução real faz parte da tarefa de _setup_ (ver [10](./10-divisao-de-tarefas.md)).

```bash
# Criação do projeto já usando pnpm como gerenciador
pnpm dlx @nestjs/cli new sos-bicho-solto-api --package-manager pnpm

# Prisma
pnpm add -D prisma
pnpm add @prisma/client
pnpm prisma init --datasource-provider postgresql

# Auth e segurança
pnpm add @nestjs/passport passport passport-jwt @nestjs/jwt bcrypt
pnpm add -D @types/passport-jwt @types/bcrypt

# Validação e config
pnpm add class-validator class-transformer @nestjs/config

# Swagger
pnpm add @nestjs/swagger

# ts-node (para rodar o prisma/seed.ts)
pnpm add -D ts-node
```

> Comandos de binários locais com pnpm: usar `pnpm <bin>` (ex.: `pnpm prisma migrate dev`,
> `pnpm nest start`). O `pnpm dlx` baixa e executa um pacote sem instalar (equivale ao `npx`).

### ⚠️ Pegadinha do pnpm 10 — liberar scripts de build

Por segurança, o **pnpm 10 não roda scripts de instalação (`postinstall`) das dependências por padrão**.
Isso quebra pacotes que precisam compilar/baixar artefatos — no nosso caso **`bcrypt`** (módulo nativo)
e **Prisma** (baixa engines e gera o client). Solução:

1. Após o primeiro `pnpm install`, rodar **`pnpm approve-builds`** e aprovar `bcrypt`, `prisma` e
   `@prisma/client`;

## Variáveis de ambiente (`.env`)

| Variável         | Exemplo                                                               | Descrição                           |
| ---------------- | --------------------------------------------------------------------- | ----------------------------------- |
| `DATABASE_URL`   | `postgresql://user:pass@localhost:5432/sos_bicho_solto?schema=public` | Conexão Postgres                    |
| `JWT_SECRET`     | `troque-isto-por-um-segredo-forte`                                    | Segredo de assinatura do JWT        |
| `JWT_EXPIRES_IN` | `1d`                                                                  | Validade do token                   |
| `PORT`           | `3000`                                                                | Porta da API                        |
| `CORS_ORIGIN`    | `http://localhost:5173`                                               | Origem do frontend liberada no CORS |

> Versionar **apenas** o `.env.example` (sem valores reais). Ver [07](./07-padroes-e-convencoes.md).
