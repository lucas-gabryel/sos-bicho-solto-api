# 04 — Modelo de Dados

> **Idioma:** domínio em **português** (entidades, campos e valores de enum). Estrutura técnica
> (Service, Controller, Repository, DTO) permanece em inglês. Ver [07](./07-padroes-e-convencoes.md).
>
> Este modelo foi **alinhado com o documento de requisitos (RF/RN/RNF)** e com as `services` do
> frontend (que hoje usam dados mocados). As referências `RNxx`/`RFxx` apontam para os requisitos.

## Entidades

| Entidade       | Papel                                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| **Usuario**    | Quem opera o sistema (equipe). Faz login. Perfis `ADMIN`/`PROTETOR`.            |
| **Tutor**      | Pessoa que adota. Não faz login (RN09 — tudo via módulo interno).               |
| **Animal**     | Animal resgatado. Pode estar `ACOLHIMENTO` ou `ADOTADO`.                        |
| **FotoAnimal** | Fotos do animal (1 principal + N adicionais). _Modelo a refinar._               |
| **Adocao**     | **Histórico** de cada adoção (vínculo animal↔tutor registrado por um protetor). |

## Estratégia de identificadores

Toda entidade tem **dois** (ou três, no caso do animal) identificadores:

| Identificador    | Tipo                      | Uso                                                                                           |
| ---------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| `id`             | **UUID**                  | Chave primária. Usado nas **relações (FKs)** e nas **URLs** (`/tutores/:id`). Opaco.          |
| `codigo`         | **Int sequencial** (auto) | Identificador **amigável** para o usuário buscar/exibir (1, 2, 3...). Em **tutor e usuário**. |
| `numeroRegistro` | **String `DD.MM.AAAA.N`** | **Só no animal** (RN04). Imutável após criação (RNF02).                                       |

**Por que assim?** O usuário nunca digita um UUID; ele busca por `codigo` (tutor/usuário), por
`numeroRegistro` (animal) ou por CPF/nome (tutor — RN11). Mas internamente e nas URLs usamos o UUID,
que é estável e não enumerável. O front já carrega o objeto inteiro, então navega pelo `uuid` mesmo
exibindo o identificador amigável. Busca é sempre por **query param** (`GET /tutores?busca=...`).

> O animal **não** tem `codigo` inteiro: o `numeroRegistro` já é o identificador amigável dele.

## Campos padrão (auditoria + soft delete) — em todas as entidades

Toda entidade carrega este conjunto de campos, **além** dos campos próprios listados no dicionário.
Para não repetir em cada tabela, o dicionário abaixo cita apenas "_(+ campos padrão)_".

| Campo             | Tipo                     | Como é preenchido                                                                                             |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `ativo`           | boolean (default `true`) | **Soft delete**: "excluir" = setar `ativo = false`. Listagens/buscas filtram `ativo = true` por padrão.       |
| `criadoEm`        | datetime                 | Automático na criação (`@default(now())`).                                                                    |
| `criadoPorId`     | UUID?                    | Usuário que criou — **preenchido pela aplicação** a partir do token (JWT). Nulo em registros de seed/sistema. |
| `modificadoEm`    | datetime                 | Automático a cada update (`@updatedAt`).                                                                      |
| `modificadoPorId` | UUID?                    | Usuário da última modificação — preenchido pela aplicação.                                                    |

**Decisões desta convenção:**

- `criadoPorId`/`modificadoPorId` guardam o **UUID do Usuario**, mas como **coluna simples (sem FK
  formal)** — assim a entidade `Usuario` não fica inflada com dezenas de relações reversas. Integridade
  por convenção; se um dia quisermos FK real, dá para adicionar. (`criadoEm`/`modificadoEm` são
  automáticos; o "quem" não tem como o banco preencher sozinho — é a aplicação que seta, a partir do
  usuário logado, idealmente via uma _Prisma extension_/interceptor para não esquecer.)
- **Soft delete e campos únicos:** um registro inativo **ainda ocupa** valores únicos (`email`, `cpf`,
  `numeroRegistro`). Se no futuro for preciso reaproveitar um e-mail/CPF de registro "excluído",
  tratamos isso à parte. Para o escopo atual, tudo bem.
- **`Adocao` é exceção:** é um **registro de ciclo de adoção** (criado na adoção, fechado na devolução
  via `devolvidoEm`). Não usa `ativo`/`modificado*` nem `criadoEm` — `dataAdocao` marca o evento, e
  `protetorId`/`devolvidoPorId` registram quem fez cada ação.

## Diagrama de entidades (ER)

