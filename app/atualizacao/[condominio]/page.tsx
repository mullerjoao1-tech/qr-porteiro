"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { onValue, push, ref, set } from "firebase/database";

import { db } from "../../services/firebase";
import { atualizarStatusImplantacao } from "../../services/implantacaoService";

type LocalCadastrado = {
  id: string;
  nome: string;
  slug?: string;
  tipo?: string;
  status?: string;
  implantacao?: {
    status?: string;
    atualizadoEm?: string;
    protocolo?: string;
    ultimaSolicitacaoId?: string;
  };
};

type UnidadeCadastrada = {
  id: string;
  codigo: string;
  localId: string;
  localNome: string;

  bloco?: string;
  nome: string;

  tipo?: string;
  status?: string;

  implantacao?: {
    status?: string;
    atualizadoEm?: string;
    protocolo?: string;
    ultimaSolicitacaoId?: string;
  };
};

type Etapa = "inicio" | "unidade" | "dados" | "revisao" | "sucesso";

function formatarNomeCondominio(slug: string) {
  const nomesConhecidos: Record<string, string> = {
    "cnd-tulipas": "Residencial Tulipas",
    tulipas: "Residencial Tulipas",
  };

  if (nomesConhecidos[slug]) {
    return nomesConhecidos[slug];
  }

  return slug
    .replace(/^cnd-/, "")
    .split("-")
    .filter(Boolean)
    .map(
      (palavra) =>
        palavra.charAt(0).toUpperCase() +
        palavra.slice(1).toLowerCase()
    )
    .join(" ");
}

