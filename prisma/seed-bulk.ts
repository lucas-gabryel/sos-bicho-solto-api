import 'dotenv/config';
import {
  PrismaClient,
  Perfil,
  EspecieAnimal,
  SexoAnimal,
  PorteAnimal,
  StatusAnimal,
  type Usuario,
  type Tutor,
  type Animal,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const QTD = 50;

const NOMES = [
  'Ana',
  'Bruno',
  'Carla',
  'Diego',
  'Eduarda',
  'Felipe',
  'Gabriela',
  'Henrique',
  'Isabela',
  'João',
  'Karina',
  'Lucas',
  'Mariana',
  'Nicolas',
  'Olívia',
  'Pedro',
  'Quésia',
  'Rafael',
  'Sofia',
  'Thiago',
];
const SOBRENOMES = [
  'Silva',
  'Santos',
  'Oliveira',
  'Souza',
  'Lima',
  'Ferreira',
  'Costa',
  'Almeida',
  'Pereira',
  'Rodrigues',
];
const NOMES_PETS = [
  'Rex',
  'Mel',
  'Thor',
  'Luna',
  'Bob',
  'Nina',
  'Max',
  'Bella',
  'Pretinho',
  'Frajola',
  'Bidu',
  'Amora',
  'Zeca',
  'Pipoca',
  'Bart',
  'Lola',
  'Tobias',
  'Maya',
  'Simba',
  'Cacau',
];
const RACAS_CAO = ['SRD', 'Labrador', 'Poodle', 'Pinscher', 'Vira-lata caramelo'];
const RACAS_GATO = ['SRD', 'Siamês', 'Persa', 'Angorá', 'Maine Coon'];
const CORES = ['Caramelo', 'Preto', 'Branco', 'Tigrado', 'Malhado', 'Cinza'];
const LOCAIS = [
  'Centro, Arapiraca/AL',
  'Brasília, Arapiraca/AL',
  'Planalto, Arapiraca/AL',
  'Cacimbas, Maceió/AL',
  'Farol, Maceió/AL',
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function gerarCpf(i: number): string {
  // CPF fictício de 11 dígitos, único por índice.
  return String(10000000000 + i).padStart(11, '0');
}

function gerarTelefone(i: number): string {
  return `82${String(900000000 + i).padStart(9, '0')}`;
}

function dataNascimento(i: number): Date {
  // Entre 18 e 67 anos atrás, aproximadamente.
  const ano = 1958 + (i % 50);
  const mes = i % 12;
  const dia = (i % 27) + 1;
  return new Date(Date.UTC(ano, mes, dia));
}

async function main() {
  const senhaHash = await bcrypt.hash('Senha@123', 10);

  // ---- 50 usuários (protetores) ----
  const usuarios: Usuario[] = [];
  for (let i = 0; i < QTD; i++) {
    const nome = `${pick(NOMES, i)} ${pick(SOBRENOMES, i + 3)}`;
    const usuario = await prisma.usuario.upsert({
      where: { email: `usuario${i + 1}@sosbichosolto.com` },
      update: {},
      create: {
        nome,
        email: `usuario${i + 1}@sosbichosolto.com`,
        senhaHash,
        perfil: i % 10 === 0 ? Perfil.ADMIN : Perfil.PROTETOR,
      },
    });
    usuarios.push(usuario);
  }
  console.log(`✔ ${usuarios.length} usuários criados.`);

  // ---- 50 tutores ----
  const tutores: Tutor[] = [];
  for (let i = 0; i < QTD; i++) {
    const nome = `${pick(NOMES, i + 5)} ${pick(SOBRENOMES, i)}`;
    const tutor = await prisma.tutor.upsert({
      where: { email: `tutor${i + 1}@email.com` },
      update: {},
      create: {
        nome,
        cpf: gerarCpf(i),
        telefone: gerarTelefone(i),
        email: `tutor${i + 1}@email.com`,
        endereco: `Rua ${pick(SOBRENOMES, i)}, nº ${i + 100} - ${pick(LOCAIS, i)}`,
        dataNascimento: dataNascimento(i),
      },
    });
    tutores.push(tutor);
  }
  console.log(`✔ ${tutores.length} tutores criados.`);

  // ---- 50 animais ----
  // Metade será adotada (com adoção), metade fica em acolhimento (sem adoção).
  const animais: (Animal & { adotado: boolean })[] = [];
  for (let i = 0; i < QTD; i++) {
    const especie = i % 2 === 0 ? EspecieAnimal.CAO : EspecieAnimal.GATO;
    const adotado = i % 2 === 0; // animais pares serão adotados
    const numeroRegistro = `25.06.2026.${i + 1}`;
    const animal = await prisma.animal.upsert({
      where: { numeroRegistro },
      update: {},
      create: {
        numeroRegistro,
        nome: `${pick(NOMES_PETS, i)} ${i + 1}`,
        especie,
        raca: especie === EspecieAnimal.CAO ? pick(RACAS_CAO, i) : pick(RACAS_GATO, i),
        sexo: i % 2 === 0 ? SexoAnimal.MACHO : SexoAnimal.FEMEA,
        porte: pick([PorteAnimal.PEQUENO, PorteAnimal.MEDIO, PorteAnimal.GRANDE], i),
        cor: pick(CORES, i),
        pesoInicial: Number((2 + (i % 30) * 0.5).toFixed(2)),
        pesoAtual: Number((3 + (i % 30) * 0.5).toFixed(2)),
        castrado: i % 3 === 0,
        vacinado: i % 2 === 0,
        localResgate: pick(LOCAIS, i),
        observacoes: 'Animal cadastrado via seed em massa.',
        status: adotado ? StatusAnimal.ADOTADO : StatusAnimal.ACOLHIMENTO,
        fotos: {
          create: [
            {
              url:
                especie === EspecieAnimal.CAO
                  ? 'https://placedog.net/640/480'
                  : 'https://placekitten.com/640/480',
              principal: true,
            },
          ],
        },
      },
    });
    animais.push({ ...animal, adotado });
  }
  console.log(`✔ ${animais.length} animais criados.`);

  // ---- Adoções ----
  // Tutores pares recebem adoção; ímpares ficam sem adoção.
  const protetores = usuarios; // qualquer usuário pode ser protetor da adoção
  let totalAdocoes = 0;
  for (let i = 0; i < animais.length; i++) {
    const animal = animais[i];
    if (!animal.adotado) continue;

    const tutor = tutores[i % tutores.length];
    const protetor = protetores[i % protetores.length];

    // evita duplicar adoção para o mesmo animal em re-execuções
    const existente = await prisma.adocao.findFirst({ where: { animalId: animal.id } });
    if (existente) continue;

    await prisma.adocao.create({
      data: {
        animalId: animal.id,
        tutorId: tutor.id,
        protetorId: protetor.id,
        observacoes: 'Adoção registrada via seed em massa.',
      },
    });
    // vincula o tutor ao animal
    await prisma.animal.update({
      where: { id: animal.id },
      data: { tutorId: tutor.id },
    });
    totalAdocoes++;
  }
  console.log(`✔ ${totalAdocoes} adoções criadas.`);

  console.log('\nSeed em massa concluído com sucesso.');
  console.log('Senha padrão dos usuários: Senha@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
