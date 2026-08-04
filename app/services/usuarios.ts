import {
  get,
  ref,
  set,
  update,
} from "firebase/database";

import {
  db,
} from "./firebase";

import type {
  AtualizacaoUsuario,
  DadosVincularUsuarioLocal,
  NovoUsuario,
  TipoPerfil,
  Usuario,
  VinculoCondominioUsuario,
  VinculoLocalUsuario,
} from "../types/Usuario";

function texto(
  valor:
    unknown
): string {
  return typeof valor ===
    "string"
    ? valor.trim()
    : "";
}

function normalizarUid(
  uid:
    string
): string {
  const normalizado =
    texto(uid);

  if (!normalizado) {
    throw new Error(
      "UID do usuário não informado."
    );
  }

  return normalizado;
}

function normalizarLocalId(
  localId:
    string
): string {
  const normalizado =
    texto(localId);

  if (!normalizado) {
    throw new Error(
      "LocalId não informado."
    );
  }

  return normalizado;
}

function caminhoUsuario(
  uid:
    string
): string {
  return `usuarios-v2/${normalizarUid(uid)}`;
}

function caminhoVinculoLocal(
  uid:
    string,
  localId:
    string
): string {
  return `${caminhoUsuario(uid)}/locais/${normalizarLocalId(localId)}`;
}

function caminhoVinculoCondominio(
  uid:
    string,
  localId:
    string
): string {
  return `${caminhoUsuario(uid)}/condominios/${normalizarLocalId(localId)}`;
}

function criarPerfis(
  perfilPrincipal:
    TipoPerfil,
  perfisRecebidos:
    DadosVincularUsuarioLocal["perfis"]
): VinculoLocalUsuario["perfis"] {
  return {
    ...(perfisRecebidos ?? {}),
    [perfilPrincipal]:
      true,
  };
}

function criarVinculoLocal(
  dados:
    DadosVincularUsuarioLocal,
  criadoEm:
    number
): VinculoLocalUsuario {
  const localId =
    normalizarLocalId(
      dados.localId
    );

  return {
    localId,

    localNome:
      texto(
        dados.localNome
      ) ||
      undefined,

    localSlug:
      texto(
        dados.localSlug
      ) ||
      undefined,

    tipoLocal:
      texto(
        dados.tipoLocal
      ) ||
      undefined,

    perfilPrincipal:
      dados.perfilPrincipal,

    perfis:
      criarPerfis(
        dados.perfilPrincipal,
        dados.perfis
      ),

    unidades:
      dados.unidades ??
      {},

    permissoes:
      dados.permissoes ??
      {},

    ativo:
      dados.ativo ??
      true,

    criadoEm,

    atualizadoEm:
      criadoEm,
  };
}

function criarVinculoCondominioCompatibilidade(
  vinculo:
    VinculoLocalUsuario
): VinculoCondominioUsuario {
  return {
    ...vinculo,

    condominioId:
      vinculo.localId,

    condominioNome:
      vinculo.localNome,

    condominioSlug:
      vinculo.localSlug,
  };
}

export async function criarUsuarioNoBanco(
  uid:
    string,
  dados:
    NovoUsuario
): Promise<Usuario> {
  const uidNormalizado =
    normalizarUid(
      uid
    );

  const agora =
    Date.now();

  const usuario:
    Usuario = {
      ...dados,

      uid:
        uidNormalizado,

      nome:
        texto(
          dados.nome
        ),

      email:
        texto(
          dados.email
        ).toLowerCase(),

      status:
        dados.status ??
        "ativo",

      criadoEm:
        agora,

      atualizadoEm:
        agora,

      ultimoLogin:
        0,

      locais:
        dados.locais ??
        {},

      condominios:
        dados.condominios ??
        {},
    };

  if (!usuario.nome) {
    throw new Error(
      "Nome do usuário não informado."
    );
  }

  if (!usuario.email) {
    throw new Error(
      "E-mail do usuário não informado."
    );
  }

  await set(
    ref(
      db,
      caminhoUsuario(
        uidNormalizado
      )
    ),
    usuario
  );

  return usuario;
}

