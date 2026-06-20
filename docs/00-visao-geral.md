# 00 — Visão Geral

## O projeto

**SOS Bicho Solto** é um sistema de gestão de resgate e adoção de animais. O Projeto 1 (frontend)
foi construído com dados _mocados_. O **Projeto 2 (este backend)** entrega uma **API REST** que
substitui esses dados mocados por dados reais persistidos em banco.

## Objetivo principal

Criar uma API REST com **NestJS** responsável por fornecer dados reais ao frontend, permitindo:

- Autenticação de usuários (operadores da ONG)
- Controle de permissões por perfil (RBAC)
- Gestão de animais
- Gestão de tutores (adotantes)
- Gestão de usuários do sistema
- Processo de adoção
- Histórico de adoções
- Dashboard com métricas
- Integração completa com o frontend
- Deploy em ambiente de produção

## Requisitos do trabalho (checklist de avaliação)

| Requisito                                          | Onde é tratado                                               |
| -------------------------------------------------- | ------------------------------------------------------------ |
| Framework NestJS                                   | Todo o projeto                                               |
| ORM configurado (Prisma)                           | [05](./05-banco-de-dados-prisma.md)                          |
| Modules, Controllers e Services coesos             | [02](./02-arquitetura.md), [03](./03-estrutura-de-pastas.md) |
| DTOs para tráfego de dados                         | [07](./07-padroes-e-convencoes.md)                           |
| Validação com `class-validator`                    | [07](./07-padroes-e-convencoes.md)                           |
| Repository Pattern                                 | [02](./02-arquitetura.md)                                    |
| Princípios SOLID                                   | [02](./02-arquitetura.md)                                    |
| Testes unitários (cobertura da camada de Services) | [08](./08-testes.md)                                         |
| Integração com o frontend                          | [11](./11-endpoints.md)                                      |
| Deploy (back + front)                              | [09](./09-deploy.md)                                         |
| Entrega: links de repositórios + URLs de deploy    | [09](./09-deploy.md)                                         |

## Escopo do domínio

O sistema gira em torno de **5 entidades** principais:

- **Usuario** — quem opera o sistema (equipe da ONG). Faz login. Perfis: `ADMIN`, `PROTETOR`.
- **Tutor** — pessoa que adota um animal. **Não faz login** (cadastro de domínio).
- **Animal** — o animal resgatado; status `ACOLHIMENTO` ou `ADOTADO`; pode ter um `tutorId` (RN06).
- **FotoAnimal** — fotos do animal (1 principal + N). *Modelo a refinar.*
- **Adocao** — **histórico** de cada adoção (vínculo animal↔tutor registrado por um protetor).

> O **Dashboard** não é uma entidade: são consultas agregadas sobre as tabelas acima.

## Fora de escopo (Projeto 2)

- Cadastro/login público de tutores (tutor é cadastrado pela equipe).
- Upload de arquivos de imagem (usaremos **URL** de foto; upload é evolução opcional — ver [12](./12-upload-arquivos.md)).
- Notificações por e-mail / integrações externas.
- Refresh token (decidido: apenas access token JWT — ver [06](./06-autenticacao-e-permissoes.md)).

## Glossário

| Termo                      | Significado                                                         |
| -------------------------- | ------------------------------------------------------------------- |
| **Tutor**                  | Pessoa física que recebe a guarda de um animal (o adotante)         |
| **Usuário**                | Membro da equipe da ONG que opera o sistema (faz login)             |
| **Perfil ADMIN**           | Usuário que administra o sistema (usuários + ações destrutivas)     |
| **Perfil PROTETOR**        | Usuário que opera o dia a dia (animais, tutores, adoções)           |
| **Resgate**                | Entrada do animal na ONG (campo `localResgate`)                     |
| **Nº de Registro**         | ID humano do animal no formato `DD.MM.AAAA.N`, imutável (RN04)      |
| **Acolhimento / Adotado**  | Status do animal (em acolhimento na ONG ou já adotado)             |
| **RBAC**                   | _Role-Based Access Control_ — permissões baseadas em perfil         |
| **DTO**                    | _Data Transfer Object_ — objeto de tráfego de dados na borda da API |

> **Convenção de idioma:** estrutura técnica (Controller, Service, Repository, DTO...) em inglês;
> **domínio** (entidades, campos, valores de enum e rotas) em **português**, para casar com o frontend.
> Os nomes exatos serão fechados ao mapear o front — ver [07](./07-padroes-e-convencoes.md) e [11](./11-endpoints.md).
