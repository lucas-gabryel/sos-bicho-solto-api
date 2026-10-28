# Diferença entre os documentos de requisitos

Comparação entre o **documento original** (`Documento de Requisitos.pdf`, v1.3 — 20/06/2026)
e a **versão consolidada do backend** (`requisitos.md`, docs 00–12).

> ⚠️ A numeração mudou entre os dois documentos. O MD reagrupou requisitos do PDF
> (vários itens do PDF viraram um só no MD) e adicionou itens novos do refino do backend.
> Por isso, abaixo a comparação é feita **por conteúdo**, não por identificador.

---

## 1. Requisitos Funcionais (RF)

### 🆕 Adicionados no MD (não existiam no PDF)

| MD    | Descrição                                                                 |
| ----- | ------------------------------------------------------------------------- |
| RF07  | Registrar **adoção** (vincular animal a tutor), marcando como `ADOTADO`.   |
| RF08  | Registrar **devolução** de adoção, retornando o animal a `ACOLHIMENTO`.   |
| RF09  | Consultar **histórico de adoções** (filtros por tutor, animal e período). |
| RF10  | **Dashboard** com métricas (total, em acolhimento, adotados, tutores).    |
| RF11  | Gerenciar **fotos** do animal (adicionar, definir principal, remover).    |

### ✏️ Modificados / reagrupados

| Tema                  | PDF (original)                                                                                                          | MD (consolidado)                                                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Módulo interno        | **RF02, RF03, RF04** separados (módulo restrito; gerenciar contas de usuários; acesso centralizado a tutores/animais). | **RF02** único: "Módulo Interno para gestão centralizada de usuários, tutores e registros de animais". RF03/RF04 do PDF foram absorvidos (gestão de usuários virou parte do RBAC — ver RN16). |
| Gestão de tutores     | **RF05**: cadastro, edição e exclusão (sem listar campos).                                                             | **RF03**: passa a **listar os campos** (nome, CPF, telefone, e-mail, endereço, data de nascimento).                                                        |
| Gestão de animais     | **RF06 + RF07 + RF08** separados (dados básicos; peso/fotos; histórico de saúde).                                      | **RF04 ✏️** unificado e **ampliado**: inclui peso (inicial **e atualizado**), fotos (principal **+ adicionais**), **vacinado**, observações de saúde, vínculo com tutor. Verbos: cadastrar, **consultar** e alterar (sem "excluir" explícito aqui). |
| Consulta por ID       | **RF09**: consultar animal pelo Identificador Único.                                                                   | Absorvido em **RF05 / RN10** (busca por `numeroRegistro`).                                                                                                 |
| Filtros dinâmicos     | **RF10**.                                                                                                              | **RF05** (mesma ideia, renumerado).                                                                                                                        |
| Logout                | **RF11**.                                                                                                              | **RF06** (mesma ideia, renumerado).                                                                                                                        |
| Login                 | **RF01**.                                                                                                              | **RF01** — inalterado.                                                                                                                                     |

### ➖ Removidos / não mais como RF próprio no MD

- **RF03 (PDF)** — "Administrador gerenciar contas de usuários internos" → virou regra de RBAC (**RN16**).
- **RF04 (PDF)** — "acesso centralizado a tutores e animais" → fundido no **RF02** do MD.
- **RF08 (PDF)** — "histórico de saúde e vacinação" → fundido no **RF04** do MD (observações de saúde + vacinado).

---

## 2. Regras de Negócio (RN)

### 🆕 Adicionadas no MD (não existiam no PDF)

