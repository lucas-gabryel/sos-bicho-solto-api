# SOS Bicho Solto API

API REST para gestão de uma ONG de resgate e adoção de animais. Permite o cadastro de animais resgatados, tutores e usuários, o registro de adoções e o acompanhamento de indicadores por meio de um dashboard.

## Tecnologias

- **[NestJS 11](https://nestjs.com/)** — framework Node.js para aplicações server-side
- **[Prisma 7](https://www.prisma.io/)** — ORM para acesso ao banco de dados
- **PostgreSQL** — banco de dados relacional
- **JWT + Passport** — autenticação e autorização
- **bcrypt** — hash de senhas
- **Swagger (OpenAPI)** — documentação da API
- **Jest** — testes automatizados
- **TypeScript**

## Arquitetura

O projeto segue a organização modular do NestJS. Cada módulo de domínio é dividido em controller, service, repository e DTOs.

```
src/
├── common/          # DTOs, filtros, interceptors, guards e decorators compartilhados
├── config/          # Configurações da aplicação
├── database/        # Configuração do Prisma e acesso ao banco
└── modules/
    ├── auth/        # Autenticação (login, JWT, estratégias)
    ├── usuarios/    # Usuários do sistema (protetores e administradores)
    ├── tutores/     # Tutores responsáveis pelas adoções
    ├── animais/     # Animais resgatados
    ├── adocoes/     # Registro de adoções
    ├── dashboard/   # Indicadores e métricas
    └── health/      # Verificação de saúde da aplicação
```

## Modelo de dados

- **Usuario** — usuários do sistema, com perfil `ADMIN` ou `PROTETOR`.
- **Tutor** — pessoas que adotam animais (CPF, contato e endereço).
- **Animal** — animais resgatados, com espécie, status (`ACOLHIMENTO` ou `ADOTADO`) e fotos.
- **Adocao** — vincula um animal a um tutor e ao protetor responsável pelo registro.
- **FotoAnimal** — fotos associadas a cada animal.

O schema completo está em [`prisma/schema.prisma`](prisma/schema.prisma).

## Pré-requisitos

- Node.js 20 ou superior
- PostgreSQL
- pnpm

## Configuração

1. Clone o repositório e instale as dependências:

   ```bash
   pnpm install
   ```

2. Crie um arquivo `.env` na raiz do projeto com as variáveis necessárias:

   ```env
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/sos_bicho_solto"
   JWT_SECRET="sua_chave_secreta"
   PORT=3000
   CORS_ORIGIN="http://localhost:3000"
   ```

3. Aplique as migrations no banco de dados:

   ```bash
   npx prisma migrate deploy
   ```

## Execução

```bash
# Desenvolvimento (com hot reload)
pnpm start:dev

# Produção
pnpm build
pnpm start:prod
```

A aplicação ficará disponível em `http://localhost:3000` (ou na porta definida em `PORT`).

## Documentação da API

Com a aplicação em execução, a documentação interativa (Swagger) fica disponível em:

```
http://localhost:3000/docs
```

## Testes

```bash
# Testes unitários
pnpm test

# Testes com relatório de cobertura
pnpm test:cov

# Testes end-to-end
pnpm test:e2e
```

## Scripts disponíveis

| Script            | Descrição                            |
| ----------------- | ------------------------------------ |
| `pnpm start:dev`  | Inicia em modo de desenvolvimento    |
| `pnpm start:prod` | Inicia a versão compilada            |
| `pnpm build`      | Compila o projeto                    |
| `pnpm lint`       | Executa o ESLint e corrige problemas |
| `pnpm format`     | Formata o código com Prettier        |
| `pnpm test`       | Executa os testes unitários          |
| `pnpm test:cov`   | Executa os testes com cobertura      |
| `pnpm test:e2e`   | Executa os testes end-to-end         |
