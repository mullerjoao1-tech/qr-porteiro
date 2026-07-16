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