| MD   | Descrição                                                                                                  |
| ---- | ---------------------------------------------------------------------------------------------------------- |
| RN14 | Exclusão **lógica (soft delete)** em todas as entidades (`ativo = false`); listagens só retornam ativos.   |
| RN15 | **Auditoria**: `criadoEm`, `criadoPorId`, `modificadoEm`, `modificadoPorId` (exceto adoção).               |
| RN16 | Dois perfis — `ADMIN` e `PROTETOR` — com **RBAC**; ações destrutivas e gestão de usuários só do ADMIN.      |
| RN17 | Administrador **não pode excluir o próprio usuário** com sessão ativa.                                      |
| RN18 | Fluxo de adoção/devolução: `ADOTADO` ↔ `ACOLHIMENTO`, com `devolvidoEm`/`devolvidoPorId`.                  |
| RN19 | Status do animal (`ACOLHIMENTO`/`ADOTADO`) só muda pelo fluxo de adoção/devolução (não por edição direta). |
| RN20 | Cada animal tem **exatamente uma** foto principal.                                                         |
| RN21 | Identificadores: **UUID** como PK; `codigo` sequencial em tutor/usuário; `numeroRegistro` no animal.       |

### ✏️ Modificadas

| RN   | PDF (original)                                                          | MD (consolidado)                                                                       |
| ---- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| RN03 | Exclusão exige revalidação de senha — apenas **animais ou tutores**.   | ✏️ Inclui **usuários** também (animais, tutores **e usuários**); senha do admin logado. |

### ✅ Inalteradas (RN01–RN02, RN04–RN13)

Bcrypt (RN01), política de senha (RN02), formato do ID `DD.MM.AAAA.N` (RN04), campos
obrigatórios do animal (RN05), vínculo único de tutor (RN06), tutor ativo p/ adoção (RN07),
upload .png/.jpg/.jpeg 5MB (RN08), sem interface pública (RN09), busca de animal por ID (RN10),
busca de tutor por nome/CPF (RN11), espécie só Cão/Gato (RN12), e-mail com `@` (RN13).

---

## 3. Requisitos Não Funcionais (RNF)

### 🆕 Adicionados no MD (não existiam no PDF)

| MD    | Descrição                                                                            |
| ----- | ----------------------------------------------------------------------------------- |
| RNF10 | Autenticação **JWT stateless** (apenas access token; sem refresh token).             |
| RNF11 | API documentada via **Swagger/OpenAPI** (rota `/docs`).                              |
| RNF12 | Services com **testes unitários** (cobertura ≥ 80%).                                 |
| RNF13 | **Repository Pattern**, SOLID, DTOs e validação com class-validator.                 |

### ✏️ Modificados

| RNF   | PDF (original)                                                       | MD (consolidado)                                                       |
| ----- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| RNF06 | Componentes de seleção para **Espécie, Sexo, Nível de Acesso**.     | ✏️ Acrescenta **Porte** (Espécie, Sexo, **Porte**, Nível de Acesso).   |

### ✅ Inalterados (RNF01–RNF05, RNF07–RNF09)

Middleware de segurança (RNF01), Nº de Registro read-only (RNF02), interface responsiva (RNF03),
validação de arquivos cliente+servidor (RNF04), tempo de resposta ≤ 5s (RNF05), feedback visual
(RNF07), HTTPS (RNF08), consultas simultâneas (RNF09).

---

## 4. Resumo das mudanças

| Categoria | Adicionados (🆕)              | Modificados (✏️)        | Removidos/fundidos        |
| --------- | ----------------------------- | ----------------------- | ------------------------- |
| **RF**    | 5 (adoção, devolução, histórico, dashboard, fotos) | RF de animais ampliado; tutores com campos | RF03, RF04, RF08 do PDF (fundidos/viraram RN) |
| **RN**    | 8 (RN14–RN21)                 | RN03 (inclui usuários)  | —                         |
| **RNF**   | 4 (RNF10–RNF13)               | RNF06 (inclui Porte)    | —                         |

**Principais ganhos da versão consolidada:**

1. **Ciclo de adoção completo** — antes só havia "vinculação"; agora há adoção, devolução, histórico e controle de status (`ACOLHIMENTO`/`ADOTADO`).
2. **Dashboard de métricas** — novo.
3. **Gestão de fotos** como funcionalidade própria (principal + adicionais).
4. **Soft delete + auditoria** formalizados como regras.
5. **RBAC explícito** (ADMIN/PROTETOR) e proteção de autoexclusão de admin.
6. **Requisitos técnicos de backend** — JWT stateless, Swagger, testes ≥80%, Repository Pattern/SOLID.
