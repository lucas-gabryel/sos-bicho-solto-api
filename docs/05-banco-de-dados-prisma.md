# 05 — Banco de Dados (Prisma)

> Domínio em **português** (campos e valores de enum). Os nomes técnicos do Prisma (`@id`, `@map`,
> `@relation`) permanecem como são. Alinhado ao [04 — Modelo de Dados](./04-modelo-de-dados.md),
> aos requisitos (RF/RN) e às `services` do front.

## `prisma/schema.prisma`

> Fonte da verdade do banco. Qualquer mudança no modelo começa aqui e gera uma migration.

> **Prisma 7 (setup adotado):**
>
> - Gerador **clássico** `prisma-client-js` com **`output` para `src/generated/prisma`** — em projeto
>   **pnpm**, o `@prisma/client` padrão reexporta de `.prisma/client`, que o editor/TS não resolve
>   (dá "has no exported member"); com output dentro do projeto isso some. Importe de `src/generated/prisma`.
> - A `DATABASE_URL` fica no **`prisma.config.ts`** (o `datasource` só tem `provider`).
> - A conexão em runtime é por **driver adapter** (`@prisma/adapter-pg`) — no Prisma 7 o
>   `new PrismaClient()` não aceita url direta, exige o adapter.

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ──────────────── ENUMS ────────────────

enum Perfil {
  ADMIN
  PROTETOR
}

enum EspecieAnimal {
  CAO  // RN12 — apenas Cão
  GATO // RN12 — apenas Gato
}

enum SexoAnimal {
  MACHO
  FEMEA
}

enum PorteAnimal {
  PEQUENO
  MEDIO
  GRANDE
}

enum StatusAnimal {
  ACOLHIMENTO
  ADOTADO
}

// ──────────────── MODELS ────────────────

model Usuario {
  id           String   @id @default(uuid())
  codigo       Int      @unique @default(autoincrement())
  nome         String
  email        String   @unique
  senhaHash    String   @map("senha_hash")
  perfil       Perfil   @default(PROTETOR)
  // campos padrão (auditoria + soft delete) — ver doc 04
  ativo           Boolean  @default(true)
  criadoEm        DateTime @default(now()) @map("criado_em")
  criadoPorId     String?  @map("criado_por_id")
  modificadoEm    DateTime @updatedAt @map("modificado_em")
  modificadoPorId String?  @map("modificado_por_id")

  adocoesRegistradas Adocao[] @relation("AdocaoProtetor")

  @@map("usuarios")
}

model Tutor {
  id             String   @id @default(uuid())
  codigo         Int      @unique @default(autoincrement())
  nome           String
  cpf            String   @unique
  telefone       String
  email          String   @unique
  endereco       String
  dataNascimento DateTime @map("data_nascimento") @db.Date
  // campos padrão (auditoria + soft delete) — ver doc 04
  ativo           Boolean  @default(true)
  criadoEm        DateTime @default(now()) @map("criado_em")
  criadoPorId     String?  @map("criado_por_id")
  modificadoEm    DateTime @updatedAt @map("modificado_em")
  modificadoPorId String?  @map("modificado_por_id")

  animais  Animal[] // vínculo atual (animais adotados por este tutor)
  adocoes  Adocao[] // histórico

  @@map("tutores")
}

