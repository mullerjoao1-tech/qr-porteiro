import "server-only";

export type TipoEstruturaUnidade =
  | "condominio"
  | "beauty"
  | "barbearia"
  | "clinica"
  | "empresa"
  | "residencia"
  | "restaurante"
  | "outro";

export type TipoUnidade =
  | "apartamento"
  | "casa"
  | "sala"
  | "consultorio"
  | "setor"
  | "mesa"
  | "ambiente"
  | "profissional"
  | "outro";

export type StatusUnidade =
  | "ativa"
  | "inativa"
  | "pendente"
  | "bloqueada";

export type UnidadeGerada = {
  id: string;

  nome: string;

  slug: string;

  tipo: TipoUnidade;

  numero?: string;

  codigo?: string;

  localId: string;

  localNome: string;

  localSlug: string;

  estruturaPaiId?: string;

  estruturaPaiNome?: string;

  status: StatusUnidade;

  moradores?: Record<
    string,
    boolean
  >;

  usuarios?: Record<
    string,
    boolean
  >;

  configuracao?: Record<
    string,
    boolean | number | string
  >;

  criadoEm: number;

  atualizadoEm: number;
};

export type EstruturaPaiGerada = {
  id: string;

  nome: string;

  slug: string;

  tipo:
    | "bloco"
    | "andar"
    | "setor"
    | "ala"
    | "ambiente"
    | "outro";

  localId: string;

  localNome: string;

  localSlug: string;

  status: StatusUnidade;

  totalUnidades: number;

  criadoEm: number;

  atualizadoEm: number;
};

export type EstruturaUnidadesGerada = {
  tipoEstrutura:
    TipoEstruturaUnidade;

  localId: string;

  estruturasPai:
    EstruturaPaiGerada[];

  unidades:
    UnidadeGerada[];

  totalEstruturasPai: number;

  totalUnidades: number;

  totalPorTipo: Partial<
    Record<
      TipoUnidade,
      number
    >
  >;
};

export type DadosLocalGerador = {
  localId: string;

  localNome: string;

  localSlug: string;

  criadoEm: number;
};

export type ConfiguracaoCondominioGerador = {
  tipoCondominio:
    | "vertical"
    | "horizontal"
    | "misto";

  quantidadeBlocos: number;

  apartamentosPorBloco: number;

  quantidadeCasas: number;
};

export type ConfiguracaoBeautyGerador = {
  quantidadeProfissionais: number;

  quantidadeSalas?: number;
};

export type ConfiguracaoEmpresaGerador = {
  quantidadeSetores?: number;

  quantidadeSalas?: number;
};

export type ConfiguracaoClinicaGerador = {
  quantidadeConsultorios?: number;

  quantidadeSalas?: number;
};

export type ConfiguracaoRestauranteGerador = {
  quantidadeMesas?: number;

  quantidadeAmbientes?: number;
};

export type EntradaGeradorEstrutura =
  | {
      tipo: "condominio";

      local:
        DadosLocalGerador;

      configuracao:
        ConfiguracaoCondominioGerador;
    }
  | {
      tipo: "beauty";

      local:
        DadosLocalGerador;

      configuracao:
        ConfiguracaoBeautyGerador;
    }
  | {
      tipo: "barbearia";

      local:
        DadosLocalGerador;

      configuracao:
        ConfiguracaoBeautyGerador;
    }
  | {
      tipo: "empresa";

      local:
        DadosLocalGerador;

      configuracao:
        ConfiguracaoEmpresaGerador;
    }
  | {
      tipo: "clinica";

      local:
        DadosLocalGerador;

      configuracao:
        ConfiguracaoClinicaGerador;
    }
  | {
      tipo: "restaurante";

      local:
        DadosLocalGerador;

      configuracao:
        ConfiguracaoRestauranteGerador;
    }
  | {
      tipo:
        | "residencia"
        | "outro";

      local:
        DadosLocalGerador;

      configuracao: Record<
        string,
        boolean | number | string
      >;
    };