"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function formatarData(dataISO: string) {
  if (!dataISO) {
    return "";
  }

  const [ano, mes, dia] = dataISO.split("-");

  if (!ano || !mes || !dia) {
    return dataISO;
  }

  return `${dia}/${mes}/${ano}`;
}

function ConteudoConfirmado() {
  const router = useRouter();
  const parametros = useSearchParams();

  const data = parametros.get("data") ?? "";
  const horario = parametros.get("horario") ?? "";
  const cliente = parametros.get("cliente") ?? "";
  const servico = parametros.get("servico") ?? "";
  const profissional = parametros.get("profissional") ?? "";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <section className="rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-4xl">
            ✓
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
            Agendamento realizado
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Horário confirmado
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            {cliente
              ? `${cliente}, seu agendamento foi enviado para o estabelecimento.`
              : "Seu agendamento foi enviado para o estabelecimento."}
          </p>

          <div className="mt-6 space-y-3 text-left">
            <Informacao
              titulo="Serviço"
              valor={servico || "Não informado"}
            />

            <Informacao
              titulo="Profissional"
              valor={profissional || "Não informado"}
            />

            <div className="grid grid-cols-2 gap-3">
              <Informacao
                titulo="Data"
                valor={formatarData(data) || "Não informada"}
              />

              <Informacao
                titulo="Horário"
                valor={horario || "Não informado"}
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-pink-900 bg-pink-950/20 p-4 text-left">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-pink-300">
              Próximos passos
            </p>

            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Você poderá receber um lembrete 24 horas antes e uma confirmação
              2 horas antes do atendimento.
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={() =>
                router.push("/beauty/qr-beauty-demo")
              }
              className="w-full rounded-2xl bg-pink-600 px-5 py-4 font-black text-white transition hover:bg-pink-500 active:scale-[0.98]"
            >
              Voltar ao início
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/beauty/qr-beauty-demo/agendar")
              }
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-5 py-4 font-black text-slate-200 transition hover:bg-slate-700 active:scale-[0.98]"
            >
              Fazer outro agendamento
            </button>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-300">
            QR Acesso Ecossistema
          </p>

          <h2 className="mt-2 text-xl font-black">
            Em breve em “Meus lugares”
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Depois do primeiro uso, o estabelecimento poderá ficar salvo para
            você agendar novamente sem precisar escanear o QR.
          </p>
        </section>

        <p className="pt-5 text-center text-xs text-slate-600">
          Demonstração QR Beauty Studio
        </p>
      </div>
    </main>
  );
}

export default function BeautyConfirmadoPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-center text-slate-400">
            Carregando confirmação...
          </div>
        </main>
      }
    >
      <ConteudoConfirmado />
    </Suspense>
  );
}

function Informacao({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 font-black text-white">
        {valor}
      </p>
    </div>
  );
}
