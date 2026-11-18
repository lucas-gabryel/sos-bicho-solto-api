-- AlterEnum
ALTER TYPE "StatusAnimal" ADD VALUE 'TRANSFERIDO';
ALTER TYPE "StatusAnimal" ADD VALUE 'OBITO';

-- CreateEnum
CREATE TYPE "TipoEventoAnimal" AS ENUM ('ENTRADA', 'SAIDA', 'MEDICO', 'FOTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "MotivoSaidaAnimal" AS ENUM ('ADOCAO', 'TRANSFERENCIA', 'OBITO');

-- CreateTable
CREATE TABLE "eventos_animal" (
    "id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "tipo" "TipoEventoAnimal" NOT NULL DEFAULT 'OUTRO',
    "motivo_saida" "MotivoSaidaAnimal",
    "descricao" TEXT NOT NULL,
    "data_evento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documento_url" TEXT,
    "documento_nome" TEXT,
    "documento_tipo" TEXT,
    "automatico" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" TEXT,

    CONSTRAINT "eventos_animal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eventos_animal_animal_id_idx" ON "eventos_animal"("animal_id");

-- CreateIndex
CREATE INDEX "eventos_animal_data_evento_idx" ON "eventos_animal"("data_evento");

-- CreateIndex
CREATE INDEX "eventos_animal_tipo_idx" ON "eventos_animal"("tipo");

-- AddForeignKey
ALTER TABLE "eventos_animal" ADD CONSTRAINT "eventos_animal_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_animal" ADD CONSTRAINT "eventos_animal_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