model Animal {
  id             String        @id @default(uuid())
  numeroRegistro String        @unique @map("numero_registro") // DD.MM.AAAA.N — imutável (RN04)
  nome           String
  especie        EspecieAnimal
  raca           String
  sexo           SexoAnimal
  porte          PorteAnimal?
  cor            String
  pesoInicial    Decimal       @map("peso_inicial") @db.Decimal(5, 2)
  pesoAtual      Decimal?      @map("peso_atual") @db.Decimal(5, 2)
  dataNascimento DateTime?     @map("data_nascimento") @db.Date
  castrado       Boolean       @default(false)
  vacinado       Boolean       @default(false)
  localResgate   String        @map("local_resgate")
  observacoes    String?
  status         StatusAnimal  @default(ACOLHIMENTO)
  tutorId        String?       @map("tutor_id") // RN06 — nullable
  // campos padrão (auditoria + soft delete) — ver doc 04
  ativo           Boolean  @default(true)
  criadoEm        DateTime @default(now()) @map("criado_em")
  criadoPorId     String?  @map("criado_por_id")
  modificadoEm    DateTime @updatedAt @map("modificado_em")
  modificadoPorId String?  @map("modificado_por_id")

  tutor   Tutor?       @relation(fields: [tutorId], references: [id])
  fotos   FotoAnimal[]
  adocoes Adocao[]

  @@index([status])
  @@index([especie])
  @@index([tutorId])
  @@map("animais")
}

model FotoAnimal {
  id        String   @id @default(uuid())
  animalId  String   @map("animal_id")
  url       String
  principal Boolean  @default(false)
  // campos padrão (auditoria + soft delete) — ver doc 04
  ativo           Boolean  @default(true)
  criadoEm        DateTime @default(now()) @map("criado_em")
  criadoPorId     String?  @map("criado_por_id")
  modificadoEm    DateTime @updatedAt @map("modificado_em")
  modificadoPorId String?  @map("modificado_por_id")

  // Cascade é só rede de segurança: o animal normalmente é soft delete (ativo=false),
  // então o cascade só dispara num eventual hard delete/limpeza (ex.: prisma migrate reset).
  animal Animal @relation(fields: [animalId], references: [id], onDelete: Cascade)

  @@index([animalId])
  @@map("fotos_animal")
}

// Linha de ciclo de adoção: criada na adoção e "fechada" na devolução (devolvidoEm).
// Não usa ativo/modificado*; dataAdocao marca o evento (sem criadoEm redundante).
model Adocao {
  id                   String    @id @default(uuid())
  animalId             String    @map("animal_id")
  tutorId              String    @map("tutor_id")
  protetorId           String    @map("protetor_id") // usuário que registrou a adoção
  dataAdocao           DateTime  @default(now()) @map("data_adocao")
  observacoes          String?
  devolvidoEm          DateTime? @map("devolvido_em")            // null = adoção ativa
  devolvidoPorId       String?   @map("devolvido_por_id")        // coluna simples (mesma convenção dos *PorId)
  observacoesDevolucao String?   @map("observacoes_devolucao")

  animal   Animal  @relation(fields: [animalId], references: [id])
  tutor    Tutor   @relation(fields: [tutorId], references: [id])
  protetor Usuario @relation("AdocaoProtetor", fields: [protetorId], references: [id])

  @@index([animalId])
  @@index([tutorId])
  @@map("adocoes")
}
```

> ⚠️ **Nota sobre `codigo` (sequencial):** usamos `Int @unique @default(autoincrement())` em campo que
> **não é** `@id`. Em PostgreSQL isso funciona (cria uma sequence), mas se o Prisma reclamar de
> `autoincrement()` fora do `@id`, a alternativa é criar a sequence no banco e usar
> `@default(dbgenerated("nextval('usuarios_codigo_seq')"))`. Validar isso no setup.

## Configuração do Prisma 7 (`prisma.config.ts`)

No Prisma 7, a conexão e os caminhos ficam no **`prisma.config.ts`** na raiz (não mais no `datasource`):

```ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env['DATABASE_URL'] },
});
```

## `PrismaService` (com driver adapter)

O `PrismaService` estende o `PrismaClient` (de `src/generated/prisma`) e recebe o **adapter** com a `DATABASE_URL`:

```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma'; // output do gerador (não @prisma/client)
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  }
  async onModuleInit() {
    await this.$connect();
  }
}
```

> Tipos (`Animal`, `Usuario`, enums como `Perfil`...) também vêm de `src/generated/prisma`.
> Dica: criar um alias no `tsconfig` (ex.: `@db → src/generated/prisma`) para encurtar os imports.
> Em produção, garanta `DATABASE_URL` no ambiente (idealmente via `ConfigService`).

## `numeroRegistro` do animal (`DD.MM.AAAA.N`)

O `numeroRegistro` **não** é gerado pelo banco — é montado no `AnimaisService` no momento da criação
(RN04) e **nunca** é alterado depois (bloquear no update; RNF02 deixa read-only no front):

- `DD.MM.AAAA` = data de cadastro.
- `N` = sequência **daquele dia** (1, 2, 3...). Calcular contando quantos animais já foram criados na
  mesma data e somando 1 — **dentro de uma transação** para evitar duplicidade em cadastros simultâneos.
- O front já espera esse formato (ex.: `06.05.2026.1`).

## Primeira migration

Após configurar `DATABASE_URL` no `.env`:

```bash
pnpm prisma migrate dev --name init   # cria e aplica a migration inicial
pnpm prisma generate                  # gera o Prisma Client tipado (roda junto no comando acima)
```

Gera `prisma/migrations/<timestamp>_init/migration.sql` — **deve ser versionado**.
Em produção: `pnpm prisma migrate deploy`.

## Seed inicial (`prisma/seed.ts`)

Cria os usuários padrão (alinhados aos do front) e alguns animais de exemplo.

```ts
import 'dotenv/config';
import { PrismaClient, Perfil, EspecieAnimal, SexoAnimal, StatusAnimal } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

