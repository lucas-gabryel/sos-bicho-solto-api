# 08 — Testes

## O que o trabalho exige

> "Desenvolver testes unitários, garantindo a cobertura adequada da **camada de Services**."

Portanto o **foco obrigatório** são os testes unitários dos **Services**. Testes de controller e
e2e são bônus.

## Estratégia

- Ferramenta: **Jest** (já vem com NestJS).
- Cada `*.service.ts` tem um `*.service.spec.ts` ao lado.
- O Service é testado **isoladamente**: o repositório é **mockado** (graças ao Repository Pattern,
  o Service depende de uma interface — fácil de substituir por um mock).
- Não tocar no banco real nos testes unitários.

## Meta de cobertura

| Métrica                    | Meta               |
| -------------------------- | ------------------ |
| Cobertura de **Services**  | ≥ 80%              |
| Cobertura geral do projeto | ≥ 60% (referência) |

Rodar com cobertura:

```bash
pnpm test          # roda todos os testes
pnpm test:watch    # modo watch
pnpm test:cov      # gera relatório de cobertura em coverage/
```

## Como mockar o repositório

```ts
describe("AnimaisService", () => {
  let service: AnimaisService;
  let repository: jest.Mocked<IAnimaisRepository>;

  beforeEach(async () => {
    const repoMock: jest.Mocked<IAnimaisRepository> = {
      criar: jest.fn(),
      listar: jest.fn(),
      buscarPorId: jest.fn(),
      atualizar: jest.fn(),
      desativar: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AnimaisService,
        { provide: ANIMAIS_REPOSITORY, useValue: repoMock },
      ],
    }).compile();

    service = module.get(AnimaisService);
    repository = module.get(ANIMAIS_REPOSITORY);
  });

  it("lança NotFound ao buscar animal inexistente", async () => {
    repository.buscarPorId.mockResolvedValue(null);
    await expect(service.buscarPorId("id-x")).rejects.toThrow(
      NotFoundException,
    );
  });
});
```

## Casos de teste mínimos por módulo

### AuthService

- Login com credenciais válidas retorna token.
- Login com senha errada lança `UnauthorizedException`.
- Login de usuário inativo é bloqueado.

### UsuariosService

- Cria usuário com senha **hasheada**.
- Bloqueia e-mail duplicado (`ConflictException`).
- Desativação lógica funciona (`ativo = false`).
- Listagem não trás usuários com `ativo = false`.

### TutoresService

- Cria tutor com sucesso.
- Bloqueia CPF/e-mail duplicado.
- Atualiza e busca por id (404 quando não existe).

### AnimaisService

- Cria animal com status default `ACOLHIMENTO` e gera `numeroRegistro` no formato `DD.MM.AAAA.N` (RN04).
- Bloqueia alteração do `numeroRegistro` no update (imutável — RN04).
- Exige campos obrigatórios (espécie, raça, sexo, cor, peso inicial, local, foto inicial — RN05).
- Exclusão exige revalidação correta da senha do admin (RN03); senha errada → erro.
- 404 ao buscar/atualizar inexistente.

### AdocoesService (núcleo das regras de negócio)

- Não permite adotar animal que não está `ACOLHIMENTO`.
- Bloqueia adoção se o tutor não existir/estiver inativo (RN07).
- Ao registrar adoção: animal recebe `tutorId`, status vira `ADOTADO` e cria registro em `adocoes`.
- Na devolução: animal volta para `ACOLHIMENTO` e `tutorId` fica nulo (histórico permanece).

### DashboardService

- Agrega contagens corretamente (ex.: total de animais por status).

## Boas práticas

- Um `it` por comportamento; nome descritivo em português.
- Padrão **AAA**: Arrange, Act, Assert.
- Testar caminho feliz **e** os erros (exceções de domínio).
