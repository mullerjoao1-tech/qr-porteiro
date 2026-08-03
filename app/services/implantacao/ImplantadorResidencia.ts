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
      "criar-unidade-principal",
      "Criar unidade principal"
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
          condominioId: local.localId,
          localNome: local.localNome,
          nome: "Residência principal",
          tipo: "residencia",
          tipoLocal: "residencia",
          bloco: "",
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
      "Preparando a unidade principal compartilhada."
    );

    atualizacoes[
      `unidades-v2/${local.localId}-principal`
    ] = {
      id: `${local.localId}-principal`,
      codigo: `${local.localId}-principal`,
      localId: local.localId,
      condominioId: local.localId,
      localNome: local.localNome,
      nome: "Residência principal",
      tipo: "residencia",
      tipoLocal: "residencia",
      bloco: "",
      modoChamado: "familia",
      status: "ativa",
      ativo: true,
      responsavelUid:
        responsavel.uid,
      criadoEm:
        new Date(criadoEm).toISOString(),
      atualizadoEm:
        new Date(criadoEm).toISOString(),
    };

    estruturasCriadas.push(
      `unidades-v2/${local.localId}-principal`
    );

    etapas[3] = concluirEtapa(
      etapas[3],
      "Unidade principal preparada em unidades-v2."
    );

    etapas[4] = iniciarEtapa(
      etapas[4],
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
        [`${local.localId}-principal`]:
          true,
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
      unidadeId:
        `${local.localId}-principal`,
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

    etapas[4] = concluirEtapa(
      etapas[4],
      "Responsável vinculado à residência."
    );

    etapas[5] = iniciarEtapa(
      etapas[5],
      "Preparando configurações e módulos iniciais."
    );

    atualizacoes[
      `configuracoes-chamadas-v2/${local.localId}`
    ] = {
      localId: local.localId,
      unidadePrincipalId:
        `${local.localId}-principal`,

      tiposAtendimento: {
        visitante: {
          id: "visitante",
          titulo: "Visitante",
          icone: "👤",
          ativo: true,
          ordem: 1,
        },

        entrega: {
          id: "entrega",
          titulo: "Entrega / encomenda",
          icone: "📦",
          ativo: true,
          ordem: 2,
        },

        comida: {
          id: "comida",
          titulo: "Entrega de comida",
          icone: "🍔",
          ativo: true,
          ordem: 3,
        },

        servico: {
          id: "servico",
          titulo: "Serviço",
          icone: "🛠️",
          ativo: true,
          ordem: 4,
        },

        motorista: {
          id: "motorista",
          titulo: "Motorista / aplicativo",
          icone: "🚗",
          ativo: true,
          ordem: 5,
        },

        outros: {
          id: "outros",
          titulo: "Outros",
          icone: "✍️",
          ativo: true,
          ordem: 6,
          exigeDescricao: true,
        },
      },

      mensagensRapidasMorador: {
        aguarde: {
          id: "aguarde",
          texto: "Aguarde um momento.",
          ativo: true,
          ordem: 1,
        },

        identificacao: {
          id: "identificacao",
          texto: "Por favor, informe seu nome e o motivo da visita.",
          ativo: true,
          ordem: 2,
        },

        descendo: {
          id: "descendo",
          texto: "Já estou indo atender.",
          ativo: true,
          ordem: 3,
        },

        deixarPorta: {
          id: "deixar-porta",
          texto: "Pode deixar a entrega na porta.",
          ativo: true,
          ordem: 4,
        },

        naoAutorizado: {
          id: "nao-autorizado",
          texto: "Não autorizei esta visita.",
          ativo: true,
          ordem: 5,
        },
      },

      mensagensRapidasVisitante: {
        aguardando: {
          id: "aguardando",
          texto: "Estou aguardando.",
          ativo: true,
          ordem: 1,
        },

        entrega: {
          id: "entrega",
          texto: "Tenho uma entrega para este endereço.",
          ativo: true,
          ordem: 2,
        },

        retorno: {
          id: "retorno",
          texto: "Posso retornar mais tarde.",
          ativo: true,
          ordem: 3,
        },
      },

      notificacoes: {
        pushChamadas: true,
        somChamadas: true,
        vibracao: true,
        repetirEnquantoAguardando: true,
        intervaloRepeticaoSegundos: 30,
      },

      atendimento: {
        permitirTexto: true,
        permitirAudio: true,
        permitirFoto: false,
        permitirVideo: false,
        permitirAbrirPortao:
          configuracao.possuiAberturaRemota ===
          true,
        tempoMaximoAguardandoMinutos: 5,
        tempoMaximoAtendimentoMinutos: 3,
        encerrarAutomaticamente: true,
      },

      criadoEm,
      criadoPorUid,
      atualizadoEm: criadoEm,
    };

    estruturasCriadas.push(
      `configuracoes-chamadas-v2/${local.localId}`
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
          `/morador-v2/${local.localId}-principal`,
        acesso:
          `/acesso-v2/${local.localSlug}`,
        unidadePrincipal:
          `/morador-v2/${local.localId}-principal`,
        cadastroUniversal:
          "/dashboard",
      },

      recursosIniciais: {
        qrVisitante: true,
        painelResponsavel: true,
        placaA4: true,
        mensagensTexto: true,
        mensagensAudio: true,
        notificacoesPush: true,
        historicoChamadas: true,
      },

      unidadePrincipalId:
        `${local.localId}-principal`,

      criadoEm,
      criadoPorUid,
      atualizadoEm: criadoEm,
    };

    estruturasCriadas.push(
      `configuracoes-locais-v2/${local.localId}`
    );

    etapas[5] = concluirEtapa(
      etapas[5],
      "Configurações iniciais preparadas."
    );

    etapas[6] = iniciarEtapa(
      etapas[6],
      "Gravando todas as estruturas no Firebase."
    );

    await database
      .ref()
      .update(atualizacoes);

    etapas[6] = concluirEtapa(
      etapas[6],
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
        unidadePrincipalId:
          `${local.localId}-principal`,
        configuracoesChamadasCriadas:
          true,
        painelResponsavel:
          `/morador-v2/${local.localId}-principal`,
        acessoVisitante:
          `/acesso-v2/${local.localSlug}`,
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
