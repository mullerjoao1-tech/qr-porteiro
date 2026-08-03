"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  get,
  ref,
} from "firebase/database";

import {
  db,
} from "../services/firebase";

export type TipoLocalAtual =
  | "condominio"
  | "residencia"
  | "beauty"
  | "empresa"
  | "clinica"
  | "barbearia"
  | "pet"
  | "restaurante"
  | "outro";

export type UnidadeLocalAtual = {
  id: string;

  nome: string;

  slug?: string;

  tipo?: string;

  localId?: string;

  condominioId?: string;

  localSlug?: string;

  localNome?: string;

  tipoLocal?: string;

  status?: string;
};

export type DadosLocalAtual = {
  id: string;

  nome: string;

  slug: string;

  tipo: TipoLocalAtual;

  segmento: TipoLocalAtual;

  status: string;

  cidade?: string;

  estado?: string;

  endereco?: string;

  configuracao?: Record<
    string,
    unknown
  >;

  modulos?: Record<
    string,
    boolean
  >;

  links?: Record<
    string,
    string
  >;

  unidadePrincipalId?: string;
};

export type ResultadoUseLocalAtual = {
  carregando: boolean;

  erro: string;

  unidade:
    UnidadeLocalAtual | null;

  local:
    DadosLocalAtual | null;

  localId: string;

  localNome: string;

  localSlug: string;

  tipoLocal:
    TipoLocalAtual;

  segmento:
    TipoLocalAtual;

  ehResidencia: boolean;

  ehCondominio: boolean;

  recarregar:
    () => Promise<void>;
};

type LocalBanco = {
  id?: string;

  nome?: string;

  slug?: string;

  tipo?: string;

  tipoLocal?: string;

  segmento?: string;

  status?: string;

  cidade?: string;

  estado?: string;

  endereco?: string;

  configuracao?: Record<
    string,
    unknown
  >;

  modulos?: Record<
    string,
    boolean
  >;

  links?: Record<
    string,
    string
  >;

  estruturas?: {
    unidadePrincipalId?:
      string;
  };
};

function normalizarTipoLocal(
  valor:
    string | undefined
): TipoLocalAtual {
  const tipo =
    valor
      ?.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-z0-9-_]/g,
        "-"
      ) ||
    "";

  if (
    tipo === "condominio"
  ) {
    return "condominio";
  }

  if (
    tipo === "residencia" ||
    tipo === "residencial" ||
    tipo === "casa"
  ) {
    return "residencia";
  }

  if (
    tipo === "beauty" ||
    tipo === "salao" ||
    tipo === "esmalteria"
  ) {
    return "beauty";
  }

  if (
    tipo === "empresa" ||
    tipo === "escritorio"
  ) {
    return "empresa";
  }

  if (
    tipo === "clinica" ||
    tipo === "consultorio"
  ) {
    return "clinica";
  }

  if (
    tipo === "barbearia" ||
    tipo === "barber"
  ) {
    return "barbearia";
  }

  if (
    tipo === "pet" ||
    tipo === "petshop" ||
    tipo === "pet-shop"
  ) {
    return "pet";
  }

  if (
    tipo === "restaurante" ||
    tipo === "bar" ||
    tipo === "alimentacao"
  ) {
    return "restaurante";
  }

  return "outro";
}

function criarLocalNormalizado(
  localId: string,
  dados:
    LocalBanco
): DadosLocalAtual {
  const tipo =
    normalizarTipoLocal(
      dados.segmento ||
      dados.tipoLocal ||
      dados.tipo
    );

  return {
    id:
      dados.id?.trim() ||
      localId,

    nome:
      dados.nome?.trim() ||
      "QR Acesso",

    slug:
      dados.slug?.trim() ||
      localId,

    tipo,

    segmento:
      tipo,

    status:
      dados.status?.trim() ||
      "ativo",

    cidade:
      dados.cidade,

    estado:
      dados.estado,

    endereco:
      dados.endereco,

    configuracao:
      dados.configuracao,

    modulos:
      dados.modulos,

    links:
      dados.links,

    unidadePrincipalId:
      dados.estruturas
        ?.unidadePrincipalId,
  };
}