export async function criarOuAtualizarUsuarioNoBanco(
  uid:
    string,
  dados:
    NovoUsuario
): Promise<Usuario> {
  const uidNormalizado =
    normalizarUid(
      uid
    );

  const existente =
    await buscarUsuarioPorUid(
      uidNormalizado
    );

  if (!existente) {
    return criarUsuarioNoBanco(
      uidNormalizado,
      dados
    );
  }

  const agora =
    Date.now();

  const atualizado:
    Usuario = {
      ...existente,

      ...dados,

      uid:
        uidNormalizado,

      nome:
        texto(
          dados.nome
        ) ||
        existente.nome,

      email:
        texto(
          dados.email
        ).toLowerCase() ||
        existente.email,

      status:
        dados.status ??
        existente.status,

      criadoEm:
        existente.criadoEm,

      atualizadoEm:
        agora,

      ultimoLogin:
        existente.ultimoLogin ??
        0,

      locais: {
        ...(existente.locais ?? {}),
        ...(dados.locais ?? {}),
      },

      condominios: {
        ...(existente.condominios ?? {}),
        ...(dados.condominios ?? {}),
      },
    };

  await set(
    ref(
      db,
      caminhoUsuario(
        uidNormalizado
      )
    ),
    atualizado
  );

  return atualizado;
}

export async function buscarUsuarioPorUid(
  uid:
    string
): Promise<Usuario | null> {
  const snapshot =
    await get(
      ref(
        db,
        caminhoUsuario(uid)
      )
    );

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as
    Usuario;
}

export async function atualizarUsuarioNoBanco(
  uid:
    string,
  dados:
    AtualizacaoUsuario
): Promise<void> {
  await update(
    ref(
      db,
      caminhoUsuario(uid)
    ),
    {
      ...dados,

      atualizadoEm:
        Date.now(),
    }
  );
}

export async function registrarUltimoLogin(
  uid:
    string
): Promise<void> {
  const agora =
    Date.now();

  await update(
    ref(
      db,
      caminhoUsuario(uid)
    ),
    {
      ultimoLogin:
        agora,

      atualizadoEm:
        agora,
    }
  );
}

export async function vincularUsuarioAoLocal(
  uid:
    string,
  dados:
    DadosVincularUsuarioLocal,
  opcoes?: {
    manterCompatibilidadeCondominio?:
      boolean;
  }
): Promise<VinculoLocalUsuario> {
  const uidNormalizado =
    normalizarUid(uid);

  const localId =
    normalizarLocalId(
      dados.localId
    );

  const usuario =
    await buscarUsuarioPorUid(
      uidNormalizado
    );

  if (!usuario) {
    throw new Error(
      `O usuário "${uidNormalizado}" não existe em usuarios-v2.`
    );
  }

  const agora =
    Date.now();

  const vinculoExistente =
    usuario.locais?.[
      localId
    ];

  const vinculoNovo =
    criarVinculoLocal(
      dados,
      vinculoExistente
        ?.criadoEm ??
      agora
    );

  const vinculoFinal:
    VinculoLocalUsuario = {
      ...vinculoExistente,
      ...vinculoNovo,

      perfis: {
        ...(vinculoExistente
          ?.perfis ??
          {}),
        ...vinculoNovo.perfis,
      },

      unidades: {
        ...(vinculoExistente
          ?.unidades ??
          {}),
        ...(vinculoNovo.unidades ??
          {}),
      },

      permissoes: {
        ...(vinculoExistente
          ?.permissoes ??
          {}),
        ...(vinculoNovo.permissoes ??
          {}),
      },

      criadoEm:
        vinculoExistente
          ?.criadoEm ??
        agora,

      atualizadoEm:
        agora,
    };

  const atualizacoes:
    Record<
      string,
      unknown
    > = {
      [`usuarios-v2/${uidNormalizado}/locais/${localId}`]:
        vinculoFinal,

      [`usuarios-v2/${uidNormalizado}/atualizadoEm`]:
        agora,
  };

  const manterCompatibilidade =
    opcoes
      ?.manterCompatibilidadeCondominio ??
    dados.tipoLocal ===
      "condominio";

  if (manterCompatibilidade) {
    atualizacoes[
      `usuarios-v2/${uidNormalizado}/condominios/${localId}`
    ] =
      criarVinculoCondominioCompatibilidade(
        vinculoFinal
      );
  }

  await update(
    ref(
      db
    ),
    atualizacoes
  );

  return vinculoFinal;
}

