import type {
  Usuario,
  VinculoCondominioUsuario,
  VinculoLocalUsuario,
} from "@/app/types/Usuario";

export type PermissoesDoVinculo =
  Record<
    string,
    boolean | undefined
  >;

export type VinculoComPermissoes =
  VinculoLocalUsuario & {
    condominioId?:
      string;

    condominioNome?:
      string;

    condominioSlug?:
      string;
  };

const PERFIL_ADMINISTRADOR_MASTER =
  "administrador_master";

const PERFIL_ADMINISTRADOR_MASTER_LEGADO =
  "administrador-master";

function converterVinculoAntigo(
  localId:
    string,
  vinculo:
    VinculoCondominioUsuario
): VinculoComPermissoes {
  return {
    localId:
      vinculo.localId ||
      vinculo.condominioId ||
      localId,

    localNome:
      vinculo.localNome ||
      vinculo.condominioNome,

    localSlug:
      vinculo.localSlug ||
      vinculo.condominioSlug,

    tipoLocal:
      vinculo.tipoLocal ||
      "condominio",

    perfilPrincipal:
      vinculo.perfilPrincipal,

    perfis:
      vinculo.perfis ??
      {},

    permissoes:
      vinculo.permissoes ??
      {},

    unidades:
      vinculo.unidades ??
      {},

    ativo:
      vinculo.ativo !==
      false,

    criadoEm:
      vinculo.criadoEm,

    atualizadoEm:
      vinculo.atualizadoEm,

    condominioId:
      vinculo.condominioId ||
      localId,

    condominioNome:
      vinculo.condominioNome ||
      vinculo.localNome,

    condominioSlug:
      vinculo.condominioSlug ||
      vinculo.localSlug,
  };
}

function possuiPerfilAdministradorMaster(
  vinculo:
    VinculoComPermissoes
): boolean {
  const perfilPrincipal =
    vinculo.perfilPrincipal;

  const perfis =
    vinculo.perfis ??
    {};

  return (
    perfilPrincipal ===
      PERFIL_ADMINISTRADOR_MASTER ||
    perfilPrincipal ===
      PERFIL_ADMINISTRADOR_MASTER_LEGADO ||
    perfis[
      PERFIL_ADMINISTRADOR_MASTER
    ] === true ||
    perfis[
      PERFIL_ADMINISTRADOR_MASTER_LEGADO
    ] === true
  );
}

/**
 * Prioridade oficial:
 * usuarios-v2/{uid}/locais/{localId}
 *
 * Compatibilidade temporária:
 * usuarios-v2/{uid}/condominios/{localId}
 */
export function obterVinculosAtivos(
  usuario:
    Usuario | null
): Array<
  [
    string,
    VinculoComPermissoes,
  ]
> {
  if (!usuario) {
    return [];
  }

  const locais =
    usuario.locais ??
    {};

  const locaisAtivos =
    Object.entries(
      locais
    )
      .filter(
        (
          [
            ,
            vinculo,
          ]
        ) =>
          vinculo?.ativo !==
          false
      )
      .map(
        (
          [
            localId,
            vinculo,
          ]
        ): [
          string,
          VinculoComPermissoes,
        ] => [
          localId,
          {
            ...vinculo,

            localId:
              vinculo.localId ||
              localId,

            perfis:
              vinculo.perfis ??
              {},

            permissoes:
              vinculo.permissoes ??
              {},

            unidades:
              vinculo.unidades ??
              {},
          },
        ]
      );

  if (
    locaisAtivos.length >
    0
  ) {
    return locaisAtivos;
  }

  return Object.entries(
    usuario.condominios ??
    {}
  )
    .filter(
      (
        [
          ,
          vinculo,
        ]
      ) =>
        vinculo?.ativo !==
        false
    )
    .map(
      (
        [
          localId,
          vinculo,
        ]
      ): [
        string,
        VinculoComPermissoes,
      ] => [
        localId,
        converterVinculoAntigo(
          localId,
          vinculo
        ),
      ]
    );
}

export function obterVinculo(
  usuario:
    Usuario | null,
  vinculoId:
    string
): VinculoComPermissoes | null {
  if (
    !usuario ||
    !vinculoId
  ) {
    return null;
  }

  const universal =
    usuario.locais?.[
      vinculoId
    ];

  if (universal) {
    return {
      ...universal,

      localId:
        universal.localId ||
        vinculoId,

      perfis:
        universal.perfis ??
        {},

      permissoes:
        universal.permissoes ??
        {},

      unidades:
        universal.unidades ??
        {},
    };
  }

  const antigo =
    usuario.condominios?.[
      vinculoId
    ];

  if (!antigo) {
    return null;
  }

  return converterVinculoAntigo(
    vinculoId,
    antigo
  );
}

