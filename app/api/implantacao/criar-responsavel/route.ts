import { NextRequest, NextResponse } from "next/server";

import {
  obterFirebaseAdmin,
} from "@/app/services/server/firebaseAdmin";

import {
  executarImplantacao,
  type ConfiguracaoSegmentoImplantacao,
  type ResultadoImplantadorSegmento,
  type TipoLocalImplantacao,
} from "@/app/services/implantacao/ImplantadorUniversal";

import {
  criarOuAtualizarLocalUniversal,
  normalizarIdentidadeVisual,
  type IdentidadeVisualLocal,
} from "@/app/services/locais/CadastroUniversal";

type CorpoCriarResponsavel = {
  nome?: unknown;
  email?: unknown;
  telefone?: unknown;
  senhaProvisoria?: unknown;

  localId?: unknown;
  localNome?: unknown;
  localSlug?: unknown;
  tipoLocal?: unknown;

  cidade?: unknown;
  estado?: unknown;
  endereco?: unknown;

  perfil?: unknown;

  configuracaoSegmento?: unknown;
  identidadeVisual?: unknown;
};

const PERFIL_PADRAO = "sindico";

const LOCAL_PADRAO_ID = "cnd-tulipas";
const LOCAL_PADRAO_NOME = "Residencial Tulipas";
const LOCAL_PADRAO_SLUG = "cnd-tulipas";
const TIPO_LOCAL_PADRAO: TipoLocalImplantacao =
  "condominio";

const TIPOS_LOCAL_PERMITIDOS =
  new Set<TipoLocalImplantacao>([
    "condominio",
    "beauty",
    "barbearia",
    "clinica",
    "empresa",
    "residencia",
    "restaurante",
    "outro",
  ]);

const PERMISSOES_SINDICO: Record<string, boolean> = {
  dashboard: true,
  "central-inteligente": true,
  condominio: true,

  receberChamadas: true,
  atenderChamadas: true,
  abrirPortao: true,

  visualizarComunicados: true,
  enviarComunicados: true,

  gerenciarMoradores: true,
  gerenciarUnidades: true,
  gerenciarUsuarios: true,

  visualizarFinanceiro: true,
  gerenciarFinanceiro: false,

  visualizarReservas: true,
  gerenciarReservas: true,

  visualizarPrestadores: true,
  gerenciarPrestadores: true,

  visualizarContratos: true,
  gerenciarContratos: true,

  visualizarRelatorios: true,
  gerenciarConfiguracoes: true,

  moradores: true,
  unidades: true,
  comunicados: true,
  prestadores: true,
  relatorios: true,
  configuracoes: true,
};

function textoObrigatorio(
  valor: unknown,
  campo: string
): string {
  if (
    typeof valor !== "string" ||
    !valor.trim()
  ) {
    throw new Error(
      `O campo "${campo}" é obrigatório.`
    );
  }

  return valor.trim();
}

function textoOpcional(
  valor: unknown
): string {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function normalizarEmail(
  valor: unknown
): string {
  const email = textoObrigatorio(
    valor,
    "email"
  ).toLowerCase();

  const formatoValido =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );

  if (!formatoValido) {
    throw new Error(
      "Digite um e-mail válido."
    );
  }

  return email;
}

function validarSenha(
  valor: unknown
): string {
  const senha = textoObrigatorio(
    valor,
    "senhaProvisoria"
  );

  if (senha.length < 6) {
    throw new Error(
      "A senha provisória precisa ter pelo menos 6 caracteres."
    );
  }

  return senha;
}

function normalizarId(
  valor: string
): string {
  const normalizado = valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9-_]/g,
      "-"
    )
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalizado) {
    throw new Error(
      "O identificador informado é inválido."
    );
  }

  return normalizado;
}

function normalizarTipoLocal(
  valor: unknown
): TipoLocalImplantacao {
  const tipo = normalizarId(
    textoOpcional(valor) ||
      TIPO_LOCAL_PADRAO
  ) as TipoLocalImplantacao;

  if (
    !TIPOS_LOCAL_PERMITIDOS.has(tipo)
  ) {
    throw new Error(
      "O tipo de local informado não é permitido."
    );
  }

  return tipo;
}

