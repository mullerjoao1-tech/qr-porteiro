"use client";

import { useMemo, useState } from "react";

type FiltroSaude = "todos" | "saudaveis" | "atencao" | "criticos";

type CondominioSaude = {
  id: string;
  nome: string;
  percentual: number;
  status: "saudavel" | "atencao" | "critico";
  problemas: string[];
};

type IndicadorRapido = {
  id: string;
  titulo: string;
  valor: string;
  descricao: string;
  icone: string;
  destaque: string;
};

type PeriodoAgenda = "hoje" | "sete-dias" | "mes";

type EventoAgenda = {
  id: string;
  periodo: PeriodoAgenda;
  tipo:
    | "manutencao"
    | "assembleia"
    | "contrato"
    | "prestador"
    | "entrega"
    | "lembrete";
  icone: string;
  titulo: string;
  condominio: string;
  data: string;
  horario: string;
  status: string;
  detalhes: string;
};

type AbaFinanceira =
  | "resumo"
  | "urgentes"
  | "inadimplencia"
  | "pagamentos";

type ItemFinanceiro = {
  id: string;
  aba: Exclude<AbaFinanceira, "resumo">;
  icone: string;
  titulo: string;
  condominio: string;
  valor: string;
  vencimento: string;
  status: string;
  detalhes: string;
};

const condominios: CondominioSaude[] = [
  {
    id: "cnd-tulipas",
    nome: "Residencial Tulipas",
    percentual: 98,
    status: "saudavel",
    problemas: [],
  },
  {
    id: "cnd-flores",
    nome: "Residencial Flores",
    percentual: 95,
    status: "saudavel",
    problemas: [],
  },
  {
    id: "cnd-alfa",
    nome: "Condomínio Alfa",
    percentual: 81,
    status: "atencao",
    problemas: [
      "Interfone com defeito",
      "Portão social aberto acima do tempo",
    ],
  },
];

const indicadoresDisponiveis: IndicadorRapido[] = [
  {
    id: "chamadas",
    titulo: "Chamadas hoje",
    valor: "18",
    descricao: "3 em andamento",
    icone: "📞",
    destaque: "text-blue-300",
  },
  {
    id: "entregas",
    titulo: "Entregas",
    valor: "12",
    descricao: "2 aguardando retirada",
    icone: "📦",
    destaque: "text-orange-300",
  },
  {
    id: "moradores",
    titulo: "Moradores",
    valor: "94",
    descricao: "6 cadastros pendentes",
    icone: "👥",
    destaque: "text-cyan-300",
  },
  {
    id: "unidades",
    titulo: "Unidades ativas",
    valor: "87",
    descricao: "92% da carteira",
    icone: "🏢",
    destaque: "text-green-300",
  },
  {
    id: "visitantes",
    titulo: "Visitantes",
    valor: "31",
    descricao: "Registrados hoje",
    icone: "🚶",
    destaque: "text-violet-300",
  },
  {
    id: "prestadores",
    titulo: "Prestadores",
    valor: "7",
    descricao: "2 acessos em andamento",
    icone: "🧰",
    destaque: "text-yellow-300",
  },
  {
    id: "portoes",
    titulo: "Portões",
    valor: "8",
    descricao: "7 funcionando normalmente",
    icone: "🚪",
    destaque: "text-emerald-300",
  },
  {
    id: "cameras",
    titulo: "Câmeras",
    valor: "11",
    descricao: "1 câmera offline",
    icone: "📷",
    destaque: "text-red-300",
  },
];

