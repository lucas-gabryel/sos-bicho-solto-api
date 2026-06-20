# 09 — Deploy

> O **host ainda será escolhido** na etapa de entrega. Este documento define a estratégia
> de forma genérica, com as opções recomendadas e o checklist final.

## O que precisa ir para produção

1. **Backend** (esta API NestJS)
2. **Banco de dados** PostgreSQL gerenciado
3. **Frontend** (Projeto 1)

## Preparação do backend para produção

### Scripts no `package.json`

```json
{
  "scripts": {
    "build": "nest build",
    "start:prod": "node dist/main",
    "prisma:deploy": "prisma migrate deploy"
  }
}
```

### Sequência de start em produção

```bash
corepack enable                      # habilita o pnpm na versão do package.json
pnpm install --frozen-lockfile       # instala exatamente o que está no pnpm-lock.yaml
pnpm prisma generate
pnpm prisma migrate deploy           # aplica migrations sem perder dados
pnpm build
pnpm start:prod
```

> O host precisa ter o **pnpm** disponível. O `corepack enable` (já incluso no Node 16.10+) é a
> forma recomendada de ativá-lo sem instalar nada extra.

### Variáveis de ambiente em produção

| Variável         | Observação                            |
| ---------------- | ------------------------------------- |
| `DATABASE_URL`   | string do Postgres gerenciado do host |
| `JWT_SECRET`     | segredo forte e exclusivo de produção |
| `JWT_EXPIRES_IN` | ex.: `1d`                             |
| `PORT`           | normalmente injetada pelo host        |
| `CORS_ORIGIN`    | URL pública do frontend em produção   |

### Ajustes obrigatórios no código

- `app.listen(process.env.PORT ?? 3000)` (usar a porta do host).
- CORS habilitado para a origem do frontend de produção.
- `ValidationPipe` global ativo.
- Não expor stack trace em erros (Exception Filter já cuida).

## Opções de host recomendadas

| Host             | Prós                                                              | Observação                         |
| ---------------- | ----------------------------------------------------------------- | ---------------------------------- |
| **Render**       | Web service + Postgres gerenciado no free tier; deploy via GitHub | Free tier "dorme" após inatividade |
| **Railway**      | DX excelente, Postgres incluso                                    | Free tier por créditos mensais     |
| **Fly.io / VPS** | Controle total via Docker                                         | Mais configuração manual           |

Banco gerenciado alternativo (se o host não oferecer): **Neon** ou **Supabase** (Postgres free tier).

## Deploy do frontend

- Hosts recomendados: **Vercel** ou **Netlify** (ideais para SPA/React).
- Configurar a variável de ambiente do front com a **URL pública da API** (ex.: `VITE_API_URL`).
- Garantir que a `CORS_ORIGIN` do backend bata com a URL do front.

## Checklist de entrega final

- [ ] Backend rodando em URL pública
- [ ] Banco de produção com migrations aplicadas (`migrate deploy`)
- [ ] Seed do admin executado (e senha trocada)
- [ ] Frontend rodando em URL pública, consumindo a API real
- [ ] CORS configurado entre front e back
- [ ] Swagger acessível (`/docs`) — opcional, mas recomendado
- [ ] README de cada repositório com instruções de execução local
- [ ] **Entrega na plataforma:**
  - [ ] Link do repositório do **Backend**
  - [ ] Link do repositório do **Frontend**
  - [ ] URL de deploy do **Backend**
  - [ ] URL de deploy do **Frontend**

## (Opcional) Dockerfile de referência

```dockerfile
FROM node:24-alpine
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate && pnpm build
EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main"]
```

> Em alguns ambientes o pnpm exige aprovar scripts de build (`bcrypt`/`prisma`) — ver a
> "pegadinha do pnpm 10" em [01](./01-stack-tecnologica.md).
