"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  onValue,
  ref,
} from "firebase/database";

import {
  db,
} from "@/app/services/firebase";

import {
  useAuth,
} from "@/app/context/AuthContext";

type ChamadaRecebida = {
  nome: string;
  motivo: string;
  criadoEm: string;
};

export default function ReceptorChamadasMorador() {
  const router =
    useRouter();

  const {
    usuario,
    carregando,
    vinculoSelecionado,
  } =
    useAuth();

  const [
    chamada,
    setChamada,
  ] =
    useState<
      ChamadaRecebida | null
    >(
      null
    );

  const intervaloSomRef =
    useRef<
      ReturnType<
        typeof setInterval
      > | null
    >(
      null
    );

  const audioContextRef =
    useRef<
      AudioContext | null
    >(
      null
    );

  const unidadeId =
    Object.entries(
      vinculoSelecionado
        ?.unidades ??
      {}
    ).find(
      (
        [
          ,
          ativo,
        ]
      ) =>
        ativo === true
    )?.[0] ||
    "";

  function pararToque() {
    if (
      intervaloSomRef.current
    ) {
      clearInterval(
        intervaloSomRef.current
      );

      intervaloSomRef.current =
        null;
    }
  }

  function tocarBip() {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?:
              typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      if (
        !audioContextRef.current
      ) {
        audioContextRef.current =
          new AudioContextClass();
      }

      const contexto =
        audioContextRef.current;

      if (
        contexto.state ===
        "suspended"
      ) {
        void contexto.resume();
      }

      const oscilador =
        contexto.createOscillator();

      const ganho =
        contexto.createGain();

      oscilador.connect(
        ganho
      );

      ganho.connect(
        contexto.destination
      );

      oscilador.frequency.value =
        880;

      ganho.gain.value =
        0.18;

      oscilador.start();

      ganho.gain.exponentialRampToValueAtTime(
        0.001,
        contexto.currentTime +
          0.35
      );

      oscilador.stop(
        contexto.currentTime +
          0.36
      );
    } catch (
      erro
    ) {
      console.error(
        "Erro ao tocar chamada no dashboard:",
        erro
      );
    }
  }

  function iniciarToque() {
    if (
      intervaloSomRef.current
    ) {
      return;
    }

    tocarBip();

    intervaloSomRef.current =
      setInterval(
        () => {
          tocarBip();
        },
        1200
      );
  }

  useEffect(
    () => {
      if (
        carregando ||
        !usuario?.uid ||
        !unidadeId
      ) {
        pararToque();

        setChamada(
          null
        );

        return;
      }

      const referenciaChamada =
        ref(
          db,
          `unidades-v2/${unidadeId}/chamada`
        );

      const desligar =
        onValue(
          referenciaChamada,
          (
            snapshot
          ) => {
            const dados =
              snapshot.val();

            if (!dados) {
              pararToque();

              setChamada(
                null
              );

              return;
            }

            const responsavelAtualUid =
              String(
                dados
                  .responsavelAtualUid ||
                dados
                  .responsavelAtualId ||
                ""
              );

            const destinadaAoUsuario =
              Boolean(
                responsavelAtualUid
              ) &&
              responsavelAtualUid ===
                usuario.uid;

            const aguardando =
              dados.status ===
                "Aguardando atendimento" &&
              dados.notificar ===
                true;

            if (
              !destinadaAoUsuario ||
              !aguardando
            ) {
              pararToque();

              setChamada(
                null
              );

              return;
            }

            setChamada({
              nome:
                String(
                  dados.nome ||
                  "Visitante"
                ),

              motivo:
                String(
                  dados.motivo ||
                  "Chamada de visitante"
                ),

              criadoEm:
                String(
                  dados.criadoEm ||
                  ""
                ),
            });

            iniciarToque();
          }
        );

      return () => {
        desligar();

        pararToque();
      };
    },
    [
      carregando,
      usuario?.uid,
      unidadeId,
    ]
  );

  function abrirAtendimento() {
    if (!unidadeId) {
      return;
    }

    pararToque();

    router.push(
      `/morador-v2/${encodeURIComponent(
        unidadeId
      )}`
    );
  }

  if (!chamada) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-3xl border-4 border-green-500 bg-slate-950 p-6 text-center shadow-2xl">
        <div className="text-6xl">
          🚨
        </div>

        <h2 className="mt-4 text-3xl font-black text-green-400">
          CHAMADA RECEBIDA
        </h2>

        <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <p className="text-2xl font-black text-white">
            {chamada.nome}
          </p>

          <p className="mt-2 text-base text-slate-300">
            {chamada.motivo}
          </p>
        </div>

        <button
          type="button"
          onClick={
            abrirAtendimento
          }
          className="mt-6 w-full rounded-2xl bg-green-600 px-5 py-5 text-xl font-black text-white transition hover:bg-green-500 active:scale-[0.98]"
        >
          ABRIR ATENDIMENTO
        </button>

        <p className="mt-4 text-sm font-semibold text-slate-400">
          Esta chamada está destinada a você.
        </p>
      </div>
    </div>
  );
}