const eventosAgenda: EventoAgenda[] = [
  {
    id: "evt-001",
    periodo: "hoje",
    tipo: "manutencao",
    icone: "🛠",
    titulo: "Revisão do portão social",
    condominio: "Residencial Tulipas",
    data: "Hoje",
    horario: "09:30",
    status: "Confirmada",
    detalhes:
      "Prestador confirmado para revisar o tempo de fechamento e os sensores do portão social.",
  },
  {
    id: "evt-002",
    periodo: "hoje",
    tipo: "manutencao",
    icone: "🛠",
    titulo: "Inspeção dos extintores",
    condominio: "Condomínio Alfa",
    data: "Hoje",
    horario: "14:00",
    status: "Agendada",
    detalhes:
      "Inspeção preventiva dos extintores das áreas comuns e atualização das etiquetas de validade.",
  },
  {
    id: "evt-003",
    periodo: "hoje",
    tipo: "assembleia",
    icone: "👥",
    titulo: "Assembleia extraordinária",
    condominio: "Residencial Flores",
    data: "Hoje",
    horario: "19:30",
    status: "Confirmada",
    detalhes:
      "Pauta principal: aprovação da modernização do sistema de controle de acesso.",
  },
  {
    id: "evt-004",
    periodo: "hoje",
    tipo: "prestador",
    icone: "👷",
    titulo: "Equipe de jardinagem",
    condominio: "Residencial Tulipas",
    data: "Hoje",
    horario: "08:00",
    status: "Entrada confirmada",
    detalhes:
      "Equipe com dois profissionais autorizados para manutenção das áreas verdes.",
  },
  {
    id: "evt-005",
    periodo: "hoje",
    tipo: "prestador",
    icone: "👷",
    titulo: "Técnico de elevadores",
    condominio: "Residencial Flores",
    data: "Hoje",
    horario: "16:00",
    status: "Aguardando chegada",
    detalhes:
      "Visita técnica preventiva no elevador do Bloco 2. Documentação já validada.",
  },
  {
    id: "evt-006",
    periodo: "hoje",
    tipo: "entrega",
    icone: "📦",
    titulo: "Entrega de materiais",
    condominio: "Condomínio Alfa",
    data: "Hoje",
    horario: "11:00",
    status: "Programada",
    detalhes:
      "Entrega de materiais para manutenção da área comum. Recebimento pela zeladoria.",
  },
  {
    id: "evt-007",
    periodo: "sete-dias",
    tipo: "contrato",
    icone: "📄",
    titulo: "Renovação da limpeza",
    condominio: "Residencial Tulipas",
    data: "Amanhã",
    horario: "Prazo final",
    status: "Vencendo",
    detalhes:
      "Contrato da empresa de limpeza vence amanhã e aguarda decisão de renovação.",
  },
  {
    id: "evt-008",
    periodo: "sete-dias",
    tipo: "manutencao",
    icone: "🛠",
    titulo: "Limpeza da caixa-d'água",
    condominio: "Residencial Flores",
    data: "Sexta-feira",
    horario: "08:30",
    status: "Confirmada",
    detalhes:
      "Serviço programado com aviso prévio aos moradores e bloqueio temporário do abastecimento.",
  },
  {
    id: "evt-009",
    periodo: "sete-dias",
    tipo: "lembrete",
    icone: "🔔",
    titulo: "Enviar pauta da assembleia",
    condominio: "Condomínio Alfa",
    data: "Sábado",
    horario: "10:00",
    status: "Pendente",
    detalhes:
      "Preparar e enviar a pauta aos moradores dentro do prazo de convocação.",
  },
  {
    id: "evt-010",
    periodo: "mes",
    tipo: "contrato",
    icone: "📄",
    titulo: "Revisão do contrato de elevadores",
    condominio: "Residencial Flores",
    data: "28 de julho",
    horario: "Prazo final",
    status: "Em análise",
    detalhes:
      "Comparar reajuste, escopo de manutenção e tempo de atendimento antes da renovação.",
  },
  {
    id: "evt-011",
    periodo: "mes",
    tipo: "assembleia",
    icone: "👥",
    titulo: "Assembleia ordinária",
    condominio: "Residencial Tulipas",
    data: "30 de julho",
    horario: "19:00",
    status: "Planejada",
    detalhes:
      "Prestação de contas, previsão orçamentária e definição das próximas melhorias.",
  },
  {
    id: "evt-012",
    periodo: "mes",
    tipo: "manutencao",
    icone: "🛠",
    titulo: "Teste do sistema de emergência",
    condominio: "Condomínio Alfa",
    data: "31 de julho",
    horario: "15:00",
    status: "Planejada",
    detalhes:
      "Teste preventivo dos equipamentos e procedimentos de emergência das áreas comuns.",
  },
];

const itensFinanceiros: ItemFinanceiro[] = [
  {
    id: "fin-001",
    aba: "urgentes",
    icone: "🔴",
    titulo: "Seguro predial",
    condominio: "Residencial Tulipas",
    valor: "R$ 8.450",
    vencimento: "Vence amanhã",
    status: "Ação imediata",
    detalhes:
      "A renovação ainda não foi registrada. É necessário confirmar o pagamento ou a negociação com a seguradora.",
  },
  {
    id: "fin-002",
    aba: "urgentes",
    icone: "🟠",
    titulo: "Manutenção dos elevadores",
    condominio: "Residencial Flores",
    valor: "R$ 4.980",
    vencimento: "Vence em 2 dias",
    status: "Próximo do prazo",
    detalhes:
      "Pagamento mensal da empresa responsável pela manutenção preventiva dos elevadores.",
  },
  {
    id: "fin-003",
    aba: "urgentes",
    icone: "🟠",
    titulo: "Serviço de limpeza",
    condominio: "Condomínio Alfa",
    valor: "R$ 6.200",
    vencimento: "Vence em 3 dias",
    status: "Próximo do prazo",
    detalhes:
      "Pagamento recorrente da equipe de limpeza das áreas comuns.",
  },
  {
    id: "fin-004",
    aba: "inadimplencia",
    icone: "🏠",
    titulo: "Unidades em atraso",
    condominio: "Residencial Tulipas",
    valor: "R$ 12.840",
    vencimento: "7 unidades",
    status: "Em acompanhamento",
    detalhes:
      "Sete unidades possuem débitos vencidos. Três delas estão há mais de 30 dias em atraso.",
  },
  {
    id: "fin-005",
    aba: "inadimplencia",
    icone: "🏢",
    titulo: "Unidades em atraso",
    condominio: "Residencial Flores",
    valor: "R$ 7.320",
    vencimento: "4 unidades",
    status: "Em acompanhamento",
    detalhes:
      "Quatro unidades possuem débitos vencidos. Nenhuma ultrapassou 60 dias.",
  },
  {
    id: "fin-006",
    aba: "inadimplencia",
    icone: "📊",
    titulo: "Índice consolidado",
    condominio: "Carteira completa",
    valor: "6,4%",
    vencimento: "11 unidades",
    status: "Atenção",
    detalhes:
      "A inadimplência consolidada está acima da meta de 5% definida para a carteira.",
  },
  {
    id: "fin-007",
    aba: "pagamentos",
    icone: "💳",
    titulo: "Folha da portaria",
    condominio: "Residencial Tulipas",
    valor: "R$ 18.600",
    vencimento: "Amanhã",
    status: "Programado",
    detalhes:
      "Pagamento da folha da equipe de portaria programado para amanhã.",
  },
  {
    id: "fin-008",
    aba: "pagamentos",
    icone: "⚡",
    titulo: "Energia das áreas comuns",
    condominio: "Residencial Flores",
    valor: "R$ 5.740",
    vencimento: "Em 4 dias",
    status: "Programado",
    detalhes:
      "Conta de energia das áreas comuns e equipamentos compartilhados.",
  },
  {
    id: "fin-009",
    aba: "pagamentos",
    icone: "💧",
    titulo: "Abastecimento de água",
    condominio: "Condomínio Alfa",
    valor: "R$ 3.980",
    vencimento: "Em 5 dias",
    status: "Programado",
    detalhes:
      "Conta mensal de abastecimento de água das áreas comuns.",
  },
];



