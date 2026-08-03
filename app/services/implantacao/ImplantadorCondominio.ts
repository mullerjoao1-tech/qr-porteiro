import "server-only";

import type {
  ContextoImplantacao,
  ResultadoImplantadorSegmento,
} from "./ImplantadorUniversal";

import {
  concluirEtapa,
  criarEtapa,
  falharEtapa,
  iniciarEtapa,
} from "./ImplantadorUniversal";

import {
  gerarEstruturaUnidades,
} from "./GeradorEstruturaUnidades";

import {
  executarPipelineImplantacao,
} from "./motor/PipelineImplantacao";

import type {
  EstruturaUnidadesGerada,
} from "./types";

type ResultadoGeracaoEstrutura = {
  estrutura:
    EstruturaUnidadesGerada;

  caminhosCriados: string[];

  usouPipeline: boolean;

  mensagensPipeline: string[];

  avisosPipeline: string[];

  totalLinks: number;

  totalQrCodes: number;

  totalPermissoes: number;

  totalDispositivos: number;
};

async function gerarEstruturaComFallback(
  contexto: ContextoImplantacao
): Promise<ResultadoGeracaoEstrutura> {
  const resultadoPipeline =
    await executarPipelineImplantacao(
      contexto.database,
      contexto
    );

  if (
    resultadoPipeline.sucesso &&
    resultadoPipeline.contexto
      .estrutura
  ) {
    const caminhoEstatisticas =
      `locais-v2/${contexto.local.localId}/estatisticas`;

    const caminhosCriados =
      resultadoPipeline.contexto
        .firebase.caminhos.filter(
          (caminho) =>
            caminho !==
            caminhoEstatisticas
        );

    return {
      estrutura:
        resultadoPipeline.contexto
          .estrutura,

      caminhosCriados,

      usouPipeline: true,

      mensagensPipeline:
        resultadoPipeline.contexto
          .resultado.mensagens,

      avisosPipeline:
        resultadoPipeline.contexto
          .resultado.avisos,

      totalLinks:
        resultadoPipeline.contexto
          .links.gerados.length,

      totalQrCodes:
        resultadoPipeline.contexto
          .qrcodes.gerados.length,

      totalPermissoes:
        resultadoPipeline.contexto
          .permissoes.criadas.length,

      totalDispositivos:
        resultadoPipeline.contexto
          .hardware.dispositivos.length,
    };
  }

  console.warn(
    "Pipeline de implantação não concluiu. Usando geração segura de fallback.",
    {
      localId:
        contexto.local.localId,

      mensagem:
        resultadoPipeline.mensagem,

      erros:
        resultadoPipeline.contexto
          .resultado.erros,

      avisos:
        resultadoPipeline.contexto
          .resultado.avisos,
    }
  );

  const configuracao =
    contexto.configuracaoSegmento;

  if (
    configuracao.tipo !==
    "condominio"
  ) {
    throw new Error(
      "A configuração recebida não pertence ao segmento condomínio."
    );
  }

  const estrutura =
    await gerarEstruturaUnidades({
      tipo:
        "condominio",

      local: {
        localId:
          contexto.local.localId,

        localNome:
          contexto.local.localNome,

        localSlug:
          contexto.local.localSlug,

        criadoEm:
          contexto.criadoEm,
      },

      configuracao: {
        tipoCondominio:
          configuracao.dados
            .tipoCondominio,

        quantidadeBlocos:
          configuracao.dados
            .quantidadeBlocos,

        apartamentosPorBloco:
          configuracao.dados
            .apartamentosPorBloco,

        quantidadeCasas:
          configuracao.dados
            .quantidadeCasas,
      },
    });

  if (
    estrutura.unidades.length ===
    0
  ) {
    throw new Error(
      "Nenhuma unidade foi gerada com a configuração informada."
    );
  }

  const atualizacoes: Record<
    string,
    unknown
  > = {};

  const caminhosCriados: string[] =
    [];

  for (
    const estruturaPai of
      estrutura.estruturasPai
  ) {
    const caminhoEstrutura =
      `locais-v2/${contexto.local.localId}/estruturas/${estruturaPai.id}`;

    atualizacoes[
      caminhoEstrutura
    ] = estruturaPai;

    caminhosCriados.push(
      caminhoEstrutura
    );
  }

  for (
    const unidade of
      estrutura.unidades
  ) {
    const caminhoUnidade =
      `unidades-v2/${unidade.id}`;

    const caminhoReferencia =
      `locais-v2/${contexto.local.localId}/unidades/${unidade.id}`;

    atualizacoes[
      caminhoUnidade
    ] = unidade;

    atualizacoes[
      caminhoReferencia
    ] = {
      unidadeId:
        unidade.id,

      nome:
        unidade.nome,

      slug:
        unidade.slug,

      tipo:
        unidade.tipo,

      estruturaPaiId:
        unidade.estruturaPaiId ||
        "",

      estruturaPaiNome:
        unidade.estruturaPaiNome ||
        "",

      numero:
        unidade.numero ||
        "",

      codigo:
        unidade.codigo ||
        "",

      status:
        unidade.status,

      criadoEm:
        contexto.criadoEm,

      atualizadoEm:
        contexto.criadoEm,
    };

    caminhosCriados.push(
      caminhoUnidade
    );

    caminhosCriados.push(
      caminhoReferencia
    );
  }

  await contexto.database
    .ref()
    .update(
      atualizacoes
    );

  await contexto.database
    .ref(
      `locais-v2/${contexto.local.localId}/estatisticas`
    )
    .update({
      totalEstruturas:
        estrutura.totalEstruturasPai,

      totalUnidades:
        estrutura.totalUnidades,

      atualizadoEm:
        contexto.criadoEm,
    });

  return {
    estrutura,

    caminhosCriados,

    usouPipeline: false,

    mensagensPipeline: [
      "O pipeline não concluiu e o fluxo seguro de fallback foi utilizado.",
    ],

    avisosPipeline: [
      resultadoPipeline.mensagem,
      ...resultadoPipeline.contexto
        .resultado.erros,
      ...resultadoPipeline.contexto
        .resultado.avisos,
    ],

    totalLinks: 0,

    totalQrCodes: 0,

    totalPermissoes: 0,

    totalDispositivos: 0,
  };
}