function normalizarTexto(texto?: string) {
  return (texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 2) {
    return numeros;
  }

  if (numeros.length <= 7) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(
      2,
      6
    )}-${numeros.slice(6)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(
    2,
    7
  )}-${numeros.slice(7)}`;
}

function textoPerfil(perfil: string) {
  const perfis: Record<string, string> = {
    proprietario: "Proprietário",
    inquilino: "Inquilino",
    familiar: "Familiar",
    morador: "Morador",
    outro: "Outro",
  };

  return perfis[perfil] || perfil;
}

export default function AtualizacaoCadastralPage() {
  const params = useParams<{ condominio: string }>();

  const condominioSlug =
    typeof params?.condominio === "string"
      ? params.condominio
      : "";

  const [etapa, setEtapa] = useState<Etapa>("inicio");

  const [locais, setLocais] = useState<LocalCadastrado[]>([]);
  const [unidades, setUnidades] = useState<UnidadeCadastrada[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const [blocoSelecionado, setBlocoSelecionado] = useState("");
  const [unidadeSelecionadaId, setUnidadeSelecionadaId] =
    useState("");

  const [nomeMorador, setNomeMorador] = useState("");
  const [telefoneMorador, setTelefoneMorador] = useState("");
  const [emailMorador, setEmailMorador] = useState("");
  const [perfilMorador, setPerfilMorador] =
    useState("proprietario");

  const [recebeChamadas, setRecebeChamadas] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [codigoSolicitacao, setCodigoSolicitacao] = useState("");

  useEffect(() => {
    setCarregando(true);
    setErroCarregamento("");

    const locaisRef = ref(db, "qrCentral/locais");
    const unidadesRef = ref(db, "qrCentral/unidades");

    let locaisCarregados = false;
    let unidadesCarregadas = false;

    function finalizarCarregamento() {
      if (locaisCarregados && unidadesCarregadas) {
        setCarregando(false);
      }
    }

    const desligarLocais = onValue(
      locaisRef,
      (snapshot) => {
        const dados = snapshot.val();

        if (!dados) {
          setLocais([]);
        } else {
          const lista = Object.entries(dados).map(
            ([id, valor]) => ({
              id,
              ...(valor as Omit<LocalCadastrado, "id">),
            })
          );

          setLocais(lista);
        }

        locaisCarregados = true;
        finalizarCarregamento();
      },
      (erro) => {
        console.error("Erro ao carregar locais:", erro);

        setErroCarregamento(
          "Não foi possível carregar o condomínio."
        );

        locaisCarregados = true;
        finalizarCarregamento();
      }
    );

    const desligarUnidades = onValue(
      unidadesRef,
      (snapshot) => {
        const dados = snapshot.val();

        if (!dados) {
          setUnidades([]);
        } else {
          const lista = Object.entries(dados).map(
            ([id, valor]) => ({
              id,
              ...(valor as Omit<UnidadeCadastrada, "id">),
            })
          );

          setUnidades(lista);
        }

        unidadesCarregadas = true;
        finalizarCarregamento();
      },
      (erro) => {
        console.error("Erro ao carregar unidades:", erro);

        setErroCarregamento(
          "Não foi possível carregar as unidades."
        );

        unidadesCarregadas = true;
        finalizarCarregamento();
      }
    );

    return () => {
      desligarLocais();
      desligarUnidades();
    };
  }, []);

  const localSelecionado = useMemo(() => {
    const slugNormalizado = normalizarTexto(condominioSlug);

    return locais.find((local) => {
      const slugDoLocal = normalizarTexto(local.slug);
      const slugPeloNome = normalizarTexto(local.nome);

      return (
        slugDoLocal === slugNormalizado ||
        slugPeloNome === slugNormalizado ||
        `cnd-${slugPeloNome}` === slugNormalizado
      );
    });
  }, [condominioSlug, locais]);

  const nomeCondominio =
    localSelecionado?.nome ||
    formatarNomeCondominio(condominioSlug);

  const unidadesDoCondominio = useMemo(() => {
    if (!localSelecionado) return [];

    return unidades
      .filter(
        (unidade) =>
          unidade.localId === localSelecionado.id &&
          unidade.status !== "desativada"
      )
      .sort((a, b) => {
        const blocoA = a.bloco || "";
        const blocoB = b.bloco || "";

        const comparacaoBloco = blocoA.localeCompare(
          blocoB,
          "pt-BR",
          {
            numeric: true,
          }
        );

        if (comparacaoBloco !== 0) {
          return comparacaoBloco;
        }

        return a.nome.localeCompare(b.nome, "pt-BR", {
          numeric: true,
        });
      });
  }, [localSelecionado, unidades]);

  const blocos = useMemo(() => {
    const lista = unidadesDoCondominio
      .map((unidade) => unidade.bloco?.trim() || "")
      .filter(Boolean);

    return Array.from(new Set(lista)).sort((a, b) =>
      a.localeCompare(b, "pt-BR", {
        numeric: true,
      })
    );
  }, [unidadesDoCondominio]);

  const possuiBlocos = blocos.length > 0;

  const unidadesFiltradas = useMemo(() => {
    if (!possuiBlocos) {
      return unidadesDoCondominio;
    }

    if (!blocoSelecionado) {
      return [];
    }

    return unidadesDoCondominio.filter(
      (unidade) =>
        (unidade.bloco || "") === blocoSelecionado
    );
  }, [
    blocoSelecionado,
    possuiBlocos,
    unidadesDoCondominio,
  ]);

  const unidadeSelecionada = unidadesDoCondominio.find(
    (unidade) => unidade.id === unidadeSelecionadaId
  );

  function textoUnidadeSelecionada() {
    if (!unidadeSelecionada) return "";

    return unidadeSelecionada.bloco
      ? `${unidadeSelecionada.bloco} / ${unidadeSelecionada.nome}`
      : unidadeSelecionada.nome;
  }

  async function continuarComUnidade() {
    if (possuiBlocos && !blocoSelecionado) {
      alert("Selecione o bloco.");
      return;
    }

    if (!unidadeSelecionada) {
      alert("Selecione sua unidade.");
      return;
    }

    try {
      const statusAtual =
        unidadeSelecionada.implantacao?.status || "sem-cadastro";

      if (
        statusAtual !== "implantado" &&
        statusAtual !== "aprovado"
      ) {
        await atualizarStatusImplantacao(
          unidadeSelecionada.id,
          "cadastro-iniciado",
          {
            iniciadoEm: new Date().toISOString(),
          }
        );
      }

      setEtapa("dados");
    } catch (erro) {
      console.error(
        "Erro ao registrar início do cadastro:",
        erro
      );

      alert(
        "Não foi possível iniciar a atualização agora. Tente novamente em alguns instantes."
      );
    }
  }

  function continuarComDados() {
    if (!nomeMorador.trim()) {
      alert("Digite seu nome completo.");
      return;
    }

    const telefoneNumeros = telefoneMorador.replace(/\D/g, "");

    if (telefoneNumeros.length < 10) {
      alert("Digite um telefone ou WhatsApp válido.");
      return;
    }

    if (
      emailMorador.trim() &&
      !emailMorador.includes("@")
    ) {
      alert("Digite um e-mail válido ou deixe o campo vazio.");
      return;
    }

    setEtapa("revisao");
  }

  async function enviarAtualizacao() {
    if (!localSelecionado || !unidadeSelecionada) {
      alert("Não foi possível identificar o condomínio ou a unidade.");
      return;
    }

    if (salvando) return;

    setSalvando(true);

    try {
      const agora = new Date();
      const dataCodigo = agora
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");

      const novaSolicitacaoRef = push(
        ref(db, "qrCentral/atualizacoesCadastrais")
      );

      const sufixo = novaSolicitacaoRef.key
        ? novaSolicitacaoRef.key.slice(-6).toUpperCase()
        : String(agora.getTime()).slice(-6);

      const codigo = `ACT-${dataCodigo}-${sufixo}`;

      await set(novaSolicitacaoRef, {
        codigo,
        condominioId: localSelecionado.id,
        condominioNome: localSelecionado.nome,
        condominioSlug,
        unidadeId: unidadeSelecionada.id,
        unidadeCodigo: unidadeSelecionada.codigo || "",
        unidadeNome: textoUnidadeSelecionada(),
        bloco: unidadeSelecionada.bloco || "",
        nomeUnidade: unidadeSelecionada.nome,
        nome: nomeMorador.trim(),
        telefone: telefoneMorador.trim(),
        email: emailMorador.trim(),
        perfil: perfilMorador,
        recebeChamadas,
        status: "pendente",
        origem: "link-publico",
        criadoEm: agora.toISOString(),
        atualizadoEm: agora.toISOString(),
      });

      const statusAtual =
        unidadeSelecionada.implantacao?.status || "sem-cadastro";

      if (
        statusAtual !== "implantado" &&
        statusAtual !== "aprovado"
      ) {
        await atualizarStatusImplantacao(
          unidadeSelecionada.id,
          "aguardando-analise",
          {
            protocolo: codigo,
            enviadoEm: agora.toISOString(),
            ultimaSolicitacaoId: novaSolicitacaoRef.key || "",
          }
        );
      }

      setCodigoSolicitacao(codigo);
      setEtapa("sucesso");
    } catch (erro) {
      console.error("Erro ao enviar atualização cadastral:", erro);
      alert(
        "Não foi possível enviar a atualização agora. Tente novamente em alguns instantes."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (etapa === "inicio") {
    return (
      <main className="min-h-screen bg-slate-950 text-white px-4 py-8 flex items-center">
        <section className="mx-auto w-full max-w-xl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex justify-center">
              <img
                src="/logo-oficial.png"
                alt="QR Acesso"
                className="h-20 w-auto object-contain"
              />
            </div>

            <div className="text-center mt-6">
              <p className="text-xs font-black tracking-widest text-blue-300">
                QR ACESSO
              </p>

              <h1 className="text-3xl md:text-4xl font-black mt-3">
                Atualização Cadastral
              </h1>

              <p className="text-xl font-bold text-white mt-3">
                {nomeCondominio}
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mt-7">
              <h2 className="text-xl font-black text-white">
                Olá! 👋
              </h2>

              <p className="text-slate-300 mt-3 leading-relaxed">
                O condomínio está atualizando os dados dos
                moradores para melhorar a comunicação e
                preparar a utilização dos recursos do QR
                Acesso.
              </p>

              <p className="text-slate-400 mt-3 leading-relaxed">
                O preenchimento será feito pelo celular e
                levará apenas alguns minutos.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-5 text-center">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                <p className="text-xl">🏠</p>
                <p className="text-xs font-bold text-slate-300 mt-1">
                  Informe a unidade
                </p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                <p className="text-xl">👤</p>
                <p className="text-xs font-bold text-slate-300 mt-1">
                  Preencha os dados
                </p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                <p className="text-xl">✅</p>
                <p className="text-xs font-bold text-slate-300 mt-1">
                  Aguarde aprovação
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEtapa("unidade")}
              className="w-full mt-7 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-4 rounded-xl shadow-lg"
            >
              Começar atualização
            </button>

            <p className="text-xs text-center text-slate-500 mt-5 leading-relaxed">
              As informações enviadas serão analisadas pela
              administração antes de entrarem no cadastro
              oficial do condomínio.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (etapa === "unidade") {
    return (
      <main className="min-h-screen bg-slate-950 text-white px-4 py-8">
        <section className="mx-auto w-full max-w-xl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="text-center">
              <p className="text-xs font-black tracking-widest text-blue-300">
                QR ACESSO
              </p>

              <h1 className="text-3xl font-black mt-3">
                Informe sua unidade
              </h1>

              <p className="text-slate-400 mt-2">
                {nomeCondominio}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-7">
              <div className="h-2 flex-1 rounded-full bg-blue-500" />
              <div className="h-2 flex-1 rounded-full bg-slate-700" />
              <div className="h-2 flex-1 rounded-full bg-slate-700" />
            </div>

            {carregando && (
              <div className="mt-7 bg-slate-800 border border-slate-700 rounded-2xl p-5 text-center">
                <p className="font-bold">
                  Carregando unidades...
                </p>
              </div>
            )}

            {!carregando && erroCarregamento && (
              <div className="mt-7 bg-red-950/50 border border-red-800 rounded-2xl p-5">
                <p className="font-black text-red-300">
                  Não foi possível continuar
                </p>

                <p className="text-sm text-red-200 mt-2">
                  {erroCarregamento}
                </p>
              </div>
            )}

            {!carregando &&
              !erroCarregamento &&
              !localSelecionado && (
                <div className="mt-7 bg-yellow-950/40 border border-yellow-800 rounded-2xl p-5">
                  <p className="font-black text-yellow-300">
                    Condomínio não localizado
                  </p>

                  <p className="text-sm text-yellow-100 mt-2 leading-relaxed">
                    Ainda não encontramos este condomínio no
                    cadastro do Studio.
                  </p>

                  <p className="text-xs text-yellow-200/70 mt-3">
                    Endereço consultado: {condominioSlug}
                  </p>
                </div>
              )}

            {!carregando &&
              !erroCarregamento &&
              localSelecionado &&
              unidadesDoCondominio.length === 0 && (
                <div className="mt-7 bg-yellow-950/40 border border-yellow-800 rounded-2xl p-5">
                  <p className="font-black text-yellow-300">
                    Nenhuma unidade disponível
                  </p>

                  <p className="text-sm text-yellow-100 mt-2">
                    Cadastre as unidades deste condomínio no
                    painel antes de enviar o link aos moradores.
                  </p>
                </div>
              )}

            {!carregando &&
              !erroCarregamento &&
              localSelecionado &&
              unidadesDoCondominio.length > 0 && (
                <div className="space-y-4 mt-7">
                  {possuiBlocos && (
                    <div>
                      <label className="block text-sm font-black text-slate-300 mb-2">
                        Bloco ou torre
                      </label>

                      <select
                        value={blocoSelecionado}
                        onChange={(e) => {
                          setBlocoSelecionado(e.target.value);
                          setUnidadeSelecionadaId("");
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white"
                      >
                        <option value="">
                          Selecione o bloco
                        </option>

                        {blocos.map((bloco) => (
                          <option key={bloco} value={bloco}>
                            {bloco}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-black text-slate-300 mb-2">
                      Unidade
                    </label>

                    <select
                      value={unidadeSelecionadaId}
                      onChange={(e) =>
                        setUnidadeSelecionadaId(e.target.value)
                      }
                      disabled={
                        possuiBlocos && !blocoSelecionado
                      }
                      className="w-full bg-slate-800 border border-slate-700 disabled:bg-slate-900 disabled:text-slate-600 rounded-xl p-4 text-white"
                    >
                      <option value="">
                        {possuiBlocos && !blocoSelecionado
                          ? "Selecione primeiro o bloco"
                          : "Selecione sua unidade"}
                      </option>

                      {unidadesFiltradas.map((unidade) => (
                        <option
                          key={unidade.id}
                          value={unidade.id}
                        >
                          {unidade.bloco
                            ? `${unidade.bloco} / ${unidade.nome}`
                            : unidade.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {unidadeSelecionada && (
                    <div className="bg-blue-950/40 border border-blue-800 rounded-2xl p-5">
                      <p className="text-xs font-black text-blue-300">
                        UNIDADE SELECIONADA
                      </p>

                      <p className="text-2xl font-black mt-2">
                        🏠 {textoUnidadeSelecionada()}
                      </p>

                      <p className="text-sm text-slate-400 mt-1">
                        {localSelecionado.nome}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={continuarComUnidade}
                    disabled={!unidadeSelecionada}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black text-lg py-4 rounded-xl"
                  >
                    Continuar
                  </button>
                </div>
              )}

            <button
              type="button"
              onClick={() => {
                setEtapa("inicio");
                setBlocoSelecionado("");
                setUnidadeSelecionadaId("");
              }}
              className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-black py-3 rounded-xl"
            >
              Voltar
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (etapa === "dados") {
    return (
      <main className="min-h-screen bg-slate-950 text-white px-4 py-8">
        <section className="mx-auto w-full max-w-xl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="text-center">
              <p className="text-xs font-black tracking-widest text-blue-300">
                QR ACESSO
              </p>

              <h1 className="text-3xl font-black mt-3">
                Seus dados
              </h1>

              <p className="text-slate-400 mt-2">
                {nomeCondominio}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-7">
              <div className="h-2 flex-1 rounded-full bg-blue-500" />
              <div className="h-2 flex-1 rounded-full bg-blue-500" />
              <div className="h-2 flex-1 rounded-full bg-slate-700" />
            </div>

            <div className="bg-blue-950/40 border border-blue-800 rounded-2xl p-4 mt-7">
              <p className="text-xs font-black text-blue-300">
                UNIDADE
              </p>

              <p className="text-xl font-black mt-1">
                🏠 {textoUnidadeSelecionada()}
              </p>
            </div>

            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-black text-slate-300 mb-2">
                  Nome completo
                </label>

                <input
                  type="text"
                  value={nomeMorador}
                  onChange={(e) =>
                    setNomeMorador(e.target.value)
                  }
                  placeholder="Digite seu nome completo"
                  autoComplete="name"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-300 mb-2">
                  Telefone / WhatsApp
                </label>

                <input
                  type="tel"
                  value={telefoneMorador}
                  onChange={(e) =>
                    setTelefoneMorador(
                      formatarTelefone(e.target.value)
                    )
                  }
                  placeholder="(41) 99999-9999"
                  autoComplete="tel"
                  inputMode="tel"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-300 mb-2">
                  E-mail
                  <span className="text-slate-500 font-normal">
                    {" "}
                    (opcional)
                  </span>
                </label>

                <input
                  type="email"
                  value={emailMorador}
                  onChange={(e) =>
                    setEmailMorador(e.target.value)
                  }
                  placeholder="seunome@email.com"
                  autoComplete="email"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-300 mb-2">
                  Sua relação com a unidade
                </label>

                <select
                  value={perfilMorador}
                  onChange={(e) =>
                    setPerfilMorador(e.target.value)
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white"
                >
                  <option value="proprietario">
                    Proprietário
                  </option>

                  <option value="inquilino">
                    Inquilino
                  </option>

                  <option value="familiar">
                    Familiar
                  </option>

                  <option value="morador">
                    Morador
                  </option>

                  <option value="outro">
                    Outro
                  </option>
                </select>
              </div>

              <label className="flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recebeChamadas}
                  onChange={(e) =>
                    setRecebeChamadas(e.target.checked)
                  }
                  className="mt-1"
                />

                <div>
                  <p className="font-black text-white">
                    Receber chamadas de visitantes
                  </p>

                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Marque esta opção para receber chamadas de
                    visitantes e entregadores destinados à sua
                    unidade.
                  </p>
                </div>
              </label>

              <div className="bg-yellow-950/30 border border-yellow-800 rounded-2xl p-4">
                <p className="text-sm text-yellow-100 leading-relaxed">
                  O direito de abrir o portão será definido pela
                  administração após a conferência do cadastro.
                </p>
              </div>

              <button
                type="button"
                onClick={continuarComDados}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-4 rounded-xl"
              >
                Revisar dados
              </button>

              <button
                type="button"
                onClick={() => setEtapa("unidade")}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-3 rounded-xl"
              >
                Voltar
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (etapa === "sucesso") {
    return (
      <main className="min-h-screen bg-slate-950 text-white px-4 py-8 flex items-center">
        <section className="mx-auto w-full max-w-xl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-950/60 border border-green-700 text-4xl">
              ✅
            </div>

            <p className="text-xs font-black tracking-widest text-green-300 mt-6">
              ATUALIZAÇÃO RECEBIDA
            </p>

            <h1 className="text-3xl md:text-4xl font-black mt-3">
              Dados enviados com sucesso
            </h1>

            <p className="text-slate-300 mt-4 leading-relaxed">
              Sua solicitação foi recebida e será analisada pela administração
              do {nomeCondominio}.
            </p>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mt-6 text-left">
              <p className="text-xs font-black text-slate-400">
                PROTOCOLO
              </p>

              <p className="text-xl font-black text-green-300 mt-1 break-all">
                {codigoSolicitacao}
              </p>

              <p className="text-xs text-slate-500 mt-2">
                Guarde este código para referência.
              </p>
            </div>

            <div className="bg-blue-950/40 border border-blue-800 rounded-2xl p-5 mt-4 text-left">
              <p className="text-sm text-blue-100 leading-relaxed">
                O envio não altera automaticamente o cadastro oficial. A
                administração fará a conferência antes da aprovação.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEtapa("inicio");
                setBlocoSelecionado("");
                setUnidadeSelecionadaId("");
                setNomeMorador("");
                setTelefoneMorador("");
                setEmailMorador("");
                setPerfilMorador("proprietario");
                setRecebeChamadas(true);
                setCodigoSolicitacao("");
              }}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl"
            >
              Finalizar
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <section className="mx-auto w-full max-w-xl">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="text-center">
            <p className="text-xs font-black tracking-widest text-blue-300">
              QR ACESSO
            </p>

            <h1 className="text-3xl font-black mt-3">
              Revise seus dados
            </h1>

            <p className="text-slate-400 mt-2">
              Confira antes de enviar
            </p>
          </div>

          <div className="flex items-center gap-2 mt-7">
            <div className="h-2 flex-1 rounded-full bg-blue-500" />
            <div className="h-2 flex-1 rounded-full bg-blue-500" />
            <div className="h-2 flex-1 rounded-full bg-blue-500" />
          </div>

          <div className="space-y-3 mt-7">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs font-black text-slate-400">
                CONDOMÍNIO
              </p>
              <p className="text-lg font-black mt-1">
                🏢 {nomeCondominio}
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs font-black text-slate-400">
                UNIDADE
              </p>
              <p className="text-lg font-black mt-1">
                🏠 {textoUnidadeSelecionada()}
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs font-black text-slate-400">
                NOME
              </p>
              <p className="text-lg font-black mt-1">
                👤 {nomeMorador.trim()}
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs font-black text-slate-400">
                TELEFONE / WHATSAPP
              </p>
              <p className="text-lg font-black mt-1">
                📱 {telefoneMorador}
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs font-black text-slate-400">
                E-MAIL
              </p>
              <p className="text-lg font-black mt-1 break-all">
                ✉️ {emailMorador.trim() || "Não informado"}
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs font-black text-slate-400">
                RELAÇÃO COM A UNIDADE
              </p>
              <p className="text-lg font-black mt-1">
                🏠 {textoPerfil(perfilMorador)}
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs font-black text-slate-400">
                CHAMADAS DE VISITANTES
              </p>
              <p className="text-lg font-black mt-1">
                {recebeChamadas
                  ? "🔔 Deseja receber chamadas"
                  : "🔕 Não deseja receber chamadas"}
              </p>
            </div>
          </div>

          <div className="bg-yellow-950/30 border border-yellow-800 rounded-2xl p-4 mt-5">
            <p className="text-sm text-yellow-100 leading-relaxed">
              Depois do envio, a administração fará a conferência
              antes de aprovar o cadastro.
            </p>
          </div>

          <button
            type="button"
            onClick={enviarAtualizacao}
            disabled={salvando}
            className="w-full mt-5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-black text-lg py-4 rounded-xl shadow-lg"
          >
            {salvando ? "Enviando..." : "✅ Enviar atualização"}
          </button>

          <button
            type="button"
            onClick={() => setEtapa("dados")}
            disabled={salvando}
            className="w-full mt-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black py-3 rounded-xl"
          >
            Voltar e corrigir
          </button>
        </div>
      </section>
    </main>
  );
}