export function vinculoEstaAtivo(
  usuario:
    Usuario | null,
  vinculoId:
    string
): boolean {
  const vinculo =
    obterVinculo(
      usuario,
      vinculoId
    );

  return Boolean(
    vinculo &&
    vinculo.ativo !==
      false
  );
}

export function obterPrimeiroVinculoAtivo(
  usuario:
    Usuario | null
): [
  string,
  VinculoComPermissoes,
] | null {
  return (
    obterVinculosAtivos(
      usuario
    )[0] ??
    null
  );
}

export function podeAcessarNoVinculo(
  usuario:
    Usuario | null,
  vinculoId:
    string,
  permissao:
    string
): boolean {
  const vinculo =
    obterVinculo(
      usuario,
      vinculoId
    );

  if (
    !vinculo ||
    vinculo.ativo ===
      false
  ) {
    return false;
  }

  if (
    possuiPerfilAdministradorMaster(
      vinculo
    )
  ) {
    return true;
  }

  return (
    vinculo.permissoes?.[
      permissao
    ] === true
  );
}

export function possuiPerfilNoVinculo(
  usuario:
    Usuario | null,
  vinculoId:
    string,
  perfil:
    string
): boolean {
  const vinculo =
    obterVinculo(
      usuario,
      vinculoId
    );

  if (
    !vinculo ||
    vinculo.ativo ===
      false
  ) {
    return false;
  }

  if (
    perfil ===
      PERFIL_ADMINISTRADOR_MASTER ||
    perfil ===
      PERFIL_ADMINISTRADOR_MASTER_LEGADO
  ) {
    return possuiPerfilAdministradorMaster(
      vinculo
    );
  }

  return (
    vinculo.perfilPrincipal ===
      perfil ||
    vinculo.perfis?.[
      perfil
    ] === true
  );
}

export function listarPermissoesDoVinculo(
  usuario:
    Usuario | null,
  vinculoId:
    string
): string[] {
  const vinculo =
    obterVinculo(
      usuario,
      vinculoId
    );

  if (
    !vinculo ||
    vinculo.ativo ===
      false
  ) {
    return [];
  }

  if (
    possuiPerfilAdministradorMaster(
      vinculo
    )
  ) {
    return [
      "*",
    ];
  }

  return Object.entries(
    vinculo.permissoes ??
    {}
  )
    .filter(
      (
        [
          ,
          liberada,
        ]
      ) =>
        liberada ===
        true
    )
    .map(
      (
        [
          permissao,
        ]
      ) =>
        permissao
    )
    .sort();
}

export function podeAcessar(
  usuario:
    Usuario | null,
  permissao:
    string
): boolean {
  return obterVinculosAtivos(
    usuario
  ).some(
    (
      [
        ,
        vinculo,
      ]
    ) => {
      if (
        possuiPerfilAdministradorMaster(
          vinculo
        )
      ) {
        return true;
      }

      return (
        vinculo.permissoes?.[
          permissao
        ] === true
      );
    }
  );
}

export function possuiPerfil(
  usuario:
    Usuario | null,
  perfil:
    string
): boolean {
  return obterVinculosAtivos(
    usuario
  ).some(
    (
      [
        vinculoId,
      ]
    ) =>
      possuiPerfilNoVinculo(
        usuario,
        vinculoId,
        perfil
      )
  );
}

export function listarPermissoes(
  usuario:
    Usuario | null
): string[] {
  const permissoesLiberadas =
    new Set<
      string
    >();

  for (
    const [
      ,
      vinculo,
    ] of obterVinculosAtivos(
      usuario
    )
  ) {
    if (
      possuiPerfilAdministradorMaster(
        vinculo
      )
    ) {
      permissoesLiberadas.add(
        "*"
      );
    }

    for (
      const [
        permissao,
        liberada,
      ] of Object.entries(
        vinculo.permissoes ??
        {}
      )
    ) {
      if (
        liberada ===
        true
      ) {
        permissoesLiberadas.add(
          permissao
        );
      }
    }
  }

  return Array.from(
    permissoesLiberadas
  ).sort();
}

export function listarVinculosComPermissao(
  usuario:
    Usuario | null,
  permissao:
    string
): string[] {
  return obterVinculosAtivos(
    usuario
  )
    .filter(
      (
        [
          vinculoId,
        ]
      ) =>
        podeAcessarNoVinculo(
          usuario,
          vinculoId,
          permissao
        )
    )
    .map(
      (
        [
          vinculoId,
        ]
      ) =>
        vinculoId
    );
}

