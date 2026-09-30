"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  get,
  onValue,
  ref,
  remove,
  set,
} from "firebase/database";

import {
  db,
} from "@/app/services/firebase";

import {
  criarQrCallLiveSessaoId,
} from "@/app/services/qrcall-live/QrCallLiveSignal";

export default function QrCallLigacaoPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const unidadeId = String(
    params?.unidadeId || ""
  ).trim();

  const criadoEm =
    searchParams.get("criadoEm") || "";

  const tipo =
    searchParams.get("tipo") === "video"
      ? "video"
      : "audio";

  const video = tipo === "video";

  const [estado, setEstado] =
    useState("preparando");

  const [erro, setErro] =
    useState("");

  const [conviteCriado, setConviteCriado] =
    useState(false);

  useEffect(() => {
    if (!unidadeId || !criadoEm) {
      setErro(
        "Identidade da chamada incompleta."
      );
      setEstado("erro");
      return;
    }

    let ativo = true;
    let pararEstado: (() => void) | null =
      null;

    const sessaoId =
      criarQrCallLiveSessaoId(
        criadoEm
      );

    const caminho =
      `qrcall-live/${unidadeId}/${sessaoId}`;

    const sessaoRef =
      ref(
        db,
        caminho
      );

    async function criarConvite() {
      try {
        setErro("");
        setEstado("validando");

        const chamadaSnapshot =
          await get(
            ref(
              db,
              `unidades-v2/${unidadeId}/chamada`
            )
          );

        if (!ativo) return;

        if (!chamadaSnapshot.exists()) {
          throw new Error(
            "Chamada atual nao encontrada."
          );
        }

        const chamada =
          chamadaSnapshot.val();

        if (
          String(
            chamada?.criadoEm || ""
          ) !== criadoEm
        ) {
          throw new Error(
            "A chamada mudou. Volte ao painel e tente novamente."
          );
        }

        if (
          String(
            chamada?.status || ""
          ) !== "Em atendimento"
        ) {
          throw new Error(
            "A chamada nao esta em atendimento."
          );
        }

        const agora =
          Date.now();

        await set(
          sessaoRef,
          {
            unidadeId,
            criadoEm,
            sessaoId,
            tipo,
            estado: "solicitando",
            iniciadaPor: "morador",
            criadaEmMs: agora,
            atualizadaEmMs: agora,
          }
        );

        if (!ativo) return;

        setConviteCriado(true);
        setEstado("solicitando");

        pararEstado =
          onValue(
            ref(
              db,
              `${caminho}/estado`
            ),
            (snapshot) => {
              if (!ativo) return;

              const valor =
                String(
                  snapshot.val() || ""
                );

              if (valor) {
                setEstado(valor);
              }
            }
          );

      } catch (e) {
        if (!ativo) return;

        console.error(
          "QRCALL_LIVE_CONVITE_MORADOR:",
          e
        );

        setErro(
          e instanceof Error
            ? e.message
            : "Erro ao solicitar ligacao."
        );

        setEstado("erro");
      }
    }

    void criarConvite();

    return () => {
      ativo = false;

      if (pararEstado) {
        pararEstado();
      }
    };
  }, [
    unidadeId,
    criadoEm,
    tipo,
  ]);

  async function cancelarLigacao() {
    try {
      if (
        unidadeId &&
        criadoEm &&
        conviteCriado
      ) {
        const sessaoId =
          criarQrCallLiveSessaoId(
            criadoEm
          );

        await remove(
          ref(
            db,
            `qrcall-live/${unidadeId}/${sessaoId}`
          )
        );
      }
    } catch (e) {
      console.warn(
        "QRCALL_CANCELAR_CONVITE:",
        e
      );
    } finally {
      router.back();
    }
  }

  const textoEstado =
    estado === "solicitando"
      ? "Chamando visitante..."
      : estado === "aceita"
      ? "Visitante aceitou."
      : estado === "recusada"
      ? "Visitante preferiu continuar sem ligacao."
      : estado === "erro"
      ? "Nao foi possivel solicitar a ligacao."
      : "Preparando ligacao...";

  return (
    <main className="min-h-screen bg-[#020617] text-white flex justify-center">
      <section className="w-full max-w-md min-h-screen px-4 py-5 flex flex-col">

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              void cancelarLigacao();
            }}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-2 font-bold"
          >
            VOLTAR
          </button>

          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-slate-400">
              QrCall
            </div>

            <div className="font-black">
              {video
                ? "Ligacao de video"
                : "Ligacao de audio"}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">

            <div className="text-center">

              <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                {video
                  ? "VIDEO"
                  : "AUDIO"}
              </div>

              <h1 className="mt-4 text-2xl font-black">
                {video
                  ? "Ligacao de video"
                  : "Ligacao de audio"}
              </h1>

              <p className="mt-3 text-lg font-bold text-emerald-400">
                {textoEstado}
              </p>

              {erro && (
                <p className="mt-3 text-sm text-red-400">
                  {erro}
                </p>
              )}
            </div>

            <div className="mt-6 rounded-3xl bg-slate-950 border border-slate-800 px-5 py-8 text-center">

              <div className="text-slate-300">
                {video
                  ? "Camera e microfone ainda nao foram ativados."
                  : "O microfone ainda nao foi ativado."}
              </div>

              <div className="mt-3 text-xs text-slate-500">
                A midia somente sera iniciada depois que o visitante aceitar.
              </div>

            </div>

            <button
              type="button"
              onClick={() => {
                void cancelarLigacao();
              }}
              className="w-full mt-5 bg-red-600 hover:bg-red-500 rounded-2xl py-4 font-black text-lg"
            >
              CANCELAR LIGACAO
            </button>

            <p className="mt-4 text-center text-xs text-slate-600">
              O atendimento continua ativo
            </p>

          </div>
        </div>

      </section>
    </main>
  );
}