import "server-only";

import type {
  Database,
} from "firebase-admin/database";

import type {
  ImplantacaoContext,
} from "../ImplantacaoContext";

import type {
  LinksUnidadeGerados,
} from "./GeradorLinks";

import type {
  QrLocalGerado,
} from "./GeradorQr";

import type {
  ResultadoQrStorage,
} from "./GeradorQrStorage";

import type {
  PermissoesGeradas,
} from "./GeradorPermissoes";

import type {
  HardwareGerado,
} from "./GeradorHardware";

export type ArtefatosPipelineFirebase = {
  linksPorUnidade?:
    LinksUnidadeGerados[];

  qrPrincipal?:
    QrLocalGerado;

  qrStorage?:
    ResultadoQrStorage;

  permissoesPorPerfil?:
    PermissoesGeradas[];

  dispositivos?:
    HardwareGerado[];
};

export type ResultadoGeradorFirebase = {
  contexto: ImplantacaoContext;

  caminhosCriados: string[];

  totalRegistros: number;

  totais: {
    estruturas: number;

    unidades: number;

    links: number;

    qrCodes: number;

    perfisPermissao: number;

    dispositivos: number;
  };
};

function adicionarCaminho(
  contexto: ImplantacaoContext,
  caminho: string
): void {
  if (
    !contexto.firebase.caminhos.includes(
      caminho
    )
  ) {
    contexto.firebase.caminhos.push(
      caminho
    );
  }
}

function adicionarAtualizacao(
  atualizacoes: Record<
    string,
    unknown
  >,
  caminhosCriados: string[],
  caminho: string,
  valor: unknown
): void {
  atualizacoes[caminho] =
    valor;

  if (
    !caminhosCriados.includes(
      caminho
    )
  ) {
    caminhosCriados.push(
      caminho
    );
  }
}

