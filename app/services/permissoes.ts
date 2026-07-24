import type { Usuario } from "@/app/types/Usuario";

export type PermissoesDoVinculo = Record<string, boolean>;

export type VinculoComPermissoes = {
  ativo?: boolean;
  condominioId?: string;
  condominioNome?: string;
  perfilPrincipal?: string;
  perfis?: Record<string, boolean>;
  permissoes?: PermissoesDoVinculo;
  unidades?: Record<string, boolean>;
};

type UsuarioComVinculos = Usuario & {
  condominios?: Record<string, VinculoComPermissoes>;
};

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
  if (!usuario) {
    return null;
  }

  const usuarioComVinculos = usuario as UsuarioComVinculos;

  return usuarioComVinculos.condominios?.[vinculoId] ?? null;
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

  if (
    vinculo.perfilPrincipal === "administrador-master" ||
    vinculo.perfis?.["administrador-master"] === true
  ) {
    return true;
  }

  return vinculo.permissoes?.[permissao] === true;
}

/**
 * Verifica se o usuário possui uma permissão em pelo menos um vínculo ativo.
 */
export function podeAcessar(
  usuario: Usuario | null,
  permissao: string
): boolean {
  const vinculosAtivos = obterVinculosAtivos(usuario);

  return vinculosAtivos.some(([, vinculo]) => {
    if (
      vinculo.perfilPrincipal === "administrador-master" ||
      vinculo.perfis?.["administrador-master"] === true
    ) {
      return true;
    }

    return vinculo.permissoes?.[permissao] === true;
  });
}

/**
 * Verifica se o usuário possui um perfil em pelo menos um vínculo ativo.
 */
export function possuiPerfil(
  usuario: Usuario | null,
  perfil: string
): boolean {
  const vinculosAtivos = obterVinculosAtivos(usuario);

  return vinculosAtivos.some(([, vinculo]) => {
    return (
      vinculo.perfilPrincipal === perfil ||
      vinculo.perfis?.[perfil] === true
    );
  });
}

/**
 * Retorna todas as permissões liberadas ao usuário,
 * considerando todos os vínculos ativos.
 */
export function listarPermissoes(
  usuario: Usuario | null
): string[] {
  const permissoesLiberadas = new Set<string>();
  const vinculosAtivos = obterVinculosAtivos(usuario);

  for (const [, vinculo] of vinculosAtivos) {
    if (
      vinculo.perfilPrincipal === "administrador-master" ||
      vinculo.perfis?.["administrador-master"] === true
    ) {
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
    .filter(([, vinculo]) => {
      if (
        vinculo.perfilPrincipal === "administrador-master" ||
        vinculo.perfis?.["administrador-master"] === true
      ) {
        return true;
      }

      return vinculo.permissoes?.[permissao] === true;
    })
    .map(([vinculoId]) => vinculoId);
}