"use client";

import { useEffect, useRef, useState } from "react";

import { usePerfilAtivo } from "@/app/context/PerfilAtivoContext";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

type BotaoMeusAcessosProps = {
  className?: string;
};

function normalizarPerfil(perfil?: string | null) {
  return (perfil || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_");
}

function nomePerfil(perfil?: string | null) {
  const normalizado = normalizarPerfil(
    perfil
  );

  switch (normalizado) {
    case "administrador_master":
      return "Administrador master";

    case "morador":
      return "Morador";

    case "inquilino":
      return "Inquilino";

    case "proprietario":
      return "Proprietário";

    case "sindico":
      return "Síndico";

    case "financeiro":
      return "Financeiro";

    case "central":
      return "Central";

    case "administradora":
      return "Administradora";

    case "gestor_local":
      return "Gestor local";

    case "responsavel":
      return "Responsável";

    case "gerente":
      return "Gerente";

    default:
      return perfil || "Selecionar perfil";
  }
}

export default function BotaoMeusAcessos({
  className,
}: BotaoMeusAcessosProps) {
  const router = useRouter();

  const [aberto, setAberto] =
    useState(false);

  const referencia =
    useRef<HTMLDivElement | null>(null);

  const {
    perfilAtivo,
    perfisDisponiveis,
    selecionarPerfil,
  } = usePerfilAtivo();

  const {
    vinculoSelecionado,
  } = useAuth();

  useEffect(() => {
    function fecharAoClicarFora(
      evento: MouseEvent
    ) {
      if (
        referencia.current &&
        !referencia.current.contains(
          evento.target as Node
        )
      ) {
        setAberto(false);
      }
    }

    function fecharComEsc(
      evento: KeyboardEvent
    ) {
      if (
        evento.key === "Escape"
      ) {
        setAberto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      fecharAoClicarFora
    );

    window.addEventListener(
      "keydown",
      fecharComEsc
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharAoClicarFora
      );

      window.removeEventListener(
        "keydown",
        fecharComEsc
      );
    };
  }, []);

  if (
    perfisDisponiveis.length <= 1
  ) {
    return null;
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

    setAberto(false);

    switch (
      normalizado
    ) {
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

      case "gestor_local":
      case "proprietario":
      case "responsavel":
      case "gerente": {
        const tipoLocal = (
          vinculoSelecionado?.tipoLocal ||
          ""
        )
          .trim()
          .toLowerCase()
          .replaceAll("-", "_");

        if (
          tipoLocal === "residencia" ||
          tipoLocal === "condominio"
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

  return (
    <div
      ref={referencia}
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setAberto(
            (valorAtual) =>
              !valorAtual
          )
        }
        className={
          className ||
          "flex min-w-[220px] items-center justify-between gap-4 rounded-2xl border border-white/40 bg-white/15 px-4 py-3 text-left text-white shadow-lg transition-all hover:bg-white/25 active:scale-[0.98]"
        }
      >
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">
            Perfil
          </p>

          <p className="mt-1 truncate text-base font-black text-white">
            {nomePerfil(
              perfilAtivo
            )}
          </p>

          <p className="mt-1 text-[10px] font-bold text-blue-100">
            {perfisDisponiveis.length} acessos disponíveis
          </p>
        </div>

        <span
          className={[
            "text-lg font-black transition-transform",
            aberto
              ? "rotate-180"
              : "",
          ].join(" ")}
        >
          &#9660;
        </span>
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-[220] mt-2 w-[260px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-2xl">
          {perfisDisponiveis.map(
            (perfil) => {
              const ativo =
                normalizarPerfil(
                  perfil
                ) ===
                normalizarPerfil(
                  perfilAtivo
                );

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
                    "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-black transition",
                    ativo
                      ? "bg-violet-500 text-white"
                      : "text-slate-200 hover:bg-slate-800",
                  ].join(
                    " "
                  )}
                >
                  <span>
                    {nomePerfil(
                      perfil
                    )}
                  </span>

                  {ativo && (
                    <span>
                      &#10003;
                    </span>
                  )}
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
