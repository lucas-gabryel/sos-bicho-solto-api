export enum SituacaoAcolhedor {
  ADOTANTE = 'ADOTANTE',
  TUTOR = 'TUTOR',
}

export function calcularSituacao(
  totalAnimaisAdotados: number,
): SituacaoAcolhedor {
  return totalAnimaisAdotados > 0
    ? SituacaoAcolhedor.TUTOR
    : SituacaoAcolhedor.ADOTANTE;
}
