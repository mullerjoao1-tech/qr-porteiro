export type PerfisDoVinculo =
  Record<
    string,
    boolean | undefined
  >;

const PERMISSOES_POR_PERFIL:
  Record<
    string,
    string[]
  > = {
  administrador_master: [
    "*",
  ],

  sindico: [
    "dashboard",
    "sindico",
    "locais",
    "unidades",
    "moradores",
    "comunicados",
    "reservas",
    "prestadores",
    "contratos",
    "relatorios",
  ],

  administradora: [
    "dashboard",
    "locais",
    "unidades",
    "moradores",
    "comunicados",
    "reservas",
    "prestadores",
    "contratos",
    "relatorios",
  ],

  gestor_local: [
    "dashboard",
    "locais",
    "unidades",
    "moradores",
    "comunicados",
    "reservas",
    "prestadores",
  ],

  financeiro: [
    "dashboard",
    "financeiro",
    "relatorios",
  ],

  conselheiro: [
    "dashboard",
    "relatorios",
  ],

  porteiro: [
    "dashboard",
  ],

  central: [
    "dashboard",
  ],

  funcionario: [
    "dashboard",
  ],

  morador: [
    "dashboard",
  ],

  proprietario: [
    "dashboard",
  ],

  inquilino: [
    "dashboard",
  ],

  responsavel: [
    "dashboard",
  ],

  prestador: [
    "dashboard",
  ],

  gerente: [
    "dashboard",
  ],

  outro: [
    "dashboard",
  ],
};

function normalizar(
  valor?: string
): string {
  return (
    valor
      ?.trim()
      .toLowerCase()
      .replaceAll(
        "-",
        "_"
      ) ||
    ""
  );
}

export function obterPerfisAtivos({
  perfilPrincipal,
  perfis,
}: {
  perfilPrincipal?: string;
  perfis?: PerfisDoVinculo;
}): string[] {
  const resultado =
    new Set<string>();

  const principal =
    normalizar(
      perfilPrincipal
    );

  if (principal) {
    resultado.add(
      principal
    );
  }

  Object.entries(
    perfis ?? {}
  ).forEach(
    ([
      perfil,
      ativo,
    ]) => {
      if (ativo === true) {
        resultado.add(
          normalizar(
            perfil
          )
        );
      }
    }
  );

  return Array.from(
    resultado
  );
}

export function obterPermissoesPadraoPorPerfil({
  perfilPrincipal,
  perfis,
}: {
  perfilPrincipal?: string;
  perfis?: PerfisDoVinculo;
}): string[] {
  const permissoes =
    new Set<string>();

  obterPerfisAtivos({
    perfilPrincipal,
    perfis,
  }).forEach(
    (perfil) => {
      (
        PERMISSOES_POR_PERFIL[
          perfil
        ] ?? []
      ).forEach(
        (permissao) =>
          permissoes.add(
            permissao
          )
      );
    }
  );

  return Array.from(
    permissoes
  );
}

export function perfilPossuiPermissaoPadrao({
  perfilPrincipal,
  perfis,
  permissao,
}: {
  perfilPrincipal?: string;
  perfis?: PerfisDoVinculo;
  permissao: string;
}): boolean {
  const permissoes =
    obterPermissoesPadraoPorPerfil({
      perfilPrincipal,
      perfis,
    });

  return (
    permissoes.includes(
      "*"
    ) ||
    permissoes.includes(
      permissao
    )
  );
}
