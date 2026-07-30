import "server-only";

import type {
  ContextoImplantacao,
  EtapaImplantacao,
  ResultadoImplantadorSegmento,
} from "./ImplantadorUniversal";

type ConfiguracaoResidencia = Record<
  string,
  boolean | number | string
>;

function criarEtapa(
  id: string,
  titulo: string
): EtapaImplantacao {
  return {
    id,
    titulo,
    status: "pendente",
  };
}

function iniciarEtapa(
  etapa: EtapaImplantacao,
  mensagem?: string
): EtapaImplantacao {
  return {
    ...etapa,
    status: "executando",
    mensagem,
    iniciadoEm: Date.now(),
  };
}

function concluirEtapa(
  etapa: EtapaImplantacao,
  mensagem?: string
): EtapaImplantacao {
  return {
    ...etapa,
    status: "concluida",
    mensagem,
    concluidoEm: Date.now(),
  };
}

function falharEtapa(
  etapa: EtapaImplantacao,
  mensagem: string
): EtapaImplantacao {
  return {
    ...etapa,
    status: "falhou",
    mensagem,
    concluidoEm: Date.now(),
  };
}

function obterConfiguracaoResidencia(
  contexto: ContextoImplantacao
): ConfiguracaoResidencia {
  if (
    contexto.configuracaoSegmento.tipo !==
    "residencia"
  ) {
    throw new Error(
      "A configuração informada não pertence ao segmento residência."
    );
  }

  return contexto.configuracaoSegmento.dados;
}

function criarPermissoesResponsavel(): Record<
  string,
  boolean
> {
  return {
    acessarDashboard: true,
    visualizarLocal: true,
    editarLocal: true,
    gerenciarMoradores: true,
    gerenciarVisitantes: true,
    gerenciarEntregas: true,
    gerenciarPrestadores: true,
    gerenciarComunicados: true,
    gerenciarPortoes: true,
    gerenciarCameras: true,
    visualizarHistorico: true,
    gerenciarConfiguracoes: true,
  };
}

