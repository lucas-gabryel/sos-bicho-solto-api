export class Doador {
  id!: string;
  nomeRazaoSocial!: string;
  cpfCnpj!: string;
  email!: string;
  telefone!: string;
  endereco!: string;
  ativo!: boolean;
  criadoEm!: Date;
  criadoPorId?: string | null;
  atualizadoEm!: Date;
  modificadoPorId?: string | null;
}
