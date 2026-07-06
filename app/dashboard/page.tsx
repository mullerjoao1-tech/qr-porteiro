"use client";

import { useEffect, useState } from "react";
import { ref, onValue, push, set, update, remove } from "firebase/database";
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

type ResponsavelAdministrativo = {
  nome: string;
  telefone: string;
  email: string;
  podeSolicitarAlteracaoStatus: boolean;
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
  possuiResponsavel?: boolean;
  responsavelAdministrativo?: ResponsavelAdministrativo | null;
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
  const [unidadeParaAbrirId, setUnidadeParaAbrirId] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [salvandoUnidade, setSalvandoUnidade] = useState(false);
  const [salvandoMorador, setSalvandoMorador] = useState(false);
  const [salvandoLote, setSalvandoLote] = useState(false);
  const [salvandoEdicaoUnidade, setSalvandoEdicaoUnidade] = useState(false);

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
  const [statusUnidade, setStatusUnidade] = useState("pendente");
  const [possuiResponsavel, setPossuiResponsavel] = useState(false);
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [telefoneResponsavel, setTelefoneResponsavel] = useState("");
  const [emailResponsavel, setEmailResponsavel] = useState("");

  const [loteAberto, setLoteAberto] = useState(false);
  const [loteLocalSelecionadoId, setLoteLocalSelecionadoId] = useState("");
  const [textoLoteUnidades, setTextoLoteUnidades] = useState("");
  const [blocoLote, setBlocoLote] = useState("");
  const [tipoLote, setTipoLote] = useState("apartamento");
  const [modoChamadoLote, setModoChamadoLote] = useState("familia");
  const [statusLote, setStatusLote] = useState("pendente");

  const [editandoUnidade, setEditandoUnidade] =
    useState<UnidadeCadastrada | null>(null);
  const [editBlocoUnidade, setEditBlocoUnidade] = useState("");
  const [editNomeUnidade, setEditNomeUnidade] = useState("");
  const [editTipoUnidade, setEditTipoUnidade] = useState("apartamento");
  const [editModoChamadoUnidade, setEditModoChamadoUnidade] =
    useState("familia");
  const [editStatusUnidade, setEditStatusUnidade] = useState("pendente");
  const [editPossuiResponsavel, setEditPossuiResponsavel] = useState(false);
  const [editNomeResponsavel, setEditNomeResponsavel] = useState("");
  const [editTelefoneResponsavel, setEditTelefoneResponsavel] = useState("");
  const [editEmailResponsavel, setEditEmailResponsavel] = useState("");

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

  function normalizarUnidadeParaComparar(bloco: string, nome: string) {
    return `${bloco.trim().toLowerCase()}|${nome.trim().toLowerCase()}`;
  }

  function separarUnidadesDoTexto(texto: string) {
    return texto
      .split(/[\n,; ]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function abrirEdicaoUnidade(unidade: UnidadeCadastrada) {
    setEditandoUnidade(unidade);
    setEditBlocoUnidade(unidade.bloco || "");
    setEditNomeUnidade(unidade.nome || "");
    setEditTipoUnidade(unidade.tipo || "apartamento");
    setEditModoChamadoUnidade(unidade.modoChamado || "familia");
    setEditStatusUnidade(unidade.status || "pendente");
    setEditPossuiResponsavel(Boolean(unidade.possuiResponsavel));

    setEditNomeResponsavel(
      unidade.responsavelAdministrativo?.nome || ""
    );
    setEditTelefoneResponsavel(
      unidade.responsavelAdministrativo?.telefone || ""
    );
    setEditEmailResponsavel(
      unidade.responsavelAdministrativo?.email || ""
    );
  }

  function fecharEdicaoUnidade() {
    setEditandoUnidade(null);
    setEditBlocoUnidade("");
    setEditNomeUnidade("");
    setEditTipoUnidade("apartamento");
    setEditModoChamadoUnidade("familia");
    setEditStatusUnidade("pendente");
    setEditPossuiResponsavel(false);
    setEditNomeResponsavel("");
    setEditTelefoneResponsavel("");
    setEditEmailResponsavel("");
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

    if (possuiResponsavel && !nomeResponsavel.trim()) {
      alert("Digite o nome do responsável administrativo.");
      return;
    }

    const blocoFinal = local.tipo === "condominio" ? formatarNome(blocoUnidade) : "";
    const nomeFinal = formatarNome(nomeUnidade);

    const jaExiste = unidades.some(
      (unidade) =>
        unidade.localId === local.id &&
        normalizarUnidadeParaComparar(unidade.bloco || "", unidade.nome) ===
          normalizarUnidadeParaComparar(blocoFinal, nomeFinal)
    );

    if (jaExiste) {
      alert("Esta unidade já está cadastrada neste local.");
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
        bloco: blocoFinal,
        nome: nomeFinal,
        tipo: tipoUnidade,
        modoChamado: modoChamadoUnidade,
        status: statusUnidade,
        possuiResponsavel,
        responsavelAdministrativo: possuiResponsavel
          ? {
              nome: formatarNome(nomeResponsavel),
              telefone: telefoneResponsavel.trim(),
              email: emailResponsavel.trim(),
              podeSolicitarAlteracaoStatus: true,
            }
          : null,
        criadoEm: new Date().toISOString(),
      });

      setBlocoUnidade("");
      setNomeUnidade("");
      setTipoUnidade(local.tipo === "condominio" ? "apartamento" : "livre");
      setModoChamadoUnidade("familia");
      setStatusUnidade("pendente");
      setPossuiResponsavel(false);
      setNomeResponsavel("");
      setTelefoneResponsavel("");
      setEmailResponsavel("");

      alert("Unidade cadastrada com sucesso.");
    } catch (erro) {
      console.error(erro);
      alert("Erro ao cadastrar unidade.");
    } finally {
      setSalvandoUnidade(false);
    }
  }

  async function cadastrarUnidadesEmLote() {
    if (!loteLocalSelecionadoId) {
      alert("Selecione um local antes de cadastrar em lote.");
      return;
    }

    const local = locais.find((item) => item.id === loteLocalSelecionadoId);

    if (!local) {
      alert("Local não encontrado.");
      return;
    }

    if (local.tipo === "condominio" && !blocoLote.trim()) {
      alert("Informe o bloco/torre para o cadastro em lote.");
      return;
    }

    const nomesExtraidos = separarUnidadesDoTexto(textoLoteUnidades);

    if (nomesExtraidos.length === 0) {
      alert("Digite ou cole pelo menos uma unidade.");
      return;
    }

    const blocoFinal = local.tipo === "condominio" ? formatarNome(blocoLote) : "";

    const unicosNoTexto: string[] = [];
    const repetidosNoTexto: string[] = [];

    nomesExtraidos.forEach((nome) => {
      const nomeFormatado = formatarNome(nome);
      const chave = normalizarUnidadeParaComparar(blocoFinal, nomeFormatado);

      const jaEntrou = unicosNoTexto.some(
        (existente) =>
          normalizarUnidadeParaComparar(blocoFinal, existente) === chave
      );

      if (jaEntrou) {
        repetidosNoTexto.push(nomeFormatado);
      } else {
        unicosNoTexto.push(nomeFormatado);
      }
    });

    const jaExistem = unicosNoTexto.filter((nome) =>
      unidades.some(
        (unidade) =>
          unidade.localId === local.id &&
          normalizarUnidadeParaComparar(unidade.bloco || "", unidade.nome) ===
            normalizarUnidadeParaComparar(blocoFinal, nome)
      )
    );

    const paraCriar = unicosNoTexto.filter(
      (nome) =>
        !jaExistem.some(
          (existente) =>
            normalizarUnidadeParaComparar(blocoFinal, existente) ===
            normalizarUnidadeParaComparar(blocoFinal, nome)
        )
    );

    if (paraCriar.length === 0) {
      alert("Nenhuma unidade nova para cadastrar. Todas já existem ou estão repetidas.");
      return;
    }

    const confirmar = confirm(
      `Criar ${paraCriar.length} unidade(s)?` +
        (jaExistem.length > 0
          ? `\n\nJá existem e serão ignoradas:\n${jaExistem.join(", ")}`
          : "") +
        (repetidosNoTexto.length > 0
          ? `\n\nRepetidas no texto e serão ignoradas:\n${repetidosNoTexto.join(", ")}`
          : "")
    );

    if (!confirmar) return;

    setSalvandoLote(true);

    try {
      const unidadesRef = ref(db, "qrCentral/unidades");
      const agora = new Date().toISOString();

      await Promise.all(
        paraCriar.map((nome, index) => {
          const novaUnidadeRef = push(unidadesRef);
          const codigo = `UNI-${String(unidades.length + index + 1).padStart(
            4,
            "0"
          )}`;

          return set(novaUnidadeRef, {
            codigo,
            localId: local.id,
            localNome: local.nome,
            tipoLocal: local.tipo,
            bloco: blocoFinal,
            nome,
            tipo: tipoLote,
            modoChamado: modoChamadoLote,
            status: statusLote,
            possuiResponsavel: false,
            responsavelAdministrativo: null,
            criadoEm: agora,
          });
        })
      );

      setLoteLocalSelecionadoId("");
      setTextoLoteUnidades("");
      setBlocoLote("");
      setTipoLote(local.tipo === "condominio" ? "apartamento" : "livre");
      setModoChamadoLote("familia");
      setStatusLote("pendente");
      setLoteAberto(false);

      alert(
        `${paraCriar.length} unidade(s) cadastrada(s) com sucesso.` +
          (jaExistem.length > 0
            ? `\n\nIgnoradas porque já existiam: ${jaExistem.join(", ")}`
            : "") +
          (repetidosNoTexto.length > 0
            ? `\n\nRepetidas ignoradas: ${repetidosNoTexto.join(", ")}`
            : "")
      );
    } catch (erro) {
      console.error(erro);
      alert("Erro ao cadastrar unidades em lote.");
    } finally {
      setSalvandoLote(false);
    }
  }

  async function salvarEdicaoUnidade() {
    if (!editandoUnidade) return;

    const local = locais.find((item) => item.id === editandoUnidade.localId);

    if (!local) {
      alert("Local da unidade não encontrado.");
      return;
    }

    if (!editNomeUnidade.trim()) {
      alert("Digite o nome ou número da unidade.");
      return;
    }

    if (local.tipo === "condominio" && !editBlocoUnidade.trim()) {
      alert("Para condomínio, informe o bloco/torre.");
      return;
    }

    if (editPossuiResponsavel && !editNomeResponsavel.trim()) {
      alert("Digite o nome do responsável administrativo.");
      return;
    }

    const blocoFinal =
      local.tipo === "condominio" ? formatarNome(editBlocoUnidade) : "";
    const nomeFinal = formatarNome(editNomeUnidade);

    const jaExiste = unidades.some(
      (unidade) =>
        unidade.id !== editandoUnidade.id &&
        unidade.localId === editandoUnidade.localId &&
        normalizarUnidadeParaComparar(unidade.bloco || "", unidade.nome) ===
          normalizarUnidadeParaComparar(blocoFinal, nomeFinal)
    );

    if (jaExiste) {
      alert("Já existe outra unidade com este bloco/nome neste local.");
      return;
    }

    setSalvandoEdicaoUnidade(true);

    try {
      const unidadeRef = ref(db, `qrCentral/unidades/${editandoUnidade.id}`);

      await update(unidadeRef, {
        bloco: blocoFinal,
        nome: nomeFinal,
        tipo: editTipoUnidade,
        modoChamado: editModoChamadoUnidade,
        status: editStatusUnidade,
        possuiResponsavel: editPossuiResponsavel,
        responsavelAdministrativo: editPossuiResponsavel
          ? {
              nome: formatarNome(editNomeResponsavel),
              telefone: editTelefoneResponsavel.trim(),
              email: editEmailResponsavel.trim(),
              podeSolicitarAlteracaoStatus: true,
            }
          : null,
        atualizadoEm: new Date().toISOString(),
      });

      alert("Unidade atualizada com sucesso.");
      fecharEdicaoUnidade();
    } catch (erro) {
      console.error(erro);
      alert("Erro ao atualizar unidade.");
    } finally {
      setSalvandoEdicaoUnidade(false);
    }
  }

  async function excluirUnidade(unidade: UnidadeCadastrada) {
    const moradoresDaUnidade = moradores.filter(
      (morador) => morador.unidadeId === unidade.id
    );

    if (moradoresDaUnidade.length > 0) {
      alert(
        `Esta unidade possui ${moradoresDaUnidade.length} morador(es). Remova ou transfira os moradores antes de excluir.`
      );
      return;
    }

    const confirmar = confirm(
      `Excluir a unidade ${montarNomeUnidade(unidade)}?\n\nEsta ação não pode ser desfeita.`
    );

    if (!confirmar) return;

    try {
      const unidadeRef = ref(db, `qrCentral/unidades/${unidade.id}`);
      await remove(unidadeRef);
      alert("Unidade excluída com sucesso.");
    } catch (erro) {
      console.error(erro);
      alert("Erro ao excluir unidade.");
    }
  }

  async function desativarUnidade(unidade: UnidadeCadastrada) {
    const confirmar = confirm(
      `Desativar a unidade ${montarNomeUnidade(unidade)}?`
    );

    if (!confirmar) return;

    try {
      const unidadeRef = ref(db, `qrCentral/unidades/${unidade.id}`);
      await update(unidadeRef, {
        status: "desativada",
        atualizadoEm: new Date().toISOString(),
      });

      alert("Unidade desativada com sucesso.");
    } catch (erro) {
      console.error(erro);
      alert("Erro ao desativar unidade.");
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

  function abrirUnidadePeloMorador(unidadeId: string) {
    const unidade = unidades.find((item) => item.id === unidadeId);

    if (!unidade) {
      alert("Unidade não localizada.");
      return;
    }

    setLocalSelecionadoId(unidade.localId);
    setUnidadeParaAbrirId(unidade.id);
    setTelaAtiva("unidades");
  }

  const localSelecionado = locais.find((item) => item.id === localSelecionadoId);
  const modoCondominio = localSelecionado?.tipo === "condominio";

  const unidadesPendentes = unidades.filter(
    (unidade) => unidade.status === "pendente"
  );

  const unidadesAtivas = unidades.filter(
    (unidade) => unidade.status === "ativa"
  );

  const unidadesDesativadas = unidades.filter(
    (unidade) => unidade.status === "desativada"
  );

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
                  <p className="text-3xl font-black mt-2">
                    {unidadesPendentes.length}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-green-950/40 rounded-2xl p-5 border border-green-800">
                  <p className="text-green-300 text-sm font-bold">
                    🟢 Ativas
                  </p>
                  <p className="text-3xl font-black mt-2">
                    {unidadesAtivas.length}
                  </p>
                </div>

                <div className="bg-yellow-950/40 rounded-2xl p-5 border border-yellow-800">
                  <p className="text-yellow-300 text-sm font-bold">
                    🟡 Pendentes
                  </p>
                  <p className="text-3xl font-black mt-2">
                    {unidadesPendentes.length}
                  </p>
                </div>

                <div className="bg-red-950/40 rounded-2xl p-5 border border-red-800">
                  <p className="text-red-300 text-sm font-bold">
                    🔴 Desativadas
                  </p>
                  <p className="text-3xl font-black mt-2">
                    {unidadesDesativadas.length}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 shadow-lg">
                <h3 className="text-2xl font-black mb-2">
                  Estrutura V2 iniciada
                </h3>
                <p className="font-semibold">
                  1 QR principal por local/portaria, várias unidades, vários
                  moradores por unidade e responsável administrativo opcional.
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
                      placeholder="Ex: Residencial Tulipas"
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
              moradores={moradores}
              unidadeParaAbrirId={unidadeParaAbrirId}
              limparUnidadeParaAbrir={() => setUnidadeParaAbrirId("")}
              localSelecionadoId={localSelecionadoId}
              setLocalSelecionadoId={(valor) => {
                setLocalSelecionadoId(valor);

                const local = locais.find((item) => item.id === valor);

                if (local?.tipo === "condominio") {
                  setTipoUnidade("apartamento");
                  setTipoLote("apartamento");
                } else {
                  setTipoUnidade("livre");
                  setTipoLote("livre");
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
              statusUnidade={statusUnidade}
              setStatusUnidade={setStatusUnidade}
              possuiResponsavel={possuiResponsavel}
              setPossuiResponsavel={setPossuiResponsavel}
              nomeResponsavel={nomeResponsavel}
              setNomeResponsavel={setNomeResponsavel}
              telefoneResponsavel={telefoneResponsavel}
              setTelefoneResponsavel={setTelefoneResponsavel}
              emailResponsavel={emailResponsavel}
              setEmailResponsavel={setEmailResponsavel}
              loteAberto={loteAberto}
              setLoteAberto={setLoteAberto}
              loteLocalSelecionadoId={loteLocalSelecionadoId}
              setLoteLocalSelecionadoId={(valor) => {
                setLoteLocalSelecionadoId(valor);

                const local = locais.find((item) => item.id === valor);

                if (local?.tipo === "condominio") {
                  setTipoLote("apartamento");
                } else {
                  setTipoLote("livre");
                  setBlocoLote("");
                }
              }}
              textoLoteUnidades={textoLoteUnidades}
              setTextoLoteUnidades={setTextoLoteUnidades}
              blocoLote={blocoLote}
              setBlocoLote={setBlocoLote}
              tipoLote={tipoLote}
              setTipoLote={setTipoLote}
              modoChamadoLote={modoChamadoLote}
              setModoChamadoLote={setModoChamadoLote}
              statusLote={statusLote}
              setStatusLote={setStatusLote}
              cadastrarUnidadesEmLote={cadastrarUnidadesEmLote}
              salvandoLote={salvandoLote}
              editandoUnidade={editandoUnidade}
              abrirEdicaoUnidade={abrirEdicaoUnidade}
              fecharEdicaoUnidade={fecharEdicaoUnidade}
              salvarEdicaoUnidade={salvarEdicaoUnidade}
              salvandoEdicaoUnidade={salvandoEdicaoUnidade}
              editBlocoUnidade={editBlocoUnidade}
              setEditBlocoUnidade={setEditBlocoUnidade}
              editNomeUnidade={editNomeUnidade}
              setEditNomeUnidade={setEditNomeUnidade}
              editTipoUnidade={editTipoUnidade}
              setEditTipoUnidade={setEditTipoUnidade}
              editModoChamadoUnidade={editModoChamadoUnidade}
              setEditModoChamadoUnidade={setEditModoChamadoUnidade}
              editStatusUnidade={editStatusUnidade}
              setEditStatusUnidade={setEditStatusUnidade}
              editPossuiResponsavel={editPossuiResponsavel}
              setEditPossuiResponsavel={setEditPossuiResponsavel}
              editNomeResponsavel={editNomeResponsavel}
              setEditNomeResponsavel={setEditNomeResponsavel}
              editTelefoneResponsavel={editTelefoneResponsavel}
              setEditTelefoneResponsavel={setEditTelefoneResponsavel}
              editEmailResponsavel={editEmailResponsavel}
              setEditEmailResponsavel={setEditEmailResponsavel}
              excluirUnidade={excluirUnidade}
              desativarUnidade={desativarUnidade}
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
              onAbrirUnidade={abrirUnidadePeloMorador}
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
