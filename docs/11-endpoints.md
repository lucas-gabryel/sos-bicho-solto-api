# 11 — Endpoints da API

> Contrato definido pelo **backend em português**, **mapeado a partir das `services` do front**
> (`auth`, `user`, `tutor`, `animal`, `dashboard`) e dos requisitos (RF/RN). Na integração, o front
> troca os mocks por chamadas reais usando estes nomes.

## Convenções gerais

- Base URL: `/` (ou prefixo `/api`).
- Autenticação: `Authorization: Bearer <token>` em tudo, exceto **🔓 Pública**.
- **URLs usam o `id` (UUID).** Busca amigável (codigo/numeroRegistro/CPF/nome) vai por **query param**.
- Paginação: `?page=1&limit=10`. Erros padronizados (ver [07](./07-padroes-e-convencoes.md)).
- RNF01: rotas protegidas por middleware/guard de autenticação.
- **`DELETE` = soft delete** (`ativo = false`), exceto onde indicado. Listagens retornam só `ativo = true`.

## Auth — `services/auth.service.ts`, `getCurrentUser`

| Método | Rota           | Acesso      | Descrição                                                  |
| ------ | -------------- | ----------- | ---------------------------------------------------------- |
| POST   | `/auth/login`  | 🔓 Pública  | `{ email, senha }` → `access_token` + usuário (RF01)       |
| GET    | `/auth/me`     | Autenticado | Usuário logado (`getCurrentUser`)                          |
| POST   | `/auth/logout` | Autenticado | Logout (RF06); com JWT stateless, o front descarta o token |

## Usuários — `services/user.service.ts` (somente ADMIN)

| Método | Rota            | Acesso | Descrição                                    |
| ------ | --------------- | ------ | -------------------------------------------- |
| GET    | `/usuarios`     | ADMIN  | Lista usuários (`getUsers`)                  |
| POST   | `/usuarios`     | ADMIN  | Cria usuário (`createUser`)                  |
| PATCH  | `/usuarios/:id` | ADMIN  | Atualiza usuário                             |
| DELETE | `/usuarios/:id` | ADMIN  | Remove (soft delete); **revalida senha admin** (RN03) e **não pode excluir a si mesmo** |

## Tutores — `services/tutor.service.ts`

| Método | Rota                   | Acesso          | Descrição                                          |
| ------ | ---------------------- | --------------- | -------------------------------------------------- |
| GET    | `/tutores`             | ADMIN, PROTETOR | Lista; `?busca=` por **nome ou CPF** (RN11)        |
| GET    | `/tutores/:id`         | ADMIN, PROTETOR | Detalha (`getTutorById`)                           |
| POST   | `/tutores`             | ADMIN, PROTETOR | Cria (`createTutor`)                               |
| PATCH  | `/tutores/:id`         | ADMIN, PROTETOR | Atualiza (`updateTutor`)                           |
| DELETE | `/tutores/:id`         | ADMIN           | Remove — **exige revalidar senha do admin** (RN03) |
| GET    | `/tutores/:id/animais` | ADMIN, PROTETOR | Animais vinculados (atende `animaisAdotadosIds`)   |

## Animais — `services/animal.service.ts`

| Método | Rota           | Acesso          | Descrição                                                                            |
| ------ | -------------- | --------------- | ------------------------------------------------------------------------------------ |
| GET    | `/animais`     | ADMIN, PROTETOR | Lista; filtros `?status=&especie=&busca=` (busca por **numeroRegistro**/nome — RN10) |
| GET    | `/animais/:id` | ADMIN, PROTETOR | Detalha                                                                              |
| POST   | `/animais`     | ADMIN, PROTETOR | Cadastra; gera `numeroRegistro` (RN04); exige campos RN05                            |
| PATCH  | `/animais/:id` | ADMIN, PROTETOR | Atualiza (`numeroRegistro` **imutável** — RN04)                                      |
| DELETE | `/animais/:id` | ADMIN           | Remove — **exige revalidar senha do admin** (RN03)                                   |

### Fotos do animal _(modelo a refinar — ver [12](./12-upload-arquivos.md))_

| Método | Rota                                   | Acesso          | Descrição                        |
| ------ | -------------------------------------- | --------------- | -------------------------------- |
| POST   | `/animais/:id/fotos`                   | ADMIN, PROTETOR | Adiciona foto (URL por enquanto) |
| PATCH  | `/animais/:id/fotos/:fotoId/principal` | ADMIN, PROTETOR | Define a foto principal          |
| DELETE | `/animais/:id/fotos/:fotoId`           | ADMIN, PROTETOR | Remove foto                      |

## Adoção (vínculo + histórico) — `AdocoesController` / `AdocoesModule` (Dev C)

> **Dono:** `AdocoesModule`. Ele importa `AnimaisModule` e `TutoresModule` (que exportam seus
> repositórios) para ler/atualizar animal e tutor. Rotas no recurso `/adocoes` (não aninhadas em
> `/animais`) para o ownership ficar claro.

