# 12 — Upload de Arquivos (evolução opcional)

> **Status:** o **modelo de dados** das fotos já existe (tabela `fotos_animal` — ver
> [04](./04-modelo-de-dados.md)/[05](./05-banco-de-dados-prisma.md)). O que fica como **evolução
> opcional** é o **upload real** do arquivo; por enquanto a foto é informada por **URL**.
>
> ⚠️ **A refinar:** os requisitos (RN05/RN08) falam em "foto inicial" e limites de upload, mas não
> detalham a quantidade. Decidimos modelar como **1 foto principal + N fotos adicionais** (tabela
> `fotos_animal`, campo `principal`). Confirmar com o time/professor antes de finalizar.

## Modelo de fotos (1 principal + N)

Cada animal tem **N** registros em `fotos_animal`, sendo **exatamente um** com `principal = true`
(a "foto inicial" obrigatória do RN05). Regra garantida no `AnimaisService`/`FotosService`.

## Princípio: upload é uma adição, não uma mudança

O banco **não muda**. Continuamos guardando uma **URL** no campo `url` da tabela `fotos_animal`.
O upload só altera *como* essa URL é obtida:

```
HOJE:   usuário cola uma URL  ───────────────────────────────▶ salva url em fotos_animal
UPLOAD: usuário envia arquivo → API sobe pro storage → recebe URL → salva url em fotos_animal
```

Por isso dá pra entregar com URL agora e plugar upload depois **sem migration**.

## Opções com tier gratuito

| Serviço | Free tier | Observações |
|---------|-----------|-------------|
| **Cloudinary** (recomendado) | ~25GB storage/banda | Especializado em imagem; SDK simples; redimensiona/otimiza automaticamente |
| **Supabase Storage** | 1GB | Coeso se o Postgres também for Supabase; S3-compatible |
| **Cloudflare R2** | 10GB, sem custo de egress | S3-compatible; setup um pouco maior |

⚠️ **Não usar disco local do servidor:** em hosts grátis (Render/Railway) o filesystem é efêmero
e os arquivos somem a cada deploy.

## O que é preciso no NestJS

1. **Recepção do arquivo** — `Multer` via `FileInterceptor` (`@nestjs/platform-express`):
   ```ts
   @Post(':id/foto')
   @UseInterceptors(FileInterceptor('arquivo'))
   uploadFoto(
     @Param('id') id: string,
     @UploadedFile(
       new ParseFilePipe({
         validators: [
           new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB (RN08)
           new FileTypeValidator({ fileType: /(png|jpe?g)$/ }),    // só .png/.jpg/.jpeg (RN08)
         ],
       }),
     )
     arquivo: Express.Multer.File,
   ) {
     // cria um registro em fotos_animal com a URL retornada pelo storage
     return this.animaisService.adicionarFoto(id, arquivo);
   }
   ```

2. **Abstração de storage** (segue o nosso padrão — DIP do SOLID): o service não conhece o provedor.
   ```ts
   export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

   export interface IStorageService {
     upload(arquivo: Express.Multer.File): Promise<{ url: string }>;
     remover(url: string): Promise<void>;
   }
   // implementação: CloudinaryStorageService implements IStorageService
   ```

3. **Variáveis de ambiente** (exemplo Cloudinary):
   | Variável | Descrição |
   |----------|-----------|
   | `CLOUDINARY_CLOUD_NAME` | nome da conta |
   | `CLOUDINARY_API_KEY` | chave |
   | `CLOUDINARY_API_SECRET` | segredo |

4. **Dependências:**
   ```bash
   pnpm add cloudinary
   # Multer já vem com @nestjs/platform-express
   ```

## Fluxo completo

```
POST /animais/:id/fotos  (multipart/form-data, campo "arquivo")
  → ParseFilePipe valida tamanho e tipo (RN08)
  → StorageService.upload(arquivo) → retorna { url }
  → cria registro em fotos_animal (url, principal conforme regra)
  → resposta 201 com a foto criada
```

## Cuidados

- Validar **tamanho** (ex.: máx. 5MB) e **tipo** (apenas imagens) — nunca confiar no cliente.
- Ao trocar a foto, opcionalmente remover a anterior do storage (`remover(urlAntiga)`).
- Manter as credenciais **só** em variáveis de ambiente.
- Esse endpoint exige autenticação (mesmos guards/roles do CRUD de animais).