// Prisma 7: conexão via driver adapter (PrismaPg) com a DATABASE_URL.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.usuario.upsert({
    where: { email: 'admin@sosbichosolto.com' },
    update: {},
    create: {
      nome: 'Malba Vinicius',
      email: 'admin@sosbichosolto.com',
      senhaHash: await bcrypt.hash('Admin@123', 10),
      perfil: Perfil.ADMIN,
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'protetor@sosbichosolto.com' },
    update: {},
    create: {
      nome: 'Paula Freitas',
      email: 'protetor@sosbichosolto.com',
      senhaHash: await bcrypt.hash('Protetor@123', 10),
      perfil: Perfil.PROTETOR,
    },
  });

  await prisma.animal.upsert({
    where: { numeroRegistro: '06.05.2026.1' },
    update: {},
    create: {
      numeroRegistro: '06.05.2026.1',
      nome: 'Rex',
      especie: EspecieAnimal.CAO,
      raca: 'SRD',
      sexo: SexoAnimal.MACHO,
      cor: 'Caramelo',
      pesoInicial: 7.2,
      pesoAtual: 8.1,
      localResgate: 'Centro, Arapiraca/AL',
      observacoes: 'Em tratamento de verminose, recuperação bem-sucedida.',
      status: StatusAnimal.ACOLHIMENTO,
      fotos: { create: [{ url: 'https://exemplo.com/rex.jpg', principal: true }] },
    },
  });

  console.log('Seed concluído. Admin: admin@sosbichosolto.com / Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

No Prisma 7, o comando de seed é declarado no **`prisma.config.ts`** (não mais no `package.json`):

```ts
// prisma.config.ts
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: { url: process.env['DATABASE_URL'] },
});
```

Executar:

```bash
pnpm prisma db seed
```

> Se a chave `seed` exata mudar entre versões do Prisma 7, conferir `pnpm prisma db seed --help`.

> ⚠️ **Trocar as senhas padrão** em produção e nunca commitar credenciais reais.

## Comandos úteis do Prisma

| Comando | Uso |
|---------|-----|
| `pnpm prisma studio` | UI web para inspecionar/editar dados |
| `pnpm prisma migrate dev --name <nome>` | Cria e aplica migration em dev |
| `pnpm prisma migrate deploy` | Aplica migrations pendentes (produção) |
| `pnpm prisma migrate reset` | Recria o banco do zero e roda o seed (⚠️ apaga tudo) |
| `pnpm prisma generate` | Regenera o client tipado |
| `pnpm prisma format` | Formata o `schema.prisma` |