export async function implantarCondominio(
  contexto: ContextoImplantacao
): Promise<ResultadoImplantadorSegmento> {
  if (
    contexto.configuracaoSegmento
      .tipo !== "condominio"
  ) {
    throw new Error(
      "A configuração recebida não pertence ao segmento condomínio."
    );
  }

  const configuracao =
    contexto.configuracaoSegmento
      .dados;

  const etapas = [
    criarEtapa(
      "estrutura-condominio",
      "Criar estrutura base do condomínio"
    ),

    criarEtapa(
      "configuracoes-condominio",
      "Criar configurações iniciais"
    ),

    criarEtapa(
      "pipeline-condominio",
      "Executar pipeline e criar unidades"
    ),

    criarEtapa(
      "indices-condominio",
      "Criar índices operacionais"
    ),
  ];

  const estruturasCriadas: string[] =
    [];

  try {
    etapas[0] = iniciarEtapa(
      etapas[0],
      "Criando a estrutura principal do condomínio."
    );

    const caminhoBase =
      `condominios-v2/${contexto.local.localId}`;

    await contexto.database
      .ref(caminhoBase)
      .set({
        id:
          contexto.local.localId,

        nome:
          contexto.local.localNome,

        slug:
          contexto.local.localSlug,

        tipo:
          "condominio",

        tipoCondominio:
          configuracao.tipoCondominio,

        status:
          "ativo",

        cidade:
          contexto.local.cidade ||
          "",

        estado:
          contexto.local.estado ||
          "",

        endereco:
          contexto.local.endereco ||
          "",

        responsavelUid:
          contexto.responsavel.uid,

        configuracaoSegmento:
          configuracao,

        criadoPorUid:
          contexto.criadoPorUid,

        criadoEm:
          contexto.criadoEm,

        atualizadoEm:
          contexto.criadoEm,
      });

    estruturasCriadas.push(
      caminhoBase
    );

    etapas[0] = concluirEtapa(
      etapas[0],
      "Estrutura principal criada."
    );

    etapas[1] = iniciarEtapa(
      etapas[1],
      "Criando configurações iniciais do condomínio."
    );

    const caminhoConfiguracoes =
      `configuracoes-v2/${contexto.local.localId}`;

    await contexto.database
      .ref(caminhoConfiguracoes)
      .set({
        localId:
          contexto.local.localId,

        tipoLocal:
          "condominio",

        tipoCondominio:
          configuracao.tipoCondominio,

        acesso: {
          chamadasAtivas:
            configuracao.possuiVisitantes,

          comunicadosAtivos:
            configuracao.possuiComunicados,

          visitantesAtivos:
            configuracao.possuiVisitantes,

          entregasAtivas:
            configuracao.possuiEntregas,

          prestadoresAtivos:
            configuracao.possuiPrestadores,

          reservasAtivas:
            configuracao.possuiReservas,

          camerasAtivas:
            configuracao.possuiCameras,

          aberturaRemotaAtiva:
            configuracao.possuiAberturaRemota,
        },

        portaria: {
          possui:
            configuracao.possuiPortaria,

          tipo:
            configuracao.tipoPortaria,
        },

        unidades: {
          permitirBlocos:
            configuracao.tipoCondominio !==
            "horizontal",

          permitirCasas:
            configuracao.tipoCondominio !==
            "vertical",

          permitirApartamentos:
            configuracao.tipoCondominio !==
            "horizontal",
        },

        notificacoes: {
          pushAtivo: true,

          exigirCienciaComunicados:
            configuracao.possuiComunicados,
        },

        status:
          "configuracao-inicial",

        criadoEm:
          contexto.criadoEm,

        atualizadoEm:
          contexto.criadoEm,
      });

    estruturasCriadas.push(
      caminhoConfiguracoes
    );

    etapas[1] = concluirEtapa(
      etapas[1],
      "Configurações iniciais criadas."
    );

    etapas[2] = iniciarEtapa(
      etapas[2],
      "Executando o pipeline do QR Core com fallback seguro."
    );

    const resultadoGeracao =
      await gerarEstruturaComFallback(
        contexto
      );

    const estrutura =
      resultadoGeracao.estrutura;

    for (
      const caminho of
        resultadoGeracao.caminhosCriados
    ) {
      if (
        !estruturasCriadas.includes(
          caminho
        )
      ) {
        estruturasCriadas.push(
          caminho
        );
      }
    }

    const caminhoPipeline =
      `locais-v2/${contexto.local.localId}/pipeline`;

    await contexto.database
      .ref(caminhoPipeline)
      .set({
        status:
          "concluido",

        modo:
          resultadoGeracao.usouPipeline
            ? "pipeline"
            : "fallback-seguro",

        mensagens:
          resultadoGeracao
            .mensagensPipeline,

        avisos:
          resultadoGeracao
            .avisosPipeline,

        totais: {
          estruturas:
            estrutura.totalEstruturasPai,

          unidades:
            estrutura.totalUnidades,

          links:
            resultadoGeracao.totalLinks,

          qrCodes:
            resultadoGeracao.totalQrCodes,

          permissoes:
            resultadoGeracao.totalPermissoes,

          dispositivos:
            resultadoGeracao.totalDispositivos,
        },

        executadoEm:
          Date.now(),
      });

    estruturasCriadas.push(
      caminhoPipeline
    );

    etapas[2] = concluirEtapa(
      etapas[2],
      resultadoGeracao.usouPipeline
        ? `${estrutura.totalUnidades} unidade(s) criada(s) pelo pipeline do QR Core.`
        : `${estrutura.totalUnidades} unidade(s) criada(s) pelo fallback seguro.`
    );

    etapas[3] = iniciarEtapa(
      etapas[3],
      "Criando índices operacionais do condomínio."
    );

    const caminhoIndices =
      `indices-v2/condominios/${contexto.local.localId}`;

    const totalApartamentos =
      estrutura.totalPorTipo
        .apartamento ||
      0;

    const totalCasas =
      estrutura.totalPorTipo
        .casa ||
      0;

    await contexto.database
      .ref(caminhoIndices)
      .set({
        localId:
          contexto.local.localId,

        localNome:
          contexto.local.localNome,

        localSlug:
          contexto.local.localSlug,

        responsavelUid:
          contexto.responsavel.uid,

        tipoCondominio:
          configuracao.tipoCondominio,

        status:
          "ativo",

        motorImplantacao:
          resultadoGeracao.usouPipeline
            ? "pipeline"
            : "fallback-seguro",

        totalBlocos:
          estrutura.totalEstruturasPai,

        totalApartamentos,

        totalCasas,

        totalUnidades:
          estrutura.totalUnidades,

        totalMoradores: 0,

        totalPrestadores: 0,

        totalVisitantes: 0,

        totalLinks:
          resultadoGeracao.totalLinks,

        totalQrCodes:
          resultadoGeracao.totalQrCodes,

        totalPermissoes:
          resultadoGeracao.totalPermissoes,

        totalDispositivos:
          resultadoGeracao.totalDispositivos,

        criadoEm:
          contexto.criadoEm,

        atualizadoEm:
          Date.now(),
      });

    estruturasCriadas.push(
      caminhoIndices
    );

    await contexto.database
      .ref(
        `locais-v2/${contexto.local.localId}/estatisticas`
      )
      .update({
        totalEstruturas:
          estrutura.totalEstruturasPai,

        totalUnidades:
          estrutura.totalUnidades,

        totalApartamentos,

        totalCasas,

        totalLinks:
          resultadoGeracao.totalLinks,

        totalQrCodes:
          resultadoGeracao.totalQrCodes,

        totalPermissoes:
          resultadoGeracao.totalPermissoes,

        totalDispositivos:
          resultadoGeracao.totalDispositivos,

        atualizadoEm:
          Date.now(),
      });

    etapas[3] = concluirEtapa(
      etapas[3],
      "Índices operacionais criados."
    );

    return {
      sucesso: true,

      tipoLocal:
        "condominio",

      estruturasCriadas,

      etapas,

      mensagem:
        resultadoGeracao.usouPipeline
          ? "Condomínio implantado com sucesso pelo pipeline do QR Core."
          : "Condomínio implantado com sucesso pelo fluxo seguro de fallback.",

      detalhes: {
        tipoCondominio:
          configuracao.tipoCondominio,

        motorImplantacao:
          resultadoGeracao.usouPipeline
            ? "pipeline"
            : "fallback-seguro",

        totalBlocos:
          estrutura.totalEstruturasPai,

        totalApartamentos,

        totalCasas,

        totalUnidades:
          estrutura.totalUnidades,

        totalLinks:
          resultadoGeracao.totalLinks,

        totalQrCodes:
          resultadoGeracao.totalQrCodes,

        totalPermissoes:
          resultadoGeracao.totalPermissoes,

        totalDispositivos:
          resultadoGeracao.totalDispositivos,
      },
    };
  } catch (erro) {
    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Não foi possível criar a estrutura do condomínio.";

    const indiceEtapaEmExecucao =
      etapas.findIndex(
        (etapa) =>
          etapa.status ===
          "executando"
      );

    if (
      indiceEtapaEmExecucao >= 0
    ) {
      etapas[
        indiceEtapaEmExecucao
      ] = falharEtapa(
        etapas[
          indiceEtapaEmExecucao
        ],
        mensagem
      );
    }

    return {
      sucesso: false,

      tipoLocal:
        "condominio",

      estruturasCriadas,

      etapas,

      mensagem,
    };
  }
}
