"use client";

import { useEffect, useState } from "react";
import { get, ref, onValue, push, set, update } from "firebase/database";
import { db } from "../services/firebase";
import Unidades from "../components/dashboard/Unidades";
import Moradores from "../components/dashboard/Moradores";
import AtualizacaoPendenteModal from "./AtualizacaoPendenteModal";
import UnidadeImplantacaoModal from "./UnidadeImplantacaoModal";
import CentralSindico from "./sindico/CentralSindico";

type Tela =
  | "dashboard"
  | "sindico"
  | "locais"
  | "unidades"
  | "moradores"
  | "planos"
  | "pendentes"
  | "implantacao"
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
  implantacao?: {
    status?: string;
    protocolo?: string;
    enviadoEm?: string;
    iniciadoEm?: string;
    atualizadoEm?: string;
    aprovadoEm?: string;
    implantadoEm?: string;
    quantidadeMoradores?: number;
    ultimaSolicitacaoId?: string;
    aprovadoPor?: string;
  };
};

type AtualizacaoCadastral = {
  id: string;
  codigo: string;
  condominioId: string;
  condominioNome: string;
  condominioSlug?: string;
  unidadeId: string;
  unidadeCodigo?: string;
  unidadeNome: string;
  bloco?: string;
  nomeUnidade?: string;
  nome: string;
  telefone: string;
  email?: string;
  perfil: string;
  recebeChamadas: boolean;
  status: string;
  origem?: string;
  criadoEm: string;
  atualizadoEm?: string;
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
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [localAberto, setLocalAberto] = useState<LocalCadastrado | null>(null);
  const [atualizacaoSelecionada, setAtualizacaoSelecionada] =
    useState<AtualizacaoCadastral | null>(null);
  const [unidadeImplantacaoSelecionada, setUnidadeImplantacaoSelecionada] =
    useState<
      | (UnidadeCadastrada & {
          statusImplantacao?: string;
          moradoresDaUnidade?: MoradorCadastrado[];
          pendenciaDaUnidade?: AtualizacaoCadastral | null;
        })
      | null
    >(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindoLocal, setExcluindoLocal] = useState(false);
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
  const [atualizacoesCadastrais, setAtualizacoesCadastrais] =
    useState<AtualizacaoCadastral[]>([]);
  const [filtroImplantacao, setFiltroImplantacao] = useState<
    "todos" | "acao" | "implantadas" | "sem-cadastro"
  >("acao");

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

  useEffect(() => {
    const atualizacoesRef = ref(
      db,
      "qrCentral/atualizacoesCadastrais"
    );

    const desligar = onValue(atualizacoesRef, (snapshot) => {
      const dados = snapshot.val();

      if (!dados) {
        setAtualizacoesCadastrais([]);
        return;
      }

      const lista = Object.entries(dados)
        .map(([id, valor]: any) => ({
          id,
          ...valor,
        }))
        .sort((a, b) =>
          String(b.criadoEm || "").localeCompare(
            String(a.criadoEm || "")
          )
        );

      setAtualizacoesCadastrais(lista);
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

  function abrirUnidadesDoLocal(local: LocalCadastrado) {
    setLocalSelecionadoId(local.id);
    setLocalAberto(null);
    setTelaAtiva("unidades");
  }

  async function excluirLocalTesteCompleto(local: LocalCadastrado) {
    if (excluindoLocal) return;

    const confirmacao = window.confirm(
      [
        "ATENÇÃO: excluir este local de teste por completo?",
        "",
        `Local: ${local.nome}`,
        "",
        "Esta ação excluirá:",
        "• o local;",
        "• todas as unidades dele;",
        "• todos os moradores vinculados;",
        "• todas as atualizações cadastrais;",
        "• todo o histórico de implantação dessas unidades;",
        "",
        "Esta ação não pode ser desfeita.",
      ].join("\n")
    );

    if (!confirmacao) return;

    const nomeDigitado = window.prompt(
      `Para confirmar, digite exatamente o nome do local:\n\n${local.nome}`
    );

    if (nomeDigitado !== local.nome) {
      alert("Nome diferente. A exclusão foi cancelada.");
      return;
    }

    setExcluindoLocal(true);

    try {
      const [unidadesSnapshot, moradoresSnapshot, atualizacoesSnapshot] =
        await Promise.all([
          get(ref(db, "qrCentral/unidades")),
          get(ref(db, "qrCentral/moradores")),
          get(ref(db, "qrCentral/atualizacoesCadastrais")),
        ]);

      const unidadesDados = unidadesSnapshot.val() || {};
      const moradoresDados = moradoresSnapshot.val() || {};
      const atualizacoesDados = atualizacoesSnapshot.val() || {};

      const idsUnidadesDoLocal = Object.entries(unidadesDados)
        .filter(([, valor]) => {
          const unidade = valor as { localId?: string };
          return unidade.localId === local.id;
        })
        .map(([id]) => id);

      const idsUnidadesSet = new Set(idsUnidadesDoLocal);
      const alteracoes: Record<string, null> = {};

      idsUnidadesDoLocal.forEach((unidadeId) => {
        alteracoes[`qrCentral/unidades/${unidadeId}`] = null;
      });

      Object.entries(moradoresDados).forEach(([id, valor]) => {
        const morador = valor as { unidadeId?: string; localId?: string };

        if (
          morador.localId === local.id ||
          (morador.unidadeId && idsUnidadesSet.has(morador.unidadeId))
        ) {
          alteracoes[`qrCentral/moradores/${id}`] = null;
        }
      });

      Object.entries(atualizacoesDados).forEach(([id, valor]) => {
        const atualizacao = valor as {
          condominioId?: string;
          unidadeId?: string;
        };

        if (
          atualizacao.condominioId === local.id ||
          (atualizacao.unidadeId &&
            idsUnidadesSet.has(atualizacao.unidadeId))
        ) {
          alteracoes[`qrCentral/atualizacoesCadastrais/${id}`] = null;
        }
      });

      alteracoes[`qrCentral/locais/${local.id}`] = null;

      await update(ref(db), alteracoes);

      alert(`O local "${local.nome}" e todos os dados de teste foram excluídos.`);

      setLocalSelecionadoId("");
      setLocalAberto(null);
      setTelaAtiva("locais");
    } catch (erro) {
      console.error("Erro ao excluir local de teste:", erro);
      alert(
        "Não foi possível excluir o local. Verifique o terminal antes de tentar novamente."
      );
    } finally {
      setExcluindoLocal(false);
    }
  }

  const atualizacoesPendentes = atualizacoesCadastrais.filter(
    (item) => item.status === "pendente"
  );

  function textoPerfil(perfil?: string) {
    const perfis: Record<string, string> = {
      proprietario: "Proprietário",
      inquilino: "Inquilino",
      familiar: "Familiar",
      morador: "Morador",
      funcionario: "Funcionário",
      outro: "Outro",
    };

    return perfis[perfil || ""] || perfil || "Não informado";
  }

  function formatarDataHora(data?: string) {
    if (!data) return "Data não informada";

    const valor = new Date(data);

    if (Number.isNaN(valor.getTime())) {
      return data;
    }

    return valor.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function textoStatusImplantacao(status?: string) {
    const statusConhecidos: Record<string, string> = {
      "sem-cadastro": "🔴 Sem cadastro",
      "link-enviado": "🔵 Link enviado",
      "cadastro-iniciado": "🟡 Cadastro iniciado",
      "aguardando-analise": "🟠 Aguardando análise",
      "correcao-solicitada": "🟣 Correção solicitada",
      aprovado: "🟢 Aprovado",
      implantado: "✅ Implantado",
    };

    return statusConhecidos[status || ""] || "🔴 Sem cadastro";
  }

  function classesStatusImplantacao(status?: string) {
    if (status === "implantado") {
      return "border-green-700 bg-green-950/40 text-green-300";
    }

    if (status === "aprovado") {
      return "border-emerald-700 bg-emerald-950/40 text-emerald-300";
    }

    if (status === "aguardando-analise") {
      return "border-orange-700 bg-orange-950/40 text-orange-300";
    }

    if (status === "cadastro-iniciado") {
      return "border-yellow-700 bg-yellow-950/40 text-yellow-300";
    }

    if (status === "link-enviado") {
      return "border-blue-700 bg-blue-950/40 text-blue-300";
    }

    if (status === "correcao-solicitada") {
      return "border-purple-700 bg-purple-950/40 text-purple-300";
    }

    return "border-slate-700 bg-slate-800/70 text-slate-300";
  }

  function prioridadeStatusImplantacao(status?: string) {
    const prioridades: Record<string, number> = {
      "aguardando-analise": 1,
      "correcao-solicitada": 2,
      "cadastro-iniciado": 3,
      "link-enviado": 4,
      "sem-cadastro": 5,
      aprovado: 6,
      implantado: 7,
    };

    return prioridades[status || "sem-cadastro"] || 99;
  }

  function unidadePassaNoFiltro(status?: string) {
    if (filtroImplantacao === "todos") return true;

    if (filtroImplantacao === "implantadas") {
      return status === "implantado" || status === "aprovado";
    }

    if (filtroImplantacao === "sem-cadastro") {
      return status === "sem-cadastro";
    }

    return (
      status === "aguardando-analise" ||
      status === "correcao-solicitada" ||
      status === "cadastro-iniciado" ||
      status === "link-enviado"
    );
  }

  const unidadesComImplantacao = unidades.map((unidade) => {
    const moradoresDaUnidade = moradores.filter(
      (morador) =>
        morador.unidadeId === unidade.id &&
        morador.status === "ativo"
    );

    const pendenciaDaUnidade = atualizacoesCadastrais.find(
      (item) =>
        item.unidadeId === unidade.id &&
        item.status === "pendente"
    );

    let statusImplantacao =
      unidade.implantacao?.status || "sem-cadastro";

    if (
      statusImplantacao === "sem-cadastro" &&
      pendenciaDaUnidade
    ) {
      statusImplantacao = "aguardando-analise";
    }

    if (
      statusImplantacao === "sem-cadastro" &&
      moradoresDaUnidade.length > 0
    ) {
      statusImplantacao = "implantado";
    }

    return {
      ...unidade,
      statusImplantacao,
      moradoresDaUnidade,
      pendenciaDaUnidade,
    };
  });

  const totalUnidadesImplantacao = unidadesComImplantacao.length;

  const totalImplantadas = unidadesComImplantacao.filter(
    (unidade) =>
      unidade.statusImplantacao === "implantado" ||
      unidade.statusImplantacao === "aprovado"
  ).length;

  const totalAguardandoAnalise = unidadesComImplantacao.filter(
    (unidade) =>
      unidade.statusImplantacao === "aguardando-analise"
  ).length;

  const totalCadastroIniciado = unidadesComImplantacao.filter(
    (unidade) =>
      unidade.statusImplantacao === "cadastro-iniciado"
  ).length;

  const totalSemCadastro = unidadesComImplantacao.filter(
    (unidade) =>
      unidade.statusImplantacao === "sem-cadastro"
  ).length;

  const percentualImplantacao =
    totalUnidadesImplantacao > 0
      ? Math.round(
          (totalImplantadas / totalUnidadesImplantacao) * 100
        )
      : 0;

  const locaisComUnidades = locais
    .map((local) => ({
      local,
      unidades: unidadesComImplantacao.filter(
        (unidade) => unidade.localId === local.id
      ),
    }))
    .filter((grupo) => grupo.unidades.length > 0);

  const localSelecionado = locais.find((item) => item.id === localSelecionadoId);
  const modoCondominio = localSelecionado?.tipo === "condominio";

  const menu: {
  id: Tela;
  nome: string;
  icone: string;
}[] = [
    { id: "dashboard", nome: "Dashboard", icone: "🏠" },
  { id: "sindico", nome: "Síndico", icone: "🏢" },
    { id: "locais", nome: "Locais", icone: "🏢" },
    { id: "unidades", nome: "Unidades", icone: "🚪" },
    { id: "moradores", nome: "Moradores", icone: "👥" },
    { id: "planos", nome: "Planos", icone: "💳" },
    { id: "pendentes", nome: "Pendentes", icone: "⏳" },
    { id: "implantacao", nome: "Implantação", icone: "🚀" },
    { id: "contingencia", nome: "Contingência", icone: "🛟" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 md:hidden">
        <button onClick={()=>setMenuMobileAberto(true)} className="rounded-xl bg-slate-800 px-3 py-2">☰</button>
        <span className="font-black text-blue-400">QR Central</span>
        <div className="w-8"/>
      </header>

      {menuMobileAberto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={()=>setMenuMobileAberto(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-slate-900 p-5">
            <nav className="space-y-2">
              {menu.map((item)=>(
                <button key={item.id} onClick={()=>{setTelaAtiva(item.id as Tela);setMenuMobileAberto(false);}} className="w-full rounded-xl bg-slate-800 px-4 py-3 text-left">
                  <span className="mr-2">{item.icone}</span>{item.nome}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

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
                onClick={() => { setTelaAtiva(item.id as Tela); setMenuMobileAberto(false); }}
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

        <section className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-8">
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
                  <p className="text-3xl font-black mt-2">
                    {atualizacoesPendentes.length}
                  </p>
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
{telaAtiva === "sindico" && (
  <CentralSindico />
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
    onClick={() => setLocalAberto(local)}
    className="bg-slate-800 rounded-xl p-4 border border-slate-700 cursor-pointer hover:border-blue-500 hover:bg-slate-700 transition-all"
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


          {telaAtiva === "pendentes" && (
            <div>
              <h2 className="text-3xl font-black text-blue-300 mb-2">
                Pendentes
              </h2>

              <p className="text-slate-400 mb-6">
                Atualizações cadastrais enviadas pelos moradores e aguardando
                análise.
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                  <p className="text-slate-400 text-sm">Total recebido</p>
                  <p className="text-3xl font-black mt-2">
                    {atualizacoesCadastrais.length}
                  </p>
                </div>

                <div className="bg-yellow-950/40 rounded-2xl p-5 border border-yellow-800">
                  <p className="text-yellow-300 text-sm font-bold">
                    🟡 Aguardando análise
                  </p>
                  <p className="text-3xl font-black mt-2">
                    {atualizacoesPendentes.length}
                  </p>
                </div>

                <div className="bg-green-950/40 rounded-2xl p-5 border border-green-800 col-span-2 lg:col-span-1">
                  <p className="text-green-300 text-sm font-bold">
                    ✅ Já analisadas
                  </p>
                  <p className="text-3xl font-black mt-2">
                    {
                      atualizacoesCadastrais.filter(
                        (item) => item.status !== "pendente"
                      ).length
                    }
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-800">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-2xl font-black">
                      Atualizações cadastrais
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Nesta etapa, apenas conferimos se os dados enviados estão
                      chegando corretamente.
                    </p>
                  </div>
                </div>

                {atualizacoesPendentes.length === 0 ? (
                  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
                    <p className="text-lg font-black text-slate-300">
                      Nenhuma atualização pendente
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      As novas solicitações aparecerão aqui automaticamente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {atualizacoesPendentes.map((solicitacao) => (
                      <div
                        key={solicitacao.id}
                        className="bg-slate-800 rounded-2xl p-4 md:p-5 border border-slate-700"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black text-yellow-300 bg-yellow-950/50 border border-yellow-800 px-3 py-1 rounded-full">
                                🟡 Pendente
                              </span>

                              <span className="text-xs font-black text-blue-300">
                                {solicitacao.codigo}
                              </span>
                            </div>

                            <h4 className="text-xl font-black mt-3">
                              👤 {solicitacao.nome}
                            </h4>

                            <p className="text-sm text-slate-300 mt-2">
                              🏢 {solicitacao.condominioNome}
                            </p>

                            <p className="text-sm text-slate-300">
                              🏠 {solicitacao.unidadeNome}
                            </p>

                            <p className="text-sm text-slate-400 mt-2">
                              📱 {solicitacao.telefone}
                            </p>

                            {solicitacao.email && (
                              <p className="text-sm text-slate-400">
                                ✉️ {solicitacao.email}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-slate-300 font-bold">
                                {textoPerfil(solicitacao.perfil)}
                              </span>

                              <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-cyan-300 font-bold">
                                {solicitacao.recebeChamadas
                                  ? "🔔 Recebe chamadas"
                                  : "🔕 Não recebe chamadas"}
                              </span>
                            </div>
                          </div>

                          <div className="md:text-right">
                            <p className="text-xs text-slate-500 font-bold">
                              RECEBIDO EM
                            </p>
                            <p className="text-sm text-slate-300 font-bold mt-1">
                              {formatarDataHora(solicitacao.criadoEm)}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                setAtualizacaoSelecionada(solicitacao)
                              }
                              className="w-full md:w-auto mt-4 bg-blue-600 hover:bg-blue-500 text-white font-black px-5 py-3 rounded-xl"
                            >
                              Visualizar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {telaAtiva === "implantacao" && (
            <div>
              <h2 className="text-3xl font-black text-blue-300 mb-2">
                Implantação
              </h2>

              <p className="text-slate-400 mb-6">
                Acompanhe o andamento do cadastro das unidades em tempo real.
              </p>

              <div className="bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-800 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div>
                    <p className="text-sm font-black text-blue-300">
                      PROGRESSO GERAL
                    </p>

                    <p className="text-4xl font-black mt-2">
                      {percentualImplantacao}%
                    </p>

                    <p className="text-sm text-slate-400 mt-1">
                      {totalImplantadas} de {totalUnidadesImplantacao} unidade(s)
                      concluída(s).
                    </p>
                  </div>

                  <div className="flex-1 max-w-2xl">
                    <div className="h-5 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-green-500 transition-all duration-500"
                        style={{
                          width: `${percentualImplantacao}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="bg-green-950/40 border border-green-800 rounded-2xl p-4">
                  <p className="text-xs text-green-300 font-black">
                    ✅ Implantadas
                  </p>
                  <p className="text-3xl font-black mt-2">
                    {totalImplantadas}
                  </p>
                </div>

                <div className="bg-orange-950/40 border border-orange-800 rounded-2xl p-4">
                  <p className="text-xs text-orange-300 font-black">
                    🟠 Aguardando análise
                  </p>
                  <p className="text-3xl font-black mt-2">
                    {totalAguardandoAnalise}
                  </p>
                </div>

                <div className="bg-yellow-950/40 border border-yellow-800 rounded-2xl p-4">
                  <p className="text-xs text-yellow-300 font-black">
                    🟡 Cadastro iniciado
                  </p>
                  <p className="text-3xl font-black mt-2">
                    {totalCadastroIniciado}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
                  <p className="text-xs text-slate-300 font-black">
                    ⚪ Sem cadastro
                  </p>
                  <p className="text-3xl font-black mt-2">
                    {totalSemCadastro}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
                <p className="text-xs font-black text-slate-400 mb-3">
                  MOSTRAR
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "acao", nome: "⚡ Precisa de ação" },
                    { id: "todos", nome: "Todas" },
                    { id: "implantadas", nome: "✅ Implantadas" },
                    { id: "sem-cadastro", nome: "⚪ Sem cadastro" },
                  ].map((filtro) => (
                    <button
                      key={filtro.id}
                      type="button"
                      onClick={() =>
                        setFiltroImplantacao(
                          filtro.id as
                            | "todos"
                            | "acao"
                            | "implantadas"
                            | "sem-cadastro"
                        )
                      }
                      className={`px-4 py-2 rounded-xl text-sm font-black border transition-all ${
                        filtroImplantacao === filtro.id
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {filtro.nome}
                    </button>
                  ))}
                </div>
              </div>

              {locaisComUnidades.length === 0 ? (
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center">
                  <p className="text-lg font-black text-slate-300">
                    Nenhuma unidade cadastrada
                  </p>

                  <p className="text-sm text-slate-500 mt-2">
                    Cadastre as unidades para iniciar o acompanhamento da implantação.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {locaisComUnidades.map(({ local, unidades: unidadesDoLocal }) => {
                    const blocosDoLocal = Array.from(
                      new Set(
                        unidadesDoLocal.map(
                          (unidade) => unidade.bloco || "Sem bloco"
                        )
                      )
                    ).sort((a, b) =>
                      a.localeCompare(b, "pt-BR", {
                        numeric: true,
                      })
                    );

                    const implantadasDoLocal = unidadesDoLocal.filter(
                      (unidade) =>
                        unidade.statusImplantacao === "implantado" ||
                        unidade.statusImplantacao === "aprovado"
                    ).length;

                    const percentualLocal =
                      unidadesDoLocal.length > 0
                        ? Math.round(
                            (implantadasDoLocal /
                              unidadesDoLocal.length) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        key={local.id}
                        className="bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-800"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                          <div>
                            <p className="text-xs font-black text-blue-300">
                              {local.codigo || "LOCAL"}
                            </p>

                            <h3 className="text-2xl font-black mt-1">
                              🏢 {local.nome}
                            </h3>

                            <p className="text-sm text-slate-400 mt-1">
                              {implantadasDoLocal} de {unidadesDoLocal.length} unidade(s)
                              implantada(s).
                            </p>
                          </div>

                          <div className="min-w-[180px]">
                            <p className="text-2xl font-black text-right">
                              {percentualLocal}%
                            </p>

                            <div className="h-3 rounded-full bg-slate-800 border border-slate-700 overflow-hidden mt-2">
                              <div
                                className="h-full bg-green-500"
                                style={{
                                  width: `${percentualLocal}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-5">
                          {blocosDoLocal.map((bloco) => {
                            const unidadesDoBloco =
                              unidadesDoLocal.filter(
                                (unidade) =>
                                  (unidade.bloco || "Sem bloco") ===
                                  bloco
                              );

                            const implantadasDoBloco =
                              unidadesDoBloco.filter(
                                (unidade) =>
                                  unidade.statusImplantacao === "implantado" ||
                                  unidade.statusImplantacao === "aprovado"
                              ).length;

                            const percentualBloco =
                              unidadesDoBloco.length > 0
                                ? Math.round(
                                    (implantadasDoBloco /
                                      unidadesDoBloco.length) *
                                      100
                                  )
                                : 0;

                            const unidadesVisiveis =
                              unidadesDoBloco
                                .filter((unidade) =>
                                  unidadePassaNoFiltro(
                                    unidade.statusImplantacao
                                  )
                                )
                                .sort((a, b) => {
                                  const prioridade =
                                    prioridadeStatusImplantacao(
                                      a.statusImplantacao
                                    ) -
                                    prioridadeStatusImplantacao(
                                      b.statusImplantacao
                                    );

                                  if (prioridade !== 0) {
                                    return prioridade;
                                  }

                                  return a.nome.localeCompare(
                                    b.nome,
                                    "pt-BR",
                                    { numeric: true }
                                  );
                                });

                            return (
                              <div key={bloco}>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                                  <div>
                                    <h4 className="text-lg font-black text-slate-200">
                                      {bloco === "Sem bloco"
                                        ? "Unidades"
                                        : `Bloco ${bloco}`}
                                    </h4>

                                    <p className="text-xs text-slate-500 mt-1">
                                      {implantadasDoBloco} de {unidadesDoBloco.length} implantada(s)
                                    </p>
                                  </div>

                                  <div className="w-full md:w-64">
                                    <div className="flex justify-between text-xs font-black mb-1">
                                      <span className="text-slate-400">
                                        Progresso
                                      </span>
                                      <span className="text-green-300">
                                        {percentualBloco}%
                                      </span>
                                    </div>

                                    <div className="h-2.5 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                                      <div
                                        className="h-full bg-green-500"
                                        style={{
                                          width: `${percentualBloco}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {unidadesVisiveis.length === 0 ? (
                                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-center text-sm text-slate-500">
                                    Nenhuma unidade neste filtro.
                                  </div>
                                ) : (
                                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {unidadesVisiveis.map((unidade) => (
                                      <button
                                        key={unidade.id}
                                        type="button"
                                        onClick={() =>
                                          setUnidadeImplantacaoSelecionada(
                                            unidade
                                          )
                                        }
                                        className={`text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${classesStatusImplantacao(
                                          unidade.statusImplantacao
                                        )}`}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <p className="text-xs font-black opacity-80">
                                              {unidade.codigo}
                                            </p>

                                            <p className="text-xl font-black text-white mt-1">
                                              🏠{" "}
                                              {unidade.bloco
                                                ? `${unidade.bloco} / ${unidade.nome}`
                                                : unidade.nome}
                                            </p>
                                          </div>

                                          <span className="text-xs font-black text-right">
                                            {textoStatusImplantacao(
                                              unidade.statusImplantacao
                                            )}
                                          </span>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                          <span className="text-xs rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-slate-300">
                                            👥 {unidade.moradoresDaUnidade.length}
                                          </span>

                                          {unidade.implantacao?.protocolo && (
                                            <span className="text-xs rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-slate-400">
                                              📋 Protocolo
                                            </span>
                                          )}
                                        </div>

                                        {unidade.pendenciaDaUnidade && (
                                          <p className="mt-3 text-xs font-black text-orange-200">
                                            Clique para visualizar a pendência
                                          </p>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {telaAtiva !== "dashboard" &&
            telaAtiva !== "sindico" &&
            telaAtiva !== "locais" &&
            telaAtiva !== "unidades" &&
            telaAtiva !== "moradores" &&
            telaAtiva !== "pendentes" &&
            telaAtiva !== "implantacao" && (
              <div>
                <h2 className="text-3xl font-black text-blue-300 mb-2">
                  {menu.find((item) => item.id === telaAtiva)?.nome}
                </h2>

                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mt-6">
                  Esta tela será construída na próxima etapa.
                </div>
              </div>
            )}
            {unidadeImplantacaoSelecionada && (
              <UnidadeImplantacaoModal
                unidade={unidadeImplantacaoSelecionada}
                moradores={moradores}
                pendencia={
                  unidadeImplantacaoSelecionada.pendenciaDaUnidade || null
                }
                onClose={() =>
                  setUnidadeImplantacaoSelecionada(null)
                }
                onVisualizarPendencia={(pendencia) => {
                  setUnidadeImplantacaoSelecionada(null);
                  setTelaAtiva("pendentes");
                  setAtualizacaoSelecionada(pendencia);
                }}
              />
            )}

            {atualizacaoSelecionada && (
              <AtualizacaoPendenteModal
                atualizacao={atualizacaoSelecionada}
                onClose={() => setAtualizacaoSelecionada(null)}
              />
            )}

            {localAberto && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-3xl max-h-[92vh] overflow-y-auto border border-slate-700">
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <div>
                      <p className="text-blue-400 font-bold">
                        {localAberto.codigo}
                      </p>

                      <h2 className="text-3xl font-black">
                        {localAberto.nome}
                      </h2>

                      <p className="text-slate-400 mt-2">
                        {localAberto.cidade}/{localAberto.estado}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLocalAberto(null)}
                      disabled={excluindoLocal}
                      className="bg-red-600 hover:bg-red-500 disabled:bg-slate-700 px-4 py-2 rounded-xl font-bold"
                    >
                      Fechar
                    </button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-800 rounded-xl p-4">
                      <p className="text-slate-400 text-sm">
                        Unidades
                      </p>
                      <p className="text-3xl font-black">
                        {
                          unidades.filter(
                            (unidade) =>
                              unidade.localId === localAberto.id
                          ).length
                        }
                      </p>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4">
                      <p className="text-slate-400 text-sm">
                        Moradores
                      </p>
                      <p className="text-3xl font-black">
                        {
                          moradores.filter((morador) =>
                            unidades.some(
                              (unidade) =>
                                unidade.id === morador.unidadeId &&
                                unidade.localId === localAberto.id
                            )
                          ).length
                        }
                      </p>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4">
                      <p className="text-slate-400 text-sm">
                        QR Principal
                      </p>
                      <p className="text-sm font-bold mt-2 break-all">
                        {localAberto.qrPrincipal}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => abrirUnidadesDoLocal(localAberto)}
                      disabled={excluindoLocal}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-xl py-3 font-bold"
                    >
                      Ver unidades
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirUnidadesDoLocal(localAberto)}
                      disabled={excluindoLocal}
                      className="bg-green-600 hover:bg-green-500 disabled:bg-slate-700 rounded-xl py-3 font-bold"
                    >
                      Adicionar unidade
                    </button>
                  </div>

                  <div className="mt-6 rounded-2xl border border-red-900 bg-red-950/20 p-4">
                    <p className="font-black text-red-300">
                      🧪 Limpeza de ambiente de teste
                    </p>

                    <p className="mt-2 text-sm leading-relaxed text-red-100/80">
                      Exclui este local e todos os dados ligados a ele:
                      unidades, moradores, solicitações e implantação.
                      Use somente para cadastros fictícios.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        excluirLocalTesteCompleto(localAberto)
                      }
                      disabled={excluindoLocal}
                      className="mt-4 w-full bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-400 rounded-xl py-3 font-black"
                    >
                      {excluindoLocal
                        ? "Excluindo local e dados..."
                        : "🗑️ Excluir local de teste completo"}
                    </button>
                  </div>
                </div>
              </div>
            )}

        </section>
      </div>
    </main>
  );
}
