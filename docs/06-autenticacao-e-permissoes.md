# 06 — Autenticação e Permissões

## Modelo escolhido

- **Autenticação:** JWT (apenas _access token_, sem refresh token).
- **Perfis (`perfil`):** `ADMIN` e `PROTETOR`.
- **Quem loga:** apenas `Usuario` (equipe da ONG). Tutores **não** têm login.

## Fluxo de autenticação

```
1. POST /auth/login  { email, senha }
2. AuthService busca o usuário por email (precisa estar ativo)
3. Compara a senha com o hash (bcrypt.compare)
4. Se ok, assina um JWT com o payload { sub: usuarioId, email, perfil }
5. Retorna { access_token, usuario: { id, codigo, nome, email, perfil } }
6. Frontend guarda o token e o envia em "Authorization: Bearer <token>"
7. JwtAuthGuard valida o token em cada rota protegida
```

### Payload do JWT

```ts
interface JwtPayload {
  sub: string; // id do usuário
  email: string;
  perfil: Perfil; // ADMIN | PROTETOR
}
```

## Componentes

| Componente        | Papel                                                             |
| ----------------- | ----------------------------------------------------------------- |
| `AuthController`  | Expõe `POST /auth/login` e `GET /auth/me`                         |
| `AuthService`     | Valida credenciais e assina o token                               |
| `JwtStrategy`     | Valida o token e injeta o usuário em `request.user`               |
| `JwtAuthGuard`    | Protege rotas; aplicado globalmente, com exceções via `@Public()` |
| `PerfilGuard`     | Verifica se o `perfil` do usuário atende ao exigido pela rota     |
| `@Perfis(...)`    | Decorator que declara os perfis permitidos numa rota              |
| `@UsuarioAtual()` | Decorator que extrai o usuário autenticado do request             |
| `@Public()`       | Decorator que marca rotas que dispensam autenticação (ex.: login) |

## Hash de senha

- Algoritmo: **bcrypt**, salt rounds = `10`.
- A senha em texto **nunca** é persistida nem retornada.
- O campo `senhaHash` é sempre removido das respostas (via mapeamento no Service / `class-transformer`).

## Matriz de permissões (RBAC)

| Recurso / Ação                                        | ADMIN | PROTETOR |
| ----------------------------------------------------- | :---: | :------: |
| Login / logout / ver próprio perfil                   |  ✅   |    ✅    |
| **Usuários** — listar / criar / editar / excluir      |  ✅   |    ❌    |
| **Tutores** — listar / criar / editar                 |  ✅   |    ✅    |
| **Tutores** — excluir _(revalida senha admin — RN03)_ |  ✅   |    ❌    |
| **Animais** — listar / criar / editar / fotos         |  ✅   |    ✅    |
| **Animais** — excluir _(revalida senha admin — RN03)_ |  ✅   |    ❌    |
| **Adoção** — registrar vínculo / devolução            |  ✅   |    ✅    |
| **Histórico de adoções** — consultar                  |  ✅   |    ✅    |
| **Dashboard** — métricas                              |  ✅   |    ✅    |

> Regra geral: **PROTETOR opera o dia a dia** (animais, tutores, adoções);
> **ADMIN também administra usuários e as exclusões** (que são auditadas — RN03).

## Regra de senha (RN02)

Validada via `class-validator` no DTO de criação/troca de senha:

- **8 a 15 caracteres**;
- ao menos **uma letra maiúscula**;
- ao menos **um caractere especial**.

```ts
// exemplo no DTO
@Length(8, 15)
@Matches(/(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+/, {
  message: 'A senha deve ter 8–15 caracteres, ao menos 1 maiúscula e 1 caractere especial.',
})
senha: string;
```

## Exclusão auditada — revalidação da senha do admin (RN03)

Toda exclusão de **animal**, **tutor** ou **user** exige que o **admin** reconfirme a própria senha no momento
da operação:

```
DELETE /animais/:id   body: { "senhaAdmin": "..." }
DELETE /tutores/:id   body: { "senhaAdmin": "..." }
DELETE /usuarios/:id   body: { "senhaAdmin": "..." }
```

No service: buscar o usuário logado (do token), comparar `senhaAdmin` com o `senhaHash` via
`bcrypt.compare`. Se não bater → `UnauthorizedException`. Só então excluir.

> **Escopo:** o RN03 cita explicitamente animais/tutores; estendemos a mesma proteção à exclusão de
> **usuários** por ser uma ação administrativa sensível.
>
> **Regra extra (usuários):** o admin **não pode excluir a si mesmo** com a sessão aberta
> (`ForbiddenException`) — alinhado ao comportamento do front (`user.service`).

> **Exclusão é soft delete** (ver convenção no [doc 04](./04-modelo-de-dados.md)): "excluir" seta
> `ativo = false`, preservando o histórico (ex.: `adocoes`). Listagens/buscas filtram `ativo = true`.
> O `modificadoPorId` recebe o id do usuário que executou a exclusão.

## Logout (RF06)

Como o JWT é **stateless**, o logout é feito no **cliente** (descartar o token). A rota
`POST /auth/logout` existe para padronizar a chamada do front e pode, no futuro, alimentar uma
blacklist de tokens (fora do escopo atual).

## Middleware de proteção (RNF01)

O `JwtAuthGuard` aplicado globalmente bloqueia o acesso a qualquer rota administrativa por usuários
não autenticados; rotas liberadas usam `@Public()` (ex.: `/auth/login`).

## Como proteger uma rota

```ts
@Controller('usuarios')
@UseGuards(JwtAuthGuard, PerfilGuard) // aplicados no controller inteiro
export class UsuariosController {
  @Post()
  @Perfis(Perfil.ADMIN) // só ADMIN cria usuários
  criar(@Body() dto: CriarUsuarioDto) { ... }

  @Get('exemplo')
  exemplo(@UsuarioAtual() usuario: JwtPayload) { ... } // usuário logado
}
```

Rota pública (sem token):

```ts
@Public()
@Post('login')
login(@Body() dto: LoginDto) { ... }
```

## Boas práticas de segurança adotadas

- `JWT_SECRET` forte, vindo de variável de ambiente (nunca hardcoded).
- CORS restrito à origem do frontend (`CORS_ORIGIN`).
- `ValidationPipe` global com `whitelist: true` (descarta campos não esperados).
- Senhas com bcrypt; nunca logar credenciais.
- Exclusão é **lógica** (`ativo = false`) em todas as entidades, preservando integridade referencial.
