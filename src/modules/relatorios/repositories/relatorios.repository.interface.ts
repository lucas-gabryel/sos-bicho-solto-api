import {
  EspecieAnimal,
  MotivoSaidaAnimal,
  PorteAnimal,
  SexoAnimal,
  StatusAnimal,
  TipoEventoAnimal,
} from '@prisma/client';
import { SituacaoAcolhedor } from '#src/modules/tutores/enums/situacao-acolhedor.enum';

export const RELATORIOS_REPOSITORY = Symbol('RELATORIOS_REPOSITORY');

export interface EventoRelatorio {
  dataEvento: Date;
  tipo: TipoEventoAnimal;
  motivoSaida: MotivoSaidaAnimal | null;
  descricao: string;
  automatico: boolean;
  registradoPor: string | null;
}

export interface AdocaoRelatorio {
  dataAdocao: Date;
  devolvidoEm: Date | null;
  observacoes: string | null;
  observacoesDevolucao: string | null;
  protetor: string;
  tutor: { codigo: number; nome: string };
  animal: {
    nome: string;
    numeroRegistro: string;
    especie: EspecieAnimal;
    criadoEm: Date;
    // Datas de entrada (resgate e retornos) usadas para medir o tempo em
    // acolhimento até cada adoção.
    entradas: Date[];
  };
}

export interface AnimalRelatorio {
  numeroRegistro: string;
  nome: string;
  especie: EspecieAnimal;
  raca: string;
  sexo: SexoAnimal;
  porte: PorteAnimal | null;
  cor: string;
  pesoInicial: number;
  pesoAtual: number | null;
  dataNascimento: Date | null;
  castrado: boolean;
  vacinado: boolean;
  localResgate: string;
  observacoes: string | null;
  status: StatusAnimal;
  criadoEm: Date;
  tutor: { codigo: number; nome: string } | null;
  eventos: EventoRelatorio[];
  adocoes: AdocaoRelatorio[];
}

export interface AnimalVinculadoRelatorio {
  numeroRegistro: string;
  nome: string;
  especie: EspecieAnimal;
  raca: string;
  status: StatusAnimal;
}

export interface AcolhedorRelatorio {
  codigo: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco: string;
  criadoEm: Date;
  adocoes: AdocaoRelatorio[];
  animaisVinculados: AnimalVinculadoRelatorio[];
}

// Os relatórios trazem o histórico completo e filtram/agregam em memória:
// indicadores do período, situação atual e fichas saem da mesma fonte, o que
// mantém os números consistentes entre si (volume compatível com uma ONG).
export interface IRelatoriosRepository {
  buscarAnimais(especie?: EspecieAnimal): Promise<AnimalRelatorio[]>;
  buscarAcolhedores(situacao: SituacaoAcolhedor): Promise<AcolhedorRelatorio[]>;
  buscarNomeUsuario(id: string): Promise<string | null>;
}