function normalizarConfiguracaoSegmento(
  valor: unknown,
  tipoLocal: TipoLocalImplantacao
): ConfiguracaoSegmentoImplantacao {
  if (
    typeof valor !== "object" ||
    valor === null
  ) {
    throw new Error(
      "A configuração do segmento não foi informada."
    );
  }

  const configuracao = valor as {
    tipo?: unknown;
    dados?: unknown;
  };

  if (
    typeof configuracao.tipo !== "string"
  ) {
    throw new Error(
      "O tipo da configuração do segmento é inválido."
    );
  }

  const tipoConfiguracao =
    normalizarId(
      configuracao.tipo
    ) as TipoLocalImplantacao;

  if (
    tipoConfiguracao !== tipoLocal
  ) {
    throw new Error(
      "A configuração enviada não corresponde ao tipo do local."
    );
  }

  if (
    typeof configuracao.dados !== "object" ||
    configuracao.dados === null ||
    Array.isArray(
      configuracao.dados
    )
  ) {
    throw new Error(
      "Os dados da configuração do segmento são inválidos."
    );
  }

  return {
    tipo: tipoConfiguracao,
    dados:
      configuracao.dados,
  } as ConfiguracaoSegmentoImplantacao;
}

function obterTokenBearer(
  request: NextRequest
): string {
  const cabecalho =
    request.headers.get(
      "authorization"
    );

  if (
    !cabecalho ||
    !cabecalho.startsWith("Bearer ")
  ) {
    throw new Error(
      "Token de autenticação não informado."
    );
  }

  const token = cabecalho
    .slice("Bearer ".length)
    .trim();

  if (!token) {
    throw new Error(
      "Token de autenticação inválido."
    );
  }

  return token;
}

function criarModulosIniciais(
  tipoLocal: TipoLocalImplantacao,
  agora: number
) {
  const base = {
    dashboard: {
      ativo: true,
      implantadoEm: agora,
    },

    marketplace: {
      ativo: true,
      implantadoEm: agora,
    },

    financeiro: {
      ativo: true,
      implantadoEm: agora,
    },

    clubeQr: {
      ativo: false,
      implantadoEm: null,
    },
  };

  if (tipoLocal === "condominio") {
    return {
      ...base,

      acesso: {
        ativo: true,
        implantadoEm: agora,
      },

      condominio: {
        ativo: true,
        implantadoEm: agora,
      },

      beauty: {
        ativo: false,
        implantadoEm: null,
      },
    };
  }

  if (
    tipoLocal === "beauty" ||
    tipoLocal === "barbearia"
  ) {
    return {
      ...base,

      acesso: {
        ativo: false,
        implantadoEm: null,
      },

      condominio: {
        ativo: false,
        implantadoEm: null,
      },

      beauty: {
        ativo: true,
        implantadoEm: agora,
      },
    };
  }

  return {
    ...base,

    acesso: {
      ativo: false,
      implantadoEm: null,
    },

    condominio: {
      ativo: false,
      implantadoEm: null,
    },

    beauty: {
      ativo: false,
      implantadoEm: null,
    },
  };
}

function criarEstatisticasIniciais(
  agora: number
) {
  return {
    totalUsuarios: 0,
    totalUnidades: 0,
    totalMoradores: 0,
    totalFuncionarios: 0,
    totalPrestadores: 0,
    totalVisitantes: 0,
    totalClientes: 0,
    totalProfissionais: 0,

    atualizadoEm: agora,
  };
}

async function validarAdministradorMaster(
  request: NextRequest
) {
  const {
    auth,
    database,
  } = obterFirebaseAdmin();

  const token =
    obterTokenBearer(request);

  const tokenDecodificado =
    await auth.verifyIdToken(token);

  const snapshot =
    await database
      .ref(
        `usuarios-v2/${tokenDecodificado.uid}`
      )
      .get();

  if (!snapshot.exists()) {
    throw new Error(
      "O usuário autenticado não possui cadastro no QR Core."
    );
  }

  const usuario = snapshot.val() as {
    status?: string;

    condominios?: Record<
      string,
      {
        ativo?: boolean;
        perfilPrincipal?: string;
        perfis?: Record<
          string,
          boolean
        >;
      }
    >;
  };

  if (
    usuario.status &&
    usuario.status !== "ativo"
  ) {
    throw new Error(
      "O usuário autenticado não está ativo."
    );
  }

  const vinculos = Object.values(
    usuario.condominios ?? {}
  );

  const administradorMaster =
    vinculos.some((vinculo) => {
      if (vinculo.ativo === false) {
        return false;
      }

      return (
        vinculo.perfilPrincipal ===
          "administrador_master" ||
        vinculo.perfilPrincipal ===
          "administrador-master" ||
        vinculo.perfis?.[
          "administrador_master"
        ] === true ||
        vinculo.perfis?.[
          "administrador-master"
        ] === true
      );
    });

  if (!administradorMaster) {
    throw new Error(
      "Você não possui permissão para realizar implantações."
    );
  }

  return tokenDecodificado;
}