```
┌──────────────┐         ┌──────────────────────────┐         ┌──────────────────┐
│   Usuario    │         │         Adocao            │         │      Tutor       │
│──────────────│         │  (histórico de adoções)   │         │──────────────────│
│ id (PK,uuid) │1      * │──────────────────────────│ *      1│ id (PK, uuid)    │
│ codigo (UQ)  │─────────│ id (PK, uuid)             │─────────│ codigo (UQ)      │
│ nome         │registra │ animalId   (FK Animal)    │  adota  │ nome / cpf (UQ)  │
│ email (UQ)   │(protetor│ tutorId    (FK Tutor)     │         │ telefone / email │
│ senhaHash    │   Id)   │ protetorId (FK Usuario)   │         │ endereco         │
│ perfil/ativo │         │ dataAdocao / observacoes  │         │ dataNascimento   │
└──────────────┘         └──────────────────────────┘         └────────┬─────────┘
                                                                        │1
                                          ┌──────────────────┐         │
                                          │     Animal       │         │ * (vínculo atual)
                                          │──────────────────│◀────────┘
                                          │ id (PK, uuid)    │
                                          │ numeroRegistro UQ│
                                          │ nome / especie   │
                                          │ raca / sexo / cor│
                                          │ pesoInicial      │
                                          │ pesoAtual?       │
                                          │ localResgate     │
                                          │ observacoes?     │
                                          │ status           │
                                          │ tutorId? (FK)    │
                                          └────────┬─────────┘
                                                   │1
                                                   │ *
                                          ┌──────────────────┐
                                          │   FotoAnimal     │
                                          │──────────────────│
                                          │ id (PK, uuid)    │
                                          │ animalId (FK)    │
                                          │ url / principal  │
                                          └──────────────────┘
```

## Relacionamentos

| Relação                        | Cardinalidade | Regra                                                                              |
| ------------------------------ | ------------- | ---------------------------------------------------------------------------------- |
| Tutor → Animal (vínculo atual) | 1 : N         | Um animal tem **no máximo um** tutor por vez; `tutorId` aceita NULL (RN06).        |
| Animal → FotoAnimal            | 1 : N         | Várias fotos; **uma** marcada como `principal`. _(modelo a refinar)_               |
| Animal → Adocao                | 1 : N         | Um animal pode ser adotado mais de uma vez ao longo do tempo (devolução/readoção). |
| Tutor → Adocao                 | 1 : N         | Um tutor pode adotar vários animais.                                               |
| Usuario → Adocao               | 1 : N         | Cada adoção registra **qual protetor** a efetuou (`protetorId`).                   |

## Enums

```
Perfil         = ADMIN | PROTETOR
EspecieAnimal  = CAO | GATO              # RN12 — apenas Cão ou Gato
SexoAnimal     = MACHO | FEMEA
PorteAnimal    = PEQUENO | MEDIO | GRANDE
StatusAnimal   = ACOLHIMENTO | ADOTADO   # alinhado ao front
```

> O front exibe os rótulos "Cão/Gato", "Macho/Fêmea", "Acolhimento/Adotado". A API usa os valores de
> enum acima (sem acento/maiúsculos) e o front faz o de↔para na camada de apresentação.

## Dicionário de dados

### `usuarios`

| Campo               | Tipo   | Regras                         |
| ------------------- | ------ | ------------------------------ |
| id                  | UUID   | PK                             |
| codigo              | int    | sequencial, único (amigável)   |
| nome                | string | obrigatório                    |
| email               | string | único; válido com `@` (RN13)   |
| senha_hash          | string | bcrypt (RN01); nunca retornado |
| perfil              | Perfil | default `PROTETOR`             |
| _(+ campos padrão)_ | —      | ver "Campos padrão"            |

### `tutores`

| Campo               | Tipo   | Regras                                             |
| ------------------- | ------ | -------------------------------------------------- |
| id                  | UUID   | PK                                                 |
| codigo              | int    | sequencial, único                                  |
| nome                | string | obrigatório (busca — RN11)                         |
| cpf                 | string | único, obrigatório (busca — RN11; validar formato) |
| telefone            | string | obrigatório                                        |
| email               | string | único; válido com `@` (RN13)                       |
| endereco            | string | obrigatório (campo único, como no front)           |
| data_nascimento     | date   | obrigatório (RF03)                                 |
| _(+ campos padrão)_ | —      | ver "Campos padrão"                                |

### `animais`

| Campo               | Tipo          | Regras                                                               |
| ------------------- | ------------- | -------------------------------------------------------------------- |
| id                  | UUID          | PK                                                                   |
| numero_registro     | string        | único, **imutável** (RN04), formato `DD.MM.AAAA.N`; busca (RN10)     |
| nome                | string        | obrigatório                                                          |
| especie             | EspecieAnimal | obrigatório (RN05); só CAO/GATO (RN12)                               |
| raca                | string        | obrigatório (RN05)                                                   |
| sexo                | SexoAnimal    | obrigatório (RN05)                                                   |
| porte               | PorteAnimal   | opcional                                                             |
| cor                 | string        | obrigatório (RN05)                                                   |
| peso_inicial        | decimal(5,2)  | obrigatório (RN05)                                                   |
| peso_atual          | decimal(5,2)  | opcional (acompanhamento evolutivo — RF04)                           |
| data_nascimento     | date          | opcional (nascimento de resgatado costuma ser estimado/desconhecido) |
| castrado            | boolean       | default `false`                                                      |
| vacinado            | boolean       | default `false`                                                      |
| local_resgate       | string        | obrigatório (RN05)                                                   |
| observacoes         | string        | opcional (estado de saúde)                                           |
| status              | StatusAnimal  | default `ACOLHIMENTO`                                                |
| tutor_id            | UUID          | FK → tutores, **nullable** (RN06)                                    |
| _(+ campos padrão)_ | —             | ver "Campos padrão"                                                  |

