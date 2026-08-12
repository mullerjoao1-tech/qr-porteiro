"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  usePerfilAtivo,
} from "@/app/context/PerfilAtivoContext";

import {
  useAuth,
} from "@/app/context/AuthContext";

import ModalSelecionarUnidade from "@/app/components/dashboard/ModalSelecionarUnidade";

const NOMES_PERFIS:
  Record<string, string> = {
    morador: "Morador",
    sindico: "Síndico",
    administradora: "Administradora",
    gestor_local: "Gestor local",
    porteiro: "Porteiro",
    central: "Central",
    funcionario: "Funcionário",
    financeiro: "Financeiro",
    prestador: "Prestador",
    conselheiro: "Conselheiro",
    administrador_master:
      "Administrador master",
    proprietario: "Proprietário",
    inquilino: "Inquilino",
    responsavel: "Responsável",
    gerente: "Gerente",
    outro: "Outro",
  };

type UnidadeNormalizada = {
  id: string;
  nome: string;
  slug: string;
  condominio?: string;
  bloco?: string;
  apartamento?: string;
};

function normalizarPerfil(
  perfil: string
) {
  return perfil
    .trim()
    .toLowerCase()
    .replaceAll(
      "-",
      "_"
    );
}

function nomePerfil(
  perfil: string
) {
  const normalizado =
    normalizarPerfil(
      perfil
    );

  return (
    NOMES_PERFIS[
      normalizado
    ] ||
    perfil
  );
}

function formatarNomeUnidade(
  unidadeId: string
) {
  return unidadeId
    .replaceAll(
      "-",
      " "
    )
    .replace(
      /\b\w/g,
      (letra) =>
        letra.toUpperCase()
    );
}

function obterUnidades(
  vinculo: any
): UnidadeNormalizada[] {
  if (
    !vinculo?.unidades
  ) {
    return [];
  }

  return Object.entries(
    vinculo.unidades
  )
    .filter(
      ([
        ,
        valor,
      ]) => {
        if (
          valor === true
        ) {
          return true;
        }

        if (
          valor &&
          typeof valor ===
            "object"
        ) {
          return (
            (
              valor as any
            ).ativo !== false
          );
        }

        return false;
      }
    )
    .map(
      ([
        unidadeId,
        valor,
      ]) => {
        const dados =
          valor &&
          typeof valor ===
            "object"
            ? (
                valor as any
              )
            : {};

        const slug =
          dados.slug ||
          dados.unidadeSlug ||
          dados.slugUnidade ||
          unidadeId;

        const nome =
          dados.nome ||
          dados.nomeUnidade ||
          dados.identificacao ||
          dados.label ||
          formatarNomeUnidade(
            unidadeId
          );

        return {
          id: unidadeId,
          nome,
          slug,

          condominio:
            nome.match(
              /^(.+?)\s+Bloco/i
            )?.[1] ||
            "Residencial Tulipas",

          bloco:
            slug.match(
              /bloco-(\d+)/i
            )?.[1] ||
            "",

          apartamento:
            slug.match(
              /ap-(\d+)/i
            )?.[1] ||
            "",
        };
      }
    )
    .sort(
      (a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR"
        )
    );
}

export default function SeletorPerfilAtivo() {
  const router =
    useRouter();

  const {
    perfilAtivo,
    perfisDisponiveis,
    selecionarPerfil,
  } =
    usePerfilAtivo();

  const {
    vinculoSelecionado,
  } =
    useAuth();

  const [
    modalUnidadeAberto,
    setModalUnidadeAberto,
  ] = useState(
    false
  );

  const unidades =
    useMemo(
      () =>
        obterUnidades(
          vinculoSelecionado
        ),
      [
        vinculoSelecionado,
      ]
    );

  if (
    perfisDisponiveis.length <=
    1
  ) {
    return null;
  }

  function entrarComoMorador() {
  const tipoLocal = (
    vinculoSelecionado?.tipoLocal || ""
  )
    .trim()
    .toLowerCase()
    .replaceAll("-", "_");

  if (tipoLocal === "condominio") {
    router.push(
      "/dashboard/morador"
    );
    return;
  }

  if (tipoLocal === "residencia") {
    router.push(
      "/dashboard/condominio"
    );
    return;
  }

  if (
    unidades.length === 0
  ) {
    alert(
      "Este perfil ainda n?o possui nenhuma unidade vinculada neste local."
    );

    return;
  }

  if (
    unidades.length === 1
  ) {
    router.push(
      `/morador-v2/${unidades[0].slug}`
    );

    return;
  }

  setModalUnidadeAberto(
    true
  );
}

function trocarPerfil(
    perfil: string
  ) {
    const normalizado =
      normalizarPerfil(
        perfil
      );

    selecionarPerfil(
      normalizado
    );

    switch (
      normalizado
    ) {
      case "sindico":
        router.push(
          "/dashboard/sindico"
        );
        return;

      case "financeiro":
        router.push(
          "/dashboard/financeiro"
        );
        return;

      case "central":
        router.push(
          "/dashboard/central-inteligente"
        );
        return;

      case "administradora":
        router.push(
          "/dashboard/administradora"
        );
        return;

      case "administrador_master":
        router.push(
          "/dashboard"
        );
        return;

      case "morador":
  case "inquilino":
    router.push(
      "/dashboard/morador"
    );
    return;

      case "gestor_local":
  case "proprietario":
  case "responsavel":
  case "gerente": {
    const tipoLocalAtual = (
      vinculoSelecionado?.tipoLocal || ""
    )
      .trim()
      .toLowerCase()
      .replaceAll("-", "_");

    if (
      tipoLocalAtual === "residencia" ||
      tipoLocalAtual === "condominio"
    ) {
      router.push(
        "/dashboard/condominio"
      );
      return;
    }

    router.push(
      "/dashboard"
    );
    return;
  }

      default:
        return;
    }
  }

  function selecionarUnidade(
    unidade:
      UnidadeNormalizada
  ) {
    setModalUnidadeAberto(
      false
    );

    router.push(
      `/morador-v2/${unidade.slug}`
    );
  }

  return (
    <>
      <section className="rounded-3xl border border-violet-500/30 bg-violet-950/20 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-violet-300">
              Perfil no contexto atual
            </p>

            <h3 className="mt-1 text-xl font-black text-white">
              {perfilAtivo
                ? nomePerfil(
                    perfilAtivo
                  )
                : "Selecionar perfil"}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Troque sua função neste local sem sair da conta.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {perfisDisponiveis.map(
              (perfil) => {
                const ativo =
                  perfil ===
                  perfilAtivo;

                return (
                  <button
                    key={perfil}
                    type="button"
                    onClick={() =>
                      trocarPerfil(
                        perfil
                      )
                    }
                    className={[
                      "rounded-2xl border px-4 py-3 text-sm font-black transition active:scale-[0.98]",
                      ativo
                        ? "border-violet-400 bg-violet-500 text-white"
                        : "border-slate-700 bg-slate-900 text-slate-200 hover:border-violet-500 hover:bg-slate-800",
                    ].join(
                      " "
                    )}
                  >
                    {ativo
                      ? "✓ "
                      : ""}

                    {nomePerfil(
                      perfil
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </section>

      <ModalSelecionarUnidade
        aberto={
          modalUnidadeAberto
        }
        unidades={
          unidades
        }
        onFechar={() =>
          setModalUnidadeAberto(
            false
          )
        }
        onSelecionar={
          selecionarUnidade
        }
      />
    </>
  );
}


