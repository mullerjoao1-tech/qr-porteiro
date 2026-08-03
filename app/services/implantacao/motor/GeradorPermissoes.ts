import "server-only";

import type {
  ImplantacaoContext,
} from "../ImplantacaoContext";

export type PermissoesGeradas = {
  perfil: string;

  permissoes: Record<
    string,
    boolean
  >;
};

export type ResultadoGeradorPermissoes = {
  contexto: ImplantacaoContext;

  permissoesPorPerfil:
    PermissoesGeradas[];

  totalPermissoes: number;
};

function adicionarPermissaoCriada(
  contexto: ImplantacaoContext,
  permissao: string
): void {
  if (
    !contexto.permissoes.criadas.includes(
      permissao
    )
  ) {
    contexto.permissoes.criadas.push(
      permissao
    );
  }
}

function criarPermissoesSindico(
  contexto: ImplantacaoContext
): Record<string, boolean> {
  const permissoes: Record<
    string,
    boolean
  > = {
    dashboard: true,

    "central-inteligente":
      true,

    condominio: true,

    receberChamadas: true,

    atenderChamadas: true,

    abrirPortao: true,

    visualizarComunicados:
      true,

    enviarComunicados:
      true,

    gerenciarMoradores:
      true,

    gerenciarUnidades:
      true,

    gerenciarUsuarios:
      true,

    visualizarFinanceiro:
      true,

    gerenciarFinanceiro:
      false,

    visualizarReservas:
      true,

    gerenciarReservas:
      true,

    visualizarPrestadores:
      true,

    gerenciarPrestadores:
      true,

    visualizarContratos:
      true,

    gerenciarContratos:
      true,

    visualizarRelatorios:
      true,

    gerenciarConfiguracoes:
      true,

    moradores: true,

    unidades: true,

    comunicados: true,

    prestadores: true,

    relatorios: true,

    configuracoes: true,
  };

  if (
    contexto.configuracao.tipo ===
    "condominio"
  ) {
    const configuracao =
      contexto.configuracao.dados;

    permissoes.receberChamadas =
      configuracao.possuiVisitantes;

    permissoes.atenderChamadas =
      configuracao.possuiVisitantes;

    permissoes.abrirPortao =
      configuracao.possuiAberturaRemota;

    permissoes.visualizarComunicados =
      configuracao.possuiComunicados;

    permissoes.enviarComunicados =
      configuracao.possuiComunicados;

    permissoes.visualizarReservas =
      configuracao.possuiReservas;

    permissoes.gerenciarReservas =
      configuracao.possuiReservas;

    permissoes.visualizarPrestadores =
      configuracao.possuiPrestadores;

    permissoes.gerenciarPrestadores =
      configuracao.possuiPrestadores;
  }

  return permissoes;
}

function criarPermissoesMorador(
  contexto: ImplantacaoContext
): Record<string, boolean> {
  const permissoes: Record<
    string,
    boolean
  > = {
    dashboard: true,

    receberChamadas: true,

    atenderChamadas: true,

    abrirPortao: false,

    visualizarComunicados:
      true,

    visualizarReservas:
      true,

    gerenciarReservas:
      false,

    visualizarPrestadores:
      false,

    visualizarFinanceiro:
      false,
  };

  if (
    contexto.configuracao.tipo ===
    "condominio"
  ) {
    const configuracao =
      contexto.configuracao.dados;

    permissoes.receberChamadas =
      configuracao.possuiVisitantes;

    permissoes.atenderChamadas =
      configuracao.possuiVisitantes;

    permissoes.abrirPortao =
      configuracao.possuiAberturaRemota;

    permissoes.visualizarComunicados =
      configuracao.possuiComunicados;

    permissoes.visualizarReservas =
      configuracao.possuiReservas;
  }

  return permissoes;
}

function criarPermissoesPorteiro(
  contexto: ImplantacaoContext
): Record<string, boolean> {
  const permissoes: Record<
    string,
    boolean
  > = {
    dashboard: true,

    "central-inteligente":
      true,

    receberChamadas: true,

    atenderChamadas: true,

    abrirPortao: true,

    visualizarComunicados:
      true,

    enviarComunicados:
      false,

    visualizarPrestadores:
      true,

    gerenciarPrestadores:
      false,

    visualizarReservas:
      false,

    visualizarFinanceiro:
      false,
  };

  if (
    contexto.configuracao.tipo ===
    "condominio"
  ) {
    const configuracao =
      contexto.configuracao.dados;

    permissoes.receberChamadas =
      configuracao.possuiVisitantes;

    permissoes.atenderChamadas =
      configuracao.possuiVisitantes;

    permissoes.abrirPortao =
      configuracao.possuiAberturaRemota;

    permissoes.visualizarComunicados =
      configuracao.possuiComunicados;

    permissoes.visualizarPrestadores =
      configuracao.possuiPrestadores;
  }

  return permissoes;
}

function registrarPermissoes(
  contexto: ImplantacaoContext,
  perfil: string,
  permissoes: Record<
    string,
    boolean
  >
): void {
  for (
    const [
      permissao,
      liberada,
    ] of Object.entries(
      permissoes
    )
  ) {
    if (liberada) {
      adicionarPermissaoCriada(
        contexto,
        `${perfil}:${permissao}`
      );
    }
  }
}

export function gerarPermissoes(
  contexto: ImplantacaoContext
): ResultadoGeradorPermissoes {
  const permissoesSindico =
    criarPermissoesSindico(
      contexto
    );

  const permissoesMorador =
    criarPermissoesMorador(
      contexto
    );

  const permissoesPorteiro =
    criarPermissoesPorteiro(
      contexto
    );

  const permissoesPorPerfil:
    PermissoesGeradas[] = [
      {
        perfil: "sindico",

        permissoes:
          permissoesSindico,
      },

      {
        perfil: "morador",

        permissoes:
          permissoesMorador,
      },

      {
        perfil: "porteiro",

        permissoes:
          permissoesPorteiro,
      },
    ];

  registrarPermissoes(
    contexto,
    "sindico",
    permissoesSindico
  );

  registrarPermissoes(
    contexto,
    "morador",
    permissoesMorador
  );

  registrarPermissoes(
    contexto,
    "porteiro",
    permissoesPorteiro
  );

  const totalPermissoes =
    permissoesPorPerfil.reduce(
      (
        total,
        grupo
      ) =>
        total +
        Object.values(
          grupo.permissoes
        ).filter(Boolean).length,
      0
    );

  contexto.resultado.mensagens.push(
    `${totalPermissoes} permissão(ões) preparada(s) para os perfis iniciais.`
  );

  return {
    contexto,

    permissoesPorPerfil,

    totalPermissoes,
  };
}