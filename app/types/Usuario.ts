export type StatusUsuario =
  | "ativo"
  | "inativo"
  | "pendente"
  | "bloqueado";

export type TipoPerfil =
  | "morador"
  | "sindico"
  | "administradora"
  | "gestor_local"
  | "porteiro"
  | "central"
  | "funcionario"
  | "financeiro"
  | "prestador"
  | "conselheiro"
  | "administrador_master"
  | "outro";

/**
 * Mantemos string no índice para permitir leitura temporária
 * de valores legados, como "administrador-master".
 */
export type PerfisUsuario =
  Record<
    string,
    boolean | undefined
  >;

export type PermissoesUsuario = {
  receberChamadas?: boolean;
  atenderChamadas?: boolean;
  abrirPortao?: boolean;

  visualizarComunicados?: boolean;
  enviarComunicados?: boolean;

  gerenciarMoradores?: boolean;
  gerenciarUnidades?: boolean;
  gerenciarUsuarios?: boolean;

  visualizarFinanceiro?: boolean;
  gerenciarFinanceiro?: boolean;

  visualizarReservas?: boolean;
  gerenciarReservas?: boolean;

  visualizarPrestadores?: boolean;
  gerenciarPrestadores?: boolean;

  visualizarContratos?: boolean;
  gerenciarContratos?: boolean;

  visualizarRelatorios?: boolean;
  gerenciarConfiguracoes?: boolean;

  [permissao: string]:
    boolean | undefined;
};

export type VinculoLocalUsuario = {
  localId:
    string;

  localNome?:
    string;

  localSlug?:
    string;

  tipoLocal?:
    string;

  perfilPrincipal?:
    TipoPerfil | string;

  perfis:
    PerfisUsuario;

  unidades?:
    Record<
      string,
      boolean
    >;

  permissoes?:
    PermissoesUsuario;

  ativo:
    boolean;

  criadoEm?:
    number;

  atualizadoEm?:
    number;
};

/**
 * Compatibilidade temporária com a estrutura antiga.
 * Novos fluxos devem usar VinculoLocalUsuario.
 */
export type VinculoCondominioUsuario =
  VinculoLocalUsuario & {
    condominioId:
      string;

    condominioNome?:
      string;

    condominioSlug?:
      string;
  };

export type Usuario = {
  uid:
    string;

  nome:
    string;

  email:
    string;

  telefone?:
    string;

  fotoUrl?:
    string;

  status:
    StatusUsuario;

  /**
   * Estrutura universal oficial.
   */
  locais?:
    Record<
      string,
      VinculoLocalUsuario
    >;

  /**
   * Compatibilidade temporária com fluxos antigos.
   */
  condominios?:
    Record<
      string,
      VinculoCondominioUsuario
    >;

  criadoEm:
    number;

  atualizadoEm?:
    number;

  ultimoLogin?:
    number;

  primeiroAcesso?:
    boolean;

  precisaTrocarSenha?:
    boolean;

  origem?:
    string;

  observacoes?:
    string;
};

export type NovoUsuario =
  Omit<
    Usuario,
    | "uid"
    | "criadoEm"
    | "atualizadoEm"
    | "ultimoLogin"
  >;

export type AtualizacaoUsuario =
  Partial<
    Omit<
      Usuario,
      | "uid"
      | "criadoEm"
    >
  >;

export type DadosVincularUsuarioLocal = {
  localId:
    string;

  localNome?:
    string;

  localSlug?:
    string;

  tipoLocal?:
    string;

  perfilPrincipal:
    TipoPerfil;

  perfis?:
    PerfisUsuario;

  unidades?:
    Record<
      string,
      boolean
    >;

  permissoes?:
    PermissoesUsuario;

  ativo?:
    boolean;
};
