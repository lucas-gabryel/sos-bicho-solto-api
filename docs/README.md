# 📚 Documentação — SOS Bicho Solto API (Projeto 2 / Backend)

Esta pasta contém toda a definição técnica e organizacional do backend do **SOS Bicho Solto**,
uma API REST construída com **NestJS** que fornece dados reais para o frontend desenvolvido no Projeto 1.

> Leia os documentos na ordem numérica. Os primeiros definem **o quê** e **por quê**; os finais definem **como dividir e entregar**.

## Índice

| #    | Documento                                                          | Conteúdo                                                                   |
| ---- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| —    | [Requisitos](./requisitos.md)                                      | RF / RN / RNF consolidados (formato de tabela) e rastreabilidade            |
| 00   | [Visão Geral](./00-visao-geral.md)                                 | Escopo, objetivos, requisitos do trabalho e glossário de domínio           |
| 01   | [Stack Tecnológica](./01-stack-tecnologica.md)                     | Tecnologias, versões e justificativas                                      |
| 02   | [Arquitetura](./02-arquitetura.md)                                 | Camadas, Repository Pattern, SOLID e fluxo de uma requisição               |
| 02.1 | [Guia: Injeção de Dependência](./02.1-guia-injecao-dependencia.md) | Explicação didática do Repository Pattern + DI (Symbol, `@Inject`, módulo) |
| 03   | [Estrutura de Pastas](./03-estrutura-de-pastas.md)                 | Organização de diretórios e responsabilidade de cada um                    |
| 04   | [Modelo de Dados](./04-modelo-de-dados.md)                         | Entidades, enums, relacionamentos e dicionário de dados                    |
| 05   | [Banco de Dados (Prisma)](./05-banco-de-dados-prisma.md)           | `schema.prisma`, primeira migration e seed                                 |
| 06   | [Autenticação e Permissões](./06-autenticacao-e-permissoes.md)     | JWT, guards, perfis e matriz de permissões                                 |
| 07   | [Padrões e Convenções](./07-padroes-e-convencoes.md)               | Código, commits, branches, DTOs, validação e respostas de erro             |
| 08   | [Testes](./08-testes.md)                                           | Estratégia de testes unitários e metas de cobertura                        |
| 09   | [Deploy](./09-deploy.md)                                           | Estratégia de deploy de back e front                                       |
| 10   | [Divisão de Tarefas](./10-divisao-de-tarefas.md)                   | Distribuição entre os 3 devs e cronograma                                  |
| 11   | [Endpoints da API](./11-endpoints.md)                              | Contrato REST (refinado após mapear o frontend)                            |
| 12   | [Upload de Arquivos](./12-upload-arquivos.md)                      | Plano opcional para upload de foto (Cloudinary/Multer)                     |

## Decisões já fechadas

- **Framework:** NestJS 11 (Node.js 24 LTS, fixado via `.nvmrc`)
- **Gerenciador de pacotes:** pnpm
- **Banco + ORM:** PostgreSQL + Prisma
- **Autenticação:** JWT com 2 perfis — `ADMIN` e `PROTETOR`
- **Tutor e Usuário são entidades separadas** (Tutor = adotante de domínio; User = operador do sistema)
- **Idioma do código:** estrutura técnica em inglês; domínio (campos, enums, rotas) em **português** — nomes exatos a fechar com o front
- **Upload de foto:** fora do escopo obrigatório; plano guardado em [12](./12-upload-arquivos.md)
- **Deploy:** estratégia definida; host (Render/Railway/etc.) a escolher na etapa de entrega

## Como usar esta documentação

1. Todos os devs leem `00` a `02` para alinhar o entendimento.
2. Cada dev é dono de módulos específicos — ver `10-divisao-de-tarefas.md`.
3. Mudanças estruturais (modelo de dados, contrato de endpoints) passam por revisão do grupo antes de implementar.
