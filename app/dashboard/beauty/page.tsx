"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AgendaBeauty from "./components/agenda/AgendaBeauty";
import ClienteBeauty from "./components/clientes/ClienteBeauty";
import ProfissionalBeauty from "./components/profissionais/ProfissionalBeauty";
import ServicoBeauty from "./components/servicos/ServicoBeauty";
import ProdutoBeauty from "./components/produtos/ProdutoBeauty";
import PushButton from "@/app/components/core/push/PushButton";

import { observarAgendamentos } from "./components/agenda/AgendaFirebase";
import { observarClientes } from "./components/clientes/ClienteFirebase";
import { observarProfissionais } from "./components/profissionais/ProfissionalFirebase";
import { observarServicos } from "./components/servicos/ServicoFirebase";

type TelaBeauty =
  | "dashboard"
  | "agenda"
  | "clientes"
  | "profissionais"
  | "servicos"
  | "produtos"
  | "configuracoes";

type ItemMenu = {
  id: TelaBeauty;
  nome: string;
  icone: string;
};

type AgendamentoDashboard = {
  id: string;
  horario: string;
  cliente: string;
  servico: string;
  profissional: string;
  status: string;
  valor?: number;
};

type ClienteDashboard = {
  id: string;
  status?: "ativo" | "inativo";
};

type ProfissionalDashboard = {
  id: string;
  status?: "ativo" | "inativo";
};

type ServicoDashboard = {
  id: string;
  status?: "ativo" | "inativo";
};

const MENU_BEAUTY: ItemMenu[] = [
  {
    id: "dashboard",
    nome: "Dashboard",
    icone: "📊",
  },
  {
    id: "agenda",
    nome: "Agenda",
    icone: "📅",
  },
  {
    id: "clientes",
    nome: "Clientes",
    icone: "👥",
  },
  {
    id: "profissionais",
    nome: "Profissionais",
    icone: "💇",
  },
  {
    id: "servicos",
    nome: "Serviços",
    icone: "✂️",
  },
  {
    id: "produtos",
    nome: "Produtos",
    icone: "📦",
  },
  {
    id: "configuracoes",
    nome: "Configurações",
    icone: "⚙️",
  },
];