async function buscarLocalPorIdOuSlug(
  identificador:
    string
): Promise<{
  localId: string;

  local:
    DadosLocalAtual;
} | null> {
  const referenciaDireta =
    ref(
      db,
      `locais-v2/${identificador}`
    );

  const snapshotDireto =
    await get(
      referenciaDireta
    );

  if (
    snapshotDireto.exists()
  ) {
    return {
      localId:
        identificador,

      local:
        criarLocalNormalizado(
          identificador,
          snapshotDireto.val() as
            LocalBanco
        ),
    };
  }

  const snapshotLocais =
    await get(
      ref(
        db,
        "locais-v2"
      )
    );

  if (
    !snapshotLocais.exists()
  ) {
    return null;
  }

  const locais =
    snapshotLocais.val() as
      Record<
        string,
        LocalBanco
      >;

  for (
    const [
      chave,
      dados,
    ] of Object.entries(
      locais
    )
  ) {
    const id =
      dados.id?.trim();

    const slug =
      dados.slug?.trim();

    if (
      chave === identificador ||
      id === identificador ||
      slug === identificador
    ) {
      return {
        localId:
          chave,

        local:
          criarLocalNormalizado(
            chave,
            dados
          ),
      };
    }
  }

  return null;
}

async function buscarUnidade(
  unidadeId:
    string
): Promise<UnidadeLocalAtual | null> {
  const snapshot =
    await get(
      ref(
        db,
        `unidades-v2/${unidadeId}`
      )
    );

  if (
    !snapshot.exists()
  ) {
    return null;
  }

  return {
    id:
      unidadeId,

    ...(
      snapshot.val() as
        Omit<
          UnidadeLocalAtual,
          "id"
        >
    ),
  };
}

function obterPossiveisLocalIds(
  unidadeId:
    string,
  unidade:
    UnidadeLocalAtual | null
): string[] {
  const candidatos = [
    unidade?.localId,
    unidade?.condominioId,
    unidade?.localSlug,
  ]
    .map(
      (valor) =>
        valor?.trim()
    )
    .filter(
      (
        valor
      ): valor is string =>
        Boolean(valor)
    );

  if (
    unidadeId.includes(
      "-casa-"
    )
  ) {
    candidatos.push(
      unidadeId.split(
        "-casa-"
      )[0]
    );
  }

  if (
    unidadeId.includes(
      "-bloco-"
    )
  ) {
    candidatos.push(
      unidadeId.split(
        "-bloco-"
      )[0]
    );
  }

  if (
    unidadeId.includes(
      "-apt-"
    )
  ) {
    candidatos.push(
      unidadeId.split(
        "-apt-"
      )[0]
    );
  }

  return Array.from(
    new Set(
      candidatos
    )
  );
}

export function useLocalAtual(
  unidadeId:
    string
): ResultadoUseLocalAtual {
  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    unidade,
    setUnidade,
  ] =
    useState<UnidadeLocalAtual | null>(
      null
    );

  const [
    local,
    setLocal,
  ] =
    useState<DadosLocalAtual | null>(
      null
    );

  const [
    localId,
    setLocalId,
  ] = useState("");

  async function carregar():
    Promise<void> {
    const id =
      unidadeId.trim();

    if (!id) {
      setUnidade(null);
      setLocal(null);
      setLocalId("");
      setErro(
        "A unidade não foi informada."
      );
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const unidadeEncontrada =
        await buscarUnidade(
          id
        );

      setUnidade(
        unidadeEncontrada
      );

      const candidatos =
        obterPossiveisLocalIds(
          id,
          unidadeEncontrada
        );

      for (
        const candidato of
          candidatos
      ) {
        const resultado =
          await buscarLocalPorIdOuSlug(
            candidato
          );

        if (resultado) {
          setLocalId(
            resultado.localId
          );

          setLocal(
            resultado.local
          );

          setCarregando(false);
          return;
        }
      }

      setLocalId(
        unidadeEncontrada
          ?.condominioId ||
        unidadeEncontrada
          ?.localId ||
        ""
      );

      setLocal(null);

      setErro(
        "O local vinculado à unidade não foi encontrado no Cadastro Universal."
      );
    } catch (erroCarregamento) {
      console.error(
        "Erro ao carregar local atual:",
        erroCarregamento
      );

      setUnidade(null);
      setLocal(null);
      setLocalId("");

      setErro(
        erroCarregamento instanceof
          Error
          ? erroCarregamento.message
          : "Não foi possível carregar o local atual."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, [
    unidadeId,
  ]);

  const tipoLocal =
    local?.tipo ||
    normalizarTipoLocal(
      unidade?.tipoLocal ||
      unidade?.tipo
    );

  const localNome =
    local?.nome ||
    unidade?.localNome ||
    "Morador V2";

  const localSlug =
    local?.slug ||
    unidade?.localSlug ||
    localId;

  return useMemo(
    () => ({
      carregando,

      erro,

      unidade,

      local,

      localId,

      localNome,

      localSlug,

      tipoLocal,

      segmento:
        local?.segmento ||
        tipoLocal,

      ehResidencia:
        tipoLocal ===
        "residencia",

      ehCondominio:
        tipoLocal ===
        "condominio",

      recarregar:
        carregar,
    }),
    [
      carregando,
      erro,
      unidade,
      local,
      localId,
      localNome,
      localSlug,
      tipoLocal,
    ]
  );
}
