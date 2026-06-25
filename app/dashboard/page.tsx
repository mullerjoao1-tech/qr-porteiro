"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../services/firebase";

export default function Dashboard() {
  const [mostrarExpansao, setMostrarExpansao] = useState(false);
  const [qrs, setQrs] = useState([
    { nome: "QR1", codigo: "qr1", status: "🟢 Disponível" },
    { nome: "QR2", codigo: "qr2", status: "🟢 Disponível" },
    { nome: "QR3", codigo: "qr3", status: "🟢 Disponível" },
    { nome: "QR4", codigo: "qr4", status: "🟢 Disponível" },
    { nome: "QR5", codigo: "qr5", status: "🟢 Disponível" },
  ]);

  useEffect(() => {
    const codigos = ["qr1", "qr2", "qr3", "qr4", "qr5"];
    const desligarEscutas: (() => void)[] = [];

    codigos.forEach((codigo, index) => {
      const qrRef = ref(db, codigo);

      const desligar = onValue(qrRef, (snapshot) => {
        const dados = snapshot.val();

        let novoStatus = "🟢 Disponível";

        if (dados?.status === "Aguardando atendimento") {
          novoStatus = "🟡 Em chamada";
        }

        if (dados?.status === "Em atendimento") {
          novoStatus = "🔵 Em atendimento";
        }

        setQrs((qrsAtuais) => {
          const copia = [...qrsAtuais];

          copia[index] = {
            ...copia[index],
            status: novoStatus,
          };

          return copia;
        });
      });

      desligarEscutas.push(desligar);
    });

    return () => {
      desligarEscutas.forEach((desligar) => desligar());
    };
  }, []);

  const modulosDoCondominio = {
    access: true,
    security: true,
    monitoring: false,
    admin: false,
    services: false,
    ai: false,
    airbnb: false,
  };

  const modulosDoMorador = {
    care: true,
  };

  const modulos = [
    {
      id: "access",
      nome: "QR Access",
      descricao: "Portaria, visitantes, entregas, portões e controle de acesso.",
      status: "🟢 Em operação",
      destaque: "QR Portaria ativo • Entregas beta • Locker em breve",
      cor: "text-green-400",
    },
    {
      id: "security",
      nome: "QR Security",
      descricao: "Proteção contra invasões, sensores, perímetro e alertas silenciosos.",
      status: "🟢 Ativo",
      destaque: "Segurança inteligente para áreas internas e externas",
      cor: "text-green-400",
    },
    {
      id: "monitoring",
      nome: "QR Monitoring",
      descricao: "Monitoramento online em tempo real para câmeras, portões e eventos.",
      status: "🟡 Disponível",
      destaque: "Central de acompanhamento do condomínio",
      cor: "text-yellow-400",
    },
    {
      id: "care",
      nome: "QR Care Family",
      descricao: "Cuidado remoto para idosos e familiares com alertas de rotina.",
      status: "🟢 Ativo individual",
      destaque: "Mais segurança para famílias e moradores vulneráveis",
      cor: "text-green-400",
    },
    {
      id: "admin",
      nome: "QR Admin",
      descricao: "Gestão entre síndico, administradora e moradores.",
      status: "🔵 Disponível",
      destaque: "Comunicados, relatórios, documentos e permissões",
      cor: "text-blue-400",
    },
    {
      id: "services",
      nome: "QR Services",
      descricao: "Prestadores avaliados estilo Google para o condomínio.",
      status: "🔵 Disponível",
      destaque: "Avaliações, reviews e faixa de preço",
      cor: "text-blue-400",
    },
    {
      id: "ai",
      nome: "QR AI Concierge",
      descricao: "Assistente inteligente para moradores, síndico e administradora.",
      status: "🟣 Futuro premium",
      destaque: "IA para dúvidas, ações, insights e automações",
      cor: "text-purple-400",
    },
    {
      id: "airbnb",
      nome: "QR Airbnb",
      descricao: "Acesso temporário, check-in remoto e apoio para locações.",
      status: "🔵 Disponível",
      destaque: "PIN/QR temporário, limpeza e controle de chaves",
      cor: "text-blue-400",
    },
  ];

  function moduloAtivo(id: string) {
    return (
      modulosDoCondominio[id as keyof typeof modulosDoCondominio] === true ||
      modulosDoMorador[id as keyof typeof modulosDoMorador] === true
    );
  }

  const modulosAtivos = modulos.filter((modulo) => moduloAtivo(modulo.id));
  const modulosDisponiveis = modulos.filter((modulo) => !moduloAtivo(modulo.id));
  const previewModulos = modulosDisponiveis.slice(0, 3);
  const quantidadeRestante = modulosDisponiveis.length - previewModulos.length;

  const chamadasAtivas = qrs.filter(
    (qr) => qr.status === "🟡 Em chamada" || qr.status === "🔵 Em atendimento"
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="/logo-oficial.png"
              alt="QR Acesso"
              className="h-10 md:h-20 w-auto object-contain"
            />

            <h1 className="text-3xl md:text-5xl font-black text-blue-400">
              QR Central
            </h1>
          </div>

          <p className="text-slate-400 text-sm md:text-lg">
            Controle de acesso • Segurança • Gestão • Automação • IA
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-5 md:p-6 mb-8 shadow-lg">
          <h2 className="text-xl md:text-2xl font-black mb-2">
            🟢 Tudo normal
          </h2>

          <p className="text-sm md:text-lg font-semibold">
            Condomínio em operação com {modulosAtivos.length} módulos ativos.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <div className="bg-black/20 rounded-xl p-4 text-center">
              <p className="text-sm text-slate-200">Unidades</p>
              <p className="text-2xl font-bold">5</p>
            </div>

            <div className="bg-black/20 rounded-xl p-4 text-center">
              <p className="text-sm text-slate-200">Online</p>
              <p className="text-2xl font-bold">5</p>
            </div>

            <div className="bg-black/20 rounded-xl p-4 text-center">
              <p className="text-sm text-slate-200">Chamadas</p>
              <p className="text-2xl font-bold">{chamadasAtivas}</p>
            </div>

            <div className="bg-black/20 rounded-xl p-4 text-center">
              <p className="text-sm text-slate-200">Alertas</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 md:p-6 mb-8 border border-green-500/20">
          <h2 className="text-2xl font-bold text-green-300">
            Seus Módulos Ativos
          </h2>

          <p className="text-slate-400 text-sm mt-1 mb-5">
            Esta tela mostra apenas o que este cliente ou morador possui ativo.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {modulosAtivos.map((modulo) => (
              <div
                key={modulo.id}
                className="bg-slate-800 rounded-xl p-4 border border-green-500/30 hover:border-green-400 transition-all"
              >
                <h3 className="font-bold text-xl mb-3 text-white">
                  {modulo.nome}
                </h3>

                <p className="text-sm text-slate-300">{modulo.descricao}</p>

                <p className={`mt-4 font-bold ${modulo.cor}`}>
                  {modulo.status}
                </p>

                <p className="text-xs text-slate-500 mt-3">
                  {modulo.destaque}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-800">
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

          <div className="bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-800">
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

        <div className="bg-slate-900 rounded-2xl p-4 md:p-6 mb-8 border border-blue-400/40 shadow-lg shadow-blue-500/10">
          <button
            onClick={() => setMostrarExpansao(!mostrarExpansao)}
            className="w-full flex items-center justify-between gap-4 text-left"
          >
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-blue-300">
                Expanda sua plataforma
              </h2>

              <p className="text-slate-400 text-xs md:text-sm mt-1">
                {modulosDisponiveis.length} módulos disponíveis para contratar.
              </p>

              {!mostrarExpansao && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {previewModulos.map((modulo) => (
                    <span
                      key={modulo.id}
                      className="bg-slate-800 border border-blue-500/30 text-blue-200 text-xs font-bold px-3 py-1 rounded-full"
                    >
                      {modulo.nome}
                    </span>
                  ))}

                  {quantidadeRestante > 0 && (
                    <span className="bg-blue-600/20 border border-blue-400/40 text-blue-200 text-xs font-bold px-3 py-1 rounded-full">
                      +{quantidadeRestante}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 text-white font-bold px-4 py-2 rounded-xl transition-all text-sm">
              {mostrarExpansao ? "Fechar" : "Ver"}
            </div>
          </button>

          {mostrarExpansao && (
            <div className="mt-5">
              <p className="text-slate-400 text-sm mb-5">
                Módulos disponíveis para contratação conforme a necessidade.
              </p>

              <div className="grid md:grid-cols-4 gap-4">
                {modulosDisponiveis.map((modulo) => (
                  <div
                    key={modulo.id}
                    className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-blue-400 transition-all"
                  >
                    <h3 className="font-bold text-xl mb-3 text-white">
                      {modulo.nome}
                    </h3>

                    <p className="text-sm text-slate-300">
                      {modulo.descricao}
                    </p>

                    <p className={`mt-4 font-bold ${modulo.cor}`}>
                      {modulo.status}
                    </p>

                    <p className="text-xs text-slate-500 mt-3">
                      {modulo.destaque}
                    </p>

                    <button className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-all">
                      Conhecer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-800">
          <h2 className="text-2xl font-bold text-blue-300 mb-5">
            Insights da IA
          </h2>

          <div className="space-y-3">
            <div className="bg-slate-800 rounded-xl p-4 border border-purple-500/20">
              🤖 QR AI Concierge poderá resumir alertas, chamados e prioridades
              do dia.
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
    </main>
  );
}