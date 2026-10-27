import { TipoDoacao } from '@prisma/client';

export class Doacao {
  id!: string;
  tipo!: TipoDoacao;
  valor?: number | null;
  quantidade?: number | null;
  unidadeMedida?: string | null;
  descricao?: string | null;
  dataRecebimento!: Date;
  doadorId?: string | null;
  registradoPorId?: string | null;
  ativo!: boolean;
  criadoEm!: Date;
  modificadoEm!: Date;
}