| Método | Rota                       | Acesso          | Descrição                                                              |
| ------ | -------------------------- | --------------- | --------------------------------------------------------------------- |
| POST   | `/adocoes`                 | ADMIN, PROTETOR | Registra adoção: vincula tutor ao animal → `ADOTADO` (RN06, RN07)      |
| POST   | `/adocoes/:id/devolucao`   | ADMIN, PROTETOR | Devolução: fecha a adoção (`devolvidoEm`) e o animal volta `ACOLHIMENTO` |
| GET    | `/adocoes`                 | ADMIN, PROTETOR | Histórico de adoções; filtros `?tutorId=&animalId=&de=&ate=`           |

## Dashboard — `services/dashboard.service.ts`

| Método | Rota                | Acesso          | Descrição          |
| ------ | ------------------- | --------------- | ------------------ |
| GET    | `/dashboard/resumo` | ADMIN, PROTETOR | Métricas agregadas |

Resposta (chaves iguais ao `DashboardStats` do front):

```json
{ "totalAnimais": 5, "emAcolhimento": 3, "adotados": 2, "tutores": 12 }
```

---

## Exemplos de payload

### `POST /auth/login`

```json
// request
{ "email": "admin@sosbichosolto.com", "senha": "Admin@123" }
// response 200
{
  "access_token": "eyJhbGc...",
  "usuario": { "id": "uuid", "codigo": 1, "nome": "Malba Vinicius", "email": "admin@sosbichosolto.com", "perfil": "ADMIN" }
}
```

### `POST /tutores`

```json
{
  "nome": "Ana Clara Santos",
  "cpf": "390.533.447-05",
  "telefone": "(82) 99912-3456",
  "email": "ana.clara@email.com",
  "endereco": "Rua Pedro Oliveira, 145 - Centro, Arapiraca/AL",
  "dataNascimento": "1992-03-15"
}
```

### `POST /animais`

```json
// numeroRegistro NÃO é enviado — o back gera (RN04)
{
  "nome": "Rex",
  "especie": "CAO",
  "raca": "SRD",
  "sexo": "MACHO",
  "porte": "GRANDE",
  "cor": "Caramelo",
  "pesoInicial": 7.2,
  "castrado": true,
  "vacinado": true,
  "localResgate": "Centro, Arapiraca/AL",
  "observacoes": "Em tratamento de verminose.",
  "fotos": [{ "url": "https://exemplo.com/rex.jpg", "principal": true }]
}
// response 201 — inclui o numeroRegistro gerado
{ "id": "uuid", "numeroRegistro": "20.06.2026.1", "status": "ACOLHIMENTO", "tutorId": null, "...": "..." }
```

### `POST /adocoes`

```json
// request (protetorId = usuário logado, vem do token)
{
  "animalId": "uuid-do-animal",
  "tutorId": "uuid-do-tutor",
  "observacoes": "Adoção responsável, casa com quintal."
}
// efeito: animal.tutorId = tutorId, animal.status = "ADOTADO", nova linha em `adocoes`
```

### `POST /adocoes/:id/devolucao`

```json
// request
{ "observacoes": "Tutor mudou de cidade." }
// efeito: adocoes.devolvidoEm = now(), devolvidoPorId = usuário logado;
//         animal volta para ACOLHIMENTO e tutorId = null (a linha de adoção fica como histórico)
```

### `DELETE` com revalidação (animais, tutores, usuários — RN03)

```json
// request body — revalidação da senha do admin logado
{ "senhaAdmin": "Admin@123" }
// efeito: soft delete (ativo = false); resposta 200
```

> ⚠️ Enviar **body em requisição DELETE** funciona em NestJS/axios/fetch, mas alguns proxies/CDNs
> descartam o corpo de um DELETE. Se isso ocorrer em produção, o plano B é trocar por um POST de
> confirmação (ex.: `POST /animais/:id/exclusao` com o mesmo body).

---

## De-para front ↔ back (campos a ajustar na integração)

O front mistura PT/EN; ao integrar, alinhar para o padrão do back (PT):

| Front (mock)                                            | Back (API)                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Animal: `esp`, `peso`, `pesoAt`, `local`, `obs`, `data` | `especie`, `pesoInicial`, `pesoAtual`, `localResgate`, `observacoes`, `criadoEm`            |
| Animal status `'Acolhimento'`/`'Adotado'`               | enum `ACOLHIMENTO`/`ADOTADO`                                                                |
| Animal espécie `'Cão'`/`'Gato'`                         | enum `CAO`/`GATO`                                                                           |
| User: `name`, `role`, `createdAt`                       | `nome`, `perfil`, `criadoEm`                                                                |
| User role `'admin'`/`'protetor'`                        | enum `ADMIN`/`PROTETOR`                                                                     |
| Tutor `animaisAdotadosIds`                              | derivado de `GET /tutores/:id/animais`                                                      |
| _(não existem no front ainda)_                          | `porte`, `castrado`, `vacinado`, `dataNascimento` — o form de animal precisará adicioná-los |
