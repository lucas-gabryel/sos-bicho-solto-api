-- CreateEnum
CREATE TYPE "TipoMovimentacaoEstoque" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMovimentacaoEstoque" NOT NULL,
    "tipo_item" "TipoDoacao" NOT NULL,
    "descricao_item" TEXT NOT NULL,
    "quantidade" DECIMAL(10,2) NOT NULL,
    "unidade_medida" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "data_movimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doacao_id" TEXT,
    "registrado_por_id" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_tipo_item_idx" ON "movimentacoes_estoque"("tipo_item");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_data_movimento_idx" ON "movimentacoes_estoque"("data_movimento");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_descricao_item_idx" ON "movimentacoes_estoque"("descricao_item");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_doacao_id_idx" ON "movimentacoes_estoque"("doacao_id");

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_doacao_id_fkey" FOREIGN KEY ("doacao_id") REFERENCES "doacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