export async function implantarResidencia(
  contexto: ContextoImplantacao
): Promise<ResultadoImplantadorSegmento> {
  const etapas: EtapaImplantacao[] = [
    criarEtapa(
      "validar-configuracao",
      "Validar configuração da residência"
    ),
    criarEtapa(
      "criar-local",
      "Criar cadastro principal do local"
    ),
    criarEtapa(
      "criar-residencia",
      "Criar estrutura da residência"
    ),
    criarEtapa(
      "vincular-responsavel",
      "Vincular responsável ao local"
    ),
    criarEtapa(
      "criar-configuracoes",
      "Criar configurações iniciais"
    ),
    criarEtapa(
      "finalizar-implantacao",
      "Finalizar implantação"
    ),
  ];

  const estruturasCriadas: string[] = [];

  try {
    etapas[0] = iniciarEtapa(
      etapas[0],
      "Validando os dados recebidos."
    );

    const configuracao =
      obterConfiguracaoResidencia(
        contexto
      );

    etapas[0] = concluirEtapa(
      etapas[0],
      "Configuração da residência validada."
    );

    const {
      database,
      criadoEm,
      criadoPorUid,
      local,
      responsavel,
    } = contexto;

    const permissoesResponsavel =
      criarPermissoesResponsavel();

    const perfilResponsavel =
      responsavel.perfil ||
      "gestor_local";

    const enderecoCompleto = {
      endereco: local.endereco ?? "",
      cidade: local.cidade ?? "",
      estado: local.estado ?? "",
    };

    const atualizacoes: Record<
      string,
      unknown
    > = {};

    etapas[1] = iniciarEtapa(
      etapas[1],
      "Preparando o cadastro global do local."
    );

    atualizacoes[
      `locais-v2/${local.localId}`
    ] = {
      id: local.localId,
      nome: local.localNome,
      slug: local.localSlug,
      tipoLocal: "residencia",
      status: "ativo",
      ativo: true,
      ...enderecoCompleto,
      criadoEm,
      criadoPorUid,
      atualizadoEm: criadoEm,

      responsaveis: {
        [responsavel.uid]: {
          uid: responsavel.uid,
          nome: responsavel.nome,
          email: responsavel.email,
          telefone:
            responsavel.telefone ?? "",
          perfil: perfilResponsavel,
          ativo: true,
          criadoEm,
          atualizadoEm: criadoEm,
        },
      },

      implantacao: {
        status: "concluida",
        tipoImplantacao: "residencia",
        implantadoEm: criadoEm,
        implantadoPorUid:
          criadoPorUid,
      },
    };

    estruturasCriadas.push(
      `locais-v2/${local.localId}`
    );

    estruturasCriadas.push(
      `locais-v2/${local.localId}/responsaveis/${responsavel.uid}`
    );

    etapas[1] = concluirEtapa(
      etapas[1],
      "Cadastro principal do local preparado."
    );

    etapas[2] = iniciarEtapa(
      etapas[2],
      "Preparando a estrutura específica da residência."
    );

    atualizacoes[
      `residencias-v2/${local.localId}`
    ] = {
      id: local.localId,
      localId: local.localId,
      nome: local.localNome,
      slug: local.localSlug,
      status: "ativo",
      ativo: true,
      responsavelUid:
        responsavel.uid,
      configuracao,
      ...enderecoCompleto,
      criadoEm,
      criadoPorUid,
      atualizadoEm: criadoEm,

      unidades: {
        principal: {
          id: "principal",
          localId: local.localId,
          nome: "Residência principal",
          tipo: "residencia",
          status: "ativa",
          ativo: true,
          responsavelUid:
            responsavel.uid,
          criadoEm,
          atualizadoEm: criadoEm,
        },
      },
    };

    estruturasCriadas.push(
      `residencias-v2/${local.localId}`
    );

    estruturasCriadas.push(
      `residencias-v2/${local.localId}/unidades/principal`
    );

    etapas[2] = concluirEtapa(
      etapas[2],
      "Estrutura da residência preparada."
    );

    etapas[3] = iniciarEtapa(
      etapas[3],
      "Preparando o vínculo do responsável."
    );

    atualizacoes[
      `usuarios-v2/${responsavel.uid}/vinculos/${local.localId}`
    ] = {
      vinculoId: local.localId,
      localId: local.localId,
      localNome: local.localNome,
      localSlug: local.localSlug,
      tipoLocal: "residencia",
      ativo: true,
      status: "ativo",
      perfilPrincipal:
        perfilResponsavel,
      perfis: {
        [perfilResponsavel]: true,
      },
      permissoes:
        permissoesResponsavel,
      unidades: {
        principal: true,
      },
      criadoEm,
      criadoPorUid,
      atualizadoEm: criadoEm,
    };

    atualizacoes[
      `vinculos-locais-v2/${local.localId}/${responsavel.uid}`
    ] = {
      uid: responsavel.uid,
      nome: responsavel.nome,
      email: responsavel.email,
      telefone:
        responsavel.telefone ?? "",
      perfil:
        perfilResponsavel,
      ativo: true,
      status: "ativo",
      unidadeId: "principal",
      permissoes:
        permissoesResponsavel,
      criadoEm,
      criadoPorUid,
      atualizadoEm: criadoEm,
    };

    estruturasCriadas.push(
      `usuarios-v2/${responsavel.uid}/vinculos/${local.localId}`
    );

    estruturasCriadas.push(
      `vinculos-locais-v2/${local.localId}/${responsavel.uid}`
    );

    etapas[3] = concluirEtapa(
      etapas[3],
      "Responsável vinculado à residência."
    );

    etapas[4] = iniciarEtapa(
      etapas[4],
      "Preparando configurações e módulos iniciais."
    );

    atualizacoes[
      `configuracoes-locais-v2/${local.localId}`
    ] = {
      localId: local.localId,
      tipoLocal: "residencia",
      configuracaoSegmento:
        configuracao,

      modulos: {
        dashboard: true,
        moradores: true,
        visitantes:
          configuracao.possuiVisitantes ===
          true,
        entregas:
          configuracao.possuiEntregas ===
          true,
        prestadores:
          configuracao.possuiPrestadores ===
          true,
        comunicados:
          configuracao.possuiComunicados ===
          true,
        cameras:
          configuracao.possuiCameras ===
          true,
        aberturaRemota:
          configuracao.possuiAberturaRemota ===
          true,
        historico: true,
        configuracoes: true,
      },

      urls: {
        painel:
          `/dashboard/${local.localSlug}`,
        acesso:
          `/acesso-v2/${local.localSlug}`,
        unidadePrincipal:
          `/morador-v2/${local.localSlug}/principal`,
      },

      criadoEm,
      criadoPorUid,
      atualizadoEm: criadoEm,
    };

    estruturasCriadas.push(
      `configuracoes-locais-v2/${local.localId}`
    );

    etapas[4] = concluirEtapa(
      etapas[4],
      "Configurações iniciais preparadas."
    );

    etapas[5] = iniciarEtapa(
      etapas[5],
      "Gravando todas as estruturas no Firebase."
    );

    await database
      .ref()
      .update(atualizacoes);

    etapas[5] = concluirEtapa(
      etapas[5],
      "Implantação da residência concluída."
    );

    return {
      sucesso: true,
      tipoLocal: "residencia",
      estruturasCriadas,
      etapas,
      mensagem:
        "Residência implantada com sucesso.",
      detalhes: {
        localId: local.localId,
        localSlug: local.localSlug,
        responsavelUid:
          responsavel.uid,
        unidadePrincipalCriada: true,
        totalEstruturas:
          estruturasCriadas.length,
      },
    };
  } catch (erro) {
    const mensagemErro =
      erro instanceof Error
        ? erro.message
        : "Erro desconhecido durante a implantação da residência.";

    const indiceEtapaExecutando =
      etapas.findIndex(
        (etapa) =>
          etapa.status ===
          "executando"
      );

    if (
      indiceEtapaExecutando >= 0
    ) {
      etapas[indiceEtapaExecutando] =
        falharEtapa(
          etapas[
            indiceEtapaExecutando
          ],
          mensagemErro
        );
    }

    return {
      sucesso: false,
      tipoLocal: "residencia",
      estruturasCriadas,
      etapas,
      mensagem:
        `Falha ao implantar residência: ${mensagemErro}`,
      detalhes: {
        erro: mensagemErro,
        totalEstruturasPreparadas:
          estruturasCriadas.length,
      },
    };
  }
}
