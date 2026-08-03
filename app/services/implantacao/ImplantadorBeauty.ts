import "server-only";

import type {
  ContextoImplantacao,
  ResultadoImplantadorSegmento,
} from "./ImplantadorUniversal";

import {
  criarEtapa,
  iniciarEtapa,
  concluirEtapa,
  falharEtapa,
} from "./ImplantadorUniversal";

export async function implantarBeauty(
  contexto: ContextoImplantacao
): Promise<ResultadoImplantadorSegmento> {
  const etapas = [
    criarEtapa(
      "estrutura-beauty",
      "Criar estabelecimento"
    ),

    criarEtapa(
      "agenda-beauty",
      "Criar agenda"
    ),

    criarEtapa(
      "configuracoes-beauty",
      "Criar configurações"
    ),
  ];

  const estruturasCriadas: string[] = [];

  try {
    // ----------------------------------------------------------------
    // Estabelecimento
    // ----------------------------------------------------------------

    etapas[0] = iniciarEtapa(
      etapas[0],
      "Criando estabelecimento."
    );

    const caminhoEstabelecimento =
      `beauty-v2/estabelecimentos/${contexto.local.localId}`;

    await contexto.database
      .ref(caminhoEstabelecimento)
      .set({
        id: contexto.local.localId,

        nome: contexto.local.localNome,

        slug: contexto.local.localSlug,

        cidade:
          contexto.local.cidade ?? "",

        estado:
          contexto.local.estado ?? "",

        endereco:
          contexto.local.endereco ?? "",

        status: "ativo",

        criadoEm:
          contexto.criadoEm,

        atualizadoEm:
          contexto.criadoEm,

        responsavelUid:
          contexto.responsavel.uid,
      });

    estruturasCriadas.push(
      caminhoEstabelecimento
    );

    etapas[0] = concluirEtapa(
      etapas[0]
    );

    // ----------------------------------------------------------------
    // Agenda
    // ----------------------------------------------------------------

    etapas[1] = iniciarEtapa(
      etapas[1],
      "Criando agenda."
    );

    const caminhoAgenda =
      `agenda-v2/${contexto.local.localId}`;

    await contexto.database
      .ref(caminhoAgenda)
      .set({
        estabelecimentoId:
          contexto.local.localId,

        horarioInicio: "08:00",

        horarioFim: "18:00",

        intervaloMinutos: 30,

        ativo: true,

        criadoEm:
          contexto.criadoEm,
      });

    estruturasCriadas.push(
      caminhoAgenda
    );

    etapas[1] = concluirEtapa(
      etapas[1]
    );

    // ----------------------------------------------------------------
    // Configurações
    // ----------------------------------------------------------------

    etapas[2] = iniciarEtapa(
      etapas[2],
      "Criando configurações."
    );

    const caminhoConfiguracoes =
      `beauty-v2/configuracoes/${contexto.local.localId}`;

    await contexto.database
      .ref(caminhoConfiguracoes)
      .set({
        notificacoes: true,

        filaEspera: true,

        antecipacaoAgenda: true,

        confirmarHorario: true,

        criadoEm:
          contexto.criadoEm,
      });

    estruturasCriadas.push(
      caminhoConfiguracoes
    );

    etapas[2] = concluirEtapa(
      etapas[2]
    );

    return {
      sucesso: true,

      tipoLocal: "beauty",

      estruturasCriadas,

      etapas,

      mensagem:
        "Estrutura inicial do Beauty criada.",
    };
  } catch (erro) {
    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Erro ao implantar Beauty.";

    const indice =
      etapas.findIndex(
        (etapa) =>
          etapa.status ===
          "executando"
      );

    if (indice >= 0) {
      etapas[indice] =
        falharEtapa(
          etapas[indice],
          mensagem
        );
    }

    return {
      sucesso: false,

      tipoLocal: "beauty",

      estruturasCriadas,

      etapas,

      mensagem,
    };
  }
}