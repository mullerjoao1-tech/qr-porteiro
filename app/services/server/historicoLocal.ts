import "server-only";

import {
  randomUUID,
} from "node:crypto";

import type {
  Database,
} from "firebase-admin/database";

type RegistrarHistoricoLocal = {
  database: Database;

  localId: string;

  tipoLocal?: string;

  modulo: string;

  acao: string;

  entidadeTipo: string;

  entidadeId?: string;

  atorUid?: string;

  dados?: Record<
    string,
    unknown
  >;
};

export async function registrarHistoricoLocal({
  database,
  localId,
  tipoLocal = "local",
  modulo,
  acao,
  entidadeTipo,
  entidadeId = "",
  atorUid = "",
  dados = {},
}: RegistrarHistoricoLocal) {
  const id =
    randomUUID();

  const criadoEm =
    Date.now();

  const evento = {
    id,

    localId,

    tipoLocal,

    modulo,

    acao,

    entidadeTipo,

    entidadeId,

    atorUid,

    criadoEm,

    dados,
  };

  await database
    .ref(
      `historico-v2/${localId}/${id}`
    )
    .set(
      evento
    );

  return evento;
}

export default registrarHistoricoLocal;
