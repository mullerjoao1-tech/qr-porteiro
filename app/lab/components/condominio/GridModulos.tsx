"use client";

import CardModulo from "./CardModulo";

type StatusModulo = "verde" | "amarelo" | "vermelho" | "azul";

type Modulo = {
  icone: string;
  titulo: string;
  resumo: string;
  status: StatusModulo;
  notificacoes?: number;
};

const modulos: Modulo[] = [
  {
    icone: "👥",
    titulo: "Moradores",
    resumo: "86 cadastrados",
    status: "verde",
  },
  {
    icone: "🚪",
    titulo: "Visitantes",
    resumo: "2 aguardando",
    status: "vermelho",
    notificacoes: 2,
  },
  {
    icone: "📦",
    titulo: "Entregas",
    resumo: "4 pendentes",
    status: "amarelo",
    notificacoes: 4,
  },
  {
    icone: "🔧",
    titulo: "Prestadores",
    resumo: "Tudo ok",
    status: "verde",
  },
  {
    icone: "📄",
    titulo: "Contratos",
    resumo: "1 vencendo",
    status: "vermelho",
    notificacoes: 1,
  },
  {
    icone: "💰",
    titulo: "Financeiro",
    resumo: "Em dia",
    status: "verde",
  },
  {
    icone: "📢",
    titulo: "Comunicados",
    resumo: "3 enviados",
    status: "azul",
  },
  {
    icone: "📷",
    titulo: "Segurança",
    resumo: "Online",
    status: "verde",
  },
  {
    icone: "🤖",
    titulo: "IA QR Acesso",
    resumo: "1 sugestão",
    status: "azul",
  },
  {
    icone: "⚙️",
    titulo: "Configurações",
    resumo: "Ativas",
    status: "verde",
  },
];

export default function GridModulos() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-2xl font-black text-slate-950">
          Módulos do Condomínio
        </h2>

        <p className="text-sm text-slate-500">
          Toque em um módulo para acessar os detalhes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {modulos.map((modulo) => (
          <CardModulo
            key={modulo.titulo}
            icone={modulo.icone}
            titulo={modulo.titulo}
            resumo={modulo.resumo}
            status={modulo.status}
            notificacoes={modulo.notificacoes}
          />
        ))}
      </div>
    </section>
  );
}