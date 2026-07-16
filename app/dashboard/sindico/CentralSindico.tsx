"use client";

export default function CentralSindico() {
  return (
    <div className="space-y-6">

      {/* Cabeçalho */}

      <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-600 p-8 text-white">

        <h1 className="text-4xl font-black">
          👋 Bom dia, João
        </h1>

        <p className="mt-2 text-blue-100">
          Você administra 3 condomínios
        </p>

      </div>

      {/* Atenção Agora */}

      <div className="rounded-2xl border border-red-700 bg-red-950/20 p-5">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-red-300 text-sm font-bold">
              🚨 ATENÇÃO AGORA
            </p>

            <h2 className="text-2xl font-black text-white mt-1">
              4 ações precisam da sua atenção
            </h2>

          </div>

          <button className="rounded-xl bg-red-600 px-4 py-2 font-bold hover:bg-red-500">
            Ver tudo
          </button>

        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">

          <button className="rounded-2xl border border-red-600 bg-red-950/40 p-4 text-left transition hover:bg-red-900">

            <div className="text-3xl">
              📷
            </div>

            <div className="mt-3 font-black">
              Câmera
            </div>

            <div className="text-sm text-red-300">
              Tulipas
            </div>

            <div className="text-xs text-slate-400">
              Offline
            </div>

          </button>

          <button className="rounded-2xl border border-orange-500 bg-orange-950/40 p-4 text-left transition hover:bg-orange-900">

            <div className="text-3xl">
              🚪
            </div>

            <div className="mt-3 font-black">
              Portão
            </div>

            <div className="text-sm text-orange-300">
              Flores
            </div>

            <div className="text-xs text-slate-400">
              Aberto 5 min
            </div>

          </button>

          <button className="rounded-2xl border border-yellow-500 bg-yellow-950/40 p-4 text-left transition hover:bg-yellow-900">

            <div className="text-3xl">
              ☎️
            </div>

            <div className="mt-3 font-black">
              Interfone
            </div>

            <div className="text-sm text-yellow-300">
              Alfa
            </div>

            <div className="text-xs text-slate-400">
              Defeito
            </div>

          </button>

          <button className="rounded-2xl border border-red-600 bg-red-950/40 p-4 text-left transition hover:bg-red-900">

            <div className="text-3xl">
              📄
            </div>

            <div className="mt-3 font-black">
              Contrato
            </div>

            <div className="text-sm text-red-300">
              Tulipas
            </div>

            <div className="text-xs text-slate-400">
              Vence amanhã
            </div>

          </button>

        </div>

      </div>

      {/* Saúde da Carteira */}

      <div className="rounded-2xl border border-green-700 bg-green-950/20 p-5 cursor-pointer hover:bg-green-900/20 transition">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-green-300 text-sm font-bold">
              ❤️ SAÚDE DA CARTEIRA
            </p>

            <h2 className="mt-1 text-2xl font-black">
              3 Condomínios
            </h2>

          </div>

          <div className="text-right">

            <div className="text-4xl font-black text-green-400">
              96%
            </div>

            <div className="text-sm text-slate-400">
              Geral
            </div>

          </div>

        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">

          <div className="rounded-xl bg-slate-900 p-3 text-center">

            <div className="text-2xl">
              🟢
            </div>

            <div className="mt-1 font-black">
              2
            </div>

            <div className="text-xs text-slate-400">
              Saudáveis
            </div>

          </div>

          <div className="rounded-xl bg-slate-900 p-3 text-center">

            <div className="text-2xl">
              🟠
            </div>

            <div className="mt-1 font-black">
              1
            </div>

            <div className="text-xs text-slate-400">
              Atenção
            </div>

          </div>

          <div className="rounded-xl bg-slate-900 p-3 text-center">

            <div className="text-2xl">
              🔴
            </div>

            <div className="mt-1 font-black">
              0
            </div>

            <div className="text-xs text-slate-400">
              Críticos
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}