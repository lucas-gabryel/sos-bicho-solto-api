-- CreateEnum
CREATE TYPE "TipoDoacao" AS ENUM ('DINHEIRO', 'RACAO', 'MEDICAMENTO', 'PRODUTO_LIMPEZA', 'OUTRO');

-- CreateTable
CREATE TABLE "doacoes" (
    "id" TEXT NOT NULL,
    "tipo" "TipoDoacao" NOT NULL,
    "valor" DECIMAL(10,2),
    "quantidade" DECIMAL(10,2),
    "unidade_medida" TEXT,
    "descricao" TEXT,
    "data_recebimento" DATE NOT NULL,
    "doador_id" TEXT,
    "registrado_por_id" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doacoes_tipo_idx" ON "doacoes"("tipo");

-- CreateIndex
CREATE INDEX "doacoes_doador_id_idx" ON "doacoes"("doador_id");

-- CreateIndex
CREATE INDEX "doacoes_data_recebimento_idx" ON "doacoes"("data_recebimento");

-- AddForeignKey
ALTER TABLE "doacoes" ADD CONSTRAINT "doacoes_doador_id_fkey" FOREIGN KEY ("doador_id") REFERENCES "doadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doacoes" ADD CONSTRAINT "doacoes_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
