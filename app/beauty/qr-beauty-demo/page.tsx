"use client";

import { useRouter } from "next/navigation";

export default function BeautyPublicoPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-6">
        <div className="rounded-3xl border border-pink-500/30 bg-gradient-to-br from-pink-700 via-fuchsia-700 to-purple-800 p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black text-pink-50">
              ✨ QR BEAUTY
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
              💅
            </div>
          </div>

          <h1 className="mt-8 text-4xl font-black leading-tight">
            Salão de testes
          </h1>

          <p className="mt-3 text-base font-semibold leading-relaxed text-pink-50">
            Escolha seu serviço, profissional e horário sem precisar esperar
            resposta no WhatsApp.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/beauty/qr-beauty-demo/agendar")
            }
            className="mt-7 w-full rounded-2xl bg-white px-5 py-4 text-lg font-black text-pink-700 shadow-lg transition active:scale-[0.98]"
          >
            📅 Agendar horário
          </button>
        </div>

        <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-300">
            Tudo em um só lugar
          </p>

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-2xl">✂️</p>
              <p className="mt-2 font-black">Serviços e valores</p>
              <p className="mt-1 text-sm text-slate-400">
                Consulte as opções antes de escolher.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-2xl">💇</p>
              <p className="mt-2 font-black">Escolha o profissional</p>
              <p className="mt-1 text-sm text-slate-400">
                Veja quem está disponível para o serviço.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-2xl">⏰</p>
              <p className="mt-2 font-black">Horários disponíveis</p>
              <p className="mt-1 text-sm text-slate-400">
                Agende de onde estiver, em poucos passos.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-pink-900 bg-pink-950/20 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-300">
            QR Acesso Ecossistema
          </p>

          <h2 className="mt-2 text-xl font-black">
            Este pode ser um dos seus lugares
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Depois do primeiro agendamento, você poderá reencontrar este
            estabelecimento em “Meus lugares”.
          </p>
        </section>

        <p className="mt-auto pt-6 text-center text-xs text-slate-600">
          Demonstração QR Beauty Studio
        </p>
      </section>
    </main>
  );
}
