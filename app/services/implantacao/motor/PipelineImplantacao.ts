import "server-only";

import type {
  Database,
} from "firebase-admin/database";

import {
  gerarEstruturaUnidades,
} from "../GeradorEstruturaUnidades";

import {
  gerarFirebase,
  removerFirebaseGerado,
} from "./GeradorFirebase";

import {
  gerarLinks,
  type LinksUnidadeGerados,
} from "./GeradorLinks";

import {
  gerarQr,
  type QrLocalGerado,
} from "./GeradorQr";

import {
  gerarQrImagem,
  type ImagemQrGerada,
} from "./GeradorQrImagem";

import {
  gerarPermissoes,
  type PermissoesGeradas,
} from "./GeradorPermissoes";

import {
  gerarHardware,
  type HardwareGerado,
} from "./GeradorHardware";

import {
  criarImplantacaoContext,
  type ImplantacaoContext,
} from "../ImplantacaoContext";

import type {
  ContextoImplantacao,
} from "../ImplantadorUniversal";

export type ResultadoPipelineImplantacao = {
  sucesso: boolean;

  contexto:
    ImplantacaoContext;

  linksPorUnidade:
    LinksUnidadeGerados[];

  qrPrincipal:
    QrLocalGerado | null;

  imagemQr:
    ImagemQrGerada | null;

  permissoesPorPerfil:
    PermissoesGeradas[];

  dispositivos:
    HardwareGerado[];

  mensagem: string;
};

function obterBaseUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  if (
    baseUrl.startsWith(
      "http://"
    ) ||
    baseUrl.startsWith(
      "https://"
    )
  ) {
    return baseUrl.replace(
      /\/+$/g,
      ""
    );
  }

  return `https://${baseUrl}`.replace(
    /\/+$/g,
    ""
  );
}

function criarContextoPipeline(
  contextoOriginal:
    ContextoImplantacao
): ImplantacaoContext {
  return criarImplantacaoContext({
    iniciadoEm:
      contextoOriginal.criadoEm,

    local: {
      id:
        contextoOriginal.local.localId,

      nome:
        contextoOriginal.local.localNome,

      slug:
        contextoOriginal.local.localSlug,

      tipo:
        contextoOriginal.local.tipoLocal,

      cidade:
        contextoOriginal.local.cidade,

      estado:
        contextoOriginal.local.estado,

      endereco:
        contextoOriginal.local.endereco,
    },

    responsavel: {
      uid:
        contextoOriginal.responsavel.uid,

      nome:
        contextoOriginal.responsavel.nome,

      email:
        contextoOriginal.responsavel.email,

      telefone:
        contextoOriginal.responsavel.telefone,

      perfil:
        contextoOriginal.responsavel.perfil,
    },

    configuracao:
      contextoOriginal.configuracaoSegmento,
  });
}

export async function executarPipelineImplantacao(
  database: Database,
  contextoOriginal:
    ContextoImplantacao
): Promise<ResultadoPipelineImplantacao> {
  const contexto =
    criarContextoPipeline(
      contextoOriginal
    );

  let linksPorUnidade:
    LinksUnidadeGerados[] = [];

  let qrPrincipal:
    QrLocalGerado | null =
      null;

  let imagemQr:
    ImagemQrGerada | null =
      null;

  let permissoesPorPerfil:
    PermissoesGeradas[] = [];

  let dispositivos:
    HardwareGerado[] = [];

  try {
    contexto.resultado.mensagens.push(
      "Pipeline de implantação iniciado."
    );

    const estrutura =
      await gerarEstruturaUnidades({
        tipo:
          contextoOriginal.local.tipoLocal,

        local: {
          localId:
            contextoOriginal.local.localId,

          localNome:
            contextoOriginal.local.localNome,

          localSlug:
            contextoOriginal.local.localSlug,

          criadoEm:
            contextoOriginal.criadoEm,
        },

        configuracao:
          contextoOriginal
            .configuracaoSegmento
            .dados,
      } as Parameters<
        typeof gerarEstruturaUnidades
      >[0]);

    contexto.estrutura =
      estrutura;

    contexto.estatisticas.totalEstruturas =
      estrutura.totalEstruturasPai;

    contexto.estatisticas.totalUnidades =
      estrutura.totalUnidades;

    contexto.resultado.mensagens.push(
      `${estrutura.totalUnidades} unidade(s) gerada(s) em memória.`
    );

    const resultadoLinks =
      gerarLinks(
        contexto,
        obterBaseUrl()
      );

    linksPorUnidade =
      resultadoLinks.linksPorUnidade;

    const resultadoQr =
      gerarQr(
        contexto
      );

    qrPrincipal =
      resultadoQr.qrPrincipal;

    imagemQr =
      await gerarQrImagem(
        qrPrincipal,
        {
          template:
            "compacto",

          larguraQr:
            900,

          margemQr:
            4,

          nivelCorrecao:
            "H",
        }
      );

    contexto.resultado.mensagens.push(
      `QR principal validado em PNG e SVG. PNG: ${imagemQr.png.tamanhoBytes} bytes. SVG: ${imagemQr.svg.tamanhoBytes} bytes.`
    );

    const resultadoPermissoes =
      gerarPermissoes(
        contexto
      );

    permissoesPorPerfil =
      resultadoPermissoes
        .permissoesPorPerfil;

    const resultadoHardware =
      gerarHardware(
        contexto
      );

    dispositivos =
      resultadoHardware.dispositivos;

    await gerarFirebase(
      database,
      contexto,
      {
        linksPorUnidade,

        qrPrincipal,

        permissoesPorPerfil,

        dispositivos,
      }
    );

    contexto.finalizadoEm =
      Date.now();

    contexto.resultado.sucesso =
      true;

    contexto.resultado.mensagens.push(
      "Pipeline de implantação concluído com sucesso."
    );

    return {
      sucesso: true,

      contexto,

      linksPorUnidade,

      qrPrincipal,

      imagemQr,

      permissoesPorPerfil,

      dispositivos,

      mensagem:
        "Estrutura, links, QR principal, permissões, hardware e Firebase preparados com sucesso.",
    };
  } catch (erro) {
    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Erro desconhecido no pipeline de implantação.";

    contexto.resultado.sucesso =
      false;

    contexto.resultado.erros.push(
      mensagem
    );

    try {
      await removerFirebaseGerado(
        database,
        contexto
      );
    } catch (erroRollback) {
      contexto.resultado.avisos.push(
        erroRollback instanceof Error
          ? erroRollback.message
          : "Não foi possível concluir o rollback do pipeline."
      );
    }

    return {
      sucesso: false,

      contexto,

      linksPorUnidade,

      qrPrincipal,

      imagemQr,

      permissoesPorPerfil,

      dispositivos,

      mensagem,
    };
  }
}
