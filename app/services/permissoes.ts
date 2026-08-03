import type { Usuario } from "@/app/types/Usuario";

export type PermissoesDoVinculo = Record<string, boolean>;

export type VinculoComPermissoes = {
  ativo?: boolean;

  condominioId?: string;
  condominioNome?: string;
  condominioSlug?: string;

  perfilPrincipal?: string;
  perfis?: Record<string, boolean>;

  permissoes?: PermissoesDoVinculo;

  unidades?: Record<string, boolean>;

  criadoEm?: number;
  atualizadoEm?: number;
};

type UsuarioComVinculos = Usuario & {
  condominios?: Record<string, VinculoComPermissoes>;
};

const PERFIL_ADMINISTRADOR_MASTER = "administrador_master";
const PERFIL_ADMINISTRADOR_MASTER_LEGADO = "administrador-master";

/**
 * Verifica se o vínculo possui perfil de administrador master.
 *
 * Mantém compatibilidade temporária com o valor legado
 * "administrador-master", usado anteriormente com hífen.
 */
function possuiPerfilAdministradorMaster(
  vinculo: VinculoComPermissoes
): boolean {
  return (
    vinculo.perfilPrincipal === PERFIL_ADMINISTRADOR_MASTER ||
    vinculo.perfilPrincipal === PERFIL_ADMINISTRADOR_MASTER_LEGADO ||
    vinculo.perfis?.[PERFIL_ADMINISTRADOR_MASTER] === true ||
    vinculo.perfis?.[PERFIL_ADMINISTRADOR_MASTER_LEGADO] === true
  );
}

/**
 * Retorna todos os vínculos ativos do usuário.
 */
export function obterVinculosAtivos(
  usuario: Usuario | null
): Array<[string, VinculoComPermissoes]> {
  if (!usuario) {
    return [];
  }

  const usuarioComVinculos = usuario as UsuarioComVinculos;
  const condominios = usuarioComVinculos.condominios ?? {};

  return Object.entries(condominios).filter(
    ([, vinculo]) => vinculo?.ativo !== false
  );
}

/**
 * Retorna um vínculo específico do usuário.
 */
export function obterVinculo(
  usuario: Usuario | null,
  vinculoId: string
): VinculoComPermissoes | null {
  if (!usuario || !vinculoId) {
    return null;
  }

  const usuarioComVinculos = usuario as UsuarioComVinculos;

  return usuarioComVinculos.condominios?.[vinculoId] ?? null;
}

/**
 * Verifica se um vínculo está ativo.
 */
export function vinculoEstaAtivo(
  usuario: Usuario | null,
  vinculoId: string
): boolean {
  const vinculo = obterVinculo(usuario, vinculoId);

  return Boolean(vinculo && vinculo.ativo !== false);
}

/**
 * Retorna o primeiro vínculo ativo do usuário.
 *
 * Será utilizado como seleção automática quando o usuário
 * possuir somente um vínculo ativo.
 */
export function obterPrimeiroVinculoAtivo(
  usuario: Usuario | null
): [string, VinculoComPermissoes] | null {
  return obterVinculosAtivos(usuario)[0] ?? null;
}

/**
 * Verifica se o usuário possui uma permissão em um vínculo específico.
 */
export function podeAcessarNoVinculo(
  usuario: Usuario | null,
  vinculoId: string,
  permissao: string
): boolean {
  const vinculo = obterVinculo(usuario, vinculoId);

  if (!vinculo || vinculo.ativo === false) {
    return false;
  }

  if (possuiPerfilAdministradorMaster(vinculo)) {
    return true;
  }

  return vinculo.permissoes?.[permissao] === true;
}

/**
 * Verifica se o usuário possui um perfil em um vínculo específico.
 */
export function possuiPerfilNoVinculo(
  usuario: Usuario | null,
  vinculoId: string,
  perfil: string
): boolean {
  const vinculo = obterVinculo(usuario, vinculoId);

  if (!vinculo || vinculo.ativo === false) {
    return false;
  }

  if (
    perfil === PERFIL_ADMINISTRADOR_MASTER ||
    perfil === PERFIL_ADMINISTRADOR_MASTER_LEGADO
  ) {
    return possuiPerfilAdministradorMaster(vinculo);
  }

  return (
    vinculo.perfilPrincipal === perfil ||
    vinculo.perfis?.[perfil] === true
  );
}

/**
 * Retorna as permissões liberadas em um vínculo específico.
 */
export function listarPermissoesDoVinculo(
  usuario: Usuario | null,
  vinculoId: string
): string[] {
  const vinculo = obterVinculo(usuario, vinculoId);

  if (!vinculo || vinculo.ativo === false) {
    return [];
  }

  if (possuiPerfilAdministradorMaster(vinculo)) {
    return ["*"];
  }

  return Object.entries(vinculo.permissoes ?? {})
    .filter(([, liberada]) => liberada === true)
    .map(([permissao]) => permissao)
    .sort();
}

/**
 * Verifica se o usuário possui uma permissão em pelo menos um vínculo ativo.
 *
 * Esta função continua existindo para consultas globais e telas
 * administrativas. As telas do local selecionado deverão usar
 * podeAcessarNoVinculo.
 */
export function podeAcessar(
  usuario: Usuario | null,
  permissao: string
): boolean {
  const vinculosAtivos = obterVinculosAtivos(usuario);

  return vinculosAtivos.some(([, vinculo]) => {
    if (possuiPerfilAdministradorMaster(vinculo)) {
      return true;
    }

    return vinculo.permissoes?.[permissao] === true;
  });
}

/**
 * Verifica se o usuário possui um perfil em pelo menos um vínculo ativo.
 *
 * Esta função continua disponível para consultas globais. As telas
 * do local selecionado deverão usar possuiPerfilNoVinculo.
 */
export function possuiPerfil(
  usuario: Usuario | null,
  perfil: string
): boolean {
  const vinculosAtivos = obterVinculosAtivos(usuario);

  return vinculosAtivos.some(([vinculoId]) =>
    possuiPerfilNoVinculo(usuario, vinculoId, perfil)
  );
}

/**
 * Retorna todas as permissões liberadas ao usuário,
 * considerando todos os vínculos ativos.
 *
 * Esta função representa uma visão global do usuário.
 */
export function listarPermissoes(
  usuario: Usuario | null
): string[] {
  const permissoesLiberadas = new Set<string>();
  const vinculosAtivos = obterVinculosAtivos(usuario);

  for (const [, vinculo] of vinculosAtivos) {
    if (possuiPerfilAdministradorMaster(vinculo)) {
      permissoesLiberadas.add("*");
    }

    for (const [permissao, liberada] of Object.entries(
      vinculo.permissoes ?? {}
    )) {
      if (liberada) {
        permissoesLiberadas.add(permissao);
      }
    }
  }

  return Array.from(permissoesLiberadas).sort();
}

/**
 * Retorna os IDs dos vínculos em que o usuário possui determinada permissão.
 */
export function listarVinculosComPermissao(
  usuario: Usuario | null,
  permissao: string
): string[] {
  return obterVinculosAtivos(usuario)
    .filter(([vinculoId]) =>
      podeAcessarNoVinculo(
        usuario,
        vinculoId,
        permissao
      )
    )
    .map(([vinculoId]) => vinculoId);
}
