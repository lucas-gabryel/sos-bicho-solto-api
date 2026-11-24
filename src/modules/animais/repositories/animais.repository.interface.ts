import {
  Animal,
  EspecieAnimal,
  FotoAnimal,
  MotivoSaidaAnimal,
  StatusAnimal,
  TipoEventoAnimal,
} from '@prisma/client';
import { CriarAnimalDto } from '../dto/criar-animal.dto';
import { AtualizarAnimalDto } from '../dto/atualizar-animal.dto';
import { EventoAnimalComAutor } from '../dto/evento-animal-response.dto';

export type AnimalComRelacoes = Animal & {
  fotos: FotoAnimal[];
  eventos?: EventoAnimalComAutor[];
};

export interface ListarAnimaisParams {
  skip: number;
  take: number;
  especie?: EspecieAnimal;
  status?: StatusAnimal;
  busca?: string;
  tutorId?: string;
}

export interface CriarEventoAnimalData {
  tipo: TipoEventoAnimal;
  motivoSaida?: MotivoSaidaAnimal | null;
  descricao: string;
  dataEvento?: Date;
  documentoUrl?: string | null;
  documentoNome?: string | null;
  documentoTipo?: string | null;
  automatico?: boolean;
  criadoPorId?: string | null;
  novoStatusAnimal?: StatusAnimal;
}

export interface ListarEventosAnimalParams {
  animalId: string;
  skip: number;
  take: number;
  tipo?: TipoEventoAnimal;
}

export interface IAnimaisRepository {
  criar(dto: CriarAnimalDto, criadoPorId: string): Promise<AnimalComRelacoes>;
  buscarPorId(id: string): Promise<AnimalComRelacoes | null>;
  listar(
    params: ListarAnimaisParams,
  ): Promise<{ data: AnimalComRelacoes[]; total: number }>;
  atualizar(
    id: string,
    dto: AtualizarAnimalDto,
    modificadoPorId: string,
    eventosParaCriar?: CriarEventoAnimalData[],
  ): Promise<AnimalComRelacoes>;
  excluir(id: string, modificadoPorId: string): Promise<Animal>;

  adicionarFoto(
    animalId: string,
    url: string,
    principal: boolean,
    criadoPorId: string,
  ): Promise<FotoAnimal>;
  removerFoto(fotoId: string, modificadoPorId: string): Promise<FotoAnimal>;
  definirFotoPrincipal(
    animalId: string,
    fotoId: string,
    modificadoPorId: string,
  ): Promise<void>;
  buscarFotoPorId(fotoId: string): Promise<FotoAnimal | null>;

  adicionarEvento(
    animalId: string,
    data: CriarEventoAnimalData,
  ): Promise<EventoAnimalComAutor>;
  listarEventos(
    params: ListarEventosAnimalParams,
  ): Promise<{ data: EventoAnimalComAutor[]; total: number }>;
}

export const ANIMAIS_REPOSITORY = 'ANIMAIS_REPOSITORY';
