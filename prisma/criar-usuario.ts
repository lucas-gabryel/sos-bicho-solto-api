import 'dotenv/config';
import { PrismaClient, Perfil } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function lerArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 2; i < process.argv.length; i++) {
    const atual = process.argv[i];
    if (atual.startsWith('--')) {
      const chave = atual.slice(2);
      const valor = process.argv[i + 1];
      if (valor && !valor.startsWith('--')) {
        args[chave] = valor;
        i++;
      } else {
        args[chave] = 'true';
      }
    }
  }
  return args;
}

function validar(
  nome?: string,
  email?: string,
  senha?: string,
  perfil?: string,
) {
  const erros: string[] = [];

  if (!nome) erros.push('--nome é obrigatório');
  if (!email) erros.push('--email é obrigatório');
  else if (!email.includes('@'))
    erros.push('--email inválido (precisa conter "@")');

  if (!senha) {
    erros.push('--senha é obrigatória');
  } else if (!/^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,15}$/.test(senha)) {
    erros.push(
      '--senha deve ter 8–15 caracteres, ao menos 1 maiúscula e 1 caractere especial',
    );
  }

  if (perfil && !Object.values(Perfil).includes(perfil as Perfil)) {
    erros.push(`--perfil deve ser um de: ${Object.values(Perfil).join(', ')}`);
  }

  return erros;
}

async function main() {
  const { nome, email, senha, perfil } = lerArgs();
  const perfilFinal = (perfil as Perfil) ?? Perfil.PROTETOR;

  const erros = validar(nome, email, senha, perfil);
  if (erros.length > 0) {
    console.error('Não foi possível criar o usuário:');
    erros.forEach((e) => console.error(`  - ${e}`));
    console.error(
      '\nUso: npx ts-node prisma/criar-usuario.ts --nome "Fulano" --email "fulano@dominio.com" --senha "Senha@123" [--perfil ADMIN|PROTETOR]',
    );
    process.exit(1);
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    console.error(`Já existe um usuário com o e-mail "${email}".`);
    process.exit(1);
  }

  const usuario = await prisma.usuario.create({
    data: {
      nome: nome!,
      email: email!,
      senhaHash: await bcrypt.hash(senha!, 10),
      perfil: perfilFinal,
    },
  });

  console.log('Usuário criado com sucesso:');
  console.log(`  codigo: ${usuario.codigo}`);
  console.log(`  nome:   ${usuario.nome}`);
  console.log(`  email:  ${usuario.email}`);
  console.log(`  perfil: ${usuario.perfil}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
