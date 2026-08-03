"use client";

import { useEffect, useState } from "react";
import { getToken } from "firebase/messaging";
import { ref, update } from "firebase/database";
import { db, messagingPromise } from "../../../services/firebase";

type PushButtonProps = {
  caminhoFirebase?: string;
  campoToken?: string;
  rotulo?: string;
  mensagemSucesso?: string;
  aoGerarToken?: (token: string) => void | Promise<void>;
};

type StatusPush =
  | "verificando"
  | "disponivel"
  | "ativando"
  | "ativado"
  | "bloqueado"
  | "nao-suportado";

const VAPID_KEY =
  "BF_-nw1UqwzDZox0uTNzgsDircH9cS3jLU74S-37w6edZAfSA4TaR-PXHuv1HMwdsvSBilJlRZTUIiUWxxZS_w4";

export default function PushButton({
  caminhoFirebase = "configuracoes",
  campoToken = "tokenMorador",
  rotulo = "🔔 Ativar notificações",
  mensagemSucesso = "Notificações ativadas com sucesso!",
  aoGerarToken,
}: PushButtonProps) {
  const [status, setStatus] =
    useState<StatusPush>("verificando");

  useEffect(() => {
    verificarStatus();
  }, []);

  async function verificarStatus() {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    ) {
      setStatus("nao-suportado");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("bloqueado");
      return;
    }

    if (Notification.permission === "granted") {
      setStatus("ativado");
      return;
    }

    setStatus("disponivel");
  }

  async function ativarNotificacoes() {
    if (
      status === "ativando" ||
      status === "ativado" ||
      status === "nao-suportado"
    ) {
      return;
    }

    setStatus("ativando");

    try {
      const messaging = await messagingPromise;

      if (!messaging) {
        setStatus("nao-suportado");
        alert("Este navegador não suporta notificações.");
        return;
      }

      const permissao =
        await Notification.requestPermission();

      if (permissao === "denied") {
        setStatus("bloqueado");
        alert(
          "As notificações foram bloqueadas neste navegador."
        );
        return;
      }

      if (permissao !== "granted") {
        setStatus("disponivel");
        return;
      }

      const registroServiceWorker =
        await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js"
        );

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registroServiceWorker,
      });

      if (!token) {
        setStatus("disponivel");
        alert(
          "Não foi possível gerar o token de notificações."
        );
        return;
      }

      await update(ref(db, caminhoFirebase), {
        [campoToken]: token,
      });

      if (aoGerarToken) {
        await aoGerarToken(token);
      }

      setStatus("ativado");
      alert(mensagemSucesso);
    } catch (erro) {
      console.error(
        "Erro completo ao ativar notificações:",
        erro
      );

      setStatus("disponivel");

      alert(
        erro instanceof Error
          ? `Erro ao ativar notificações: ${erro.message}`
          : "Erro ao ativar notificações. Veja o console."
      );
    }
  }

  if (status === "verificando") {
    return (
      <div className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm font-black text-slate-400">
        Verificando notificações...
      </div>
    );
  }

  if (status === "ativado") {
    return (
      <div className="w-full rounded-xl border border-emerald-700 bg-emerald-950/40 px-4 py-3">
        <p className="text-sm font-black text-emerald-300">
          🔔 Notificações ativadas
        </p>

        <p className="mt-1 text-xs text-emerald-200">
          Este dispositivo receberá novos agendamentos e avisos
          importantes do salão.
        </p>
      </div>
    );
  }

  if (status === "bloqueado") {
    return (
      <div className="w-full rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm font-black text-red-300">
        🔒 Notificações bloqueadas no navegador
      </div>
    );
  }

  if (status === "nao-suportado") {
    return (
      <div className="w-full rounded-xl border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm font-black text-amber-300">
        ⚠️ Navegador sem suporte a notificações
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={ativarNotificacoes}
      disabled={status === "ativando"}
      className="w-full rounded-xl border border-slate-600 bg-slate-900/60 px-4 py-3 text-left text-sm font-black text-white transition-all hover:border-pink-400 hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {status === "ativando"
        ? "Ativando notificações..."
        : rotulo}
    </button>
  );
}