export async function desvincularUsuarioDoLocal(
  uid:
    string,
  localId:
    string,
  opcoes?: {
    removerCompatibilidadeCondominio?:
      boolean;
  }
): Promise<void> {
  const uidNormalizado =
    normalizarUid(uid);

  const localIdNormalizado =
    normalizarLocalId(
      localId
    );

  const agora =
    Date.now();

  const atualizacoes:
    Record<
      string,
      unknown
    > = {
      [`usuarios-v2/${uidNormalizado}/locais/${localIdNormalizado}/ativo`]:
        false,

      [`usuarios-v2/${uidNormalizado}/locais/${localIdNormalizado}/atualizadoEm`]:
        agora,

      [`usuarios-v2/${uidNormalizado}/atualizadoEm`]:
        agora,
  };

  if (
    opcoes
      ?.removerCompatibilidadeCondominio !==
    false
  ) {
    atualizacoes[
      `usuarios-v2/${uidNormalizado}/condominios/${localIdNormalizado}/ativo`
    ] =
      false;

    atualizacoes[
      `usuarios-v2/${uidNormalizado}/condominios/${localIdNormalizado}/atualizadoEm`
    ] =
      agora;
  }

  await update(
    ref(
      db
    ),
    atualizacoes
  );
}

export async function buscarVinculosAtivosDoUsuario(
  uid:
    string
): Promise<
  Record<
    string,
    VinculoLocalUsuario
  >
> {
  const usuario =
    await buscarUsuarioPorUid(
      uid
    );

  if (!usuario) {
    return {};
  }

  const vinculosUniversais =
    usuario.locais ??
    {};

  if (
    Object.keys(
      vinculosUniversais
    ).length >
    0
  ) {
    return Object.fromEntries(
      Object.entries(
        vinculosUniversais
      ).filter(
        (
          [
            ,
            vinculo,
          ]
        ) =>
          vinculo.ativo !==
          false
      )
    );
  }

  const vinculosAntigos =
    usuario.condominios ??
    {};

  return Object.fromEntries(
    Object.entries(
      vinculosAntigos
    )
      .filter(
        (
          [
            ,
            vinculo,
          ]
        ) =>
          vinculo.ativo !==
          false
      )
      .map(
        (
          [
            localId,
            vinculo,
          ]
        ) => [
          localId,
          {
            localId:
              vinculo.localId ||
              vinculo.condominioId,

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
              vinculo.perfis,

            unidades:
              vinculo.unidades,

            permissoes:
              vinculo.permissoes,

            ativo:
              vinculo.ativo,

            criadoEm:
              vinculo.criadoEm,

            atualizadoEm:
              vinculo.atualizadoEm,
          },
        ]
      )
  );
}

export async function buscarVinculoUsuarioLocal(
  uid:
    string,
  localId:
    string
): Promise<
  VinculoLocalUsuario | null
> {
  const localIdNormalizado =
    normalizarLocalId(
      localId
    );

  const usuario =
    await buscarUsuarioPorUid(
      uid
    );

  if (!usuario) {
    return null;
  }

  const universal =
    usuario.locais?.[
      localIdNormalizado
    ];

  if (universal) {
    return universal;
  }

  const antigo =
    usuario.condominios?.[
      localIdNormalizado
    ];

  if (!antigo) {
    return null;
  }

  return {
    localId:
      antigo.localId ||
      antigo.condominioId,

    localNome:
      antigo.localNome ||
      antigo.condominioNome,

    localSlug:
      antigo.localSlug ||
      antigo.condominioSlug,

    tipoLocal:
      antigo.tipoLocal ||
      "condominio",

    perfilPrincipal:
      antigo.perfilPrincipal,

    perfis:
      antigo.perfis,

    unidades:
      antigo.unidades,

    permissoes:
      antigo.permissoes,

    ativo:
      antigo.ativo,

    criadoEm:
      antigo.criadoEm,

    atualizadoEm:
      antigo.atualizadoEm,
  };
}
