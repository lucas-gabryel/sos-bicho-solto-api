# Requisitos — SOS Bicho Solto (Projeto 2 / Backend)

> Versão **consolidada e atualizada** do documento de requisitos, refletindo tudo que está
> contemplado nesta documentação (docs 00–12). Legenda: ✏️ = atualizado em relação ao documento
> original · 🆕 = novo (surgiu no refino do backend).

---

## Requisitos Funcionais (RF)

| Identificador | Descrição                                                                                                                                                                                                                                                                                                       | Prioridade | Depende de |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| RF01          | O sistema deve permitir o login via e-mail e senha válidos.                                                                                                                                                                                                                                                     | Alta       | -          |
| RF02          | O sistema deve oferecer um Módulo Interno para a gestão centralizada de usuários, tutores e registros de animais.                                                                                                                                                                                               | Alta       | RF01       |
| RF03          | O sistema deve permitir gerenciar as informações de Tutores, contendo: nome, CPF, telefone, e-mail, endereço e data de nascimento.                                                                                                                                                                              | Alta       | RF02       |
| RF04 ✏️       | O sistema deve permitir o gerenciamento de animais (cadastrar, consultar e alterar), contendo: nome, espécie, raça, sexo, porte, cor, peso (inicial e atualizado), data de nascimento, castrado, vacinado, localidade de resgate, fotos (principal + adicionais), observações de saúde e o vínculo com o tutor. | Alta       | RF02       |
| RF05          | O sistema deve permitir consultar animais e tutores através de filtros dinâmicos.                                                                                                                                                                                                                               | Média      | RF03, RF04 |
| RF06          | O sistema deve permitir o encerramento seguro da sessão ativa (Logout).                                                                                                                                                                                                                                         | Baixa      | RF01       |
| RF07 🆕       | O sistema deve permitir registrar a **adoção** (vincular um animal a um tutor), marcando o animal como `ADOTADO`.                                                                                                                                                                                               | Alta       | RF03, RF04 |
| RF08 🆕       | O sistema deve permitir registrar a **devolução** de uma adoção, retornando o animal para `ACOLHIMENTO` e preservando o registro.                                                                                                                                                                               | Média      | RF07       |
| RF09 🆕       | O sistema deve permitir consultar o **histórico de adoções** (com filtros por tutor, animal e período).                                                                                                                                                                                                         | Média      | RF07       |
| RF10 🆕       | O sistema deve fornecer um **dashboard** com métricas (total de animais, em acolhimento, adotados e total de tutores).                                                                                                                                                                                          | Média      | RF02       |
| RF11 🆕       | O sistema deve permitir gerenciar as **fotos** do animal (adicionar, definir principal e remover).                                                                                                                                                                                                              | Média      | RF04       |

---

## Regras de Negócio (RN)

| Identificador | Descrição                                                                                                                                                     | Prioridade | Depende de |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| RN01          | As senhas devem ser armazenadas com criptografia robusta (Bcrypt), nunca em texto pleno.                                                                      | Alta       | RF01       |
| RN02          | A senha deve conter entre 8 e 15 caracteres, incluindo ao menos uma letra maiúscula e um caractere especial.                                                  | Alta       | RF01       |
| RN03 ✏️       | Toda exclusão de registros (animais, tutores e usuários) exige a revalidação da senha do usuário logado (admin).                                              | Alta       | RF03, RF04 |
| RN04          | O Identificador Único do animal deve seguir o formato `DD.MM.AAAA.N` e é imutável após a criação.                                                             | Alta       | RF04       |
| RN05          | Não é permitido salvar um animal sem espécie, raça, sexo, cor, peso inicial, localidade ou foto inicial.                                                      | Alta       | RF04       |
| RN06          | Um animal só pode ser vinculado a um único tutor por vez. O campo tutor aceita valor nulo (NULL).                                                             | Alta       | RF04       |
| RN07          | A adoção exige que o tutor já possua um cadastro ativo na base de dados.                                                                                      | Alta       | RF03, RF04 |
| RN08          | O upload de fotos deve aceitar apenas extensões .png, .jpg ou .jpeg, com limite máximo de 5MB por arquivo.                                                    | Média      | RF04, RF11 |
| RN09          | O sistema não possui interface pública; todos os usuários e tutores são inseridos via módulo interno.                                                         | Alta       | RF02       |
| RN10          | A consulta de animais deve permitir a localização rápida pelo Identificador Único (`numeroRegistro`).                                                         | Alta       | RF05       |
| RN11          | A consulta de tutores deve permitir a localização por nome ou CPF.                                                                                            | Alta       | RF05       |
| RN12          | A seleção de espécie é restrita exclusivamente a "Cão" ou "Gato".                                                                                             | Alta       | RF04       |
| RN13          | O e-mail válido deve conter o símbolo '@' separando o nome de usuário e o domínio (ex.: usuario@dominio).                                                     | Alta       | RF01       |
| RN14 🆕       | A exclusão de registros é **lógica (soft delete)** em todas as entidades (`ativo = false`); listagens retornam apenas registros ativos.                       | Alta       | RF02       |
| RN15 🆕       | Toda entidade registra **auditoria**: `criadoEm`, `criadoPorId`, `modificadoEm`, `modificadoPorId` (exceto a adoção, que é registro de ciclo).                | Média      | RF02       |
| RN16 🆕       | O sistema possui dois perfis — `ADMIN` e `PROTETOR` — e aplica permissões por perfil (RBAC); ações destrutivas e gestão de usuários são exclusivas do ADMIN.  | Alta       | RF01, RF02 |
| RN17 🆕       | O administrador não pode excluir o próprio usuário com a sessão ativa.                                                                                        | Média      | RF02       |
| RN18 🆕       | Na adoção, o animal passa a `ADOTADO` e recebe o vínculo do tutor; na devolução, volta a `ACOLHIMENTO` e a adoção é fechada (`devolvidoEm`/`devolvidoPorId`). | Alta       | RF07, RF08 |
| RN19 🆕       | O status do animal é `ACOLHIMENTO` ou `ADOTADO` e só muda pelo fluxo de adoção/devolução (não por edição direta).                                             | Alta       | RF04, RF07 |
| RN20 🆕       | Cada animal tem **exatamente uma** foto marcada como principal.                                                                                               | Média      | RF11       |
| RN21 🆕       | Identificadores: UUID como chave primária (usada em FKs e URLs); `codigo` sequencial amigável em tutor/usuário; `numeroRegistro` no animal.                   | Média      | RF02       |