function textoStatus(status: CondominioSaude["status"]) {
  if (status === "saudavel") return "Saudável";
  if (status === "atencao") return "Atenção";
  return "Crítico";
}

function iconeStatus(status: CondominioSaude["status"]) {
  if (status === "saudavel") return "🟢";
  if (status === "atencao") return "🟠";
  return "🔴";
}

function classesStatus(status: CondominioSaude["status"]) {
  if (status === "saudavel") {
    return "border-green-800 bg-green-950/30 hover:bg-green-950/50";
  }

  if (status === "atencao") {
    return "border-orange-700 bg-orange-950/30 hover:bg-orange-950/50";
  }

  return "border-red-700 bg-red-950/30 hover:bg-red-950/50";
}

export default function CentralSindico() {
  const [popupSaudeAberto, setPopupSaudeAberto] = useState(false);
  const [filtroSaude, setFiltroSaude] = useState<FiltroSaude>("todos");
  const [condominioSelecionado, setCondominioSelecionado] =
    useState<CondominioSaude | null>(null);

  const [popupIndicadoresAberto, setPopupIndicadoresAberto] = useState(false);
  const [popupAgendaAberto, setPopupAgendaAberto] = useState(false);
  const [popupFinanceiroAberto, setPopupFinanceiroAberto] = useState(false);
  const [abaFinanceira, setAbaFinanceira] =
    useState<AbaFinanceira>("resumo");
  const [itemFinanceiroSelecionado, setItemFinanceiroSelecionado] =
    useState<ItemFinanceiro | null>(null);
  const [periodoAgenda, setPeriodoAgenda] = useState<PeriodoAgenda>("hoje");
  const [eventoAgendaSelecionado, setEventoAgendaSelecionado] =
    useState<EventoAgenda | null>(null);
  const [indicadoresVisiveis, setIndicadoresVisiveis] = useState<string[]>([
    "chamadas",
    "entregas",
    "moradores",
    "unidades",
  ]);
  const [indicadoresRascunho, setIndicadoresRascunho] = useState<string[]>([
    "chamadas",
    "entregas",
    "moradores",
    "unidades",
  ]);

  const saudaveis = condominios.filter(
    (condominio) => condominio.status === "saudavel"
  ).length;

  const atencao = condominios.filter(
    (condominio) => condominio.status === "atencao"
  ).length;

  const criticos = condominios.filter(
    (condominio) => condominio.status === "critico"
  ).length;

  const condominiosFiltrados = condominios.filter((condominio) => {
    if (filtroSaude === "todos") return true;
    if (filtroSaude === "saudaveis") {
      return condominio.status === "saudavel";
    }
    if (filtroSaude === "atencao") {
      return condominio.status === "atencao";
    }
    return condominio.status === "critico";
  });

  const eventosAgendaFiltrados = eventosAgenda.filter(
    (evento) => evento.periodo === periodoAgenda
  );

  const itensFinanceirosFiltrados =
    abaFinanceira === "resumo"
      ? []
      : itensFinanceiros.filter((item) => item.aba === abaFinanceira);

  const indicadoresAtivos = useMemo(
    () =>
      indicadoresVisiveis
        .map((id) =>
          indicadoresDisponiveis.find((indicador) => indicador.id === id)
        )
        .filter((indicador): indicador is IndicadorRapido =>
          Boolean(indicador)
        ),
    [indicadoresVisiveis]
  );

  function abrirSaude(filtro: FiltroSaude = "todos") {
    setFiltroSaude(filtro);
    setCondominioSelecionado(null);
    setPopupSaudeAberto(true);
  }

  function fecharSaude() {
    setPopupSaudeAberto(false);
    setCondominioSelecionado(null);
    setFiltroSaude("todos");
  }

  function abrirConfiguracaoIndicadores() {
    setIndicadoresRascunho(indicadoresVisiveis);
    setPopupIndicadoresAberto(true);
  }

  function fecharConfiguracaoIndicadores() {
    setIndicadoresRascunho(indicadoresVisiveis);
    setPopupIndicadoresAberto(false);
  }

  function alternarIndicador(id: string) {
    setIndicadoresRascunho((atuais) => {
      if (atuais.includes(id)) {
        if (atuais.length === 1) return atuais;
        return atuais.filter((indicadorId) => indicadorId !== id);
      }

      if (atuais.length >= 6) return atuais;
      return [...atuais, id];
    });
  }

  function salvarIndicadores() {
    setIndicadoresVisiveis(indicadoresRascunho);
    setPopupIndicadoresAberto(false);
  }

  function abrirAgenda(periodo: PeriodoAgenda = "hoje") {
    setPeriodoAgenda(periodo);
    setEventoAgendaSelecionado(null);
    setPopupAgendaAberto(true);
  }

  function fecharAgenda() {
    setPopupAgendaAberto(false);
    setEventoAgendaSelecionado(null);
    setPeriodoAgenda("hoje");
  }

  function abrirFinanceiro(aba: AbaFinanceira = "resumo") {
    setAbaFinanceira(aba);
    setItemFinanceiroSelecionado(null);
    setPopupFinanceiroAberto(true);
  }

  function fecharFinanceiro() {
    setPopupFinanceiroAberto(false);
    setItemFinanceiroSelecionado(null);
    setAbaFinanceira("resumo");
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}

      <section className="rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-600 p-5 text-white md:p-8">
        <h1 className="text-3xl font-black md:text-4xl">
          👋 Bom dia, João
        </h1>

        <p className="mt-2 text-sm text-blue-100 md:text-base">
          Você administra 3 condomínios
        </p>
      </section>

      {/* Atenção agora */}

      <section className="rounded-2xl border border-red-700 bg-red-950/20 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-red-300 md:text-sm">
              🚨 ATENÇÃO AGORA
            </p>

            <h2 className="mt-1 text-xl font-black text-white md:text-2xl">
              4 ações precisam da sua atenção
            </h2>
          </div>

          <button
            type="button"
            className="shrink-0 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold transition-all duration-150 hover:bg-red-500 active:scale-95 active:brightness-125"
          >
            Ver tudo
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <button
            type="button"
            className="rounded-2xl border border-red-600 bg-red-950/40 p-4 text-left transition-all duration-150 hover:bg-red-900 active:scale-95 active:brightness-125"
          >
            <div className="text-4xl">📷</div>
            <div className="mt-3 font-black text-white">Câmera</div>
            <div className="text-sm text-red-300">Tulipas</div>
            <div className="mt-1 text-xs text-slate-400">Offline</div>
          </button>

          <button
            type="button"
            className="rounded-2xl border border-orange-500 bg-orange-950/40 p-4 text-left transition-all duration-150 hover:bg-orange-900 active:scale-95 active:brightness-125"
          >
            <div className="text-4xl">🚪</div>
            <div className="mt-3 font-black text-white">Portão</div>
            <div className="text-sm text-orange-300">Flores</div>
            <div className="mt-1 text-xs text-slate-400">
              Aberto há 5 min
            </div>
          </button>

          <button
            type="button"
            className="rounded-2xl border border-yellow-500 bg-yellow-950/40 p-4 text-left transition-all duration-150 hover:bg-yellow-900 active:scale-95 active:brightness-125"
          >
            <div className="text-4xl">☎️</div>
            <div className="mt-3 font-black text-white">Interfone</div>
            <div className="text-sm text-yellow-300">Alfa</div>
            <div className="mt-1 text-xs text-slate-400">Defeito</div>
          </button>

          <button
            type="button"
            className="rounded-2xl border border-red-600 bg-red-950/40 p-4 text-left transition-all duration-150 hover:bg-red-900 active:scale-95 active:brightness-125"
          >
            <div className="text-4xl">📄</div>
            <div className="mt-3 font-black text-white">Contrato</div>
            <div className="text-sm text-red-300">Tulipas</div>
            <div className="mt-1 text-xs text-slate-400">
              Vence amanhã
            </div>
          </button>
        </div>
      </section>

      {/* Indicadores rápidos personalizáveis */}

      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-blue-300 md:text-sm">
              📊 INDICADORES RÁPIDOS
            </p>

            <h2 className="mt-1 text-xl font-black text-white md:text-2xl">
              Tudo importante na palma da mão
            </h2>

            <p className="mt-1 text-xs text-slate-400 md:text-sm">
              Escolha os indicadores que deseja acompanhar primeiro.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirConfiguracaoIndicadores}
            className="shrink-0 rounded-xl border border-slate-600 bg-slate-800 px-3 py-3 text-sm font-black text-white transition-all duration-150 hover:bg-slate-700 active:scale-95 active:brightness-125 md:px-4"
          >
            ⚙️ <span className="hidden sm:inline">Personalizar</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {indicadoresAtivos.map((indicador) => (
            <button
              key={indicador.id}
              type="button"
              className="min-h-[138px] rounded-2xl border border-slate-700 bg-slate-800/80 p-4 text-left transition-all duration-150 hover:border-blue-600 hover:bg-slate-800 active:scale-95 active:brightness-125"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-3xl">{indicador.icone}</div>

                <div className={`text-2xl font-black ${indicador.destaque}`}>
                  {indicador.valor}
                </div>
              </div>

              <div className="mt-4 font-black text-white">
                {indicador.titulo}
              </div>

              <div className="mt-1 text-xs leading-relaxed text-slate-400">
                {indicador.descricao}
              </div>
            </button>
          ))}
        </div>
      </section>


      {/* Agenda inteligente */}

      <section
        role="button"
        tabIndex={0}
        onClick={() => abrirAgenda("hoje")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            abrirAgenda("hoje");
          }
        }}
        className="cursor-pointer rounded-2xl border border-violet-700 bg-violet-950/20 p-4 transition-all duration-150 hover:bg-violet-900/20 active:scale-[0.99] active:brightness-125 md:p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-violet-300 md:text-sm">
              📅 AGENDA INTELIGENTE
            </p>

            <h2 className="mt-1 text-xl font-black text-white md:text-2xl">
              Compromissos de hoje
            </h2>

            <p className="mt-1 text-xs text-slate-400 md:text-sm">
              Sua operação organizada em um único lugar.
            </p>
          </div>

          <div className="shrink-0 rounded-xl bg-violet-600 px-3 py-2 text-center">
            <div className="text-2xl font-black text-white">12</div>
            <div className="text-[10px] font-bold text-violet-100">
              EVENTOS
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              abrirAgenda("hoje");
            }}
            className="rounded-xl bg-slate-900 p-3 text-center transition-all duration-150 hover:bg-slate-800 active:scale-95 active:brightness-125"
          >
            <div className="text-2xl">🛠</div>
            <div className="mt-1 font-black text-white">2</div>
            <div className="text-[10px] text-slate-400">Manutenções</div>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              abrirAgenda("hoje");
            }}
            className="rounded-xl bg-slate-900 p-3 text-center transition-all duration-150 hover:bg-slate-800 active:scale-95 active:brightness-125"
          >
            <div className="text-2xl">👥</div>
            <div className="mt-1 font-black text-white">1</div>
            <div className="text-[10px] text-slate-400">Assembleia</div>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              abrirAgenda("sete-dias");
            }}
            className="rounded-xl bg-slate-900 p-3 text-center transition-all duration-150 hover:bg-slate-800 active:scale-95 active:brightness-125"
          >
            <div className="text-2xl">📄</div>
            <div className="mt-1 font-black text-white">3</div>
            <div className="text-[10px] text-slate-400">Contratos</div>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              abrirAgenda("hoje");
            }}
            className="rounded-xl bg-slate-900 p-3 text-center transition-all duration-150 hover:bg-slate-800 active:scale-95 active:brightness-125"
          >
            <div className="text-2xl">👷</div>
            <div className="mt-1 font-black text-white">2</div>
            <div className="text-[10px] text-slate-400">Prestadores</div>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              abrirAgenda("hoje");
            }}
            className="rounded-xl bg-slate-900 p-3 text-center transition-all duration-150 hover:bg-slate-800 active:scale-95 active:brightness-125"
          >
            <div className="text-2xl">📦</div>
            <div className="mt-1 font-black text-white">5</div>
            <div className="text-[10px] text-slate-400">Entregas</div>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              abrirAgenda("sete-dias");
            }}
            className="rounded-xl bg-slate-900 p-3 text-center transition-all duration-150 hover:bg-slate-800 active:scale-95 active:brightness-125"
          >
            <div className="text-2xl">🔔</div>
            <div className="mt-1 font-black text-white">4</div>
            <div className="text-[10px] text-slate-400">Lembretes</div>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900/80 px-4 py-3">
          <div>
            <p className="text-xs font-bold text-violet-300">
              PRÓXIMO COMPROMISSO
            </p>
            <p className="mt-1 text-sm font-black text-white">
              🛠 Revisão do portão social — 09:30
            </p>
          </div>

          <span className="text-sm font-black text-violet-300">
            Ver agenda →
          </span>
        </div>
      </section>


      {/* Saúde financeira */}

      <section
        role="button"
        tabIndex={0}
        onClick={() => abrirFinanceiro("resumo")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            abrirFinanceiro("resumo");
          }
        }}
        className="cursor-pointer rounded-2xl border border-emerald-700 bg-emerald-950/20 p-4 transition-all duration-150 hover:bg-emerald-900/20 active:scale-[0.99] active:brightness-125 md:p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-emerald-300 md:text-sm">
              💰 SAÚDE FINANCEIRA
            </p>

            <h2 className="mt-1 text-xl font-black text-white md:text-2xl">
              Caixa saudável
            </h2>

            <p className="mt-1 text-xs text-slate-400 md:text-sm">
              Previsão positiva para os próximos 30 dias.
            </p>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-3xl font-black text-emerald-400 md:text-4xl">
              R$ 187 mil
            </div>

            <div className="text-xs font-bold text-emerald-300">
              ▲ +6% no mês
            </div>

            <div className="text-[10px] text-slate-400">
              Saldo previsto
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              abrirFinanceiro("urgentes");
            }}
            className="rounded-xl border border-red-900 bg-slate-900 p-3 text-left transition-all duration-150 hover:bg-slate-800 active:scale-95 active:brightness-125"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">🔴</span>
              <span className="text-xl font-black text-red-300">3</span>
            </div>
            <div className="mt-2 font-black text-white">Contas urgentes</div>
            <div className="mt-1 text-xs text-slate-400">
              R$ 19.630 próximos do prazo
            </div>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              abrirFinanceiro("inadimplencia");
            }}
            className="rounded-xl border border-orange-900 bg-slate-900 p-3 text-left transition-all duration-150 hover:bg-slate-800 active:scale-95 active:brightness-125"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">📉</span>
              <span className="text-xl font-black text-orange-300">6,4%</span>
            </div>
            <div className="mt-2 font-black text-white">Inadimplência</div>
            <div className="mt-1 text-xs text-slate-400">
              11 unidades em atraso
            </div>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              abrirFinanceiro("pagamentos");
            }}
            className="rounded-xl border border-blue-900 bg-slate-900 p-3 text-left transition-all duration-150 hover:bg-slate-800 active:scale-95 active:brightness-125"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">💳</span>
              <span className="text-xl font-black text-blue-300">4</span>
            </div>
            <div className="mt-2 font-black text-white">
              Próximos pagamentos
            </div>
            <div className="mt-1 text-xs text-slate-400">
              R$ 33.300 nos próximos dias
            </div>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              abrirFinanceiro("resumo");
            }}
            className="rounded-xl border border-emerald-900 bg-slate-900 p-3 text-left transition-all duration-150 hover:bg-slate-800 active:scale-95 active:brightness-125"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">📈</span>
              <span className="text-xl font-black text-emerald-300">+8%</span>
            </div>
            <div className="mt-2 font-black text-white">Receitas do mês</div>
            <div className="mt-1 text-xs text-slate-400">
              Acima do mês anterior
            </div>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-red-900/70 bg-red-950/20 px-4 py-3">
          <div>
            <p className="text-xs font-bold text-red-300">
              PRIORIDADE FINANCEIRA
            </p>
            <p className="mt-1 text-sm font-black text-white">
              Seguro predial vence amanhã
            </p>
          </div>

          <span className="text-sm font-black text-red-300">
            Ver detalhes →
          </span>
        </div>
      </section>

      {/* Saúde da carteira */}

      <section
        role="button"
        tabIndex={0}
        onClick={() => abrirSaude("todos")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            abrirSaude("todos");
          }
        }}
        className="cursor-pointer rounded-2xl border border-green-700 bg-green-950/20 p-4 transition-all duration-150 hover:bg-green-900/20 active:scale-[0.99] active:brightness-125 md:p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-green-300 md:text-sm">
              ❤️ SAÚDE DA CARTEIRA
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              3 Condomínios
            </h2>
          </div>

          <div className="text-right">
            <div className="text-4xl font-black text-green-400">96%</div>

            <div className="text-xs font-bold text-green-300">
              ▲ +2%
            </div>

            <div className="text-xs text-slate-400">Geral</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 md:gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              abrirSaude("saudaveis");
            }}
            className="rounded-xl bg-slate-900 p-3 text-center transition-all duration-150 hover:bg-slate-800 active:scale-95 active:brightness-125"
          >
            <div className="text-2xl">🟢</div>
            <div className="mt-1 font-black text-white">{saudaveis}</div>
            <div className="text-[10px] text-slate-400 md:text-xs">
              Saudáveis
            </div>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              abrirSaude("atencao");
            }}
            className="rounded-xl bg-slate-900 p-3 text-center transition-all duration-150 hover:bg-slate-800 active:scale-95 active:brightness-125"
          >
            <div className="text-2xl">🟠</div>
            <div className="mt-1 font-black text-white">{atencao}</div>
            <div className="text-[10px] text-slate-400 md:text-xs">
              Atenção
            </div>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              abrirSaude("criticos");
            }}
            className="rounded-xl bg-slate-900 p-3 text-center transition-all duration-150 hover:bg-slate-800 active:scale-95 active:brightness-125"
          >
            <div className="text-2xl">🔴</div>
            <div className="mt-1 font-black text-white">{criticos}</div>
            <div className="text-[10px] text-slate-400 md:text-xs">
              Críticos
            </div>
          </button>
        </div>
      </section>

      {/* Popup de configuração dos indicadores */}

      {popupIndicadoresAberto && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-3 md:p-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-blue-300">
                  ⚙️ PERSONALIZAR INDICADORES
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  Sua visão rápida
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Selecione de 1 a 6 indicadores. A ordem escolhida será mantida
                  na tela principal.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharConfiguracaoIndicadores}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl font-black transition-all hover:bg-slate-700 active:scale-95"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-blue-800 bg-blue-950/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-white">
                  {indicadoresRascunho.length} selecionados
                </p>

                <p className="text-xs font-bold text-blue-300">
                  Máximo: 6
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {indicadoresDisponiveis.map((indicador) => {
                const selecionado = indicadoresRascunho.includes(indicador.id);
                const limiteAtingido =
                  indicadoresRascunho.length >= 6 && !selecionado;

                return (
                  <button
                    key={indicador.id}
                    type="button"
                    onClick={() => alternarIndicador(indicador.id)}
                    disabled={limiteAtingido}
                    className={`rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.98] ${
                      selecionado
                        ? "border-blue-500 bg-blue-950/40"
                        : "border-slate-700 bg-slate-800"
                    } ${
                      limiteAtingido
                        ? "cursor-not-allowed opacity-40"
                        : "hover:border-blue-600 hover:bg-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{indicador.icone}</span>

                        <div>
                          <p className="font-black text-white">
                            {indicador.titulo}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {indicador.descricao}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-black ${
                          selecionado
                            ? "border-blue-400 bg-blue-600 text-white"
                            : "border-slate-500 bg-slate-900 text-slate-500"
                        }`}
                      >
                        {selecionado ? "✓" : ""}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={fecharConfiguracaoIndicadores}
                className="rounded-xl bg-slate-700 py-3 font-black text-white transition-all hover:bg-slate-600 active:scale-95"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={salvarIndicadores}
                className="rounded-xl bg-blue-600 py-3 font-black text-white transition-all hover:bg-blue-500 active:scale-95"
              >
                Salvar visão
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Popup Saúde Financeira */}

      {popupFinanceiroAberto && (
        <div className="fixed inset-0 z-[128] flex items-center justify-center bg-black/75 p-3 md:p-6">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-emerald-300">
                  💰 SAÚDE FINANCEIRA
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  {itemFinanceiroSelecionado
                    ? itemFinanceiroSelecionado.titulo
                    : "Visão financeira da carteira"}
                </h2>
              </div>

              <button
                type="button"
                onClick={fecharFinanceiro}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl font-black transition-all hover:bg-slate-700 active:scale-95"
              >
                ✕
              </button>
            </div>

            {!itemFinanceiroSelecionado ? (
              <>
                <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setAbaFinanceira("resumo")}
                    className={`rounded-xl px-2 py-3 text-xs font-black transition-all active:scale-95 ${
                      abaFinanceira === "resumo"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    Resumo
                  </button>

                  <button
                    type="button"
                    onClick={() => setAbaFinanceira("urgentes")}
                    className={`rounded-xl px-2 py-3 text-xs font-black transition-all active:scale-95 ${
                      abaFinanceira === "urgentes"
                        ? "bg-red-600 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    🔴 Urgentes
                  </button>

                  <button
                    type="button"
                    onClick={() => setAbaFinanceira("inadimplencia")}
                    className={`rounded-xl px-2 py-3 text-xs font-black transition-all active:scale-95 ${
                      abaFinanceira === "inadimplencia"
                        ? "bg-orange-600 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    📉 Inadimplência
                  </button>

                  <button
                    type="button"
                    onClick={() => setAbaFinanceira("pagamentos")}
                    className={`rounded-xl px-2 py-3 text-xs font-black transition-all active:scale-95 ${
                      abaFinanceira === "pagamentos"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    💳 Pagamentos
                  </button>
                </div>

                {abaFinanceira === "resumo" ? (
                  <div className="mt-5">
                    <div className="rounded-2xl border border-emerald-700 bg-emerald-950/25 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-emerald-300">
                            SALDO PREVISTO
                          </p>

                          <p className="mt-1 text-3xl font-black text-white">
                            R$ 187.450
                          </p>

                          <p className="mt-2 text-sm text-emerald-300">
                            🟢 Caixa saudável para os próximos 30 dias
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-black text-emerald-400">
                            +6%
                          </p>
                          <p className="text-xs text-slate-400">
                            no mês
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
                        <p className="text-xs font-bold text-slate-400">
                          ENTRADAS DO MÊS
                        </p>
                        <p className="mt-2 text-2xl font-black text-emerald-300">
                          R$ 214.800
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          94% já recebido
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
                        <p className="text-xs font-bold text-slate-400">
                          SAÍDAS DO MÊS
                        </p>
                        <p className="mt-2 text-2xl font-black text-red-300">
                          R$ 162.300
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          76% do previsto
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
                        <p className="text-xs font-bold text-slate-400">
                          INADIMPLÊNCIA
                        </p>
                        <p className="mt-2 text-2xl font-black text-orange-300">
                          6,4%
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          11 unidades
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
                        <p className="text-xs font-bold text-slate-400">
                          CONTAS PRÓXIMAS
                        </p>
                        <p className="mt-2 text-2xl font-black text-blue-300">
                          R$ 33.300
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Próximos 7 dias
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAbaFinanceira("urgentes")}
                      className="mt-4 w-full rounded-2xl border border-red-800 bg-red-950/30 p-4 text-left transition-all hover:bg-red-950/50 active:scale-[0.98]"
                    >
                      <p className="text-xs font-bold text-red-300">
                        🚨 PRIORIDADE
                      </p>

                      <p className="mt-1 font-black text-white">
                        Seguro predial vence amanhã
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Nenhuma ação foi registrada até o momento.
                      </p>
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {itensFinanceirosFiltrados.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setItemFinanceiroSelecionado(item)}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-4 text-left transition-all duration-150 hover:border-emerald-600 hover:bg-slate-700 active:scale-[0.98] active:brightness-125"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="text-3xl">{item.icone}</div>

                            <div className="min-w-0">
                              <p className="font-black text-white">
                                {item.titulo}
                              </p>

                              <p className="mt-1 text-sm text-emerald-300">
                                {item.condominio}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {item.vencimento}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-lg font-black text-white">
                              {item.valor}
                            </p>

                            <span className="mt-2 inline-flex rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black text-slate-300">
                              {item.status}
                            </span>

                            <p className="mt-2 text-xs text-slate-500">
                              Detalhes →
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-5">
                <div className="rounded-2xl border border-emerald-700 bg-emerald-950/25 p-5">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">
                      {itemFinanceiroSelecionado.icone}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-emerald-300">
                        {itemFinanceiroSelecionado.condominio}
                      </p>

                      <p className="mt-1 text-xl font-black text-white">
                        {itemFinanceiroSelecionado.titulo}
                      </p>

                      <p className="mt-2 text-2xl font-black text-white">
                        {itemFinanceiroSelecionado.valor}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
                    <p className="text-xs font-bold text-slate-400">
                      PRAZO
                    </p>

                    <p className="mt-1 font-black text-white">
                      {itemFinanceiroSelecionado.vencimento}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
                    <p className="text-xs font-bold text-slate-400">
                      STATUS
                    </p>

                    <p className="mt-1 font-black text-emerald-300">
                      {itemFinanceiroSelecionado.status}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800 p-4">
                  <p className="font-black text-white">Detalhes financeiros</p>

                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {itemFinanceiroSelecionado.detalhes}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setItemFinanceiroSelecionado(null)}
                    className="rounded-xl bg-slate-700 py-3 font-black text-white transition-all hover:bg-slate-600 active:scale-95"
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    className="rounded-xl bg-emerald-600 py-3 font-black text-white transition-all hover:bg-emerald-500 active:scale-95"
                  >
                    Abrir financeiro
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popup Agenda Inteligente */}

      {popupAgendaAberto && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/75 p-3 md:p-6">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-violet-300">
                  📅 AGENDA INTELIGENTE
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  {eventoAgendaSelecionado
                    ? eventoAgendaSelecionado.titulo
                    : "Compromissos e prazos"}
                </h2>
              </div>

              <button
                type="button"
                onClick={fecharAgenda}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl font-black transition-all hover:bg-slate-700 active:scale-95"
              >
                ✕
              </button>
            </div>

            {!eventoAgendaSelecionado ? (
              <>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPeriodoAgenda("hoje")}
                    className={`rounded-xl px-2 py-3 text-xs font-black transition-all active:scale-95 ${
                      periodoAgenda === "hoje"
                        ? "bg-violet-600 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    Hoje
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriodoAgenda("sete-dias")}
                    className={`rounded-xl px-2 py-3 text-xs font-black transition-all active:scale-95 ${
                      periodoAgenda === "sete-dias"
                        ? "bg-violet-600 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    Próximos 7 dias
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriodoAgenda("mes")}
                    className={`rounded-xl px-2 py-3 text-xs font-black transition-all active:scale-95 ${
                      periodoAgenda === "mes"
                        ? "bg-violet-600 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    Este mês
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {eventosAgendaFiltrados.map((evento) => (
                    <button
                      key={evento.id}
                      type="button"
                      onClick={() => setEventoAgendaSelecionado(evento)}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-4 text-left transition-all duration-150 hover:border-violet-600 hover:bg-slate-700 active:scale-[0.98] active:brightness-125"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="text-3xl">{evento.icone}</div>

                          <div className="min-w-0">
                            <p className="font-black text-white">
                              {evento.titulo}
                            </p>

                            <p className="mt-1 text-sm text-violet-300">
                              {evento.condominio}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {evento.data} • {evento.horario}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="inline-flex rounded-full bg-violet-950 px-3 py-1 text-[10px] font-black text-violet-300">
                            {evento.status}
                          </span>

                          <p className="mt-2 text-xs text-slate-500">
                            Detalhes →
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-5">
                <div className="rounded-2xl border border-violet-700 bg-violet-950/25 p-5">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">
                      {eventoAgendaSelecionado.icone}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-violet-300">
                        {eventoAgendaSelecionado.condominio}
                      </p>

                      <p className="mt-1 text-xl font-black text-white">
                        {eventoAgendaSelecionado.titulo}
                      </p>

                      <p className="mt-2 text-sm text-slate-300">
                        {eventoAgendaSelecionado.data} •{" "}
                        {eventoAgendaSelecionado.horario}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800 p-4">
                  <p className="text-xs font-bold text-slate-400">
                    STATUS
                  </p>

                  <p className="mt-1 font-black text-violet-300">
                    {eventoAgendaSelecionado.status}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800 p-4">
                  <p className="font-black text-white">Detalhes do evento</p>

                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {eventoAgendaSelecionado.detalhes}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEventoAgendaSelecionado(null)}
                    className="rounded-xl bg-slate-700 py-3 font-black text-white transition-all hover:bg-slate-600 active:scale-95"
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    className="rounded-xl bg-violet-600 py-3 font-black text-white transition-all hover:bg-violet-500 active:scale-95"
                  >
                    Abrir evento
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popup Saúde da Carteira */}

      {popupSaudeAberto && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-3 md:p-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-green-300">
                  ❤️ SAÚDE DA CARTEIRA
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  {condominioSelecionado
                    ? condominioSelecionado.nome
                    : "Situação dos condomínios"}
                </h2>
              </div>

              <button
                type="button"
                onClick={fecharSaude}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl font-black transition-all hover:bg-slate-700 active:scale-95"
              >
                ✕
              </button>
            </div>

            {!condominioSelecionado ? (
              <>
                <div className="mt-5 grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltroSaude("todos")}
                    className={`rounded-xl px-2 py-3 text-xs font-black transition-all active:scale-95 ${
                      filtroSaude === "todos"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    Todos
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroSaude("saudaveis")}
                    className={`rounded-xl px-2 py-3 text-xs font-black transition-all active:scale-95 ${
                      filtroSaude === "saudaveis"
                        ? "bg-green-600 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    🟢 {saudaveis}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroSaude("atencao")}
                    className={`rounded-xl px-2 py-3 text-xs font-black transition-all active:scale-95 ${
                      filtroSaude === "atencao"
                        ? "bg-orange-600 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    🟠 {atencao}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroSaude("criticos")}
                    className={`rounded-xl px-2 py-3 text-xs font-black transition-all active:scale-95 ${
                      filtroSaude === "criticos"
                        ? "bg-red-600 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    🔴 {criticos}
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {condominiosFiltrados.map((condominio) => (
                    <button
                      key={condominio.id}
                      type="button"
                      onClick={() => setCondominioSelecionado(condominio)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.98] active:brightness-125 ${classesStatus(
                        condominio.status
                      )}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-black text-white">
                            {iconeStatus(condominio.status)} {condominio.nome}
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            {textoStatus(condominio.status)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-black text-white">
                            {condominio.percentual}%
                          </p>

                          <p className="text-xs text-slate-500">
                            Ver detalhes →
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {condominiosFiltrados.length === 0 && (
                    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 text-center">
                      <p className="font-black text-slate-300">
                        Nenhum condomínio neste filtro
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-5">
                <div
                  className={`rounded-2xl border p-5 ${classesStatus(
                    condominioSelecionado.status
                  )}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-300">
                        SITUAÇÃO ATUAL
                      </p>

                      <p className="mt-1 text-xl font-black text-white">
                        {iconeStatus(condominioSelecionado.status)}{" "}
                        {textoStatus(condominioSelecionado.status)}
                      </p>
                    </div>

                    <p className="text-4xl font-black text-white">
                      {condominioSelecionado.percentual}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800 p-4">
                  <p className="font-black text-white">
                    Problemas encontrados
                  </p>

                  {condominioSelecionado.problemas.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {condominioSelecionado.problemas.map((problema) => (
                        <button
                          key={problema}
                          type="button"
                          className="w-full rounded-xl border border-orange-800 bg-orange-950/30 p-3 text-left text-sm font-bold text-orange-200 transition-all active:scale-[0.98]"
                        >
                          🟠 {problema}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-green-300">
                      ✅ Nenhum problema ativo neste condomínio.
                    </p>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCondominioSelecionado(null)}
                    className="rounded-xl bg-slate-700 py-3 font-black transition-all hover:bg-slate-600 active:scale-95"
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    className="rounded-xl bg-blue-600 py-3 font-black transition-all hover:bg-blue-500 active:scale-95"
                  >
                    Abrir condomínio
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
