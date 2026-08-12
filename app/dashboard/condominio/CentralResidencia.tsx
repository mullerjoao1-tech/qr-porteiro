"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import FamiliaResidencia from "@/app/dashboard/condominio/FamiliaResidencia";
import AcessosTemporariosResidencia from "@/app/dashboard/condominio/AcessosTemporariosResidencia";
import { useAuth } from "@/app/context/AuthContext";

export default function CentralResidencia() {
  const router = useRouter();

  const {
    usuario,
    vinculoSelecionado,
    vinculoSelecionadoId,
    logout,
  } = useAuth();

  const [abrindoPortao, setAbrindoPortao] =
    useState(false);

  const [statusPortao, setStatusPortao] =
    useState("");

  const [capturandoCamera, setCapturandoCamera] =
    useState(false);

  const [fotoCamera, setFotoCamera] =
    useState("");

  const [cameraAberta, setCameraAberta] =
    useState(false);

  const [telaAtiva, setTelaAtiva] =
    useState<"inicio" | "familia" | "temporarios">("inicio");

  const nomeLocal = useMemo(() => {
    return (
      vinculoSelecionado?.localNome ||
      vinculoSelecionado?.condominioNome ||
      vinculoSelecionado?.localSlug ||
      vinculoSelecionado?.condominioSlug ||
      vinculoSelecionado?.localId ||
      vinculoSelecionado?.condominioId ||
      vinculoSelecionadoId ||
      "Residencia"
    );
  }, [
    vinculoSelecionado,
    vinculoSelecionadoId,
  ]);

  const perfilResumo = useMemo(() => {
    const perfilPrincipal = (
      vinculoSelecionado?.perfilPrincipal ||
      ""
    )
      .trim()
      .toLowerCase()
      .replaceAll("-", "_");

    const perfisAtivos = Object.entries(
      vinculoSelecionado?.perfis ?? {}
    )
      .filter(([, ativo]) => ativo === true)
      .map(([perfil]) =>
        perfil
          .trim()
          .toLowerCase()
          .replaceAll("-", "_")
      );

    const temAdministradorMaster =
      perfilPrincipal === "administrador_master" ||
      perfisAtivos.includes("administrador_master");

    const temProprietario =
      perfilPrincipal === "proprietario" ||
      perfisAtivos.includes("proprietario");

    const temResponsavel =
      perfilPrincipal === "responsavel" ||
      perfisAtivos.includes("responsavel");

    if (
      temAdministradorMaster &&
      temProprietario
    ) {
      return (
        <>
          Administrador master &bull; Propriet&aacute;rio
        </>
      );
    }

    if (temAdministradorMaster) {
      return "Administrador master";
    }

    if (temProprietario) {
      return (
        <>
          Propriet&aacute;rio
        </>
      );
    }

    if (temResponsavel) {
      return (
        <>
          Respons&aacute;vel pela resid&ecirc;ncia
        </>
      );
    }

    return (
      <>
        Respons&aacute;vel pela resid&ecirc;ncia
      </>
    );
  }, [vinculoSelecionado]);

  const unidadeId = useMemo(() => {
    const unidades =
      vinculoSelecionado?.unidades ?? {};

    return (
      Object.entries(unidades).find(
        ([, ativo]) => ativo === true
      )?.[0] ?? null
    );
  }, [vinculoSelecionado]);

  async function sair() {
    await logout();
    window.location.href = "/";
  }

  async function abrirPortao() {
    if (abrindoPortao) {
      return;
    }

    try {
      setAbrindoPortao(true);
      setStatusPortao(
        "\u23F3 Abrindo port\u00E3o..."
      );

      const resposta =
        await fetch("/api/abrir-portao");

      const dados =
        await resposta.json();

      if (dados.success) {
        setStatusPortao(
          "\u2705 Port\u00E3o aberto com sucesso"
        );
      } else {
        setStatusPortao(
          "\u274C Falha ao abrir port\u00E3o"
        );
      }
    } catch (erro) {
      console.error(
        "Erro ao abrir portao:",
        erro
      );

      setStatusPortao(
        "\u274C Erro ao abrir port\u00E3o"
      );
    } finally {
      setTimeout(() => {
        setAbrindoPortao(false);
        setStatusPortao("");
      }, 7000);
    }
  }

  async function abrirCamera() {
    if (capturandoCamera) {
      return;
    }

    try {
      setCapturandoCamera(true);
      setCameraAberta(true);

      const resposta =
        await fetch(
          `/api/capturar-camera?cache=${Date.now()}`
        );

      const dados =
        await resposta.json();

      if (
        dados.sucesso &&
        dados.imagem
      ) {
        setFotoCamera(
          `${dados.imagem}?t=${Date.now()}`
        );
      } else {
        setFotoCamera("");
      }
    } catch (erro) {
      console.error(
        "Erro ao carregar camera:",
        erro
      );

      setFotoCamera("");
    } finally {
      setCapturandoCamera(false);
    }
  }

  function abrirVisitantes() {
  const slugResidencia =
    vinculoSelecionado?.localSlug ||
    vinculoSelecionado?.condominioSlug ||
    vinculoSelecionadoId ||
    "";

  if (!slugResidencia) {
    alert(
      "Nao foi possivel identificar esta residencia."
    );

    return;
  }

  const unidadeResidencia =
    slugResidencia === "muller"
      ? "muller-principal"
      : `${slugResidencia}-principal`;

  router.push(
    `/morador-v2/${encodeURIComponent(
      unidadeResidencia
    )}`
  );
}

  return (
    <div className="grid min-h-screen gap-5 bg-slate-950 p-4 lg:grid-cols-[220px_minmax(0,1fr)]">

      <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-wider text-cyan-400">
            QR Residencia
          </p>

          <h2 className="mt-1 text-lg font-black text-white">
            {nomeLocal}
          </h2>
        </div>

        <nav className="space-y-2">
      <button
        type="button"
        onClick={() => setTelaAtiva("inicio")}
        className={[
          "w-full rounded-2xl px-4 py-3 text-left text-sm font-black transition",
          telaAtiva === "inicio"
            ? "bg-cyan-500 text-slate-950"
            : "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700",
        ].join(" ")}
      >
        InÃƒÂ­cio
      </button>

      <button
        type="button"
        onClick={() => setTelaAtiva("familia")}
        className={[
          "w-full rounded-2xl px-4 py-3 text-left text-sm font-bold transition",
          telaAtiva === "familia"
            ? "bg-cyan-500 text-slate-950"
            : "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700",
        ].join(" ")}
      >
        FamÃƒÂ­lia / Moradores
      </button>

      <button
        type="button"
        onClick={() => setTelaAtiva("temporarios")}
        className={[
          "w-full rounded-2xl px-4 py-3 text-left text-sm font-bold transition",
          telaAtiva === "temporarios"
            ? "bg-amber-400 text-slate-950"
            : "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700",
        ].join(" ")}
      >
        Acessos tempor&aacute;rios
      </button>

          <button
            type="button"
            onClick={() =>
              alert(
                "Planos sera conectado ao modulo comercial."
              )
            }
            className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-slate-700"
          >
            Planos
          </button>

          <button
            type="button"
            onClick={() =>
              alert(
                "Configuracoes da residencia sera conectado nesta etapa."
              )
            }
            className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-slate-700"
          >
            Configuracoes
          </button>
        </nav>
      </aside>

      <div className="min-w-0 space-y-5">

        {telaAtiva === "familia" ? (
          <FamiliaResidencia
            localId={vinculoSelecionadoId || ""}
            localNome={nomeLocal}
            onVoltar={() => setTelaAtiva("inicio")}
          />
        ) : telaAtiva === "temporarios" ? (
          <AcessosTemporariosResidencia
            localId={vinculoSelecionadoId || ""}
            localNome={nomeLocal}
            onVoltar={() => setTelaAtiva("inicio")}
          />
        ) : (
          <>

        <section className="rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-600 p-5 text-white md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-sm font-bold text-blue-100">
                {nomeLocal} &bull; Residencia
              </p>

              <h1 className="mt-1 text-3xl font-black md:text-4xl">
                Bom dia, {usuario?.nome?.split(" ")[0] || "Usuario"}
              </h1>

              <p className="mt-2 text-sm text-blue-100">
                O que importa, na palma da sua mao.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
                  <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-100">
                  Perfil
                </p>

                <p className="mt-1 text-sm font-black text-white">
                  {perfilResumo}
                </p>
              </div>


              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard/morador?modo=pessoal")
                }
                className="rounded-2xl border border-white/40 bg-white/15 px-4 py-3 text-sm font-black text-white transition hover:bg-white/25"
              >
                Meu painel
              </button>

              <button
                type="button"
                onClick={sair}
                className="rounded-2xl border border-red-300/50 bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-500"
              >
                Sair
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
              Acesso rapido
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              Principais comandos
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

            <button
              type="button"
              onClick={abrirPortao}
              disabled={abrindoPortao}
              className="rounded-3xl border border-violet-500/40 bg-slate-900 p-6 text-left transition hover:bg-slate-800 disabled:opacity-60"
            >
              <p className="text-xs font-black uppercase tracking-wider text-violet-300">
                Portao
              </p>

              <h3 className="mt-3 text-2xl font-black text-white">
                {abrindoPortao
                  ? "Abrindo..."
                  : "Abrir portao"}
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Acionamento rapido da entrada.
              </p>
            </button>

            <button
              type="button"
              onClick={abrirCamera}
              disabled={capturandoCamera}
              className="rounded-3xl border border-cyan-500/40 bg-slate-900 p-6 text-left transition hover:bg-slate-800 disabled:opacity-60"
            >
              <p className="text-xs font-black uppercase tracking-wider text-cyan-300">
                Cameras
              </p>

              <h3 className="mt-3 text-2xl font-black text-white">
                {capturandoCamera
                  ? "Carregando..."
                  : "Ver cameras"}
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Visualize a entrada da residencia.
              </p>
            </button>

            <div className="rounded-3xl border border-emerald-500/30 bg-slate-900 p-6">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-300">
                Alarme
              </p>

              <h3 className="mt-3 text-2xl font-black text-white">
                Nao configurado
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Aparecera aqui quando houver integracao ativa.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirVisitantes}
              className="rounded-3xl border border-orange-500/40 bg-slate-900 p-6 text-left transition hover:bg-slate-800"
            >
              <p className="text-xs font-black uppercase tracking-wider text-orange-300">
                Visitantes
              </p>

              <h3 className="mt-3 text-2xl font-black text-white">
                Chamadas
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Visitantes, prestadores e entregadores.
              </p>
            </button>
          </div>

          {statusPortao && (
            <p className="mt-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-black text-white">
              {statusPortao}
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-emerald-500/30 bg-slate-900 p-5 md:p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
            Atencao agora
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Tudo funcionando normalmente
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            Cameras, portao e dispositivos monitorados sem falhas detectadas.
          </p>
        </section>

        {cameraAberta && (
          <div
            className="fixed inset-0 z-[210] flex items-center justify-center bg-black/80 p-4"
            onMouseDown={() =>
              setCameraAberta(false)
            }
          >
            <div
              className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-5"
              onMouseDown={(evento) =>
                evento.stopPropagation()
              }
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-black text-white">
                  Camera da entrada
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setCameraAberta(false)
                  }
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-4">
                {capturandoCamera ? (
                  <div className="rounded-2xl bg-slate-800 p-8 text-center font-bold text-slate-300">
                    Carregando imagem...
                  </div>
                ) : fotoCamera ? (
                  <img
                    src={fotoCamera}
                    alt="Camera da entrada"
                    className="w-full rounded-2xl border border-slate-700"
                  />
                ) : (
                  <div className="rounded-2xl bg-slate-800 p-8 text-center font-bold text-slate-300">
                    Nenhuma imagem disponivel.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={abrirCamera}
                disabled={capturandoCamera}
                className="mt-4 w-full rounded-2xl bg-cyan-500 px-4 py-3 font-black text-slate-950 disabled:opacity-60"
              >
                Atualizar camera
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
