import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

export interface ArquivoUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB

const MIME_TYPES_PERMITIDOS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
};

const PADRAO_DOCUMENTO_URL =
  /^(https?:\/\/[^\s]+|\/uploads\/[^\s]+|data:(image\/(jpeg|png|webp|gif)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document));base64,[A-Za-z0-9+/=]+)$/i;

export function validarDocumentoUrl(valor: string): boolean {
  return PADRAO_DOCUMENTO_URL.test(valor.trim());
}

export function inferirTipoDocumentoPorUrl(url: string): string | null {
  const limpa = url.trim();
  if (limpa.startsWith('data:')) {
    const match = /^data:([^;]+);base64,/i.exec(limpa);
    return match ? match[1].toLowerCase() : null;
  }

  const semQuery = limpa.split('?')[0].toLowerCase();
  if (semQuery.endsWith('.pdf')) return 'application/pdf';
  if (semQuery.endsWith('.png')) return 'image/png';
  if (semQuery.endsWith('.jpg') || semQuery.endsWith('.jpeg'))
    return 'image/jpeg';
  if (semQuery.endsWith('.webp')) return 'image/webp';
  if (semQuery.endsWith('.gif')) return 'image/gif';
  if (semQuery.endsWith('.doc')) return 'application/msword';
  if (semQuery.endsWith('.docx'))
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  return null;
}

export async function salvarArquivoEvento(
  arquivo: ArquivoUpload,
  baseUrl: string,
): Promise<{
  documentoUrl: string;
  documentoNome: string;
  documentoTipo: string;
}> {
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    throw new BadRequestException(
      'O documento comprobatório deve ter no máximo 10 MB.',
    );
  }

  const extensaoMapeada = MIME_TYPES_PERMITIDOS[arquivo.mimetype.toLowerCase()];
  if (!extensaoMapeada) {
    throw new BadRequestException(
      'Tipo de arquivo não suportado. Envie imagem (JPG, PNG, WEBP, GIF) ou documento (PDF, DOC, DOCX).',
    );
  }

  const extOriginal = extname(arquivo.originalname).toLowerCase();
  const extensaoFinal =
    extOriginal && /^[.][a-z0-9]{2,5}$/.test(extOriginal)
      ? extOriginal
      : extensaoMapeada;

  const nomeArquivo = `${randomUUID()}${extensaoFinal}`;
  const pastaDestino = join(process.cwd(), 'uploads', 'eventos');
  await mkdir(pastaDestino, { recursive: true });
  await writeFile(join(pastaDestino, nomeArquivo), arquivo.buffer);

  const prefixoUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : '';

  return {
    documentoUrl: `${prefixoUrl}/uploads/eventos/${nomeArquivo}`,
    documentoNome: arquivo.originalname,
    documentoTipo: arquivo.mimetype.toLowerCase(),
  };
}
