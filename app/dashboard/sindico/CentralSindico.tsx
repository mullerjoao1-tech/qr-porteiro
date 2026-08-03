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

      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8">

        <h2 className="text-2xl font-black">
          Central de Gestão
        </h2>

        <p className="mt-3 text-slate-400">
          Aqui ficará a Central de Gestão que já criamos para o Tulipas,
          agora integrada ao QR Central.
        </p>

      </div>

    </div>
  );
}
