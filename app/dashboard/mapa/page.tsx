"use client";

export default function MapaPlataforma() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-10">
          <p className="text-green-400 font-semibold">
            QR ACESSO • ARQUITETURA DA PLATAFORMA
          </p>

          <h1 className="text-5xl font-bold mt-2">
            Mapa da Plataforma
          </h1>

          <p className="text-slate-400 mt-3">
            Estrutura oficial do ecossistema QR Acesso.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h2 className="text-2xl font-bold mb-4">
              🏢 QR Access
            </h2>

            <ul className="space-y-2 text-slate-300">
              <li>• Condomínios</li>
              <li>• Casas</li>
              <li>• Empresas</li>
              <li>• Airbnb</li>
              <li>• Moradores</li>
              <li>• Visitantes</li>
              <li>• Portões</li>
              <li>• Câmeras</li>
            </ul>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h2 className="text-2xl font-bold mb-4">
              👨‍💼 QR Síndico
            </h2>

            <ul className="space-y-2 text-slate-300">
              <li>• Comunicados</li>
              <li>• Assembleias</li>
              <li>• Documentos</li>
              <li>• Avisos</li>
              <li>• Contato com moradores</li>
            </ul>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h2 className="text-2xl font-bold mb-4">
              📦 QR Entregas
            </h2>

            <ul className="space-y-2 text-slate-300">
              <li>• Entregas</li>
              <li>• Locker</li>
              <li>• Histórico</li>
              <li>• Fotos</li>
              <li>• Comprovantes</li>
            </ul>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h2 className="text-2xl font-bold mb-4">
              🛡 QR Security
            </h2>

            <ul className="space-y-2 text-slate-300">
              <li>• Alarmes</li>
              <li>• Sensores</li>
              <li>• Cercas</li>
              <li>• Monitoramento</li>
              <li>• IA</li>
            </ul>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h2 className="text-2xl font-bold mb-4">
              ❤️ QR Care
            </h2>

            <ul className="space-y-2 text-slate-300">
              <li>• SOS</li>
              <li>• Rotina</li>
              <li>• Família</li>
              <li>• Idosos</li>
              <li>• Alertas</li>
            </ul>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h2 className="text-2xl font-bold mb-4">
              🛠 QR Services
            </h2>

            <ul className="space-y-2 text-slate-300">
              <li>• Prestadores</li>
              <li>• Marketplace</li>
              <li>• Agendamentos</li>
              <li>• Serviços</li>
            </ul>
          </div>

        </div>

        <div className="mt-10 bg-blue-600 rounded-2xl p-6">
          <h2 className="text-2xl font-bold">
            Filosofia da Plataforma
          </h2>

          <p className="mt-4 text-lg">
            Um único sistema.
          </p>

          <p className="text-lg">
            Um único código.
          </p>

          <p className="text-lg">
            Cada cliente ativa apenas os módulos que precisa.
          </p>
        </div>

      </div>
    </main>
  );
}