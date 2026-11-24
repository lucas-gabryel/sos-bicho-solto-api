import type { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import type {
  CriarEventoAnimalData,
  IAnimaisRepository,
} from './repositories/animais.repository.interface';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Animal,
  MotivoSaidaAnimal,
  StatusAnimal,
  TipoEventoAnimal,
} from '@prisma/client';
import { paginar, RespostaPaginada } from '#src/common/dto/paginacao.dto';
import { CriarAnimalDto } from './dto/criar-animal.dto';
import { AtualizarAnimalDto } from './dto/atualizar-animal.dto';
import { AnimalResponseDto, FotoResponseDto } from './dto/animal-response.dto';
import { CriarEventoAnimalDto } from './dto/criar-evento-animal.dto';
import { EventoAnimalResponseDto } from './dto/evento-animal-response.dto';
import { FiltrarEventosAnimalDto } from './dto/filtrar-eventos-animal.dto';
import { ANIMAIS_REPOSITORY } from './repositories/animais.repository.interface';
import { FiltrarAnimaisDto } from './dto/filtrar-animais.dto';
import type { IUsuariosRepository } from '#src/modules/usuarios/repositories/usuarios.repository.interface';
import { USUARIOS_REPOSITORY } from '#src/modules/usuarios/repositories/usuarios.repository.interface';
import {
  type ArquivoUpload,
  inferirTipoDocumentoPorUrl,
  salvarArquivoEvento,
  validarDocumentoUrl,
} from './utils/documento-evento.util';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AnimaisService {
  constructor(
    @Inject(ANIMAIS_REPOSITORY)
    private readonly animaisRepository: IAnimaisRepository,
    @Inject(USUARIOS_REPOSITORY)
    private readonly usuariosRepository: IUsuariosRepository,
  ) {}

  async criar(
    dto: CriarAnimalDto,
    usuario: JwtPayload,
  ): Promise<AnimalResponseDto> {
    const fotos = dto.fotos || [];
    if (fotos.length === 0) {
      throw new BadRequestException(
        'O animal deve ter pelo menos uma foto inicial.',
      );
    }

    const temPrincipal = fotos.some((f) => f.principal);
    if (!temPrincipal) {
      fotos[0].principal = true;
    }

    const principais = fotos.filter((f) => f.principal);
    if (principais.length !== 1) {
      throw new BadRequestException(
        'O animal deve ter exatamente uma foto principal.',
      );
    }

    const animal = await this.animaisRepository.criar(dto, usuario.sub);
    return AnimalResponseDto.fromEntity(animal);
  }

  async buscarPorId(id: string): Promise<AnimalResponseDto> {
    const animal = await this.animaisRepository.buscarPorId(id);

    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    return AnimalResponseDto.fromEntity(animal);
  }

  async listar(
    filtros: FiltrarAnimaisDto,
  ): Promise<RespostaPaginada<AnimalResponseDto>> {
    const { data, total } = await this.animaisRepository.listar({
      skip: filtros.skip,
      take: filtros.take,
      especie: filtros.especie,
      status: filtros.status,
      busca: filtros.busca,
    });

    return paginar(
      data.map((animal) => AnimalResponseDto.fromEntity(animal)),
      total,
      filtros,
    );
  }

  async atualizar(
    id: string,
    dto: AtualizarAnimalDto,
    usuario: JwtPayload,
  ): Promise<AnimalResponseDto> {
    const animal = await this.animaisRepository.buscarPorId(id);

    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    const eventosParaCriar = this.coletarEventosNaAtualizacao(
      animal,
      dto,
      usuario.sub,
    );

    const animalAtualizado =
      eventosParaCriar.length > 0
        ? await this.animaisRepository.atualizar(
            id,
            dto,
            usuario.sub,
            eventosParaCriar,
          )
        : await this.animaisRepository.atualizar(id, dto, usuario.sub);

    return AnimalResponseDto.fromEntity(animalAtualizado);
  }

  async adicionarEvento(
    animalId: string,
    dto: CriarEventoAnimalDto,
    usuario: JwtPayload,
    arquivoUpload?: ArquivoUpload,
    baseUrl = '',
  ): Promise<EventoAnimalResponseDto> {
    const animal = await this.animaisRepository.buscarPorId(animalId);
    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    let documentoInfo: {
      documentoUrl: string | null;
      documentoNome: string | null;
      documentoTipo: string | null;
    } | null = null;

    if (arquivoUpload) {
      documentoInfo = await salvarArquivoEvento(arquivoUpload, baseUrl);
    }

    const dadosEvento = this.montarDadosEventoManual(
      animal,
      dto,
      usuario.sub,
      documentoInfo,
    );

    const evento = await this.animaisRepository.adicionarEvento(
      animalId,
      dadosEvento,
    );

    return EventoAnimalResponseDto.fromEntity(evento);
  }

  async listarEventos(
    animalId: string,
    filtros: FiltrarEventosAnimalDto,
  ): Promise<RespostaPaginada<EventoAnimalResponseDto>> {
    const animal = await this.animaisRepository.buscarPorId(animalId);
    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    const { data, total } = await this.animaisRepository.listarEventos({
      animalId,
      skip: filtros.skip,
      take: filtros.take,
      tipo: filtros.tipo,
    });

    return paginar(
      data.map((ev) => EventoAnimalResponseDto.fromEntity(ev)),
      total,
      filtros,
    );
  }

  async excluir(
    id: string,
    senhaAdmin: string,
    usuario: JwtPayload,
  ): Promise<{ ok: true }> {
    if (usuario.perfil !== 'ADMIN') {
      throw new ForbiddenException('Apenas ADMIN pode excluir animais.');
    }

    const admin = await this.usuariosRepository.buscarPorId(usuario.sub);
    if (!admin || !(await bcrypt.compare(senhaAdmin, admin.senhaHash))) {
      throw new UnauthorizedException('Senha do administrador inválida.');
    }

    const animal = await this.animaisRepository.buscarPorId(id);

    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    await this.animaisRepository.excluir(id, usuario.sub);

    return { ok: true };
  }

  async adicionarFoto(
    animalId: string,
    url: string,
    principal: boolean,
    usuario: JwtPayload,
  ) {
    const animal = await this.animaisRepository.buscarPorId(animalId);
    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    const foto = await this.animaisRepository.adicionarFoto(
      animalId,
      url,
      principal,
      usuario.sub,
    );
    return FotoResponseDto.fromEntity(foto);
  }

  async removerFoto(animalId: string, fotoId: string, usuario: JwtPayload) {
    const animal = await this.animaisRepository.buscarPorId(animalId);
    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    const foto = await this.animaisRepository.buscarFotoPorId(fotoId);
    if (!foto || !foto.ativo || foto.animalId !== animalId) {
      throw new NotFoundException('Foto não encontrada no animal informado');
    }

    const fotosAtivas = animal.fotos || [];
    if (fotosAtivas.length <= 1) {
      throw new BadRequestException(
        'O animal deve ter pelo menos uma foto ativa.',
      );
    }

    await this.animaisRepository.removerFoto(fotoId, usuario.sub);

    if (foto.principal) {
      const proximaFoto = fotosAtivas.find((f) => f.id !== fotoId);
      if (proximaFoto) {
        await this.animaisRepository.definirFotoPrincipal(
          animalId,
          proximaFoto.id,
          usuario.sub,
        );
      }
    }

    return { ok: true };
  }

  async definirFotoPrincipal(
    animalId: string,
    fotoId: string,
    usuario: JwtPayload,
  ) {
    const animal = await this.animaisRepository.buscarPorId(animalId);
    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    const foto = await this.animaisRepository.buscarFotoPorId(fotoId);
    if (!foto || !foto.ativo || foto.animalId !== animalId) {
      throw new NotFoundException('Foto não encontrada no animal informado');
    }

    await this.animaisRepository.definirFotoPrincipal(
      animalId,
      fotoId,
      usuario.sub,
    );
    return { ok: true };
  }

  private coletarEventosNaAtualizacao(
    animal: Animal,
    dto: AtualizarAnimalDto,
    usuarioId: string,
  ): CriarEventoAnimalData[] {
    const eventos: CriarEventoAnimalData[] = [];

    if (dto.status !== undefined && dto.status !== animal.status) {
      if (dto.status === StatusAnimal.ADOTADO) {
        throw new BadRequestException(
          'Para registrar adoção de um animal, utilize o módulo de adoções.',
        );
      }

      if (animal.status === StatusAnimal.ADOTADO) {
        throw new BadRequestException(
          'O animal possui adoção ativa. Registre a devolução antes de alterar o status.',
        );
      }

      const complemento = dto.motivoSaidaDescricao?.trim();

      if (dto.status === StatusAnimal.TRANSFERIDO) {
        eventos.push({
          tipo: TipoEventoAnimal.SAIDA,
          motivoSaida: MotivoSaidaAnimal.TRANSFERENCIA,
          descricao: complemento
            ? `Saída da ONG por transferência: ${complemento}`
            : 'Saída da ONG registrada por transferência.',
          automatico: true,
          criadoPorId: usuarioId,
        });
      } else if (dto.status === StatusAnimal.OBITO) {
        eventos.push({
          tipo: TipoEventoAnimal.SAIDA,
          motivoSaida: MotivoSaidaAnimal.OBITO,
          descricao: complemento
            ? `Saída da ONG por óbito: ${complemento}`
            : 'Saída da ONG registrada por óbito do animal.',
          automatico: true,
          criadoPorId: usuarioId,
        });
      } else if (dto.status === StatusAnimal.ACOLHIMENTO) {
        eventos.push({
          tipo: TipoEventoAnimal.ENTRADA,
          descricao: complemento
            ? `Retorno ao acolhimento na ONG: ${complemento}`
            : 'Retorno do animal ao acolhimento na ONG.',
          automatico: true,
          criadoPorId: usuarioId,
        });
      }
    }

    const alteracoesMedicas: string[] = [];

    if (
      dto.pesoInicial !== undefined &&
      Number(dto.pesoInicial) !== Number(animal.pesoInicial)
    ) {
      alteracoesMedicas.push(
        `peso inicial ajustado de ${Number(animal.pesoInicial)} kg para ${Number(dto.pesoInicial)} kg`,
      );
    }

    const pesoAtualAnterior =
      animal.pesoAtual !== null && animal.pesoAtual !== undefined
        ? Number(animal.pesoAtual)
        : null;
    if (
      dto.pesoAtual !== undefined &&
      Number(dto.pesoAtual) !== pesoAtualAnterior
    ) {
      alteracoesMedicas.push(
        pesoAtualAnterior === null
          ? `peso atual registrado: ${Number(dto.pesoAtual)} kg`
          : `peso atualizado de ${pesoAtualAnterior} kg para ${Number(dto.pesoAtual)} kg`,
      );
    }

    if (dto.vacinado !== undefined && dto.vacinado !== animal.vacinado) {
      alteracoesMedicas.push(
        dto.vacinado
          ? 'animal marcado como vacinado'
          : 'status de vacinação alterado para não vacinado',
      );
    }

    if (dto.castrado !== undefined && dto.castrado !== animal.castrado) {
      alteracoesMedicas.push(
        dto.castrado
          ? 'animal marcado como castrado'
          : 'status de castração alterado para não castrado',
      );
    }

    const obsNova =
      dto.observacoes !== undefined
        ? dto.observacoes.trim() || null
        : undefined;
    const obsAnterior = animal.observacoes?.trim() || null;
    if (obsNova !== undefined && obsNova !== obsAnterior) {
      alteracoesMedicas.push(
        obsNova
          ? `observações clínicas atualizadas: "${obsNova}"`
          : 'observações clínicas removidas',
      );
    }

    if (alteracoesMedicas.length > 0) {
      eventos.push({
        tipo: TipoEventoAnimal.MEDICO,
        descricao: `Atualização médica automática: ${alteracoesMedicas.join('; ')}.`,
        automatico: true,
        criadoPorId: usuarioId,
      });
    }

    const eventosManuaisDto: CriarEventoAnimalDto[] = [
      ...(dto.novoEvento ? [dto.novoEvento] : []),
      ...(dto.eventos ?? []),
    ];

    for (const evDto of eventosManuaisDto) {
      eventos.push(this.montarDadosEventoManual(animal, evDto, usuarioId));
    }

    return eventos;
  }

  private montarDadosEventoManual(
    animal: Animal,
    dto: CriarEventoAnimalDto,
    usuarioId: string,
    documentoUpload?: {
      documentoUrl: string | null;
      documentoNome: string | null;
      documentoTipo: string | null;
    } | null,
  ): CriarEventoAnimalData {
    const descricao = dto.descricao?.trim();
    if (!descricao) {
      throw new BadRequestException('A descrição do evento é obrigatória.');
    }

    const dataEvento = dto.data ?? dto.dataEvento ?? new Date();
    if (Number.isNaN(dataEvento.getTime())) {
      throw new BadRequestException('A data do evento informada é inválida.');
    }

    const tipo =
      dto.tipo ??
      (dto.motivoSaida ? TipoEventoAnimal.SAIDA : TipoEventoAnimal.OUTRO);

    let motivoSaida: MotivoSaidaAnimal | null = dto.motivoSaida ?? null;
    let novoStatusAnimal: StatusAnimal | undefined = undefined;

    if (tipo === TipoEventoAnimal.SAIDA) {
      if (motivoSaida === MotivoSaidaAnimal.ADOCAO) {
        throw new BadRequestException(
          'Para registrar saída por adoção, utilize o módulo de adoções.',
        );
      }

      if (
        motivoSaida === MotivoSaidaAnimal.TRANSFERENCIA ||
        motivoSaida === MotivoSaidaAnimal.OBITO
      ) {
        if (animal.status === StatusAnimal.ADOTADO) {
          throw new BadRequestException(
            'O animal possui adoção ativa. Registre a devolução antes de alterar o status.',
          );
        }
        novoStatusAnimal =
          motivoSaida === MotivoSaidaAnimal.TRANSFERENCIA
            ? StatusAnimal.TRANSFERIDO
            : StatusAnimal.OBITO;
      }
    } else {
      motivoSaida = null;
      if (
        tipo === TipoEventoAnimal.ENTRADA &&
        animal.status === StatusAnimal.TRANSFERIDO
      ) {
        novoStatusAnimal = StatusAnimal.ACOLHIMENTO;
      }
    }

    let documentoUrl = documentoUpload?.documentoUrl ?? null;
    const documentoNome =
      documentoUpload?.documentoNome ?? dto.documentoNome?.trim() ?? null;
    let documentoTipo =
      documentoUpload?.documentoTipo ?? dto.documentoTipo?.trim() ?? null;

    if (!documentoUrl) {
      const urlInformada = (
        dto.documentoUrl ??
        dto.url ??
        dto.arquivoUrl ??
        dto.anexoUrl
      )?.trim();

      if (urlInformada) {
        if (!validarDocumentoUrl(urlInformada)) {
          throw new BadRequestException(
            'URL ou formato do documento comprobatório inválido.',
          );
        }
        documentoUrl = urlInformada;
        documentoTipo =
          documentoTipo ?? inferirTipoDocumentoPorUrl(urlInformada);
      }
    }

    return {
      tipo,
      motivoSaida,
      descricao,
      dataEvento,
      documentoUrl,
      documentoNome,
      documentoTipo,
      automatico: false,
      criadoPorId: usuarioId,
      novoStatusAnimal,
    };
  }
}
