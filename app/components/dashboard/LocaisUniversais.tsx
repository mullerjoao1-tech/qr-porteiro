"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../../services/firebase";

type TipoLocalUniversal =
  | "condominio"
  | "beauty"
  | "barbearia"
  | "clinica"
  | "empresa"
  | "residencia"
  | "restaurante"
  | "outro";

type LocalUniversal = {
  id: string;
  nome: string;
  slug: string;
  tipoLocal: TipoLocalUniversal;
  status?: string;
  ativo?: boolean;
  cidade?: string;
  estado?: string;
  endereco?: string;
  criadoEm?: number | string;
  responsaveis?: Record<string, {
    uid?: string;
    nome?: string;
    email?: string;
    telefone?: string;
    perfil?: string;
    ativo?: boolean;
  }>;
  implantacao?: {
    status?: string;
    tipoImplantacao?: string;
    implantadoEm?: number | string;
  };
};

function iconeTipo(tipo: TipoLocalUniversal) {
  const icones: Record<TipoLocalUniversal, string> = {
    condominio: "🏢",
    beauty: "💇",
    barbearia: "💈",
    clinica: "🏥",
    empresa: "🏭",
    residencia: "🏠",
    restaurante: "🍽️",
    outro: "📍",
  };

  return icones[tipo] || "📍";
}

function nomeTipo(tipo: TipoLocalUniversal) {
  const nomes: Record<TipoLocalUniversal, string> = {
    condominio: "Condomínio",
    beauty: "Beauty",
    barbearia: "Barbearia",
    clinica: "Clínica",
    empresa: "Empresa",
    residencia: "Residência",
    restaurante: "Restaurante",
    outro: "Outro",
  };

  return nomes[tipo] || tipo;
}

function formatarData(valor?: number | string) {
  if (!valor) return "Data não informada";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return String(valor);
  }

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function obterResponsavel(local: LocalUniversal) {
  const responsaveis = Object.values(local.responsaveis || {});

  return (
    responsaveis.find((responsavel) => responsavel.ativo !== false) ||
    responsaveis[0]
  );
}

