import { ref, remove, set, update } from "firebase/database";
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
  if (!unidadeId) {
    throw new Error("ID da unidade não informado.");
  }

  /*
   * A chamada sempre é gravada dentro do ID REAL da unidade
   * que veio do Firebase.
   */
  await update(ref(db, `unidades-v2/${unidadeId}/chamada`), chamada);
}

export async function enviarPushChamada(unidadeId: string) {
  try {
    const resposta = await fetch("/api/enviar-notificacao-v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        unidadeId,
      }),
    });

    const textoResposta = await resposta.text();

    let dados: any = null;

    try {
      dados = textoResposta ? JSON.parse(textoResposta) : null;
    } catch {
      dados = {
        mensagem: textoResposta || "Resposta sem conteúdo.",
      };
    }

    if (!resposta.ok) {
      console.error("Falha ao enviar push V2:", {
        status: resposta.status,
        dados,
      });

      /*
       * O push não pode cancelar uma chamada que já foi salva no Firebase.
       */
      return {
        sucesso: false,
        pushEnviado: false,
        status: resposta.status,
        dados,
      };
    }

    return {
      sucesso: true,
      pushEnviado: true,
      dados,
    };
  } catch (erro) {
    console.error("Erro de rede ao enviar push V2:", erro);

    /*
     * A chamada continua válida mesmo que a notificação push falhe.
     */
    return {
      sucesso: false,
      pushEnviado: false,
      erro:
        erro instanceof Error
          ? erro.message
          : "Erro desconhecido ao enviar push.",
    };
  }
}
