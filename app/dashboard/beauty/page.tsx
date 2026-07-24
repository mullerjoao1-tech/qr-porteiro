"use client";

import { useState } from "react";
import AgendaBeauty from "./components/agenda/AgendaBeauty";
import ClienteBeauty from "./components/clientes/ClienteBeauty";
import ProfissionalBeauty from "./components/profissionais/ProfissionalBeauty";
import ServicoBeauty from "./components/servicos/ServicoBeauty";
import ProdutoBeauty from "./components/produtos/ProdutoBeauty";
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

export default function BeautyPage() {
  const [telaAtiva, setTelaAtiva] = useState<TelaBeauty>("dashboard");
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  function abrirTela(tela: TelaBeauty) {
    setTelaAtiva(tela);
    setMenuMobileAberto(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Cabeçalho mobile */}

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMenuMobileAberto(true)}
          className="rounded-xl bg-slate-800 px-3 py-2 text-lg font-black"
        >
          ☰
        </button>

        <div className="text-center">
          <p className="font-black text-pink-400">QR Beauty</p>
          <p className="text-[10px] text-slate-500">Gestão do salão</p>
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

      {/* Menu mobile */}

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
                  <span className="mr-3">{item.icone}</span>
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
        {/* Menu lateral desktop */}

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
                <span className="mr-3">{item.icone}</span>
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
              Agenda, clientes, profissionais e serviços isolados dos demais
              módulos da plataforma.
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

        {/* Conteúdo */}

        <section className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-8">
          {telaAtiva === "dashboard" && (
            <DashboardBeauty abrirTela={abrirTela} />
          )}

          {telaAtiva === "agenda" && (
  <AgendaBeauty estabelecimentoNome="Salão de testes QR Beauty" />
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

function DashboardBeauty({ abrirTela }: DashboardBeautyProps) {
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
    <div className="space-y-5">
      {/* Apresentação */}

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
              Agenda, clientes, profissionais e serviços organizados em um
              único lugar.
            </p>

            <button
              type="button"
              onClick={() => abrirTela("agenda")}
              className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-black text-pink-700 shadow transition-all hover:bg-pink-50 active:scale-95"
            >
              Abrir agenda
            </button>
          </div>

          <div className="rounded-2xl border border-white/20 bg-slate-950/20 p-4 backdrop-blur lg:min-w-72">
            <p className="text-xs font-black text-pink-100">
              HOJE NO SALÃO
            </p>

            <p className="mt-2 text-3xl font-black">
              0 agendamentos
            </p>

            <p className="mt-1 text-sm text-pink-100">
              Os próximos horários aparecerão aqui.
            </p>
          </div>
        </div>
      </section>

      {/* Indicadores */}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador
          titulo="AGENDAMENTOS HOJE"
          valor="0"
          detalhe="Nenhum marcado"
          classes="border-pink-800 bg-pink-950/25 text-pink-300"
        />

        <Indicador
          titulo="CLIENTES"
          valor="0"
          detalhe="Cadastrados"
          classes="border-blue-800 bg-blue-950/25 text-blue-300"
        />

        <Indicador
          titulo="PROFISSIONAIS"
          valor="0"
          detalhe="Ativos"
          classes="border-violet-800 bg-violet-950/25 text-violet-300"
        />

        <Indicador
          titulo="SERVIÇOS"
          valor="0"
          detalhe="Disponíveis"
          classes="border-emerald-800 bg-emerald-950/25 text-emerald-300"
        />
      </section>

      {/* Acesso rápido */}

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
              <div className="text-4xl">{atalho.icone}</div>

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

      {/* Próximos atendimentos */}

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

        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
          <div className="text-4xl">📅</div>

          <p className="mt-3 font-black text-slate-300">
            Nenhum atendimento agendado
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Os próximos clientes e horários aparecerão aqui.
          </p>
        </div>
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
        <div className="text-5xl">{icone}</div>

        <h3 className="mt-4 text-2xl font-black">
          Módulo preparado
        </h3>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
          A estrutura inicial desta área já está criada. Agora vamos conectar
          os cadastros e os dados do Firebase do salão.
        </p>
      </section>
    </div>
  );
}