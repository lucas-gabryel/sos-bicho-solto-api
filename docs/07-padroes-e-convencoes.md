# 07 — Padrões e Convenções

## DTOs e validação

- Todo dado de entrada passa por um **DTO** com decorators do `class-validator`.
- `ValidationPipe` global configurado em `main.ts`:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // remove props não declaradas no DTO
    forbidNonWhitelisted: true, // erro 400 se enviar prop desconhecida
    transform: true, // converte tipos (ex.: query string → number)
  }),
);
```

Exemplo de DTO:

```ts
export class CriarAnimalDto {
  // numeroRegistro NÃO entra aqui — é gerado pelo back (RN04)
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEnum(EspecieAnimal) // CAO | GATO (RN12)
  especie: EspecieAnimal;

  @IsString()
  @IsNotEmpty() // obrigatório (RN05)
  raca: string;

  @IsEnum(SexoAnimal)
  sexo: SexoAnimal;

  @IsOptional()
  @IsEnum(PorteAnimal)
  porte?: PorteAnimal;

  @IsString()
  @IsNotEmpty() // obrigatório (RN05)
  cor: string;

  @IsNumber()
  @IsPositive() // peso inicial obrigatório (RN05)
  pesoInicial: number;

  @IsOptional()
  @IsDateString()
  dataNascimento?: string;

  @IsOptional()
  @IsBoolean()
  castrado?: boolean;

  @IsOptional()
  @IsBoolean()
  vacinado?: boolean;

  @IsString()
  @IsNotEmpty() // localidade de resgate (RN05)
  localResgate: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  // RN05 — a foto inicial é obrigatória: ≥1 foto, com uma marcada como principal.
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FotoAnimalInputDto)
  fotos: FotoAnimalInputDto[];
}

// dto auxiliar (uma foto na criação)
export class FotoAnimalInputDto {
  @IsUrl()
  url: string;

  @IsOptional() @IsBoolean()
  principal?: boolean; // se nenhuma vier true, o service marca a 1ª como principal
}
```

- DTOs de **atualização** usam `PartialType(CriarAnimalDto)` (`@nestjs/mapped-types` ou `@nestjs/swagger`).
- DTOs de **filtro/paginação** ficam em `dto/filtrar-*.dto.ts` e estendem `PaginacaoDto`.
- O `AnimaisService` valida que **exatamente uma** foto fique `principal` (RN05).

## Padrão de resposta

### Sucesso

> **Sem envelope global.** Não usamos um interceptor que embrulha toda resposta (evita o problema de
> `{ data: { data, meta } }` e de mudar a forma do login). Cada endpoint retorna conforme abaixo.
> Um interceptor pode existir só para **logging** (não muda a estrutura). O `senhaHash` **nunca** é
> retornado — é omitido na seleção/mapeamento do Service.

- **Item único / criação:** o recurso direto (ex.: `{ "id": "...", "nome": "..." }`).
- **Listagens:** envelope de paginação `{ data, meta }`:

```json
{
  "data": [
    /* itens */
  ],
  "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

- **Auth:** forma específica (`{ access_token, usuario }`).

### Erro (padronizado pelo Exception Filter global)

```json
{
  "statusCode": 404,
  "message": "Animal não encontrado",
  "error": "Not Found",
  "path": "/animais/123",
  "timestamp": "2026-06-20T12:00:00.000Z"
}
```

Códigos HTTP usados:

| Código | Quando                                             |
| ------ | -------------------------------------------------- |
| 200    | GET/PUT/PATCH com sucesso                          |
| 201    | POST criou recurso                                 |
| 200    | DELETE soft delete / com revalidação (RN03) — retorna o recurso ou `{ ok: true }` |
| 204    | DELETE simples sem corpo de resposta               |
| 400    | Validação de DTO falhou / regra de negócio violada |
| 401    | Sem token ou token inválido                        |
| 403    | Token válido, mas sem permissão (role)             |
| 404    | Recurso não encontrado                             |
| 409    | Conflito (ex.: e-mail/CPF já cadastrado)           |

## Convenções de código

- **TypeScript estrito** (`strict: true` no `tsconfig`).
- ESLint + Prettier obrigatórios; rodar antes de commitar.
- Nada de `any` sem justificativa.
- **Alias de import `#src/*`** para evitar caminhos relativos profundos (`../../..`). Use em imports
  que sobem de pasta; mantenha `./` para arquivos da mesma pasta. Ex.:
  `import { PrismaService } from '#src/database/prisma.service';`
  - Implementado via **subpath imports do Node** (`"imports"` no `package.json`) + `customConditions`
    no `tsconfig` — sem `baseUrl`/`tsc-alias`. Em dev/prod resolve para `dist`; na IDE/tsc, para o source.
  - Como o `deleteOutDir` do nest conflita com build incremental, o `incremental` foi removido do
    `tsconfig` (o `nest build` apaga o `dist` e re-emite tudo).
- **Idioma do código (convenção do time):**

  | Camada                                             | Idioma        | Exemplos                                                        |
  | -------------------------------------------------- | ------------- | --------------------------------------------------------------- |
  | Estrutura técnica (framework)                      | Inglês        | `Controller`, `Service`, `Module`, `Repository`, `Guard`, `Dto` |
  | Domínio: entidades, campos, valores de enum, rotas | **Português** | `animal.nome`, `animal.cor`, `status: ACOLHIMENTO`, `/animais`  |
  | Mensagens ao usuário e documentação                | Português     | "Animal não encontrado"                                         |

  > Domínio em PT para casar com o frontend e evitar tradução de campos na integração.
  > Os nomes exatos de campos/rotas são fechados ao mapear o front (ver [11](./11-endpoints.md)).
  > Termos de terceiros permanecem como são (ex.: `sub` no payload do JWT).

## Convenção de commits (Conventional Commits)

```
<tipo>(<escopo>): <descrição curta no imperativo>
```

Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`.

Exemplos:

```
feat(animais): adiciona filtro por espécie na listagem
fix(auth): corrige expiração do token
test(adocoes): cobre regra de animal indisponível
docs(readme): adiciona instruções de deploy
```

## Estratégia de branches (trunk-based, só `main`)

```
main        → única branch fixa (sempre deployável)
feature/*   → trabalho de cada dev (ex.: feature/animais-crud)
fix/*       → correções
```

Fluxo:

1. Criar branch a partir da `main`: `feature/<modulo>-<descricao>`.
2. Abrir **Pull Request** para a `main`; pelo menos 1 revisor do grupo aprova.
3. Merge na `main` (atualizar a branch com a `main` antes do merge para evitar conflitos).

> Regra: **ninguém faz push direto na `main`** — tudo entra via PR.

## Arquivos versionados x ignorados

`.gitignore` deve conter no mínimo:

```
node_modules/
dist/
.env
*.log
coverage/
```

Versionar sempre:

- `.env.example` (sem segredos)
- `prisma/schema.prisma` e `prisma/migrations/`
- toda a pasta `docs/`

## Documentação da API (Swagger)

- Disponível em `GET /docs` (rota da própria API).
- Cada controller usa `@ApiTags`, e DTOs usam `@ApiProperty` para enriquecer a doc.
- Serve como contrato vivo para a integração com o frontend.
