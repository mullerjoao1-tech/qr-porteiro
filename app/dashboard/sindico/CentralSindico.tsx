"use client";

export default function CentralSindico() {
  return (
    <div className="space-y-6">

      <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-600 p-8 text-white">
        <h1 className="text-4xl font-black">
          👋 Bom dia, João
        </h1>

        <p className="mt-2 text-blue-100">
          Painel do Síndico
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">

        <div className="rounded-2xl bg-slate-800 p-6">
          <p className="text-slate-400 text-sm">
            Chamadas hoje
          </p>

          <h2 className="mt-2 text-4xl font-black">
            0
          </h2>
        </div>

        <div className="rounded-2xl bg-slate-800 p-6">
          <p className="text-slate-400 text-sm">
            Entregas
          </p>

          <h2 className="mt-2 text-4xl font-black">
            0
          </h2>
        </div>

        <div className="rounded-2xl bg-slate-800 p-6">
          <p className="text-slate-400 text-sm">
            Prestadores
          </p>

          <h2 className="mt-2 text-4xl font-black">
            0
          </h2>
        </div>

        <div className="rounded-2xl bg-slate-800 p-6">
          <p className="text-slate-400 text-sm">
            Alertas
          </p>

          <h2 className="mt-2 text-4xl font-black text-red-400">
            0
          </h2>
        </div>

      </div>

     <div className="rounded-2xl border border-red-700 bg-red-950/20 p-5">

    <div className="flex items-center justify-between">

        <div>

            <p className="text-red-300 text-sm font-bold">
                🚨 ATENÇÃO AGORA
            </p>

            <h2 className="text-2xl font-black text-white mt-1">
                4 ações pendentes
            </h2>

        </div>

        <button className="rounded-xl bg-red-600 px-4 py-2 font-bold hover:bg-red-500">
            Ver tudo
        </button>

    </div>

    <div className="mt-5 space-y-3">

        <div className="rounded-xl bg-slate-900 p-4">
            🔴 Câmera Portão Principal Offline
        </div>

        <div className="rounded-xl bg-slate-900 p-4">
            🟠 Portão Social aberto há 5 minutos
        </div>

        <div className="rounded-xl bg-slate-900 p-4">
            🟡 Morador informou defeito no interfone
        </div>

    </div>

</div>

    </div>
  );
}