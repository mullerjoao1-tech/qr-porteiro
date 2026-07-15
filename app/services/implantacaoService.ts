import { ref, update } from "firebase/database";

import { db } from "./firebase";

export type StatusImplantacao =
  | "sem-cadastro"
  | "link-enviado"
  | "cadastro-iniciado"
  | "aguardando-analise"
  | "correcao-solicitada"
  | "aprovado"
  | "implantado";

type DadosExtrasImplantacao = {
  protocolo?: string;
  enviadoEm?: string;
  iniciadoEm?: string;
  aprovadoEm?: string;
  implantadoEm?: string;
  quantidadeMoradores?: number;
  ultimaSolicitacaoId?: string;
  aprovadoPor?: string;
};

export async function atualizarStatusImplantacao(
  unidadeId: string,
  status: StatusImplantacao,
  dadosExtras: DadosExtrasImplantacao = {}
) {
  if (!unidadeId.trim()) {
    throw new Error(
      "Não foi possível atualizar a implantação: unidade não informada."
    );
  }

  const agora = new Date().toISOString();

  const unidadeRef = ref(
    db,
    `qrCentral/unidades/${unidadeId}/implantacao`
  );

  await update(unidadeRef, {
    status,
    atualizadoEm: agora,
    ...dadosExtras,
  });
}