# 03 — Estrutura de Pastas

> **Idioma:** pastas técnicas (`common`, `config`, `database`) e sufixos de papel (`service`,
> `controller`, `module`, `repository`, `dto`) em inglês; **nomes de domínio em português**
> (`animais`, `tutores`, `usuarios`, `adocoes`). Ver [07](./07-padroes-e-convencoes.md).

## Árvore do projeto

```
sos-bicho-solto-api/
├── docs/                          # esta documentação
├── prisma/
│   ├── schema.prisma              # modelo de dados (fonte da verdade do BD)
│   ├── migrations/                # migrations versionadas (geradas pelo Prisma)
│   └── seed.ts                    # dados iniciais (admin padrão, exemplos)
│
├── src/
│   ├── main.ts                    # bootstrap: CORS, ValidationPipe global, Swagger
│   ├── app.module.ts              # módulo raiz
│   ├── generated/prisma/          # client Prisma gerado (output) — NÃO versionar (.gitignore)
│   │
│   ├── config/                    # configuração de ambiente
│   │   ├── env.validation.ts      # validação das variáveis de ambiente
│   │   └── configuration.ts       # objeto de config tipado
│   │
│   ├── database/                  # camada de infraestrutura do ORM
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts      # PrismaClient como provider injetável
│   │
│   ├── common/                    # código transversal reutilizável
│   │   ├── decorators/
│   │   │   ├── perfis.decorator.ts        # @Perfis(Perfil.ADMIN)
│   │   │   ├── usuario-atual.decorator.ts # @UsuarioAtual()
│   │   │   └── public.decorator.ts        # @Public()
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── perfil.guard.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts      # log de requisições (NÃO embrulha a resposta)
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts   # padroniza resposta de erro
│   │   ├── dto/
│   │   │   └── paginacao.dto.ts            # ?page=&limit=
│   │   └── interfaces/
│   │       └── jwt-payload.interface.ts
│   │
│   └── modules/                   # um diretório por feature de domínio
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.service.spec.ts
│       │   ├── strategies/
│       │   │   └── jwt.strategy.ts
│       │   └── dto/
│       │       └── login.dto.ts
│       │
│       ├── usuarios/
│       │   ├── usuarios.module.ts
│       │   ├── usuarios.controller.ts
│       │   ├── usuarios.service.ts
│       │   ├── usuarios.service.spec.ts
│       │   ├── repositories/
│       │   │   ├── usuarios.repository.interface.ts
│       │   │   └── usuarios.prisma.repository.ts
│       │   └── dto/
│       │       ├── criar-usuario.dto.ts
│       │       └── atualizar-usuario.dto.ts
│       │
│       ├── tutores/               # mesma estrutura de usuarios/
│       ├── animais/              # mesma estrutura + dto de filtro + fotos
│       ├── adocoes/             # mesma estrutura + lógica de histórico
│       └── dashboard/
│           ├── dashboard.module.ts
│           ├── dashboard.controller.ts
│           ├── dashboard.service.ts
│           └── dashboard.service.spec.ts
│
├── test/                          # testes e2e (opcional no escopo)
│   └── app.e2e-spec.ts
│
├── .env                           # NÃO versionar
├── .env.example                   # versionar (sem valores reais)
├── .nvmrc                          # versão do Node (24) — padroniza o time
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── pnpm-lock.yaml                  # versionar (lockfile do pnpm)
├── prisma.config.ts               # Prisma 7: schema/migrations/seed + DATABASE_URL
├── tsconfig.json
└── README.md
```

## Anatomia padrão de um módulo de feature

Todo módulo de CRUD segue o **mesmo esqueleto** — isso facilita a divisão entre devs e a revisão:

```
modules/<dominio>/
├── <dominio>.module.ts             # declara controller, service e bind do repositório
├── <dominio>.controller.ts         # rotas HTTP + Swagger + guards
├── <dominio>.service.ts            # regra de negócio (camada testada)
├── <dominio>.service.spec.ts       # testes unitários do service
├── repositories/
│   ├── <dominio>.repository.interface.ts
│   └── <dominio>.prisma.repository.ts
└── dto/
    ├── criar-<dominio>.dto.ts
    ├── atualizar-<dominio>.dto.ts
    └── filtrar-<dominio>.dto.ts     # quando houver listagem com filtros
```

## Convenções de nomenclatura de arquivos

- Arquivos em **kebab-case** com sufixo do papel: `criar-animal.dto.ts`, `animais.service.ts`.
- Classes em **PascalCase** (domínio em PT): `AnimaisService`, `CriarAnimalDto`.
- Interface de repositório sempre prefixada com `I`: `IAnimaisRepository`.
- Token de injeção como `Symbol` exportado: `export const ANIMAIS_REPOSITORY = Symbol('ANIMAIS_REPOSITORY')`.
- Testes sempre ao lado do arquivo testado, com sufixo `.spec.ts`.

## Onde cada coisa NÃO deve estar

- ❌ Prisma Client importado dentro de Controller ou Service → só no Repository.
- ❌ Regra de negócio no Controller → vai para o Service.
- ❌ DTO usado como tipo de retorno do banco → DTO é só para a borda (entrada/saída HTTP).
- ❌ Lógica duplicada entre módulos → extrair para `common/`.
