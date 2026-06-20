-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'PROTETOR');

-- CreateEnum
CREATE TYPE "EspecieAnimal" AS ENUM ('CAO', 'GATO');

-- CreateEnum
CREATE TYPE "SexoAnimal" AS ENUM ('MACHO', 'FEMEA');

-- CreateEnum
CREATE TYPE "PorteAnimal" AS ENUM ('PEQUENO', 'MEDIO', 'GRANDE');

-- CreateEnum
CREATE TYPE "StatusAnimal" AS ENUM ('ACOLHIMENTO', 'ADOTADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "codigo" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'PROTETOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" TEXT,
    "modificado_em" TIMESTAMP(3) NOT NULL,
    "modificado_por_id" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutores" (
    "id" TEXT NOT NULL,
    "codigo" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" TEXT,
    "modificado_em" TIMESTAMP(3) NOT NULL,
    "modificado_por_id" TEXT,

    CONSTRAINT "tutores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animais" (
    "id" TEXT NOT NULL,
    "numero_registro" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especie" "EspecieAnimal" NOT NULL,
    "raca" TEXT NOT NULL,
    "sexo" "SexoAnimal" NOT NULL,
    "porte" "PorteAnimal",
    "cor" TEXT NOT NULL,
    "peso_inicial" DECIMAL(5,2) NOT NULL,
    "peso_atual" DECIMAL(5,2),
    "data_nascimento" DATE,
    "castrado" BOOLEAN NOT NULL DEFAULT false,
    "vacinado" BOOLEAN NOT NULL DEFAULT false,
    "local_resgate" TEXT NOT NULL,
    "observacoes" TEXT,
    "status" "StatusAnimal" NOT NULL DEFAULT 'ACOLHIMENTO',
    "tutor_id" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" TEXT,
    "modificado_em" TIMESTAMP(3) NOT NULL,
    "modificado_por_id" TEXT,

    CONSTRAINT "animais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_animal" (
    "id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" TEXT,
    "modificado_em" TIMESTAMP(3) NOT NULL,
    "modificado_por_id" TEXT,

    CONSTRAINT "fotos_animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adocoes" (
    "id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "protetor_id" TEXT NOT NULL,
    "data_adocao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "devolvido_em" TIMESTAMP(3),
    "devolvido_por_id" TEXT,
    "observacoes_devolucao" TEXT,

    CONSTRAINT "adocoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_codigo_key" ON "usuarios"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tutores_codigo_key" ON "tutores"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tutores_cpf_key" ON "tutores"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "tutores_email_key" ON "tutores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "animais_numero_registro_key" ON "animais"("numero_registro");

-- CreateIndex
CREATE INDEX "animais_status_idx" ON "animais"("status");

-- CreateIndex
CREATE INDEX "animais_especie_idx" ON "animais"("especie");

-- CreateIndex
CREATE INDEX "animais_tutor_id_idx" ON "animais"("tutor_id");

-- CreateIndex
CREATE INDEX "fotos_animal_animal_id_idx" ON "fotos_animal"("animal_id");

-- CreateIndex
CREATE INDEX "adocoes_animal_id_idx" ON "adocoes"("animal_id");

-- CreateIndex
CREATE INDEX "adocoes_tutor_id_idx" ON "adocoes"("tutor_id");

-- AddForeignKey
ALTER TABLE "animais" ADD CONSTRAINT "animais_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_animal" ADD CONSTRAINT "fotos_animal_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adocoes" ADD CONSTRAINT "adocoes_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adocoes" ADD CONSTRAINT "adocoes_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adocoes" ADD CONSTRAINT "adocoes_protetor_id_fkey" FOREIGN KEY ("protetor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