function dataISOHoje() {
  const agora = new Date();

  return [
    agora.getFullYear(),
    String(agora.getMonth() + 1).padStart(2, "0"),
    String(agora.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function horarioParaMinutos(horario: string) {
  const [hora, minuto] = horario.split(":").map(Number);

  if (
    Number.isNaN(hora) ||
    Number.isNaN(minuto)
  ) {
    return 0;
  }

  return hora * 60 + minuto;
}

export default function BeautyPage() {
  const [telaAtiva, setTelaAtiva] =
    useState<TelaBeauty>("dashboard");

  const [menuMobileAberto, setMenuMobileAberto] =
    useState(false);

  function abrirTela(tela: TelaBeauty) {
    setTelaAtiva(tela);
    setMenuMobileAberto(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMenuMobileAberto(true)}
          className="rounded-xl bg-slate-800 px-3 py-2 text-lg font-black"
        >
          ☰
        </button>

        <div className="text-center">
          <p className="font-black text-pink-400">
            QR Beauty
          </p>

          <p className="text-[10px] text-slate-500">
            Gestão do salão
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
          className="rounded-xl bg-slate-800 px-3 py-2"
          title="Voltar"
        >
          ←
        </button>
      </header>

      {menuMobileAberto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuMobileAberto(false)}
            className="absolute inset-0 bg-black/70"
          />

          <aside className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <div className="mb-6">
              <p className="text-xs font-black text-pink-300">
                QR BEAUTY
              </p>

              <h1 className="mt-1 text-2xl font-black">
                Gestão do salão
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Agenda, clientes e serviços.
              </p>
            </div>

            <nav className="space-y-2">
              {MENU_BEAUTY.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => abrirTela(item.id)}
                  className={`w-full rounded-xl px-4 py-3 text-left font-black transition-all ${
                    telaAtiva === item.id
                      ? "bg-pink-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <span className="mr-3">
                    {item.icone}
                  </span>

                  {item.nome}
                </button>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/dashboard";
              }}
              className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left font-black text-slate-300"
            >
              ← Voltar ao início
            </button>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-900 p-5 md:block">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-950 text-2xl">
                ✨
              </div>

              <div>
                <h1 className="text-2xl font-black text-pink-400">
                  QR Beauty
                </h1>

                <p className="text-xs text-slate-400">
                  Gestão do salão
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {MENU_BEAUTY.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => abrirTela(item.id)}
                className={`w-full rounded-xl px-4 py-3 text-left font-black transition-all ${
                  telaAtiva === item.id
                    ? "bg-pink-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span className="mr-3">
                  {item.icone}
                </span>

                {item.nome}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-pink-900 bg-pink-950/30 p-4">
            <p className="text-xs font-black text-pink-300">
              AMBIENTE DO SALÃO
            </p>

            <p className="mt-2 text-sm font-black text-white">
              Somente dados do estabelecimento
            </p>

            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Agenda, clientes, profissionais e serviços isolados
              dos demais módulos da plataforma.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
            className="mt-5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left font-black text-slate-300 transition-all hover:bg-slate-800"
          >
            ← Voltar ao início
          </button>
        </aside>

        <section className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-8">
          {telaAtiva === "dashboard" && (
            <DashboardBeauty abrirTela={abrirTela} />
          )}

          {telaAtiva === "agenda" && (
            <AgendaBeauty estabelecimentoNome="Belas Unhas" />
          )}

          {telaAtiva === "clientes" && (
            <ClienteBeauty />
          )}

          {telaAtiva === "profissionais" && (
            <ProfissionalBeauty />
          )}

          {telaAtiva === "servicos" && (
            <ServicoBeauty />
          )}

          {telaAtiva === "produtos" && (
            <ProdutoBeauty />
          )}

          {telaAtiva === "configuracoes" && (
            <TelaEmConstrucao
              icone="⚙️"
              titulo="Configurações"
              descricao="Configure dados do salão, horários, notificações e regras de atendimento."
            />
          )}
        </section>
      </div>
    </main>
  );
}

type DashboardBeautyProps = {
  abrirTela: (tela: TelaBeauty) => void;
};

function DashboardBeauty({
  abrirTela,
}: DashboardBeautyProps) {
  const [agendamentosHoje, setAgendamentosHoje] =
    useState<AgendamentoDashboard[]>([]);

  const [clientes, setClientes] =
    useState<ClienteDashboard[]>([]);

  const [profissionais, setProfissionais] =
    useState<ProfissionalDashboard[]>([]);

  const [servicos, setServicos] =
    useState<ServicoDashboard[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [
    novoAgendamento,
    setNovoAgendamento,
  ] = useState<AgendamentoDashboard | null>(null);

  const [
    agendamentoDestacadoId,
    setAgendamentoDestacadoId,
  ] = useState<string | null>(null);

  const idsAgendamentosRef = useRef<Set<string>>(
    new Set()
  );

  const monitoramentoIniciadoRef = useRef(false);
  const timerToastRef = useRef<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    let agendaCarregada = false;
    let clientesCarregados = false;
    let profissionaisCarregados = false;
    let servicosCarregados = false;

    function atualizarCarregamento() {
      if (
        agendaCarregada &&
        clientesCarregados &&
        profissionaisCarregados &&
        servicosCarregados
      ) {
        setCarregando(false);
      }
    }

    const pararAgenda = observarAgendamentos(
      dataISOHoje(),
      (lista) => {
        const listaAtual =
          lista as unknown as AgendamentoDashboard[];

        setAgendamentosHoje(listaAtual);

        const idsAtuais = new Set(
          listaAtual.map((item) => item.id)
        );

        if (!monitoramentoIniciadoRef.current) {
          idsAgendamentosRef.current = idsAtuais;
          monitoramentoIniciadoRef.current = true;
        } else {
          const novos = listaAtual.filter(
            (item) =>
              !idsAgendamentosRef.current.has(item.id) &&
              item.status !== "cancelado"
          );

          if (novos.length > 0) {
            const maisNovo = novos[novos.length - 1];
            mostrarNovoAgendamento(maisNovo);
          }

          idsAgendamentosRef.current = idsAtuais;
        }

        agendaCarregada = true;
        atualizarCarregamento();
      },
      (e) => {
        console.error(e);
        setErro(
          "Não foi possível carregar a agenda de hoje."
        );
        agendaCarregada = true;
        atualizarCarregamento();
      }
    );

    const pararClientes = observarClientes(
      (lista) => {
        setClientes(
          lista as unknown as ClienteDashboard[]
        );
        clientesCarregados = true;
        atualizarCarregamento();
      },
      (e) => {
        console.error(e);
        setErro(
          "Não foi possível carregar os clientes."
        );
        clientesCarregados = true;
        atualizarCarregamento();
      }
    );

    const pararProfissionais = observarProfissionais(
      (lista) => {
        setProfissionais(
          lista as unknown as ProfissionalDashboard[]
        );
        profissionaisCarregados = true;
        atualizarCarregamento();
      },
      (e) => {
        console.error(e);
        setErro(
          "Não foi possível carregar os profissionais."
        );
        profissionaisCarregados = true;
        atualizarCarregamento();
      }
    );

    const pararServicos = observarServicos(
      (lista) => {
        setServicos(
          lista as unknown as ServicoDashboard[]
        );
        servicosCarregados = true;
        atualizarCarregamento();
      },
      (e) => {
        console.error(e);
        setErro(
          "Não foi possível carregar os serviços."
        );
        servicosCarregados = true;
        atualizarCarregamento();
      }
    );

    return () => {
      pararAgenda();
      pararClientes();
      pararProfissionais();
      pararServicos();

      if (timerToastRef.current) {
        clearTimeout(timerToastRef.current);
      }
    };
  }, []);

  function mostrarNovoAgendamento(
    agendamento: AgendamentoDashboard
  ) {
    setNovoAgendamento(agendamento);
    setAgendamentoDestacadoId(agendamento.id);

    tocarSomNovoAgendamento();

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification(
          "Novo agendamento recebido",
          {
            body: `${agendamento.cliente} agendou ${agendamento.servico} às ${agendamento.horario}.`,
            icon: "/icon-192.png",
          }
        );
      } catch (erro) {
        console.warn(
          "Não foi possível mostrar a notificação local:",
          erro
        );
      }
    }

    if (timerToastRef.current) {
      clearTimeout(timerToastRef.current);
    }

    timerToastRef.current = setTimeout(() => {
      setNovoAgendamento(null);
      setAgendamentoDestacadoId(null);
    }, 8000);
  }

  function tocarSomNovoAgendamento() {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        880,
        audioContext.currentTime
      );

      oscillator.frequency.exponentialRampToValueAtTime(
        1320,
        audioContext.currentTime + 0.18
      );

      gainNode.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.22,
        audioContext.currentTime + 0.03
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.45
      );

      oscillator.start();
      oscillator.stop(
        audioContext.currentTime + 0.48
      );
    } catch (erro) {
      console.warn(
        "Não foi possível tocar o som:",
        erro
      );
    }
  }

  const agendamentosValidos = useMemo(() => {
    return agendamentosHoje
      .filter(
        (item) =>
          item.status !== "cancelado" &&
          item.status !== "finalizado"
      )
      .sort(
        (a, b) =>
          horarioParaMinutos(a.horario) -
          horarioParaMinutos(b.horario)
      );
  }, [agendamentosHoje]);

  const clientesAtivos = useMemo(
    () =>
      clientes.filter(
        (item) => item.status !== "inativo"
      ),
    [clientes]
  );

  const profissionaisAtivos = useMemo(
    () =>
      profissionais.filter(
        (item) => item.status !== "inativo"
      ),
    [profissionais]
  );

  const servicosAtivos = useMemo(
    () =>
      servicos.filter(
        (item) => item.status !== "inativo"
      ),
    [servicos]
  );

  const valorPrevistoHoje = useMemo(
    () =>
      agendamentosHoje
        .filter(
          (item) => item.status !== "cancelado"
        )
        .reduce(
          (total, item) =>
            total + Number(item.valor ?? 0),
          0
        ),
    [agendamentosHoje]
  );

  const atalhos: Array<{
    id: TelaBeauty;
    titulo: string;
    descricao: string;
    icone: string;
  }> = [
    {
      id: "agenda",
      titulo: "Agenda",
      descricao: "Ver horários e agendamentos",
      icone: "📅",
    },
    {
      id: "clientes",
      titulo: "Clientes",
      descricao: "Consultar e cadastrar clientes",
      icone: "👥",
    },
    {
      id: "profissionais",
      titulo: "Profissionais",
      descricao: "Gerenciar equipe e horários",
      icone: "💇",
    },
    {
      id: "servicos",
      titulo: "Serviços",
      descricao: "Cadastrar serviços e preços",
      icone: "✂️",
    },
    {
      id: "produtos",
      titulo: "Produtos",
      descricao: "Gerenciar estoque e produtos",
      icone: "📦",
    },
    {
      id: "configuracoes",
      titulo: "Configurações",
      descricao: "Dados e regras do salão",
      icone: "⚙️",
    },
  ];

  return (
    <div className="relative space-y-5">
      {novoAgendamento && (
        <div className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm animate-[pulse_0.45s_ease-in-out_1] rounded-2xl border border-emerald-500 bg-slate-900 p-4 shadow-2xl shadow-emerald-950/40">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-2xl">
              🔔
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-300">
                Novo agendamento
              </p>

              <p className="mt-1 truncate text-lg font-black text-white">
                {novoAgendamento.cliente}
              </p>

              <p className="mt-1 text-sm text-slate-300">
                {novoAgendamento.servico} •{" "}
                {novoAgendamento.horario}
              </p>

              <p className="mt-1 text-xs font-bold text-pink-300">
                {novoAgendamento.profissional}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setNovoAgendamento(null)
              }
              className="rounded-lg bg-slate-800 px-2 py-1 text-sm font-black text-slate-300"
              aria-label="Fechar aviso"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <section className="rounded-3xl border border-pink-500/30 bg-gradient-to-r from-pink-700 via-fuchsia-700 to-purple-700 p-5 shadow-xl md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black text-pink-50 backdrop-blur">
              ✨ QR BEAUTY
            </div>

            <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">
              Gestão do salão
            </h2>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-pink-50 md:text-base">
              Agenda, clientes, profissionais e serviços organizados
              em um único lugar.
            </p>

            <button
              type="button"
              onClick={() => abrirTela("agenda")}
              className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-black text-pink-700 shadow transition-all hover:bg-pink-50 active:scale-95"
            >
              Abrir agenda
            </button>

            <div className="mt-3 max-w-sm">
              <PushButton
                caminhoFirebase="beauty-v2/estabelecimentos/qr-beauty-demo/configuracoes"
                campoToken="tokenPainel"
                rotulo="🔔 Ativar notificações"
                mensagemSucesso="Notificações do salão ativadas com sucesso!"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-slate-950/20 p-4 backdrop-blur lg:min-w-72">
            <p className="text-xs font-black text-pink-100">
              HOJE NO SALÃO
            </p>

            <p className="mt-2 text-3xl font-black">
              {carregando
                ? "..."
                : `${agendamentosValidos.length} ${
                    agendamentosValidos.length === 1
                      ? "agendamento"
                      : "agendamentos"
                  }`}
            </p>

            <p className="mt-1 text-sm text-pink-100">
              {agendamentosValidos.length > 0
                ? `Próximo: ${agendamentosValidos[0].horario} — ${agendamentosValidos[0].cliente}`
                : "Nenhum horário pendente para hoje."}
            </p>

            <div className="mt-4 rounded-xl border border-white/15 bg-white/10 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-pink-100">
                Valor previsto
              </p>

              <p className="mt-1 text-xl font-black">
                {formatarMoeda(valorPrevistoHoje)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {erro && (
        <section className="rounded-2xl border border-red-800 bg-red-950/30 p-4 text-sm font-bold text-red-300">
          {erro}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador
          titulo="AGENDAMENTOS HOJE"
          valor={
            carregando
              ? "..."
              : String(agendamentosValidos.length)
          }
          detalhe={
            agendamentosValidos.length === 0
              ? "Nenhum marcado"
              : "Atendimentos pendentes"
          }
          classes="border-pink-800 bg-pink-950/25 text-pink-300"
        />

        <Indicador
          titulo="CLIENTES"
          valor={
            carregando
              ? "..."
              : String(clientesAtivos.length)
          }
          detalhe="Cadastrados"
          classes="border-blue-800 bg-blue-950/25 text-blue-300"
        />

        <Indicador
          titulo="PROFISSIONAIS"
          valor={
            carregando
              ? "..."
              : String(profissionaisAtivos.length)
          }
          detalhe="Ativos"
          classes="border-violet-800 bg-violet-950/25 text-violet-300"
        />

        <Indicador
          titulo="SERVIÇOS"
          valor={
            carregando
              ? "..."
              : String(servicosAtivos.length)
          }
          detalhe="Disponíveis"
          classes="border-emerald-800 bg-emerald-950/25 text-emerald-300"
        />
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <p className="text-xs font-black text-pink-300">
          ACESSO RÁPIDO
        </p>

        <h3 className="mt-1 text-2xl font-black">
          O que você precisa fazer?
        </h3>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {atalhos.map((atalho) => (
            <button
              key={atalho.id}
              type="button"
              onClick={() => abrirTela(atalho.id)}
              className="rounded-2xl border border-slate-700 bg-slate-800 p-4 text-left transition-all hover:border-pink-500 hover:bg-slate-700 active:scale-[0.98]"
            >
              <div className="text-4xl">
                {atalho.icone}
              </div>

              <h4 className="mt-3 text-lg font-black">
                {atalho.titulo}
              </h4>

              <p className="mt-1 text-sm text-slate-400">
                {atalho.descricao}
              </p>

              <p className="mt-4 text-xs font-black text-pink-300">
                Abrir →
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black text-cyan-300">
              PRÓXIMOS ATENDIMENTOS
            </p>

            <h3 className="mt-1 text-2xl font-black">
              Agenda de hoje
            </h3>
          </div>

          <button
            type="button"
            onClick={() => abrirTela("agenda")}
            className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-black text-slate-200 transition-all hover:bg-slate-700 active:scale-95"
          >
            Ver agenda completa
          </button>
        </div>

        {carregando ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
            <p className="font-black text-slate-300">
              Carregando agenda...
            </p>
          </div>
        ) : agendamentosValidos.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
            <div className="text-4xl">📅</div>

            <p className="mt-3 font-black text-slate-300">
              Nenhum atendimento agendado
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Os próximos clientes e horários aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {agendamentosValidos
              .slice(0, 5)
              .map((agendamento) => {
                const estaDestacado =
                  agendamento.id ===
                  agendamentoDestacadoId;

                return (
                  <div
                    key={agendamento.id}
                    className={`rounded-2xl border p-4 transition-all duration-500 ${
                      estaDestacado
                        ? "scale-[1.01] border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-950/30"
                        : "border-slate-700 bg-slate-800"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white ${
                            estaDestacado
                              ? "bg-emerald-500"
                              : "bg-pink-600"
                          }`}
                        >
                          {agendamento.horario}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-lg font-black text-white">
                            {agendamento.cliente}
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            {agendamento.servico}
                          </p>

                          <p className="mt-1 text-xs font-bold text-pink-300">
                            {agendamento.profissional}
                          </p>
                        </div>
                      </div>

                      <span className="w-fit rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs font-black capitalize text-slate-300">
                        {agendamento.status.replace(
                          "-",
                          " "
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}

type IndicadorProps = {
  titulo: string;
  valor: string;
  detalhe: string;
  classes: string;
};

function Indicador({
  titulo,
  valor,
  detalhe,
  classes,
}: IndicadorProps) {
  return (
    <div className={`rounded-2xl border p-4 ${classes}`}>
      <p className="text-[10px] font-black">
        {titulo}
      </p>

      <p className="mt-2 text-3xl font-black text-white">
        {valor}
      </p>

      <p className="mt-1 text-xs font-bold text-slate-400">
        {detalhe}
      </p>
    </div>
  );
}

type TelaEmConstrucaoProps = {
  icone: string;
  titulo: string;
  descricao: string;
};

function TelaEmConstrucao({
  icone,
  titulo,
  descricao,
}: TelaEmConstrucaoProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-pink-500/30 bg-gradient-to-r from-pink-700 to-purple-700 p-5 md:p-7">
        <p className="text-sm font-black text-pink-100">
          {icone} QR BEAUTY
        </p>

        <h2 className="mt-2 text-3xl font-black md:text-4xl">
          {titulo}
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-pink-100 md:text-base">
          {descricao}
        </p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
        <div className="text-5xl">
          {icone}
        </div>

        <h3 className="mt-4 text-2xl font-black">
          Módulo preparado
        </h3>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
          A estrutura inicial desta área já está criada.
          Agora vamos conectar os cadastros e os dados
          do Firebase do salão.
        </p>
      </section>
    </div>
  );
}
