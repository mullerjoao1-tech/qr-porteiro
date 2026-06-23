export default function Dashboard() {
  const modulos = [
    {
      nome: "QR Access",
      descricao: "Portaria, visitantes, entregas, portões e controle de acesso.",
      status: "🟢 Em operação",
      destaque: "QR Portaria ativo • Entregas beta • Locker em breve",
      cor: "text-green-400",
    },
    {
      nome: "QR Security",
      descricao: "Proteção contra invasões, sensores, perímetro e alertas silenciosos.",
      status: "🟡 Em breve",
      destaque: "Segurança inteligente para áreas internas e externas",
      cor: "text-yellow-400",
    },
    {
      nome: "QR Monitoring",
      descricao: "Monitoramento online em tempo real para câmeras, portões e eventos.",
      status: "🟡 Em breve",
      destaque: "Central de acompanhamento do condomínio",
      cor: "text-yellow-400",
    },
    {
      nome: "QR Care Family",
      descricao: "Cuidado remoto para idosos e familiares com alertas de rotina.",
      status: "🟡 Em breve",
      destaque: "Mais segurança para famílias e moradores vulneráveis",
      cor: "text-yellow-400",
    },
    {
      nome: "QR Admin",
      descricao: "Gestão entre síndico, administradora e moradores.",
      status: "🔵 Planejado",
      destaque: "Comunicados, relatórios, documentos e permissões",
      cor: "text-blue-400",
    },
    {
      nome: "QR Services",
      descricao: "Prestadores avaliados estilo Google para o condomínio.",
      status: "🔵 Planejado",
      destaque: "Avaliações, reviews e faixa de preço",
      cor: "text-blue-400",
    },
    {
      nome: "QR AI Concierge",
      descricao: "Assistente inteligente para moradores, síndico e administradora.",
      status: "🟣 Futuro premium",
      destaque: "IA para dúvidas, ações, insights e automações",
      cor: "text-purple-400",
    },
    {
      nome: "QR Airbnb",
      descricao: "Acesso temporário, check-in remoto e apoio para locações.",
      status: "🔵 Planejado",
      destaque: "PIN/QR temporário, limpeza e controle de chaves",
      cor: "text-blue-400",
    },
  ];

  const qrs = [
    { nome: "QR1", status: "🟢 Disponível" },
    { nome: "QR2", status: "🟢 Disponível" },
    { nome: "QR3", status: "🟢 Disponível" },
    { nome: "QR4", status: "🟢 Disponível" },
    { nome: "QR5", status: "🟢 Disponível" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-5xl font-black mb-3 text-blue-400">
            🛡️ QR Acesso Dashboard
          </h1>

          <p className="text-slate-400 text-lg">
            Controle de acesso • Segurança • Gestão • Automação • IA
          </p>
        </div>
<div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 mb-8 shadow-lg">
  <h2 className="text-2xl font-black mb-2">
    🚀 Capacidade da Plataforma
  </h2>

  <p className="text-lg font-semibold">
    Projetado para atender desde residências até condomínios com
    1000+ unidades
  </p>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
    <div className="bg-black/20 rounded-xl p-4 text-center">
      <p className="text-sm text-slate-200">Pequeno Porte</p>
      <p className="text-xl font-bold">1–20</p>
    </div>

    <div className="bg-black/20 rounded-xl p-4 text-center">
      <p className="text-sm text-slate-200">Médio Porte</p>
      <p className="text-xl font-bold">20–100</p>
    </div>

    <div className="bg-black/20 rounded-xl p-4 text-center">
      <p className="text-sm text-slate-200">Grande Porte</p>
      <p className="text-xl font-bold">100–500</p>
    </div>

    <div className="bg-black/20 rounded-xl p-4 text-center">
      <p className="text-sm text-slate-200">Multi Torre</p>
      <p className="text-xl font-bold">1000+</p>
    </div>
  </div>
</div>
        <div className="grid md:grid-cols-5 gap-4 mb-10">
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <p className="text-slate-400 text-sm">Unidades Ativas</p>
            <p className="text-3xl font-bold text-green-400">5</p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <p className="text-slate-400 text-sm">Moradores Online</p>
            <p className="text-3xl font-bold text-blue-400">5</p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <p className="text-slate-400 text-sm">Chamadas Hoje</p>
            <p className="text-3xl font-bold text-yellow-400">0</p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <p className="text-slate-400 text-sm">Taxa Atendimento</p>
            <p className="text-3xl font-bold text-green-400">0%</p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <p className="text-slate-400 text-sm">Alertas Ativos</p>
            <p className="text-3xl font-bold text-red-400">0</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 mb-10 border border-blue-500/20">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold text-blue-300">
                Ecossistema QR Acesso
              </h2>

              <p className="text-slate-400 text-sm mt-1">
                Uma plataforma completa para operação, segurança e gestão condominial.
              </p>
            </div>

            <span className="bg-blue-500/20 text-blue-300 text-sm font-bold px-4 py-2 rounded-full">
              Beta V1
            </span>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {modulos.map((modulo) => (
              <div
                key={modulo.nome}
                className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-blue-400 transition-all"
              >
                <p className="font-bold text-lg">{modulo.nome}</p>

                <p className="text-sm text-slate-300 mt-2 min-h-[66px]">
                  {modulo.descricao}
                </p>

                <p className={`mt-3 font-bold ${modulo.cor}`}>
                  {modulo.status}
                </p>

                <p className="text-xs text-slate-500 mt-3">
                  {modulo.destaque}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h2 className="text-2xl font-bold text-blue-300 mb-5">
              Status em Tempo Real
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {qrs.map((qr) => (
                <div
                  key={qr.nome}
                  className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700"
                >
                  <p className="text-xl font-bold">{qr.nome}</p>
                  <p className="mt-3 text-sm">{qr.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h2 className="text-2xl font-bold text-blue-300 mb-5">
              Insights da IA
            </h2>

            <div className="space-y-3">
              <div className="bg-slate-800 rounded-xl p-4 border border-purple-500/20">
                🤖 QR AI Concierge poderá resumir alertas, chamados e prioridades do dia.
              </div>

              <div className="bg-slate-800 rounded-xl p-4 border border-purple-500/20">
                📦 Entregas poderão gerar recomendação para locker conforme volume.
              </div>

              <div className="bg-slate-800 rounded-xl p-4 border border-purple-500/20">
                🛡️ Padrões fora do normal poderão virar alertas preventivos.
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h2 className="text-2xl font-bold text-blue-300 mb-5">
            Chamadas Recentes
          </h2>

          <div className="space-y-3">
            <div className="bg-slate-800 rounded-xl p-4">
              Nenhuma chamada recente registrada nesta dashboard beta.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}