---

## Requisitos Não Funcionais (RNF)

| Id.      | Descrição                                                                                                                        | Categoria / Subcategoria       | Prioridade | Depende de |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------- | ---------- |
| RNF01    | O sistema deve implementar middleware de segurança para bloquear o acesso a rotas administrativas por usuários não autenticados. | Segurança / Integridade        | Alta       | RF01, RF02 |
| RNF02    | O campo "Nº de Registro" deve ser configurado como read-only na interface após a persistência do dado.                           | Confiabilidade                 | Alta       | RF04, RN04 |
| RNF03    | A interface deve ser responsiva (mobile-friendly), garantindo a usabilidade em dispositivos móveis para protetores em campo.     | Usabilidade                    | Alta       | RF02       |
| RNF04    | O sistema deve validar tipos de arquivos e tamanho (máx 5MB) de forma síncrona no cliente e no servidor.                         | Eficiência                     | Alta       | RF04, RN08 |
| RNF05    | O tempo de resposta para buscas indexadas (ID ou CPF) não deve ultrapassar 5 segundos sob condições normais de rede.             | Performance                    | Média      | RF05       |
| RNF06 ✏️ | A interface deve usar componentes padronizados de seleção para campos de valores fixos (Espécie, Sexo, Porte, Nível de Acesso).  | Usabilidade                    | Alta       | RF03, RF04 |
| RNF07    | O sistema deve fornecer feedback visual (toasts/alertas) para todas as ações de sucesso ou erro de permissão.                    | Usabilidade                    | Média      | RF02       |
| RNF08    | Toda a comunicação entre Frontend e Backend deve ser criptografada via HTTPS.                                                    | Segurança                      | Alta       | RF01       |
| RNF09    | O sistema deve suportar múltiplas consultas simultâneas na base de tutores e animais sem degradação de performance.              | Disponibilidade                | Média      | RF05       |
| RNF10 🆕 | A autenticação usa JWT stateless (apenas access token, validade configurável; sem refresh token).                                | Segurança                      | Média      | RF01       |
| RNF11 🆕 | A API deve ser documentada via Swagger/OpenAPI (rota `/docs`), servindo de contrato para o frontend.                             | Manutenibilidade               | Média      | RF02       |
| RNF12 🆕 | Os Services devem ter testes unitários com cobertura adequada (meta ≥ 80%).                                                      | Manutenibilidade / Qualidade   | Alta       | -          |
| RNF13 🆕 | O backend deve seguir Repository Pattern, princípios SOLID, DTOs e validação com class-validator.                                | Manutenibilidade / Arquitetura | Alta       | -          |

---

## Principais funcionalidades

| Funcionalidade                           | Requisitos associados                                  | Doc                                                                    |
| ---------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| Autenticação e módulo interno (RBAC)     | RF01, RF02, RF06, RN01, RN02, RN13, RN16, RNF01, RNF10 | [06](./06-autenticacao-e-permissoes.md)                                |
| Identificação única e imutável do animal | RF04, RN04, RN21, RNF02                                | [04](./04-modelo-de-dados.md)                                          |
| Gerenciamento de animais                 | RF04, RN05, RN06, RN12, RN19, RNF06                    | [04](./04-modelo-de-dados.md), [11](./11-endpoints.md)                 |
| Fotos do animal (principal + N)          | RF11, RN08, RN20, RNF04                                | [12](./12-upload-arquivos.md)                                          |
| Gestão centralizada de tutores           | RF03, RN07, RN11, RNF06                                | [11](./11-endpoints.md)                                                |
| Fluxo de adoção e devolução              | RF07, RF08, RN06, RN07, RN18, RN19, RNF07              | [04](./04-modelo-de-dados.md), [11](./11-endpoints.md)                 |
| Histórico de adoções                     | RF09, RN18                                             | [04](./04-modelo-de-dados.md)                                          |
| Dashboard / métricas                     | RF10                                                   | [11](./11-endpoints.md)                                                |
| Busca e filtros                          | RF05, RN10, RN11, RNF05, RNF09                         | [11](./11-endpoints.md)                                                |
| Exclusão auditada e segura (soft delete) | RF02, RN03, RN14, RN15, RN17                           | [04](./04-modelo-de-dados.md), [06](./06-autenticacao-e-permissoes.md) |
| Auditoria / acompanhamento evolutivo     | RF04, RN15                                             | [04](./04-modelo-de-dados.md)                                          |
| Qualidade (testes, arquitetura)          | RNF12, RNF13                                           | [02](./02-arquitetura.md), [08](./08-testes.md)                        |
| Deploy (HTTPS, produção)                 | RNF08                                                  | [09](./09-deploy.md)                                                   |
