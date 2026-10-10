import { Prisma } from '@prisma/client';
import { SituacaoAcolhedor } from '../enums/situacao-acolhedor.enum';

// Mesmo critério de INCLUDE_CONTAGEM: apenas animais ativos vinculados.
export function filtroSituacao(
  situacao?: SituacaoAcolhedor,
): Prisma.TutorWhereInput {
  if (situacao === SituacaoAcolhedor.TUTOR) {
    return { animais: { some: { ativo: true } } };
  }

  if (situacao === SituacaoAcolhedor.ADOTANTE) {
    return { animais: { none: { ativo: true } } };
  }

  return {};
}
