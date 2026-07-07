import { ref, set, update, remove } from "firebase/database";
import { db } from "../../../services/firebase";

import type { MensagemConversa } from "../types";

export async function registrarMensagemConversa(
  unidadeId: string,
  dados: Omit<MensagemConversa, "criadoEm">
) {
  const idMensagem = String(Date.now());

  await set(
    ref(db, `unidades-v2/${unidadeId}/chamada/mensagens/${idMensagem}`),
    {
      ...dados,
      criadoEm: Date.now(),
    }
  );

  await update(ref(db, `unidades-v2/${unidadeId}/chamada`), {
    ultimaAtividade: Date.now(),
    enviadoEm: Date.now(),
  });
}

export async function cancelarChamadaNoFirebase(unidadeId: string) {
  await update(ref(db, `unidades-v2/${unidadeId}/chamada`), {
    status: "Cancelado pelo visitante",
    notificar: false,
    canceladoEm: Date.now(),
  });

  await remove(ref(db, `unidades-v2/${unidadeId}/chamada`));
}

export async function criarChamadaNoFirebase(
    
  unidadeId: string,
  chamada: any
) {
  await update(ref(db, `unidades-v2/${unidadeId}/chamada`), chamada);
}
export async function enviarPushChamada(unidadeId: string) {
  const resposta = await fetch("/api/enviar-notificacao-v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      unidadeId,
    }),
  });

  return resposta.json();
}