# 02 — Arquitetura

## Visão em camadas

A API segue uma arquitetura em camadas, organizada por **feature module** (um módulo por recurso de domínio).
Cada requisição percorre as camadas abaixo:

```
HTTP Request
   │
   ▼
┌───────────────┐   Controller        → recebe a requisição, valida o DTO (via Pipe),
│  Controller   │                       delega ao Service. NÃO contém regra de negócio.
└───────┬───────┘
        ▼
┌───────────────┐   Service           → orquestra regra de negócio, coordena repositórios,
│   Service     │                       lança exceções de domínio. É a camada TESTADA.
└───────┬───────┘
        ▼
┌───────────────┐   Repository        → única camada que conhece o Prisma.
│  Repository   │   (interface +        Abstrai o acesso a dados (Repository Pattern).
└───────┬───────┘    implementação)
        ▼
┌───────────────┐
│  Prisma /     │   Banco de dados PostgreSQL
│  PostgreSQL   │
└───────────────┘
```

Camadas transversais (cross-cutting), aplicadas globalmente: **Guards** (auth/roles),
**Pipes** (validação), **Interceptors** (logging — **não** embrulham a resposta; ver [07](./07-padroes-e-convencoes.md)),
**Filters** (tratamento de erro).

## Repository Pattern

A camada de acesso a dados é abstraída por uma **interface** que o Service consome. A implementação
concreta usa o Prisma. Isso isola o domínio do ORM e permite **mockar o repositório nos testes**.

```
modules/animais/
├── repositories/
│   ├── animais.repository.interface.ts   # contrato (porta)
│   └── animais.prisma.repository.ts       # implementação com Prisma (adaptador)
├── animais.service.ts                     # depende da INTERFACE, não do Prisma
```

Exemplo de contrato:

```ts
// animais.repository.interface.ts
export const ANIMAIS_REPOSITORY = Symbol("ANIMAIS_REPOSITORY");

export interface IAnimaisRepository {
  criar(dados: CriarAnimalData): Promise<Animal>;
  listar(filtro: FiltroAnimal): Promise<Animal[]>;
  buscarPorId(id: string): Promise<Animal | null>;
  atualizar(id: string, dados: AtualizarAnimalData): Promise<Animal>;
  desativar(id: string): Promise<void>; // soft delete (ativo = false)
}
```

Registro no módulo (injeção por token):

```ts
@Module({
  controllers: [AnimaisController],
  providers: [
    AnimaisService,
    { provide: ANIMAIS_REPOSITORY, useClass: AnimaisPrismaRepository },
  ],
})
export class AnimaisModule {}
```

No Service:

```ts
constructor(
  @Inject(ANIMAIS_REPOSITORY)
  private readonly animaisRepository: IAnimaisRepository,
) {}
```

## Como aplicamos SOLID

| Princípio                     | Aplicação no projeto                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| **S** — Single Responsibility | Controller só lida com HTTP; Service só com regra de negócio; Repository só com dados.      |
| **O** — Open/Closed           | Novos repositórios/estratégias adicionados sem alterar o Service (depende da interface).    |
| **L** — Liskov                | Qualquer implementação de `I...Repository` substitui a outra (Prisma real ↔ mock de teste). |
| **I** — Interface Segregation | Interfaces de repositório enxutas, só com os métodos que aquele recurso usa.                |
| **D** — Dependency Inversion  | Services dependem de **abstrações** (interfaces + tokens), não de implementações concretas. |

## Módulos da aplicação

| Módulo            | Responsabilidade                                         |
| ----------------- | -------------------------------------------------------- |
| `AppModule`       | Raiz; importa config, database e os módulos de feature   |
| `ConfigModule`    | Carrega e valida variáveis de ambiente                   |
| `PrismaModule`    | Expõe o `PrismaService` (singleton) para os repositórios |
| `AuthModule`      | Login, emissão e validação de JWT, estratégias Passport  |
| `UsuariosModule`  | CRUD de usuários do sistema                              |
| `TutoresModule`   | CRUD de tutores (adotantes)                              |
| `AnimaisModule`   | CRUD de animais + fotos (status muda via adoção)         |
| `AdocoesModule`   | Processo de adoção + histórico de status                 |
| `DashboardModule` | Consultas agregadas (métricas)                           |

## Tratamento de erros

- Erros de domínio usam as **exceptions do NestJS** (`NotFoundException`, `ConflictException`,
  `ForbiddenException`, `BadRequestException`).
- Um **Exception Filter global** padroniza o corpo da resposta de erro (ver [07](./07-padroes-e-convencoes.md)).
- Nunca vazar detalhes internos (stack trace, query) na resposta de produção.

## Fluxo de exemplo — criar adoção

1. `POST /adocoes` chega ao `AdocoesController` com `RegistrarAdocaoDto` (`{ animalId, tutorId, observacoes }`).
2. `ValidationPipe` valida o DTO; `JwtAuthGuard` confirma o usuário (protetor) logado.
3. `AdocoesService` verifica: animal existe e está `ACOLHIMENTO`? tutor existe/ativo (RN07)?
   (o `AdocoesModule` importa `AnimaisModule`/`TutoresModule`, que **exportam** seus repositórios.)
4. Em transação: seta `animal.tutorId`, muda status para `ADOTADO` e cria a linha em `adocoes`
   (`protetorId` = usuário logado).
5. Repositórios persistem via Prisma.
6. O controller retorna o recurso (sem envelope global — ver [07](./07-padroes-e-convencoes.md)); Nest responde `201`.