export default function LocaisUniversais() {
  const [locais, setLocais] = useState<LocalUniversal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [localSelecionado, setLocalSelecionado] =
    useState<LocalUniversal | null>(null);

  useEffect(() => {
    const locaisRef = ref(db, "locais-v2");

    const desligar = onValue(
      locaisRef,
      (snapshot) => {
        const dados = snapshot.val();

        if (!dados) {
          setLocais([]);
          setCarregando(false);
          return;
        }

        const lista = Object.entries(dados)
          .map(([id, valor]) => ({
            id,
            ...(valor as Omit<LocalUniversal, "id">),
          }))
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

        setLocais(lista);
        setCarregando(false);
      },
      (erro) => {
        console.error("Erro ao carregar locais-v2:", erro);
        setLocais([]);
        setCarregando(false);
      }
    );

    return () => desligar();
  }, []);

  const locaisFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return locais.filter((local) => {
      const passaBusca =
        !termo ||
        [
          local.nome,
          local.slug,
          local.id,
          local.tipoLocal,
          local.cidade,
          local.estado,
          local.endereco,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(termo);

      const passaTipo =
        filtroTipo === "todos" || local.tipoLocal === filtroTipo;

      return passaBusca && passaTipo;
    });
  }, [locais, busca, filtroTipo]);

  const totalAtivos = locais.filter(
    (local) => local.ativo !== false && local.status !== "inativo"
  ).length;

  const totalResidencias = locais.filter(
    (local) => local.tipoLocal === "residencia"
  ).length;

  const totalCondominios = locais.filter(
    (local) => local.tipoLocal === "condominio"
  ).length;

  function abrirAcesso(local: LocalUniversal) {
    window.open(
      `/acesso-v2/${local.slug}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function copiarLink(local: LocalUniversal) {
    const link = `${window.location.origin}/acesso-v2/${local.slug}`;

    try {
      await navigator.clipboard.writeText(link);
      alert("Link copiado.");
    } catch (erro) {
      console.error("Erro ao copiar link:", erro);
      alert("Não foi possível copiar o link.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-600 p-5 text-white md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-100">🌐 QR CORE</p>
            <h2 className="mt-1 text-3xl font-black md:text-4xl">
              Cadastro Universal
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-blue-100 md:text-base">
              Todos os locais implantados pelo novo motor do QR Core,
              independentemente do segmento.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-xs font-black text-blue-100">BASE FIREBASE</p>
            <p className="mt-1 text-lg font-black">locais-v2</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-xs font-bold text-slate-400">TOTAL</p>
          <p className="mt-2 text-3xl font-black">{locais.length}</p>
        </div>

        <div className="rounded-2xl border border-green-800 bg-green-950/25 p-4">
          <p className="text-xs font-bold text-green-300">ATIVOS</p>
          <p className="mt-2 text-3xl font-black">{totalAtivos}</p>
        </div>

        <div className="rounded-2xl border border-blue-800 bg-blue-950/25 p-4">
          <p className="text-xs font-bold text-blue-300">CONDOMÍNIOS</p>
          <p className="mt-2 text-3xl font-black">{totalCondominios}</p>
        </div>

        <div className="rounded-2xl border border-cyan-800 bg-cyan-950/25 p-4">
          <p className="text-xs font-bold text-cyan-300">RESIDÊNCIAS</p>
          <p className="mt-2 text-3xl font-black">{totalResidencias}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Pesquisar por nome, slug, cidade ou tipo..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
          />

          <select
            value={filtroTipo}
            onChange={(event) => setFiltroTipo(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
          >
            <option value="todos">Todos os tipos</option>
            <option value="condominio">🏢 Condomínio</option>
            <option value="residencia">🏠 Residência</option>
            <option value="beauty">💇 Beauty</option>
            <option value="barbearia">💈 Barbearia</option>
            <option value="clinica">🏥 Clínica</option>
            <option value="empresa">🏭 Empresa</option>
            <option value="restaurante">🍽️ Restaurante</option>
            <option value="outro">📍 Outro</option>
          </select>
        </div>

        <p className="mt-3 text-sm text-slate-400">
          {locaisFiltrados.length} local
          {locaisFiltrados.length === 1 ? "" : "is"} encontrado
          {locaisFiltrados.length === 1 ? "" : "s"}.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <p className="text-xs font-black text-blue-300">LOCAIS IMPLANTADOS</p>
        <h3 className="mt-1 text-2xl font-black">Ecossistema QR</h3>

        {carregando ? (
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
            <p className="font-black text-slate-300">Carregando locais...</p>
          </div>
        ) : locaisFiltrados.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
            <div className="text-4xl">🌐</div>
            <p className="mt-3 font-black text-slate-300">
              Nenhum local encontrado
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Os locais implantados pelo Cadastro Universal aparecerão aqui
              automaticamente.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {locaisFiltrados.map((local) => {
              const responsavel = obterResponsavel(local);
              const ativo =
                local.ativo !== false && local.status !== "inativo";

              return (
                <article
                  key={local.id}
                  className="flex h-full flex-col rounded-2xl border border-slate-700 bg-slate-800 p-4 transition-all hover:border-blue-500"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-3xl">
                      {iconeTipo(local.tipoLocal)}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black ${
                        ativo
                          ? "bg-green-950 text-green-300"
                          : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      {ativo ? "🟢 ATIVO" : "⚪ INATIVO"}
                    </span>
                  </div>

                  <p className="mt-4 text-xs font-black text-blue-300">
                    {nomeTipo(local.tipoLocal)}
                  </p>

                  <h4 className="mt-1 text-xl font-black text-white">
                    {local.nome}
                  </h4>

                  <p className="mt-2 break-all text-sm text-slate-400">
                    Slug: {local.slug}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    📍 {local.cidade || "Cidade não informada"}
                    {local.estado ? `/${local.estado}` : ""}
                  </p>

                  <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-3">
                    <p className="text-[10px] font-black text-slate-500">
                      RESPONSÁVEL
                    </p>
                    <p className="mt-1 font-bold text-slate-200">
                      {responsavel?.nome || "Não informado"}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {responsavel?.email || "E-mail não informado"}
                    </p>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Implantado em: {formatarData(
                      local.implantacao?.implantadoEm || local.criadoEm
                    )}
                  </p>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <button
                      type="button"
                      onClick={() => setLocalSelecionado(local)}
                      className="rounded-xl bg-slate-700 px-3 py-2.5 text-sm font-black text-white transition-all hover:bg-slate-600 active:scale-95"
                    >
                      Ver detalhes
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirAcesso(local)}
                      className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-black text-white transition-all hover:bg-blue-500 active:scale-95"
                    >
                      Abrir acesso
                    </button>

                    <button
                      type="button"
                      onClick={() => copiarLink(local)}
                      className="col-span-2 rounded-xl border border-cyan-700 bg-cyan-950/30 px-3 py-2.5 text-sm font-black text-cyan-300 transition-all hover:bg-cyan-950/60 active:scale-95"
                    >
                      🔗 Copiar link
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {localSelecionado && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-3 md:p-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-blue-300">
                  {iconeTipo(localSelecionado.tipoLocal)} {nomeTipo(
                    localSelecionado.tipoLocal
                  )}
                </p>
                <h3 className="mt-1 text-2xl font-black">
                  {localSelecionado.nome}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setLocalSelecionado(null)}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-xl font-black hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ["ID", localSelecionado.id],
                ["Slug", localSelecionado.slug],
                ["Tipo", nomeTipo(localSelecionado.tipoLocal)],
                ["Status", localSelecionado.status || "ativo"],
                ["Endereço", localSelecionado.endereco || "Não informado"],
                [
                  "Cidade/Estado",
                  `${localSelecionado.cidade || "Não informado"}${
                    localSelecionado.estado
                      ? `/${localSelecionado.estado}`
                      : ""
                  }`,
                ],
                [
                  "Implantação",
                  localSelecionado.implantacao?.status || "Não informada",
                ],
              ].map(([titulo, valor]) => (
                <div
                  key={titulo}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-3"
                >
                  <p className="text-[10px] font-black text-slate-500">
                    {titulo}
                  </p>
                  <p className="mt-1 break-all font-bold text-slate-200">
                    {valor}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => copiarLink(localSelecionado)}
                className="rounded-xl bg-slate-700 py-3 font-black hover:bg-slate-600"
              >
                Copiar link
              </button>

              <button
                type="button"
                onClick={() => abrirAcesso(localSelecionado)}
                className="rounded-xl bg-blue-600 py-3 font-black hover:bg-blue-500"
              >
                Abrir acesso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