async function removerEstruturasCriadas(
  estruturas: string[]
) {
  const {
    database,
  } = obterFirebaseAdmin();

  for (
    const caminho of [...estruturas].reverse()
  ) {
    try {
      await database
        .ref(caminho)
        .remove();
    } catch (erro) {
      console.error(
        `Erro ao remover estrutura "${caminho}" durante rollback:`,
        erro
      );
    }
  }
}

export async function POST(
  request: NextRequest
) {
  const {
    auth,
    database,
  } = obterFirebaseAdmin();

  let uidResponsavel: string | null = null;

  let usuarioCriadoNoAuthentication = false;

  let usuarioBancoExistiaAntes = false;

  let vinculosUsuarioGravados = false;

  let localCriadoNestaOperacao = false;

  let localIdProcessado:
    | string
    | null = null;

  let resultadoSegmento:
    | ResultadoImplantadorSegmento
    | null = null;

  try {
    const administrador =
      await validarAdministradorMaster(
        request
      );

    const corpo =
      (await request.json()) as CorpoCriarResponsavel;

    const nome = textoObrigatorio(
      corpo.nome,
      "nome"
    );

    const email =
      normalizarEmail(corpo.email);

    const telefone =
      textoOpcional(corpo.telefone);

    const senhaProvisoriaInformada =
      textoOpcional(
        corpo.senhaProvisoria
      );

    const localId = normalizarId(
      textoOpcional(corpo.localId) ||
        LOCAL_PADRAO_ID
    );

    localIdProcessado = localId;

    const localNome =
      textoOpcional(corpo.localNome) ||
      LOCAL_PADRAO_NOME;

    const localSlug = normalizarId(
      textoOpcional(corpo.localSlug) ||
        LOCAL_PADRAO_SLUG
    );

    const tipoLocal =
      normalizarTipoLocal(
        corpo.tipoLocal
      );

    const cidade =
      textoOpcional(corpo.cidade);

    const estado =
      textoOpcional(corpo.estado)
        .toUpperCase();

    const endereco =
      textoOpcional(corpo.endereco);

    const perfil =
      normalizarId(
        textoOpcional(corpo.perfil) ||
          PERFIL_PADRAO
      ).replaceAll("-", "_");

    const configuracaoSegmento =
      normalizarConfiguracaoSegmento(
        corpo.configuracaoSegmento,
        tipoLocal
      );

    const identidadeVisual:
      IdentidadeVisualLocal =
      normalizarIdentidadeVisual(
        corpo.identidadeVisual
      );

    if (perfil !== "sindico") {
      throw new Error(
        "Nesta primeira etapa, somente o perfil de síndico está liberado."
      );
    }

    let usuarioAuthenticationExistente:
      Awaited<
        ReturnType<
          typeof auth.getUserByEmail
        >
      > | null = null;

    try {
      usuarioAuthenticationExistente =
        await auth.getUserByEmail(
          email
        );
    } catch (erroBusca) {
      const codigo =
        typeof erroBusca === "object" &&
        erroBusca !== null &&
        "code" in erroBusca
          ? String(
              (
                erroBusca as {
                  code?: unknown;
                }
              ).code ?? ""
            )
          : "";

      if (
        codigo !==
        "auth/user-not-found"
      ) {
        throw erroBusca;
      }
    }

    const agora = Date.now();

    const modulosIniciais =
      criarModulosIniciais(
        tipoLocal,
        agora
      );

    const estatisticasIniciais =
      criarEstatisticasIniciais(
        agora
      );

    const resultadoCadastroLocal =
      await criarOuAtualizarLocalUniversal(
        database,
        {
          localId,

          nome:
            localNome,

          slug:
            localSlug,

          tipo:
            tipoLocal,

          cidade,
          estado,
          endereco,

          criadoPorUid:
            administrador.uid,

          criadoEm:
            agora,

          modulos:
            modulosIniciais,

          estatisticas:
            estatisticasIniciais,

          configuracaoSegmento,

          identidadeVisual,
        }
      );

    localCriadoNestaOperacao =
      resultadoCadastroLocal.criado;

    if (
      usuarioAuthenticationExistente
    ) {
      uidResponsavel =
        usuarioAuthenticationExistente.uid;
    } else {
      const senhaProvisoria =
        validarSenha(
          senhaProvisoriaInformada
        );

      const usuarioAuthentication =
        await auth.createUser({
          email,
          password:
            senhaProvisoria,
          displayName:
            nome,
          disabled:
            false,
        });

      uidResponsavel =
        usuarioAuthentication.uid;

      usuarioCriadoNoAuthentication =
        true;
    }

    if (!uidResponsavel) {
      throw new Error(
        "Não foi possível determinar o UID do responsável."
      );
    }

    const vinculoUniversal = {
      localId,
      localNome,
      localSlug,
      tipoLocal,

      condominioId: localId,
      condominioNome: localNome,
      condominioSlug: localSlug,

      perfilPrincipal: perfil,

      perfis: {
        [perfil]: true,
      },

      unidades: {},

      permissoes: {
        ...PERMISSOES_SINDICO,
      },

      ativo: true,

      criadoEm: agora,
      atualizadoEm: agora,
    };

    const referenciaUsuarioBanco =
      database.ref(
        `usuarios-v2/${uidResponsavel}`
      );

    const snapshotUsuarioBanco =
      await referenciaUsuarioBanco.get();

    usuarioBancoExistiaAntes =
      snapshotUsuarioBanco.exists();

    const usuarioBancoExistente =
      snapshotUsuarioBanco.exists()
        ? (
            snapshotUsuarioBanco.val() as {
              criadoEm?: number;
              ultimoLogin?: number;
              primeiroAcesso?: boolean;
              precisaTrocarSenha?: boolean;
              origem?: string;
            }
          )
        : null;

    await referenciaUsuarioBanco.update({
      uid:
        uidResponsavel,

      nome,
      email,
      telefone,

      status:
        "ativo",

      criadoEm:
        usuarioBancoExistente
          ?.criadoEm ??
        agora,

      atualizadoEm:
        agora,

      ultimoLogin:
        usuarioBancoExistente
          ?.ultimoLogin ??
        0,

      primeiroAcesso:
        usuarioBancoExistente
          ?.primeiroAcesso ??
        usuarioCriadoNoAuthentication,

      precisaTrocarSenha:
        usuarioBancoExistente
          ?.precisaTrocarSenha ??
        usuarioCriadoNoAuthentication,

      origem:
        usuarioBancoExistente
          ?.origem ??
        "assistente-implantacao-qr-core",

      [`locais/${localId}`]:
        vinculoUniversal,

      [`condominios/${localId}`]:
        vinculoUniversal,
    });

    vinculosUsuarioGravados =
      true;

    const referenciaUsuarioLocal = {
      uid: uidResponsavel,
      nome,
      email,
      telefone,

      perfilPrincipal: perfil,

      perfis: {
        [perfil]: true,
      },

      ativo: true,

      criadoEm: agora,
      atualizadoEm: agora,
    };

    await database
      .ref(
        `locais-v2/${localId}/usuarios/${uidResponsavel}`
      )
      .set(
        referenciaUsuarioLocal
      );

    await database
      .ref(
        `locais-v2/${localId}/responsaveis/${uidResponsavel}`
      )
      .set({
        uid: uidResponsavel,
        nome,
        email,
        telefone,

        perfil,
        ativo: true,

        criadoEm: agora,
        atualizadoEm: agora,
      });

    await database
      .ref(
        `locais-v2/${localId}/estatisticas`
      )
      .update({
        totalUsuarios: 1,
        atualizadoEm: agora,
      });

    resultadoSegmento =
      await executarImplantacao({
        database,

        criadoEm: agora,

        criadoPorUid:
          administrador.uid,

        local: {
          localId,
          localNome,
          localSlug,
          tipoLocal,

          cidade,
          estado,
          endereco,
        },

        responsavel: {
          uid: uidResponsavel,
          nome,
          email,
          telefone,
          perfil,
        },

        configuracaoSegmento,
      });

    if (
      !resultadoSegmento.sucesso
    ) {
      throw new Error(
        resultadoSegmento.mensagem ||
          "O implantador do segmento não concluiu a operação."
      );
    }

    await database
      .ref(
        `locais-v2/${localId}`
      )
      .update({
        implantacao: {
          status: "concluida",

          estruturasCriadas:
            resultadoSegmento.estruturasCriadas,

          etapas:
            resultadoSegmento.etapas,

          concluidaEm:
            Date.now(),
        },

        atualizadoEm:
          Date.now(),
      });

    await database
      .ref(
        `historico-implantacoes-v2/${localId}`
      )
      .push({
        tipo:
          "implantacao_concluida",

        localId,
        localNome,
        localSlug,
        tipoLocal,

        usuarioUid:
          uidResponsavel,

        usuarioNome:
          nome,

        usuarioEmail:
          email,

        usuarioReutilizado:
          !usuarioCriadoNoAuthentication,

        perfil,

        configuracaoSegmento,

        identidadeVisual,

        modulosAtivos:
          Object.entries(
            criarModulosIniciais(
              tipoLocal,
              agora
            )
          )
            .filter(
              ([, modulo]) =>
                modulo.ativo === true
            )
            .map(
              ([moduloId]) =>
                moduloId
            ),

        estruturasCriadas:
          resultadoSegmento.estruturasCriadas,

        etapas:
          resultadoSegmento.etapas,

        criadoPorUid:
          administrador.uid,

        criadoEm: agora,

        criadoEmFormatado:
          new Date(
            agora
          ).toLocaleString(
            "pt-BR"
          ),
      });

    return NextResponse.json(
      {
        sucesso: true,

        mensagem:
          usuarioCriadoNoAuthentication
            ? "Local, novo responsável, módulos e estrutura do segmento implantados com sucesso."
            : "Local implantado e vinculado ao responsável já existente com sucesso.",

        local: {
          id: localId,
          nome: localNome,
          slug: localSlug,
          tipo: tipoLocal,
          status: "ativo",

          cidade,
          estado,
          endereco,

          modulos:
            criarModulosIniciais(
              tipoLocal,
              agora
            ),

          configuracaoSegmento,

          identidadeVisual,
        },

        usuario: {
          uid: uidResponsavel,
          nome,
          email,
          telefone,
          status: "ativo",

          primeiroAcesso:
            usuarioCriadoNoAuthentication,

          precisaTrocarSenha:
            usuarioCriadoNoAuthentication,

          usuarioReutilizado:
            !usuarioCriadoNoAuthentication,
        },

        vinculo: {
          localId,
          localNome,
          localSlug,
          tipoLocal,

          condominioId:
            localId,

          condominioNome:
            localNome,

          condominioSlug:
            localSlug,

          perfil,
        },

        implantacao: {
          sucesso:
            resultadoSegmento.sucesso,

          estruturasCriadas:
            resultadoSegmento.estruturasCriadas,

          etapas:
            resultadoSegmento.etapas,

          mensagem:
            resultadoSegmento.mensagem,
        },
      },
      {
        status: 201,
      }
    );
  } catch (erro) {
    console.error(
      "Erro ao realizar implantação:",
      erro
    );

    if (
      resultadoSegmento
        ?.estruturasCriadas
        .length
    ) {
      await removerEstruturasCriadas(
        resultadoSegmento
          .estruturasCriadas
      );
    }

    if (
      uidResponsavel &&
      localIdProcessado
    ) {
      try {
        if (
          vinculosUsuarioGravados
        ) {
          await database
            .ref(
              `usuarios-v2/${uidResponsavel}/locais/${localIdProcessado}`
            )
            .remove();

          await database
            .ref(
              `usuarios-v2/${uidResponsavel}/condominios/${localIdProcessado}`
            )
            .remove();
        }

        await database
          .ref(
            `locais-v2/${localIdProcessado}/usuarios/${uidResponsavel}`
          )
          .remove();

        await database
          .ref(
            `locais-v2/${localIdProcessado}/responsaveis/${uidResponsavel}`
          )
          .remove();

        if (
          usuarioCriadoNoAuthentication &&
          !usuarioBancoExistiaAntes
        ) {
          await database
            .ref(
              `usuarios-v2/${uidResponsavel}`
            )
            .remove();
        }
      } catch (erroBanco) {
        console.error(
          "Erro ao desfazer vínculos do usuário durante rollback:",
          erroBanco
        );
      }

      if (
        usuarioCriadoNoAuthentication
      ) {
        try {
          await auth.deleteUser(
            uidResponsavel
          );
        } catch (erroAuth) {
          console.error(
            "Erro ao remover usuário novo do Authentication durante rollback:",
            erroAuth
          );
        }
      }
    }

    if (
      localCriadoNestaOperacao &&
      localIdProcessado
    ) {
      try {
        await database
          .ref(
            `locais-v2/${localIdProcessado}`
          )
          .remove();
      } catch (erroLocal) {
        console.error(
          "Erro ao remover local durante rollback:",
          erroLocal
        );
      }
    }

    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Não foi possível concluir a implantação.";

    const naoAutorizado =
      mensagem.includes(
        "Token de autenticação"
      ) ||
      mensagem.includes(
        "não possui cadastro"
      );

    const semPermissao =
      mensagem.includes(
        "não possui permissão"
      ) ||
      mensagem.includes(
        "não está ativo"
      );

    return NextResponse.json(
      {
        sucesso: false,
        erro: mensagem,
      },
      {
        status: naoAutorizado
          ? 401
          : semPermissao
          ? 403
          : 400,
      }
    );
  }
}
