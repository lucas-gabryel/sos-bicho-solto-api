# 10 — Divisão de Tarefas (3 devs)

## Princípio da divisão

Dividimos por **fatias verticais** (cada dev é dono de módulos completos: controller → service →
repository → DTOs → testes). Isso reduz conflito de merge e dá autonomia. Antes disso, há uma
**fase 0 compartilhada** que precisa estar pronta para todos destravarem.

## Fase 0 — Fundação (todos juntos / pair, ~1 dia)

Feita em conjunto no início porque tudo depende dela:

- [ ] `nest new` + estrutura de pastas do [doc 03](./03-estrutura-de-pastas.md)
- [ ] Configurar Prisma + `schema.prisma` do [doc 05](./05-banco-de-dados-prisma.md)
- [ ] Primeira migration (`migrate dev --name init`) + seed do admin
- [ ] `ConfigModule` + `.env.example` + validação de env
- [ ] `PrismaModule` / `PrismaService`
- [ ] `main.ts`: `ValidationPipe` global, CORS, Swagger
- [ ] `common/`: Exception Filter, Transform Interceptor, `PaginacaoDto`
- [ ] Repositório Git criado (branch `main`, proteção via PR), `.gitignore`

> **Recomendação:** o Dev A lidera a Fase 0, mas todos acompanham para entender a base.

---

## Dev A — Auth, Usuários e Infra

**Responsável pela espinha dorsal de segurança e pela base compartilhada.**

- [ ] `AuthModule`: `POST /auth/login`, `GET /auth/me`
- [ ] `JwtStrategy`, `JwtAuthGuard`, `PerfilGuard`
- [ ] Decorators `@Perfis`, `@UsuarioAtual`, `@Public`
- [ ] `UsuariosModule`: CRUD completo (somente ADMIN) + desativação lógica
- [ ] Hash de senha com bcrypt
- [ ] Testes: `AuthService`, `UsuariosService`
- [ ] Manutenção do `common/` e do `PrismaModule`

**Entrega de interface para o time:** Guards e decorators prontos para B e C protegerem suas rotas.

---

## Dev B — Animais e Tutores

**Responsável pelos cadastros de domínio.**

- [ ] `AnimaisModule`: CRUD + listagem com filtros (espécie, status, etc.) + paginação + fotos
- [ ] `TutoresModule`: CRUD + validação de CPF/e-mail únicos
- [ ] Repositórios (interface + implementação Prisma) de ambos
- [ ] **Exportar** os repositórios nos módulos (`exports: [...]`) para o `AdocoesModule` (Dev C) usar
- [ ] DTOs de criar/atualizar/filtrar
- [ ] Testes: `AnimaisService`, `TutoresService`

> Obs.: o status do animal (`ACOLHIMENTO`/`ADOTADO`) é alterado pelo fluxo de adoção (Dev C),
> não por um endpoint manual de status.

**Depende de:** Guards do Dev A (mas pode começar com as rotas e plugar os guards depois).

---

## Dev C — Adoções, Histórico e Dashboard

**Responsável pelo coração das regras de negócio e pela camada de métricas.**

- [ ] `AdocoesModule` + `AdocoesController` (dono do recurso `/adocoes`): registrar adoção e devolução (RN06, RN07)
- [ ] `AdocoesModule` **importa** `AnimaisModule` e `TutoresModule` e injeta os repositórios deles
- [ ] Em transação: setar `animal.tutorId` + status `ADOTADO` + criar linha em `adocoes`
- [ ] Devolução: fechar a linha (`devolvidoEm`/`devolvidoPorId`) e voltar o animal para `ACOLHIMENTO`
- [ ] Listagem de **histórico de adoções** (tabela `adocoes`, filtros por período/tutor/animal)
- [ ] `DashboardModule`: métricas (`totalAnimais`, `emAcolhimento`, `adotados`, `tutores`)
- [ ] Testes: `AdocoesService` (foco nas regras), `DashboardService`

**Depende de:** `AnimaisModule` e `TutoresModule` (Dev B, que precisam **exportar** seus repositórios)
e dos Guards (Dev A). Pode iniciar mockando repositórios enquanto B finaliza.

---

## Tarefas transversais (divididas no fim)

| Tarefa                                                               | Sugestão de responsável                        |
| -------------------------------------------------------------------- | ---------------------------------------------- |
| Mapeamento de endpoints com o frontend ([doc 11](./11-endpoints.md)) | Todos (sessão conjunta)                        |
| Integração frontend ↔ backend                                        | Dev que fez o módulo correspondente            |
| Deploy do backend + banco                                            | Dev A                                          |
| Deploy do frontend                                                   | Dev B                                          |
| README final + entrega na plataforma                                 | Dev C                                          |
| Revisão de PRs                                                       | Rotativo (sempre 1 revisor diferente do autor) |

## Dependências entre módulos (ordem de integração)

```
Fase 0 (base)
   │
   ├─▶ Dev A: Auth + Usuários  ──┐
   │                             ├─▶ Dev C: Adoções + Dashboard
   └─▶ Dev B: Animais + Tutores ─┘
```

## Cronograma sugerido (ajustar à realidade do grupo)

| Semana | Foco                                           |
| ------ | ---------------------------------------------- |
| 1      | Fase 0 + skeleton dos módulos de cada dev      |
| 2      | CRUDs (A, B) e início das adoções (C)          |
| 3      | Regras de negócio, testes unitários, dashboard |
| 4      | Integração com o frontend                      |
| 5      | Deploy, ajustes finais e entrega               |

## Definition of Done (por módulo)

- [ ] Controller + Service + Repository (interface + impl) implementados
- [ ] DTOs com validação `class-validator`
- [ ] Rotas protegidas pelos guards/roles corretos
- [ ] Testes unitários do Service passando (cobertura adequada)
- [ ] Documentado no Swagger
- [ ] PR revisado e mergeado na `main`
