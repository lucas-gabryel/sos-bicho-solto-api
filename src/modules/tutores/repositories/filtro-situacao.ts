import { Prisma } from '@prisma/client';
import { SituacaoAcolhedor } from '../enums/situacao-acolhedor.enum';

// Critério único de "animal vinculado": define a contagem (e, portanto, a
// situação exibida), o filtro de situação e os contadores do dashboard.
export const ANIMAIS_VINCULADOS_WHERE = {
  ativo: true,
} satisfies Prisma.AnimalWhereInput;

export function filtroSituacao(
  situacao?: SituacaoAcolhedor,
): Prisma.TutorWhereInput {
  if (situacao === SituacaoAcolhedor.TUTOR) {
    return { animais: { some: ANIMAIS_VINCULADOS_WHERE } };
  }

  if (situacao === SituacaoAcolhedor.ADOTANTE) {
    return { animais: { none: ANIMAIS_VINCULADOS_WHERE } };
  }

  return {};
}