> **RN05 — foto inicial obrigatória:** validada na camada de aplicação (o animal deve ter ≥1 `FotoAnimal`
> com `principal = true`). Ver tabela `fotos_animal` e [12](./12-upload-arquivos.md).

### `fotos_animal` _(modelo a refinar)_

| Campo               | Tipo    | Regras                                                                          |
| ------------------- | ------- | ------------------------------------------------------------------------------- |
| id                  | UUID    | PK                                                                              |
| animal_id           | UUID    | FK → animais (cascade no delete)                                                |
| url                 | string  | URL da imagem (por enquanto; upload é evolução — [12](./12-upload-arquivos.md)) |
| principal           | boolean | default `false`; **exatamente uma** principal por animal (regra no service)     |
| _(+ campos padrão)_ | —       | ver "Campos padrão"                                                             |

### `adocoes` (histórico)

| Campo       | Tipo     | Regras                                  |
| ----------- | -------- | --------------------------------------- |
| id          | UUID     | PK                                      |
| animal_id   | UUID     | FK → animais                            |
| tutor_id    | UUID     | FK → tutores                            |
| protetor_id | UUID     | FK → usuarios (quem registrou a adoção) |
| data_adocao | datetime | default `now()` (marca o evento; sem `criado_em` redundante) |
| observacoes | string   | opcional                                |
| devolvido_em | datetime | nullable; null = adoção ativa, preenchido na devolução |
| devolvido_por_id | UUID | nullable; usuário que registrou a devolução |
| observacoes_devolucao | string | opcional (motivo da devolução) |

## Regras de negócio (mapeadas aos requisitos)

| Regra                                                                                | Onde é aplicada                                                     |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| **RN01** — senha sempre com bcrypt                                                   | `AuthService`/`UsuariosService`                                     |
| **RN02** — senha 8–15 chars, ≥1 maiúscula e ≥1 especial                              | DTO (class-validator) — ver [06](./06-autenticacao-e-permissoes.md) |
| **RN03** — excluir animal/tutor/user exige **revalidar senha do user logado**        | `AnimaisService`/`TutoresService`                                   |
| **RN04** — `numeroRegistro` imutável após criação                                    | `AnimaisService` (gera na criação, bloqueia update)                 |
| **RN05** — animal exige espécie, raça, sexo, cor, peso inicial, local e foto inicial | DTO + `AnimaisService`                                              |
| **RN06** — animal vinculado a no máx. 1 tutor; `tutorId` pode ser NULL               | schema + `AnimaisService`                                           |
| **RN07** — adoção exige tutor já cadastrado/ativo                                    | `AdocoesService` (valida tutor antes de vincular)                   |
| **RN08** — upload .png/.jpg/.jpeg ≤ 5MB                                              | validação de upload — [12](./12-upload-arquivos.md)                 |
| **RN10/RN11** — buscar animal por `numeroRegistro`; tutor por nome/CPF               | filtros nas listagens — [11](./11-endpoints.md)                     |
| **RN12** — espécie só CAO/GATO                                                       | enum `EspecieAnimal`                                                |
| **RN13** — e-mail válido com `@`                                                     | DTO (`@IsEmail`)                                                    |

## Fluxo de adoção (vínculo + histórico)

```
1. Animal está ACOLHIMENTO, tutorId = null.
2. Protetor registra adoção (POST /adocoes) com animalId + tutorId (tutor precisa existir — RN07).
3. O service (transação): seta animal.tutorId, muda status para ADOTADO,
   e cria uma linha em `adocoes` (animal, tutor, protetorId = usuário logado, dataAdocao, observacoes).
4. (Devolução, opcional — POST /adocoes/:id/devolucao) a linha de `adocoes` é **fechada**
   (`devolvidoEm`, `devolvidoPorId`, `observacoesDevolucao`) e o animal volta para ACOLHIMENTO, tutorId = null.
   A linha permanece como histórico — agora **com** o registro da devolução.
```

> "Adoção ativa" = linha de `adocoes` com `devolvidoEm` nulo.

## Histórico de adoções

- **Por tutor:** animais atualmente vinculados (`animais where tutorId = X`) + registros em `adocoes`.
- **Geral/auditoria:** tabela `adocoes` com filtros por período/tutor/animal.
- O front (`tutor.animaisAdotadosIds`) é atendido pela consulta dos animais com `tutorId` do tutor.

## Dashboard (métricas)

Alinhado ao front (`DashboardStats`): consultas agregadas, sem tabela própria.

```
{ totalAnimais, emAcolhimento, adotados, tutores }
```

(pode ser estendido depois — ver [11](./11-endpoints.md)).
