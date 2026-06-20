import 'dotenv/config';
import { PrismaClient, Perfil, EspecieAnimal, SexoAnimal, StatusAnimal } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.usuario.upsert({
    where: { email: 'admin@sosbichosolto.com' },
    update: {},
    create: {
      nome: 'Malba Vinicius',
      email: 'admin@sosbichosolto.com',
      senhaHash: await bcrypt.hash('Admin@123', 10),
      perfil: Perfil.ADMIN,
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'protetor@sosbichosolto.com' },
    update: {},
    create: {
      nome: 'Paula Freitas',
      email: 'protetor@sosbichosolto.com',
      senhaHash: await bcrypt.hash('Protetor@123', 10),
      perfil: Perfil.PROTETOR,
    },
  });

  await prisma.animal.upsert({
    where: { numeroRegistro: '06.05.2026.1' },
    update: {},
    create: {
      numeroRegistro: '06.05.2026.1',
      nome: 'Rex',
      especie: EspecieAnimal.CAO,
      raca: 'SRD',
      sexo: SexoAnimal.MACHO,
      cor: 'Caramelo',
      pesoInicial: 7.2,
      pesoAtual: 8.1,
      localResgate: 'Centro, Arapiraca/AL',
      observacoes: 'Em tratamento de verminose, recuperação bem-sucedida.',
      status: StatusAnimal.ACOLHIMENTO,
      fotos: { create: [{ url: 'https://placedog.net/640/480', principal: true }] },
    },
  });

  console.log('Seed concluído. Admin: admin@sosbichosolto.com / Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
