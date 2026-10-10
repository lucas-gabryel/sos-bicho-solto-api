import { SituacaoAcolhedor } from '../enums/situacao-acolhedor.enum';
import { filtroSituacao } from './filtro-situacao';

describe('filtroSituacao', () => {
  it('retorna filtro vazio quando situacao não informada', () => {
    expect(filtroSituacao()).toEqual({});
  });

  it('TUTOR exige ao menos um animal ativo vinculado', () => {
    expect(filtroSituacao(SituacaoAcolhedor.TUTOR)).toEqual({
      animais: { some: { ativo: true } },
    });
  });

  it('ADOTANTE exige nenhum animal ativo vinculado', () => {
    expect(filtroSituacao(SituacaoAcolhedor.ADOTANTE)).toEqual({
      animais: { none: { ativo: true } },
    });
  });

  it('não interfere na chave OR usada pela busca', () => {
    const where = {
      ativo: true,
      OR: [{ nome: { contains: 'ana' } }],
      ...filtroSituacao(SituacaoAcolhedor.TUTOR),
    };

    expect(where.OR).toEqual([{ nome: { contains: 'ana' } }]);
    expect(where.animais).toEqual({ some: { ativo: true } });
  });
});
