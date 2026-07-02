"use client";

import { useEffect, useState } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "../services/firebase";
import Unidades from "../components/dashboard/Unidades";
import Moradores from "../components/dashboard/Moradores";

type Tela =
  | "dashboard"
  | "locais"
  | "unidades"
  | "moradores"
  | "planos"
  | "pendentes"
  | "contingencia";

type LocalCadastrado = {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  cidade: string;
  estado: string;
  slug: string;
  status: string;
  plano: string;
  qrPrincipal: string;
  criadoEm: string;
};

type UnidadeCadastrada = {
  id: string;
  codigo: string;
  localId: string;
  localNome: string;
  tipoLocal: string;
  bloco: string;
  nome: string;
  tipo: string;
  modoChamado?: string;
  status: string;
  criadoEm: string;
};

type MoradorCadastrado = {
  id: string;
  codigo: string;
  nome: string;
  telefone: string;
  unidadeId: string;
  unidadeNome: string;
  prioridade: number;
  podeAbrirPortao: boolean;
  status: string;
  criadoEm: string;
};

export default function Dashboard() {
  const [telaAtiva, setTelaAtiva] = useState<Tela>("dashboard");

  const [salvando, setSalvando] = useState(false);
  const [salvandoUnidade, setSalvandoUnidade] = useState(false);
  const [salvandoMorador, setSalvandoMorador] = useState(false);

  const [nomeLocal, setNomeLocal] = useState("");
  const [tipoLocal, setTipoLocal] = useState("condominio");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("PR");
  const [plano, setPlano] = useState("residencial");

  const [localSelecionadoId, setLocalSelecionadoId] = useState("");
  const [blocoUnidade, setBlocoUnidade] = useState("");
  const [nomeUnidade, setNomeUnidade] = useState("");
  const [tipoUnidade, setTipoUnidade] = useState("apartamento");
  const [modoChamadoUnidade, setModoChamadoUnidade] = useState("familia");

  const [unidadeMoradorId, setUnidadeMoradorId] = useState("");
  const [nomeMorador, setNomeMorador] = useState("");
  const [telefoneMorador, setTelefoneMorador] = useState("");
  const [prioridadeMorador, setPrioridadeMorador] = useState("1");
  const [podeAbrirPortao, setPodeAbrirPortao] = useState(false);

  const [locais, setLocais] = useState<LocalCadastrado[]>([]);
  const [unidades, setUnidades] = useState<UnidadeCadastrada[]>([]);
  const [moradores, setMoradores] = useState<MoradorCadastrado[]>([]);

  useEffect(() => {
    const locaisRef = ref(db, "qrCentral/locais");

    const desligar = onValue(locaisRef, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setLocais([]);
        return;
      }

      const lista = Object.entries(dados).map(([id, valor]: any) => ({
        id,
        ...valor,
      }));

      setLocais(lista);
    });

    return () => desligar();
  }, []);

  useEffect(() => {
    const unidadesRef = ref(db, "qrCentral/unidades");

    const desligar = onValue(unidadesRef, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setUnidades([]);
        return;
      }

      const lista = Object.entries(dados).map(([id, valor]: any) => ({
        id,
        ...valor,
      }));

      setUnidades(lista);
    });

    return () => desligar();
  }, []);

  useEffect(() => {
    const moradoresRef = ref(db, "qrCentral/moradores");

    const desligar = onValue(moradoresRef, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setMoradores([]);
        return;
      }

      const lista = Object.entries(dados).map(([id, valor]: any) => ({
        id,
        ...valor,
      }));

      setMoradores(lista);
    });

    return () => desligar();
  }, []);

  function gerarSlug(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function formatarNome(texto: string) {
    return texto
      .trim()
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(" ");
  }

  function formatarTextoTipo(texto: string) {
    const nomes: any = {
      condominio: "Condomínio",
      casa: "Casa",
      airbnb: "Airbnb",
      chacara: "Chácara",
      empresa: "Empresa",
      portaria: "Portaria",
      apartamento: "Apartamento",
      sala: "Sala",
      loja: "Loja",
      quarto: "Quarto",
      chale: "Chalé",
      livre: "Livre",
    };

    return nomes[texto] || texto;
  }

  function montarNomeUnidade(unidade: UnidadeCadastrada) {
    return unidade.bloco
      ? `${unidade.bloco}/${unidade.nome}`
      : unidade.nome;
  }

  async function cadastrarLocal() {
    if (!nomeLocal.trim()) {
      alert("Digite o nome do local.");
      return;
    }

    if (!cidade.trim()) {
      alert("Digite a cidade.");
      return;
    }

    setSalvando(true);

    try {
      const locaisRef = ref(db, "qrCentral/locais");
      const novoLocalRef = push(locaisRef);

      const nomeFormatado = formatarNome(nomeLocal);
      const cidadeFormatada = formatarNome(cidade);
      const estadoFormatado = estado.trim().toUpperCase();
      const slug = gerarSlug(nomeFormatado);
      const codigo = `LOC-${String(locais.length + 1).padStart(4, "0")}`;

      await set(novoLocalRef, {
        codigo,
        nome: nomeFormatado,
        tipo: tipoLocal,
        cidade: cidadeFormatada,
        estado: estadoFormatado,
        slug,
        status: "ativo",
        plano,
        qrPrincipal: `/acesso/${slug}`,
        criadoEm: new Date().toISOString(),
      });

      setNomeLocal("");
      setTipoLocal("condominio");
      setCidade("");
      setEstado("PR");
      setPlano("residencial");

      alert("Local cadastrado com sucesso.");
    } catch (erro) {
      console.error(erro);
      alert("Erro ao cadastrar local.");
    } finally {
      setSalvando(false);
    }
  }

  async function cadastrarUnidade() {
    if (!localSelecionadoId) {
      alert("Selecione um local.");
      return;
    }

    const local = locais.find((item) => item.id === localSelecionadoId);

    if (!local) {
      alert("Local não encontrado.");
      return;
    }

    if (!nomeUnidade.trim()) {
      alert("Digite o nome ou número da unidade.");
      return;
    }

    if (local.tipo === "condominio" && !blocoUnidade.trim()) {
      alert("Para condomínio, informe o bloco/torre.");
      return;
    }

    setSalvandoUnidade(true);

    try {
      const unidadesRef = ref(db, "qrCentral/unidades");
      const novaUnidadeRef = push(unidadesRef);

      const codigo = `UNI-${String(unidades.length + 1).padStart(4, "0")}`;

      await set(novaUnidadeRef, {
        codigo,
        localId: local.id,
        localNome: local.nome,
        tipoLocal: local.tipo,
        bloco: local.tipo === "condominio" ? formatarNome(blocoUnidade) : "",
        nome: formatarNome(nomeUnidade),
        tipo: tipoUnidade,
        modoChamado: modoChamadoUnidade,
        status: "ativa",
        criadoEm: new Date().toISOString(),
      });

      setBlocoUnidade("");
      setNomeUnidade("");
      setTipoUnidade(local.tipo === "condominio" ? "apartamento" : "livre");
      setModoChamadoUnidade("familia");

      alert("Unidade cadastrada com sucesso.");
    } catch (erro) {
      console.error(erro);
      alert("Erro ao cadastrar unidade.");
    } finally {
      setSalvandoUnidade(false);
    }
  }

  async function cadastrarMorador() {
    if (!unidadeMoradorId) {
      alert("Selecione uma unidade.");
      return;
    }

    const unidade = unidades.find((item) => item.id === unidadeMoradorId);

    if (!unidade) {
      alert("Unidade não encontrada.");
      return;
    }

    if (!nomeMorador.trim()) {
      alert("Digite o nome do morador.");
      return;
    }

    if (!telefoneMorador.trim()) {
      alert("Digite o telefone/WhatsApp do morador.");
      return;
    }

    setSalvandoMorador(true);

    try {
      const moradoresRef = ref(db, "qrCentral/moradores");
      const novoMoradorRef = push(moradoresRef);

      const codigo = `MOR-${String(moradores.length + 1).padStart(4, "0")}`;
      const unidadeNome = `${unidade.localNome} • ${montarNomeUnidade(unidade)}`;

      await set(novoMoradorRef, {
        codigo,
        nome: formatarNome(nomeMorador),
        telefone: telefoneMorador.trim(),
        unidadeId: unidade.id,
        unidadeNome,
        prioridade: Number(prioridadeMorador),
        podeAbrirPortao,
        status: "ativo",
        criadoEm: new Date().toISOString(),
      });

      setNomeMorador("");
      setTelefoneMorador("");
      setPrioridadeMorador("1");
      setPodeAbrirPortao(false);

      alert("Morador cadastrado com sucesso.");
    } catch (erro) {
      console.error(erro);
      alert("Erro ao cadastrar morador.");
    } finally {
      setSalvandoMorador(false);
    }
  }

  const localSelecionado = locais.find((item) => item.id === localSelecionadoId);
  const modoCondominio = localSelecionado?.tipo === "condominio";

  const menu = [
    { id: "dashboard", nome: "Dashboard", icone: "🏠" },
    { id: "locais", nome: "Locais", icone: "🏢" },
    { id: "unidades", nome: "Unidades", icone: "🚪" },
    { id: "moradores", nome: "Moradores", icone: "👥" },
    { id: "planos", nome: "Planos", icone: "💳" },
    { id: "pendentes", nome: "Pendentes", icone: "⏳" },
    { id: "contingencia", nome: "Contingência", icone: "🛟" },
  ] as const;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside className="w-72 bg-slate-900 border-r border-slate-800 p-5 hidden md:block">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <img src="/logo-oficial.png" alt="QR Acesso" className="h-12" />

              <div>
                <h1 className="text-2xl font-black text-blue-400">
                  QR Central
                </h1>
                <p className="text-xs text-slate-400">Admin Master V2</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {menu.map((item) => (
              <button
                key={item.id}
                onClick={() => setTelaAtiva(item.id as Tela)}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${
                  telaAtiva === item.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span className="mr-2">{item.icone}</span>
                {item.nome}
              </button>
            ))}
          </nav>

          <div className="mt-8 bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-xs text-slate-400">Piloto atual protegido</p>
            <p className="text-sm font-bold text-green-400 mt-1">
              qr1 até qr5 intactos
            </p>
          </div>
        </aside>

        <section className="flex-1 p-4 md:p-8">
          {telaAtiva === "dashboard" && (
            <div>
              <h2 className="text-3xl font-black text-blue-300 mb-2">
                Dashboard Geral
              </h2>

              <p className="text-slate-400 mb-8">
                Visão geral do QR Central V2 sem alterar o piloto atual.
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                  <p className="text-slate-400 text-sm">Locais</p>
                  <p className="text-3xl font-black mt-2">{locais.length}</p>
                </div>

                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                  <p className="text-slate-400 text-sm">Unidades</p>
                  <p className="text-3xl font-black mt-2">
                    {unidades.length}
                  </p>
                </div>

                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                  <p className="text-slate-400 text-sm">Moradores</p>
                  <p className="text-3xl font-black mt-2">
                    {moradores.length}
                  </p>
                </div>

                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                  <p className="text-slate-400 text-sm">Pendentes</p>
                  <p className="text-3xl font-black mt-2">0</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 shadow-lg">
                <h3 className="text-2xl font-black mb-2">
                  Estrutura V2 iniciada
                </h3>
                <p className="font-semibold">
                  1 QR principal por local/portaria, várias unidades e vários
                  moradores por unidade.
                </p>
              </div>
            </div>
          )}

          {telaAtiva === "locais" && (
            <div>
              <h2 className="text-3xl font-black text-blue-300 mb-2">
                Locais
              </h2>

              <p className="text-slate-400 mb-8">
                Cadastre condomínios, casas, chácaras, airbnbs ou portarias.
              </p>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <h3 className="text-2xl font-bold mb-5">
                    Cadastrar novo local
                  </h3>

                  <div className="space-y-4">
                    <input
                      value={nomeLocal}
                      onChange={(e) => setNomeLocal(e.target.value)}
                      placeholder="Ex: Residencial Mar Azul"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                    />

                    <select
                      value={tipoLocal}
                      onChange={(e) => setTipoLocal(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                    >
                      <option value="condominio">Condomínio</option>
                      <option value="casa">Casa</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="chacara">Chácara</option>
                      <option value="empresa">Empresa</option>
                      <option value="portaria">Portaria</option>
                    </select>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        placeholder="Cidade"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                      />

                      <input
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        placeholder="Estado"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                      />
                    </div>

                    <select
                      value={plano}
                      onChange={(e) => setPlano(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                    >
                      <option value="residencial">Residencial</option>
                      <option value="residencial-pro">Residencial Pro</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="condominio">Condomínio</option>
                      <option value="teste-piloto">Teste Piloto</option>
                    </select>

                    <button
                      onClick={cadastrarLocal}
                      disabled={salvando}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-black py-3 rounded-xl"
                    >
                      {salvando ? "Salvando..." : "Cadastrar local"}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <h3 className="text-2xl font-bold mb-5">
                    Locais cadastrados
                  </h3>

                  <div className="space-y-3">
                    {locais.map((local) => (
                      <div
                        key={local.id}
                        className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                      >
                        <p className="text-xs text-blue-300 font-bold">
                          {local.codigo || "LOC"}
                        </p>

                        <h4 className="text-lg font-black">{local.nome}</h4>

                        <p className="text-sm text-slate-400 mt-1">
                          {formatarTextoTipo(local.tipo)} • {local.cidade}/
                          {local.estado}
                        </p>

                        <p className="text-xs text-blue-300 mt-2">
                          QR principal:{" "}
                          {local.qrPrincipal || `/acesso/${local.slug}`}
                        </p>
                      </div>
                    ))}

                    {locais.length === 0 && (
                      <div className="bg-slate-800 rounded-xl p-4 text-slate-400">
                        Nenhum local cadastrado ainda.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {telaAtiva === "unidades" && (
            <Unidades
              modoChamadoUnidade={modoChamadoUnidade}
              setModoChamadoUnidade={setModoChamadoUnidade}
              locais={locais}
              unidades={unidades}
              localSelecionadoId={localSelecionadoId}
              setLocalSelecionadoId={(valor) => {
                setLocalSelecionadoId(valor);

                const local = locais.find((item) => item.id === valor);

                if (local?.tipo === "condominio") {
                  setTipoUnidade("apartamento");
                } else {
                  setTipoUnidade("livre");
                }
              }}
              blocoUnidade={blocoUnidade}
              setBlocoUnidade={setBlocoUnidade}
              nomeUnidade={nomeUnidade}
              setNomeUnidade={setNomeUnidade}
              tipoUnidade={tipoUnidade}
              setTipoUnidade={setTipoUnidade}
              modoCondominio={modoCondominio}
              cadastrarUnidade={cadastrarUnidade}
              salvandoUnidade={salvandoUnidade}
            />
          )}

          {telaAtiva === "moradores" && (
            <Moradores
              unidades={unidades}
              moradores={moradores}
              unidadeMoradorId={unidadeMoradorId}
              setUnidadeMoradorId={setUnidadeMoradorId}
              nomeMorador={nomeMorador}
              setNomeMorador={setNomeMorador}
              telefoneMorador={telefoneMorador}
              setTelefoneMorador={setTelefoneMorador}
              prioridadeMorador={prioridadeMorador}
              setPrioridadeMorador={setPrioridadeMorador}
              podeAbrirPortao={podeAbrirPortao}
              setPodeAbrirPortao={setPodeAbrirPortao}
              cadastrarMorador={cadastrarMorador}
              salvandoMorador={salvandoMorador}
            />
          )}

          {telaAtiva !== "dashboard" &&
            telaAtiva !== "locais" &&
            telaAtiva !== "unidades" &&
            telaAtiva !== "moradores" && (
              <div>
                <h2 className="text-3xl font-black text-blue-300 mb-2">
                  {menu.find((item) => item.id === telaAtiva)?.nome}
                </h2>

                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mt-6">
                  Esta tela será construída na próxima etapa.
                </div>
              </div>
            )}
        </section>
      </div>
    </main>
  );
}