export async function gerarFirebase(
  database: Database,
  contexto: ImplantacaoContext,
  artefatos:
    ArtefatosPipelineFirebase = {}
): Promise<ResultadoGeradorFirebase> {
  if (!contexto.estrutura) {
    throw new Error(
      "A estrutura das unidades ainda não foi gerada."
    );
  }

  const atualizacoes: Record<
    string,
    unknown
  > = {};

  const caminhosCriados: string[] =
    [];

  const {
    local,
    estrutura,
  } = contexto;

  const linksPorUnidade =
    artefatos.linksPorUnidade ??
    [];

  const qrPrincipal =
    artefatos.qrPrincipal;

  const qrStorage =
    artefatos.qrStorage;

  const permissoesPorPerfil =
    artefatos.permissoesPorPerfil ??
    [];

  const dispositivos =
    artefatos.dispositivos ??
    [];

  const mapaLinks =
    new Map(
      linksPorUnidade.map(
        (links) => [
          links.unidadeId,
          links,
        ]
      )
    );

  for (
    const estruturaPai of
      estrutura.estruturasPai
  ) {
    const caminho =
      `locais-v2/${local.id}/estruturas/${estruturaPai.id}`;

    adicionarAtualizacao(
      atualizacoes,
      caminhosCriados,
      caminho,
      estruturaPai
    );
  }

  for (
    const unidade of
      estrutura.unidades
  ) {
    const caminhoUnidade =
      `unidades-v2/${unidade.id}`;

    const caminhoReferenciaLocal =
      `locais-v2/${local.id}/unidades/${unidade.id}`;

    const links =
      mapaLinks.get(
        unidade.id
      );

    adicionarAtualizacao(
      atualizacoes,
      caminhosCriados,
      caminhoUnidade,
      {
        ...unidade,

        links:
          links ?? {},
      }
    );

    adicionarAtualizacao(
      atualizacoes,
      caminhosCriados,
      caminhoReferenciaLocal,
      {
        unidadeId:
          unidade.id,

        nome:
          unidade.nome,

        slug:
          unidade.slug,

        tipo:
          unidade.tipo,

        numero:
          unidade.numero || "",

        codigo:
          unidade.codigo || "",

        estruturaPaiId:
          unidade.estruturaPaiId || "",

        estruturaPaiNome:
          unidade.estruturaPaiNome || "",

        status:
          unidade.status,

        links:
          links ?? {},

        criadoEm:
          unidade.criadoEm,

        atualizadoEm:
          unidade.atualizadoEm,
      }
    );
  }

  if (qrPrincipal) {
    const caminhoQrPrincipal =
      `qrcodes-v2/${local.id}/principal`;

    adicionarAtualizacao(
      atualizacoes,
      caminhosCriados,
      caminhoQrPrincipal,
      {
        ...qrPrincipal,

        arquivos:
          qrStorage
            ? {
                png: {
                  formato:
                    qrStorage.png.formato,

                  caminho:
                    qrStorage.png.caminho,

                  bucket:
                    qrStorage.png.bucket,

                  mimeType:
                    qrStorage.png.mimeType,

                  tamanhoBytes:
                    qrStorage.png.tamanhoBytes,

                  urlDownload:
                    qrStorage.png.urlDownload,
                },

                svg: {
                  formato:
                    qrStorage.svg.formato,

                  caminho:
                    qrStorage.svg.caminho,

                  bucket:
                    qrStorage.svg.bucket,

                  mimeType:
                    qrStorage.svg.mimeType,

                  tamanhoBytes:
                    qrStorage.svg.tamanhoBytes,

                  urlDownload:
                    qrStorage.svg.urlDownload,
                },
              }
            : {},

        atualizadoEm:
          Date.now(),
      }
    );

    adicionarAtualizacao(
      atualizacoes,
      caminhosCriados,
      `locais-v2/${local.id}/qrcode`,
      {
        id:
          qrPrincipal.id,

        tipo:
          qrPrincipal.tipo,

        url:
          qrPrincipal.url,

        ativo:
          qrPrincipal.ativo,

        versao:
          qrPrincipal.versao,

        imagemPngUrl:
          qrStorage?.png
            .urlDownload ??
          "",

        imagemSvgUrl:
          qrStorage?.svg
            .urlDownload ??
          "",

        storage: qrStorage
          ? {
              pasta:
                qrStorage.pasta,

              bucket:
                qrStorage.png.bucket,
            }
          : {},

        criadoEm:
          qrPrincipal.criadoEm,

        atualizadoEm:
          Date.now(),
      }
    );
  }

  for (
    const grupo of
      permissoesPorPerfil
  ) {
    const caminhoPermissoes =
      `perfis-permissoes-v2/${local.id}/${grupo.perfil}`;

    adicionarAtualizacao(
      atualizacoes,
      caminhosCriados,
      caminhoPermissoes,
      {
        localId:
          local.id,

        perfil:
          grupo.perfil,

        permissoes:
          grupo.permissoes,

        criadoEm:
          contexto.iniciadoEm,

        atualizadoEm:
          Date.now(),
      }
    );
  }

  for (
    const dispositivo of
      dispositivos
  ) {
    const caminhoHardware =
      `hardware-v2/${local.id}/${dispositivo.id}`;

    adicionarAtualizacao(
      atualizacoes,
      caminhosCriados,
      caminhoHardware,
      dispositivo
    );
  }

  const caminhoEstatisticas =
    `locais-v2/${local.id}/estatisticas`;

  adicionarAtualizacao(
    atualizacoes,
    caminhosCriados,
    `${caminhoEstatisticas}/totalEstruturas`,
    estrutura.totalEstruturasPai
  );

  adicionarAtualizacao(
    atualizacoes,
    caminhosCriados,
    `${caminhoEstatisticas}/totalUnidades`,
    estrutura.totalUnidades
  );

  adicionarAtualizacao(
    atualizacoes,
    caminhosCriados,
    `${caminhoEstatisticas}/totalLinks`,
    contexto.links.gerados.length
  );

  adicionarAtualizacao(
    atualizacoes,
    caminhosCriados,
    `${caminhoEstatisticas}/totalQrCodes`,
    qrPrincipal ? 1 : 0
  );

  adicionarAtualizacao(
    atualizacoes,
    caminhosCriados,
    `${caminhoEstatisticas}/totalPerfisPermissao`,
    permissoesPorPerfil.length
  );

  adicionarAtualizacao(
    atualizacoes,
    caminhosCriados,
    `${caminhoEstatisticas}/totalDispositivos`,
    dispositivos.length
  );

  adicionarAtualizacao(
    atualizacoes,
    caminhosCriados,
    `${caminhoEstatisticas}/qrImagemGerada`,
    Boolean(qrStorage)
  );

  adicionarAtualizacao(
    atualizacoes,
    caminhosCriados,
    `${caminhoEstatisticas}/atualizadoEm`,
    Date.now()
  );

  await database
    .ref()
    .update(
      atualizacoes
    );

  for (
    const caminho of caminhosCriados
  ) {
    adicionarCaminho(
      contexto,
      caminho
    );
  }

  contexto.estatisticas.totalEstruturas =
    estrutura.totalEstruturasPai;

  contexto.estatisticas.totalUnidades =
    estrutura.totalUnidades;

  contexto.estatisticas.totalQrCodes =
    qrPrincipal ? 1 : 0;

  contexto.resultado.mensagens.push(
    `${estrutura.totalUnidades} unidade(s), ${qrPrincipal ? 1 : 0} QR Code principal, ${permissoesPorPerfil.length} perfil(is) de permissão e ${dispositivos.length} dispositivo(s) gravados no Firebase.`
  );

  if (qrStorage) {
    contexto.resultado.mensagens.push(
      "As URLs do PNG e do SVG do QR principal foram gravadas no Firebase."
    );
  }

  return {
    contexto,

    caminhosCriados,

    totalRegistros:
      Object.keys(
        atualizacoes
      ).length,

    totais: {
      estruturas:
        estrutura.totalEstruturasPai,

      unidades:
        estrutura.totalUnidades,

      links:
        contexto.links.gerados.length,

      qrCodes:
        qrPrincipal ? 1 : 0,

      perfisPermissao:
        permissoesPorPerfil.length,

      dispositivos:
        dispositivos.length,
    },
  };
}

export async function removerFirebaseGerado(
  database: Database,
  contexto: ImplantacaoContext
): Promise<void> {
  const caminhos = [
    ...contexto.firebase.caminhos,
  ]
    .sort(
      (a, b) =>
        b.length - a.length
    );

  for (
    const caminho of caminhos
  ) {
    try {
      await database
        .ref(caminho)
        .remove();
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Erro desconhecido.";

      contexto.resultado.avisos.push(
        `Não foi possível remover "${caminho}" durante o rollback: ${mensagem}`
      );
    }
  }

  contexto.firebase.caminhos = [];
}
