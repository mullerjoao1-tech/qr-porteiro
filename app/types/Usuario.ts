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
  [permissao: string]: boolean | undefined;
};

export type VinculoCondominioUsuario = {
  condominioId: string;
  condominioNome?: string;
  condominioSlug?: string;

  perfis: Partial<Record<TipoPerfil, boolean>>;

  unidades?: Record<string, boolean>;

  permissoes?: PermissoesUsuario;

  ativo: boolean;

  criadoEm?: number;
  atualizadoEm?: number;
};

export type Usuario = {
  uid: string;

  nome: string;
  email: string;
  telefone?: string;
  fotoUrl?: string;

  status: StatusUsuario;

  condominios?: Record<string, VinculoCondominioUsuario>;

  criadoEm: number;
  atualizadoEm?: number;
  ultimoLogin?: number;

  primeiroAcesso?: boolean;
  precisaTrocarSenha?: boolean;

  origem?: string;
  observacoes?: string;
};

export type NovoUsuario = Omit<
  Usuario,
  "uid" | "criadoEm" | "atualizadoEm" | "ultimoLogin"
>;

export type AtualizacaoUsuario = Partial<
  Omit<Usuario, "uid" | "criadoEm">
>;