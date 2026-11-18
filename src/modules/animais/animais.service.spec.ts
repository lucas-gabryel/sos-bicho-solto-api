import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  EspecieAnimal,
  MotivoSaidaAnimal,
  SexoAnimal,
  StatusAnimal,
  TipoEventoAnimal,
} from '@prisma/client';
import { AnimaisService } from './animais.service';
import { ANIMAIS_REPOSITORY } from './repositories/animais.repository.interface';
import { FiltrarAnimaisDto } from './dto/filtrar-animais.dto';
import { FiltrarEventosAnimalDto } from './dto/filtrar-eventos-animal.dto';
import { USUARIOS_REPOSITORY } from '#src/modules/usuarios/repositories/usuarios.repository.interface';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AnimaisService', () => {
  let service: AnimaisService;

  const mockRepository = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listar: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn(),
    adicionarFoto: jest.fn(),
    removerFoto: jest.fn(),
    definirFotoPrincipal: jest.fn(),
    buscarFotoPorId: jest.fn(),
    adicionarEvento: jest.fn(),
    listarEventos: jest.fn(),
  };

  const mockUsuariosRepository = {
    buscarPorId: jest.fn(),
  };

  const usuarioAdmin = {
    sub: 'admin-123',
    email: 'admin@test.com',
    perfil: 'ADMIN' as const,
  };

  const usuarioProtetor = {
    sub: 'protetor-456',
    email: 'protetor@test.com',
    perfil: 'PROTETOR' as const,
  };

  const mockAdminUser = {
    id: 'admin-123',
    nome: 'Admin',
    email: 'admin@test.com',
    senhaHash: 'hash-senha-admin',
    perfil: 'ADMIN',
    ativo: true,
  };

  const mockAnimal = {
    id: '123',
    numeroRegistro: '20.06.2026.1',
    nome: 'Rex',
    especie: 'CAO',
    raca: 'SRD',
    sexo: 'MACHO',
    porte: 'MEDIO',
    cor: 'Caramelo',
    pesoInicial: 10.5,
    pesoAtual: null,
    dataNascimento: null,
    castrado: false,
    vacinado: false,
    localResgate: 'Rua A',
    observacoes: null,
    status: 'ACOLHIMENTO',
    tutorId: null,
    ativo: true,
    criadoEm: new Date(),
    modificadoEm: new Date(),
    criadoPorId: 'admin-123',
    modificadoPorId: 'admin-123',
    fotos: [
      {
        id: 'foto-1',
        url: 'https://exemplo.com/rex.jpg',
        principal: true,
        ativo: true,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnimaisService,
        {
          provide: ANIMAIS_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: USUARIOS_REPOSITORY,
          useValue: mockUsuariosRepository,
        },
      ],
    }).compile();

    service = module.get<AnimaisService>(AnimaisService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('criar', () => {
    it('deve criar um animal com sucesso se contiver exatamente uma foto principal', async () => {
      const dto = {
        nome: 'Rex',
        especie: EspecieAnimal.CAO,
        raca: 'SRD',
        sexo: SexoAnimal.MACHO,
        cor: 'Caramelo',
        pesoInicial: 10.5,
        localResgate: 'Rua A',
        fotos: [{ url: 'https://exemplo.com/rex.jpg', principal: true }],
      };

      mockRepository.criar.mockResolvedValue(mockAnimal);

      const result = await service.criar(dto, usuarioAdmin);

      expect(mockRepository.criar).toHaveBeenCalledWith(dto, usuarioAdmin.sub);
      expect(result.nome).toBe('Rex');
    });

    it('deve lançar BadRequestException se criar animal sem fotos', async () => {
      const dto = {
        nome: 'Rex',
        especie: EspecieAnimal.CAO,
        raca: 'SRD',
        sexo: SexoAnimal.MACHO,
        cor: 'Caramelo',
        pesoInicial: 10.5,
        localResgate: 'Rua A',
        fotos: [],
      };

      await expect(service.criar(dto, usuarioAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException se houver mais de uma foto principal', async () => {
      const dto = {
        nome: 'Rex',
        especie: EspecieAnimal.CAO,
        raca: 'SRD',
        sexo: SexoAnimal.MACHO,
        cor: 'Caramelo',
        pesoInicial: 10.5,
        localResgate: 'Rua A',
        fotos: [
          { url: 'https://exemplo.com/f1.jpg', principal: true },
          { url: 'https://exemplo.com/f2.jpg', principal: true },
        ],
      };

      await expect(service.criar(dto, usuarioAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve marcar a primeira foto como principal caso nenhuma seja explicitamente principal', async () => {
      const dto = {
        nome: 'Rex',
        especie: EspecieAnimal.CAO,
        raca: 'SRD',
        sexo: SexoAnimal.MACHO,
        cor: 'Caramelo',
        pesoInicial: 10.5,
        localResgate: 'Rua A',
        fotos: [
          { url: 'https://exemplo.com/f1.jpg' },
          { url: 'https://exemplo.com/f2.jpg', principal: false },
        ],
      };

      mockRepository.criar.mockResolvedValue(mockAnimal);

      await service.criar(dto, usuarioAdmin);

      expect(dto.fotos[0].principal).toBe(true);
      expect(mockRepository.criar).toHaveBeenCalledWith(dto, usuarioAdmin.sub);
    });
  });

  describe('buscarPorId', () => {
    it('deve buscar um animal por ID com sucesso', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);

      const result = await service.buscarPorId('123');

      expect(mockRepository.buscarPorId).toHaveBeenCalledWith('123');
      expect(result.nome).toBe('Rex');
    });

    it('deve lançar NotFoundException se animal não existir', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.buscarPorId('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listar', () => {
    it('deve listar animais paginados com sucesso', async () => {
      mockRepository.listar.mockResolvedValue({
        data: [mockAnimal],
        total: 1,
      });

      const filtros = new FiltrarAnimaisDto();
      filtros.page = 1;
      filtros.limit = 10;

      const result = await service.listar(filtros);

      expect(mockRepository.listar).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        especie: undefined,
        status: undefined,
        busca: undefined,
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar um animal com sucesso', async () => {
      const dto = { nome: 'Rex Atualizado' };

      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.atualizar.mockResolvedValue({
        ...mockAnimal,
        nome: 'Rex Atualizado',
      });

      const result = await service.atualizar('123', dto, usuarioAdmin);

      expect(mockRepository.atualizar).toHaveBeenCalledWith(
        '123',
        dto,
        usuarioAdmin.sub,
      );
      expect(result.nome).toBe('Rex Atualizado');
    });

    it('deve registrar automaticamente evento MEDICO ao atualizar informações médicas', async () => {
      const dto = {
        pesoAtual: 12.4,
        vacinado: true,
        castrado: true,
        observacoes: 'Recuperado de verminose e vermifugado.',
      };

      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.atualizar.mockResolvedValue({
        ...mockAnimal,
        ...dto,
      });

      await service.atualizar('123', dto, usuarioAdmin);

      expect(mockRepository.atualizar).toHaveBeenCalledTimes(1);
      const [idChamado, dtoChamado, autorChamado, eventosGerados] =
        mockRepository.atualizar.mock.calls[0] as [
          string,
          unknown,
          string,
          Array<{
            tipo: TipoEventoAnimal;
            automatico: boolean;
            descricao: string;
          }>,
        ];
      expect(idChamado).toBe('123');
      expect(dtoChamado).toEqual(dto);
      expect(autorChamado).toBe(usuarioAdmin.sub);
      expect(eventosGerados).toHaveLength(1);
      expect(eventosGerados[0].tipo).toBe(TipoEventoAnimal.MEDICO);
      expect(eventosGerados[0].automatico).toBe(true);
      expect(eventosGerados[0].descricao).toContain(
        'peso atual registrado: 12.4 kg',
      );
    });

    it('deve registrar automaticamente evento SAIDA ao alterar status para TRANSFERIDO ou OBITO', async () => {
      const dto = {
        status: StatusAnimal.TRANSFERIDO,
        motivoSaidaDescricao: 'Encaminhado para abrigo parceiro',
      };

      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.atualizar.mockResolvedValue({
        ...mockAnimal,
        status: StatusAnimal.TRANSFERIDO,
      });

      await service.atualizar('123', dto, usuarioAdmin);

      expect(mockRepository.atualizar).toHaveBeenCalledWith(
        '123',
        dto,
        usuarioAdmin.sub,
        [
          expect.objectContaining({
            tipo: TipoEventoAnimal.SAIDA,
            motivoSaida: MotivoSaidaAnimal.TRANSFERENCIA,
            automatico: true,
            descricao:
              'Saída da ONG por transferência: Encaminhado para abrigo parceiro',
          }),
        ],
      );
    });

    it('deve bloquear alteração manual de status para ADOTADO fora do módulo de adoções', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);

      await expect(
        service.atualizar(
          '123',
          { status: StatusAnimal.ADOTADO },
          usuarioAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.atualizar).not.toHaveBeenCalled();
    });

    it('deve inserir evento incremental enviado junto com novoEvento no PATCH', async () => {
      const dataEvento = new Date('2026-11-17T15:00:00.000Z');
      const dto = {
        novoEvento: {
          descricao: 'Exame laboratorial anexado',
          data: dataEvento,
          documentoUrl: 'https://exemplo.com/laudo.pdf',
        },
      };

      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.atualizar.mockResolvedValue(mockAnimal);

      await service.atualizar('123', dto, usuarioAdmin);

      expect(mockRepository.atualizar).toHaveBeenCalledWith(
        '123',
        dto,
        usuarioAdmin.sub,
        [
          expect.objectContaining({
            tipo: TipoEventoAnimal.OUTRO,
            descricao: 'Exame laboratorial anexado',
            dataEvento,
            documentoUrl: 'https://exemplo.com/laudo.pdf',
            documentoTipo: 'application/pdf',
            automatico: false,
          }),
        ],
      );
    });
  });

  describe('adicionarEvento e listarEventos', () => {
    it('deve adicionar um evento manual com documento comprobatório (PDF) via URL', async () => {
      const dataEvento = new Date('2026-11-17T12:00:00.000Z');
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.adicionarEvento.mockResolvedValue({
        id: 'ev-1',
        animalId: '123',
        tipo: TipoEventoAnimal.MEDICO,
        motivoSaida: null,
        descricao: 'Hemograma completo realizado',
        dataEvento,
        documentoUrl: 'https://exemplo.com/hemograma.pdf',
        documentoNome: 'hemograma.pdf',
        documentoTipo: 'application/pdf',
        automatico: false,
        ativo: true,
        criadoEm: dataEvento,
        criadoPorId: usuarioAdmin.sub,
        criadoPor: {
          id: usuarioAdmin.sub,
          nome: 'Admin',
          email: 'admin@test.com',
        },
      });

      const result = await service.adicionarEvento(
        '123',
        {
          tipo: TipoEventoAnimal.MEDICO,
          descricao: 'Hemograma completo realizado',
          data: dataEvento,
          documentoUrl: 'https://exemplo.com/hemograma.pdf',
          documentoNome: 'hemograma.pdf',
        },
        usuarioAdmin,
      );

      expect(mockRepository.adicionarEvento).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          tipo: TipoEventoAnimal.MEDICO,
          descricao: 'Hemograma completo realizado',
          dataEvento,
          documentoUrl: 'https://exemplo.com/hemograma.pdf',
          documentoNome: 'hemograma.pdf',
          documentoTipo: 'application/pdf',
          automatico: false,
        }),
      );
      expect(result.id).toBe('ev-1');
      expect(result.data).toEqual(dataEvento);
      expect(result.documentoUrl).toBe('https://exemplo.com/hemograma.pdf');
    });

    it('deve atualizar novoStatusAnimal ao registrar evento manual de SAIDA por OBITO', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.adicionarEvento.mockResolvedValue({
        id: 'ev-obito',
        animalId: '123',
        tipo: TipoEventoAnimal.SAIDA,
        motivoSaida: MotivoSaidaAnimal.OBITO,
        descricao: 'Atestado veterinário de óbito',
        dataEvento: new Date(),
        documentoUrl: 'https://exemplo.com/atestado.pdf',
        documentoNome: 'atestado.pdf',
        documentoTipo: 'application/pdf',
        automatico: false,
        ativo: true,
        criadoEm: new Date(),
        criadoPorId: usuarioAdmin.sub,
      });

      await service.adicionarEvento(
        '123',
        {
          tipo: TipoEventoAnimal.SAIDA,
          motivoSaida: MotivoSaidaAnimal.OBITO,
          descricao: 'Atestado veterinário de óbito',
          documentoUrl: 'https://exemplo.com/atestado.pdf',
        },
        usuarioAdmin,
      );

      expect(mockRepository.adicionarEvento).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          tipo: TipoEventoAnimal.SAIDA,
          motivoSaida: MotivoSaidaAnimal.OBITO,
          novoStatusAnimal: StatusAnimal.OBITO,
        }),
      );
    });

    it('deve rejeitar arquivo com formato não permitido no upload', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);

      await expect(
        service.adicionarEvento(
          '123',
          { descricao: 'Arquivo malicioso' },
          usuarioAdmin,
          {
            fieldname: 'documento',
            originalname: 'script.exe',
            encoding: '7bit',
            mimetype: 'application/x-msdownload',
            buffer: Buffer.from('test'),
            size: 4,
          },
          'http://localhost:3000',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve listar eventos paginados da linha do tempo do animal', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.listarEventos.mockResolvedValue({
        data: [
          {
            id: 'ev-1',
            animalId: '123',
            tipo: TipoEventoAnimal.ENTRADA,
            motivoSaida: null,
            descricao: 'Entrada na ONG',
            dataEvento: new Date('2026-06-20T10:00:00Z'),
            documentoUrl: 'https://exemplo.com/rex.jpg',
            documentoNome: null,
            documentoTipo: 'image/jpeg',
            automatico: true,
            ativo: true,
            criadoEm: new Date('2026-06-20T10:00:00Z'),
            criadoPorId: 'admin-123',
          },
        ],
        total: 1,
      });

      const filtros = new FiltrarEventosAnimalDto();
      const result = await service.listarEventos('123', filtros);

      expect(mockRepository.listarEventos).toHaveBeenCalledWith({
        animalId: '123',
        skip: 0,
        take: 50,
        tipo: undefined,
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].tipo).toBe(TipoEventoAnimal.ENTRADA);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('excluir', () => {
    it('deve excluir um animal logicamente com revalidação de senha do administrador', async () => {
      mockUsuariosRepository.buscarPorId.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);

      await service.excluir('123', 'SenhaAdmin@123', usuarioAdmin);

      expect(mockRepository.excluir).toHaveBeenCalledWith(
        '123',
        usuarioAdmin.sub,
      );
    });

    it('deve lançar ForbiddenException se o usuário não for ADMIN', async () => {
      await expect(
        service.excluir('123', 'senha', usuarioProtetor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar UnauthorizedException se a senha do admin estiver incorreta', async () => {
      mockUsuariosRepository.buscarPorId.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.excluir('123', 'senha-errada', usuarioAdmin),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('adicionarFoto', () => {
    it('deve adicionar uma foto ao animal com sucesso', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      const fotoCriada = {
        id: 'foto-2',
        url: 'https://exemplo.com/outra.jpg',
        principal: false,
        ativo: true,
      };
      mockRepository.adicionarFoto.mockResolvedValue(fotoCriada);

      const result = await service.adicionarFoto(
        '123',
        'https://exemplo.com/outra.jpg',
        false,
        usuarioAdmin,
      );

      expect(mockRepository.buscarPorId).toHaveBeenCalledWith('123');
      expect(mockRepository.adicionarFoto).toHaveBeenCalledWith(
        '123',
        'https://exemplo.com/outra.jpg',
        false,
        usuarioAdmin.sub,
      );
      expect(result.id).toBe('foto-2');
      expect(result.url).toBe('https://exemplo.com/outra.jpg');
      expect(result.principal).toBe(false);
    });

    it('deve lançar NotFoundException se o animal não for encontrado ou não estiver ativo', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.adicionarFoto(
          '999',
          'https://exemplo.com/outra.jpg',
          false,
          usuarioAdmin,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removerFoto', () => {
    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.removerFoto('999', 'foto-1', usuarioAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se a foto não pertencer ao animal ou não estiver ativa', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.buscarFotoPorId.mockResolvedValue(null);

      await expect(
        service.removerFoto('123', 'foto-inexistente', usuarioAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se for a única foto ativa do animal', async () => {
      const animalComUmaFoto = {
        ...mockAnimal,
        fotos: [
          {
            id: 'foto-1',
            animalId: '123',
            url: 'https://exemplo.com/rex.jpg',
            principal: true,
            ativo: true,
          },
        ],
      };
      mockRepository.buscarPorId.mockResolvedValue(animalComUmaFoto);
      mockRepository.buscarFotoPorId.mockResolvedValue(
        animalComUmaFoto.fotos[0],
      );

      await expect(
        service.removerFoto('123', 'foto-1', usuarioAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve remover a foto e reatribuir a principal para a próxima se a removida for a principal', async () => {
      const animalComDuasFotos = {
        ...mockAnimal,
        fotos: [
          {
            id: 'foto-1',
            animalId: '123',
            url: 'https://exemplo.com/f1.jpg',
            principal: true,
            ativo: true,
          },
          {
            id: 'foto-2',
            animalId: '123',
            url: 'https://exemplo.com/f2.jpg',
            principal: false,
            ativo: true,
          },
        ],
      };
      mockRepository.buscarPorId.mockResolvedValue(animalComDuasFotos);
      mockRepository.buscarFotoPorId.mockResolvedValue(
        animalComDuasFotos.fotos[0],
      );

      const result = await service.removerFoto('123', 'foto-1', usuarioAdmin);

      expect(mockRepository.removerFoto).toHaveBeenCalledWith(
        'foto-1',
        usuarioAdmin.sub,
      );
      expect(mockRepository.definirFotoPrincipal).toHaveBeenCalledWith(
        '123',
        'foto-2',
        usuarioAdmin.sub,
      );
      expect(result).toEqual({ ok: true });
    });

    it('deve apenas remover a foto se a removida não for a principal', async () => {
      const animalComDuasFotos = {
        ...mockAnimal,
        fotos: [
          {
            id: 'foto-1',
            animalId: '123',
            url: 'https://exemplo.com/f1.jpg',
            principal: true,
            ativo: true,
          },
          {
            id: 'foto-2',
            animalId: '123',
            url: 'https://exemplo.com/f2.jpg',
            principal: false,
            ativo: true,
          },
        ],
      };
      mockRepository.buscarPorId.mockResolvedValue(animalComDuasFotos);
      mockRepository.buscarFotoPorId.mockResolvedValue(
        animalComDuasFotos.fotos[1],
      );

      const result = await service.removerFoto('123', 'foto-2', usuarioAdmin);

      expect(mockRepository.removerFoto).toHaveBeenCalledWith(
        'foto-2',
        usuarioAdmin.sub,
      );
      expect(mockRepository.definirFotoPrincipal).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('definirFotoPrincipal', () => {
    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.definirFotoPrincipal('999', 'foto-1', usuarioAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se a foto não for encontrada ou não pertencer ao animal', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.buscarFotoPorId.mockResolvedValue(null);

      await expect(
        service.definirFotoPrincipal('123', 'foto-inexistente', usuarioAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve definir a foto principal com sucesso', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.buscarFotoPorId.mockResolvedValue({
        id: 'foto-1',
        animalId: '123',
        url: 'https://exemplo.com/rex.jpg',
        principal: false,
        ativo: true,
      });

      const result = await service.definirFotoPrincipal(
        '123',
        'foto-1',
        usuarioAdmin,
      );

      expect(mockRepository.definirFotoPrincipal).toHaveBeenCalledWith(
        '123',
        'foto-1',
        usuarioAdmin.sub,
      );
      expect(result).toEqual({ ok: true });
    });
  });
});
