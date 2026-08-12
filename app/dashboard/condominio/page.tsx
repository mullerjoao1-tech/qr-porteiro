"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  onValue,
  push,
  ref,
  set,
update,
} from "firebase/database";

import {
  db,
} from "@/app/services/firebase";

import CentralResidencia from "@/app/dashboard/condominio/CentralResidencia";
import CentralSindico from "@/app/dashboard/sindico/CentralSindico";
import Unidades from "@/app/components/dashboard/Unidades";
import Moradores from "@/app/components/dashboard/Moradores";
import AtualizacaoPendenteModal from "@/app/dashboard/AtualizacaoPendenteModal";
import MateriaisDoLocal from "@/app/components/core/dashboard/MateriaisDoLocal";

import {
  useAuth,
} from "@/app/context/AuthContext";

type TelaCondominio =
  | "inicio"
  | "unidades"
  | "moradores"
  | "acessos"
  | "prestadores"
  | "agendamentos"
  | "reservas"
  | "documentos"
  | "historico"
  | "pendentes"
  | "configuracoes"
  | "materiais"
  | "planos"
  | "contingencia";

type LocalCadastrado = {
  id: string;
  nome: string;
  tipo: string;
};

type UnidadeCadastrada = {
  id: string;
  codigo: string;
  localId: string;
  localNome: string;
  tipo: string;
  bloco: string;
  nome: string;
  modoChamado?: string;
};

type MoradorCadastrado = {
  id: string;
  codigo: string;
  nome: string;
  telefone: string;
email?: string;
  unidadeId: string;
  unidadeNome: string;
  prioridade: number;
  podeAbrirPortao: boolean;
recebeChamadas?: boolean;
  status: string;
};


type AtualizacaoCadastralCondominio = {
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

function normalizar(
  valor?: string
) {
  return (valor || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_");
}

function formatarNome(
  valor: string
) {
  return valor
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}

export default function PaginaCondominio() {
  const router =
    useRouter();

  const {
    usuario,
    carregando,
    vinculoSelecionado,
    vinculoSelecionadoId,
    vinculosAtivos,
  } = useAuth();

  const [
    telaAtiva,
    setTelaAtiva,
  ] =
    useState<TelaCondominio>(
      "inicio"
    );

  const [
    locais,
    setLocais,
  ] =
    useState<LocalCadastrado[]>(
      []
    );

  const [
    unidades,
    setUnidades,
  ] =
    useState<UnidadeCadastrada[]>(
      []
    );

  const [
    blocoUnidade,
    setBlocoUnidade,
  ] =
    useState("");

  const [
    nomeUnidade,
    setNomeUnidade,
  ] =
    useState("");

  const [
    tipoUnidade,
    setTipoUnidade,
  ] =
    useState(
      "apartamento"
    );

  const [
    modoChamadoUnidade,
    setModoChamadoUnidade,
  ] =
    useState(
      "familia"
    );

  const [
    salvandoUnidade,
    setSalvandoUnidade,
  ] =
    useState(false);

  const [
    moradores,
    setMoradores,
  ] =
    useState<MoradorCadastrado[]>(
      []
    );

  const [
    unidadeMoradorId,
    setUnidadeMoradorId,
  ] =
    useState("");

  const [
    nomeMorador,
    setNomeMorador,
  ] =
    useState("");

  const [
    telefoneMorador,
    setTelefoneMorador,
  ] =
    useState("");

  const [
    prioridadeMorador,
    setPrioridadeMorador,
  ] =
    useState("1");

  const [
    podeAbrirPortao,
    setPodeAbrirPortao,
  ] =
    useState(false);

  const [
    salvandoMorador,
    setSalvandoMorador,
  ] =
    useState(false);

  const [
    atualizacoesCadastrais,
    setAtualizacoesCadastrais,
  ] =
    useState<AtualizacaoCadastralCondominio[]>([]);

  const [
    atualizacaoSelecionada,
    setAtualizacaoSelecionada,
  ] =
    useState<AtualizacaoCadastralCondominio | null>(null);

  const tipoLocal =
    normalizar(
      vinculoSelecionado
        ?.tipoLocal
    );

  const perfilPrincipal =
    normalizar(
      vinculoSelecionado
        ?.perfilPrincipal
    );

  const perfis =
    vinculoSelecionado
      ?.perfis ??
    {};

  const possuiPerfil = (
    perfil: string
  ) => {
    if (
      perfilPrincipal ===
      normalizar(perfil)
    ) {
      return true;
    }

    return Object.entries(
      perfis
    ).some(
      ([nome, ativo]) =>
        ativo === true &&
        normalizar(nome) ===
          normalizar(perfil)
    );
  };

  const modoResidencia =
    tipoLocal ===
    "residencia";

  const podeGerenciarResidencia =
    possuiPerfil(
      "administrador_master"
    ) ||
    possuiPerfil(
      "proprietario"
    ) ||
    possuiPerfil(
      "responsavel"
    ) ||
    possuiPerfil(
      "gestor_local"
    );

  const vinculoAtual =
    vinculosAtivos.find(
      ([id]) =>
        id === vinculoSelecionadoId
    )?.[1] ??
    vinculoSelecionado ??
    null;

  const identificadorVinculoAtual =
    (
      vinculoAtual?.localId ||
      vinculoAtual?.localSlug ||
      vinculoAtual?.condominioId ||
      vinculoAtual?.condominioSlug ||
      vinculoSelecionadoId ||
      ""
    )
      .trim()
      .toLowerCase();

  const localAtual =
    useMemo(
      () =>
        locais.find((local) => {
          const candidatos = [
            local.id,
            local.nome,
            (local as any).slug,
            (local as any).codigo,
          ]
            .filter(Boolean)
            .map((valor) =>
              String(valor)
                .trim()
                .toLowerCase()
            );

          return candidatos.includes(
            identificadorVinculoAtual
          );
        }) ?? null,
      [
        locais,
        identificadorVinculoAtual,
      ]
    );

  const localIdAtual =
    localAtual?.id ||
    vinculoAtual?.localId ||
    vinculoAtual?.condominioId ||
    vinculoAtual?.localSlug ||
    vinculoAtual?.condominioSlug ||
    vinculoSelecionadoId ||
    "";

  const nomeLocalAtual =
    localAtual?.nome ||
    vinculoAtual?.localNome ||
    vinculoAtual?.condominioNome ||
    vinculoAtual?.localSlug ||
    vinculoAtual?.condominioSlug ||
    "Condominio";

  useEffect(() => {
  }, [
    vinculoSelecionadoId,
    vinculoSelecionado,
    vinculoAtual,
    vinculosAtivos,
    identificadorVinculoAtual,
    localIdAtual,
    nomeLocalAtual,
    localAtual,
  ]);

  useEffect(() => {
    if (
      carregando ||
      !usuario ||
      !vinculoSelecionado
    ) {
      return;
    }

    if (
      modoResidencia
    ) {
      router.replace(
        "/dashboard/morador"
      );
    }
  }, [
    carregando,
    usuario,
    vinculoSelecionado,
    modoResidencia,
    podeGerenciarResidencia,
    router,
  ]);

  useEffect(() => {
    if (modoResidencia) {
      return;
    }

    const locaisRef =
      ref(
        db,
        "qrCentral/locais"
      );

    const parar =
      onValue(
        locaisRef,
        (snapshot) => {
          const dados =
            snapshot.val();

          if (!dados) {
            setLocais([]);
            return;
          }

          const lista =
            Object.entries(
              dados
            ).map(
              ([id, valor]) => ({
                id,
                ...(valor as Omit<
                  LocalCadastrado,
                  "id"
                >),
              })
            );

          setLocais(
            lista
          );
        }
      );

    return () =>
      parar();
  }, [
    modoResidencia,
  ]);

  useEffect(() => {
    if (
      modoResidencia ||
      !localIdAtual
    ) {
      return;
    }

    const unidadesRef =
      ref(
        db,
        `locais-v2/${localIdAtual}/unidades`
      );

    const parar =
      onValue(
        unidadesRef,
        (snapshot) => {
          const dados =
            snapshot.val();

          if (!dados) {
            setUnidades([]);
            return;
          }

          const lista =
            Object.entries(
              dados
            ).map(
              ([id, valor]) => {
                const unidade =
                  valor as {
                    unidadeId?: string;
                    nome?: string;
                    tipo?: string;
                    estruturaPaiNome?: string;
                    numero?: string;
                    codigo?: string;
                    status?: string;
                  };

                return {
                  id:
                    unidade.unidadeId ||
                    id,

                  codigo:
                    unidade.codigo ||
                    id,

                  localId:
                    localIdAtual,

                  localNome:
                    nomeLocalAtual,

                  tipo:
                    unidade.tipo ||
                    "apartamento",

                  bloco:
                    unidade.estruturaPaiNome ||
                    "",

                  nome:
                    unidade.numero ||
                    unidade.nome ||
                    id,

                  modoChamado:
                    "familia",
                };
              }
            );

          setUnidades(
            lista
          );
        }
      );

    return () =>
      parar();
  }, [
    modoResidencia,
    localIdAtual,
    nomeLocalAtual,
  ]);

  useEffect(() => {
    if (modoResidencia) {
      return;
    }

    const moradoresRef =
      ref(
        db,
        "qrCentral/moradores"
      );

    const parar =
      onValue(
        moradoresRef,
        (snapshot) => {
          const dados =
            snapshot.val();

          if (!dados) {
            setMoradores([]);
            return;
          }

          const lista =
            Object.entries(
              dados
            ).map(
              ([id, valor]) => ({
                id,
                ...(valor as Omit<
                  MoradorCadastrado,
                  "id"
                >),
              })
            );

          setMoradores(
            lista
          );
        }
      );

    return () =>
      parar();
  }, [
    modoResidencia,
  ]);

  useEffect(() => {
    if (modoResidencia) {
      return;
    }

    const referencia =
      ref(
        db,
        "qrCentral/atualizacoesCadastrais"
      );

    const parar =
      onValue(
        referencia,
        (snapshot) => {
          const dados =
            snapshot.val();

          if (!dados) {
            setAtualizacoesCadastrais([]);
            return;
          }

          const lista =
            Object.entries(dados).map(
              ([id, valor]) => ({
                id,
                ...(valor as Omit<
                  AtualizacaoCadastralCondominio,
                  "id"
                >),
              })
            );


          setAtualizacoesCadastrais(lista);
        }
      );

    return () => parar();
  }, [
    modoResidencia,
  ]);

  async function cadastrarUnidade() {
    if (!localIdAtual) {
      alert(
        "Local nao identificado."
      );
      return;
    }

    const local =
      localAtual || {
        id:
          localIdAtual,
        nome:
          nomeLocalAtual,
        tipo:
          "condominio",
      };

    if (
      !nomeUnidade.trim()
    ) {
      alert(
        "Digite o nome ou numero da unidade."
      );
      return;
    }

    if (
      !blocoUnidade.trim()
    ) {
      alert(
        "Informe o bloco ou torre."
      );
      return;
    }

    setSalvandoUnidade(
      true
    );

    try {
      const unidadesRef =
        ref(
          db,
          "qrCentral/unidades"
        );

      const novaUnidadeRef =
        push(
          unidadesRef
        );

      const codigo =
        `UNI-${String(
          unidades.length + 1
        ).padStart(
          4,
          "0"
        )}`;

      await set(
        novaUnidadeRef,
        {
          codigo,

          localId:
            local.id,

          localNome:
            local.nome,

          tipoLocal:
            "condominio",

          bloco:
            formatarNome(
              blocoUnidade
            ),

          nome:
            formatarNome(
              nomeUnidade
            ),

          tipo:
            tipoUnidade,

          modoChamado:
            modoChamadoUnidade,

          status:
            "ativa",

          criadoEm:
            new Date()
              .toISOString(),
        }
      );

      setBlocoUnidade("");
      setNomeUnidade("");
      setTipoUnidade(
        "apartamento"
      );
      setModoChamadoUnidade(
        "familia"
      );

      alert(
        "Unidade cadastrada com sucesso."
      );
    } catch (erro) {
      console.error(
        erro
      );

      alert(
        "Erro ao cadastrar unidade."
      );
    } finally {
      setSalvandoUnidade(
        false
      );
    }
  }

  async function cadastrarMorador() {
    if (!unidadeMoradorId) {
      alert(
        "Selecione uma unidade."
      );
      return;
    }

    const unidade =
      unidades.find(
        (item) =>
          item.id ===
          unidadeMoradorId
      );

    if (!unidade) {
      alert(
        "Unidade nao encontrada."
      );
      return;
    }

    if (!nomeMorador.trim()) {
      alert(
        "Digite o nome do morador."
      );
      return;
    }

    if (!telefoneMorador.trim()) {
      alert(
        "Digite o telefone do morador."
      );
      return;
    }

    setSalvandoMorador(
      true
    );

    try {
      const moradoresRef =
        ref(
          db,
          "qrCentral/moradores"
        );

      const novoMoradorRef =
        push(
          moradoresRef
        );

      const codigo =
        `MOR-${String(
          moradores.length + 1
        ).padStart(
          4,
          "0"
        )}`;

      const unidadeNome =
        `${unidade.localNome} - ${
          unidade.bloco
            ? `${unidade.bloco} - `
            : ""
        }${unidade.nome}`;

      await set(
        novoMoradorRef,
        {
          codigo,

          nome:
            formatarNome(
              nomeMorador
            ),

          telefone:
            telefoneMorador.trim(),

          unidadeId:
            unidade.id,

          unidadeNome,

          prioridade:
            Number(
              prioridadeMorador
            ),

          ordemAtendimento:
            Number(
              prioridadeMorador
            ),

          recebeChamadas:
            true,

          disponivel:
            true,

          encaminhamentoAutomatico:
            true,

          podeAbrirPortao,

          status:
            "ativo",

          criadoEm:
            new Date()
              .toISOString(),

          ultimoStatusEm:
            Date.now(),
        }
      );

      setNomeMorador("");
      setTelefoneMorador("");
      setPrioridadeMorador(
        "1"
      );
      setPodeAbrirPortao(
        false
      );

      alert(
        "Morador cadastrado com sucesso."
      );
    } catch (erro) {
      console.error(
        erro
      );

      alert(
        "Erro ao cadastrar morador."
      );
    } finally {
      setSalvandoMorador(
        false
      );
    }
  }

async function atualizarMoradorCadastrado(
  moradorId: string,
  dados: {
    nome: string;
    telefone: string;
    email?: string;
    prioridade: number;
    recebeChamadas: boolean;
    podeAbrirPortao: boolean;
    status: string;
  }
) {
  if (!moradorId) {
    throw new Error(
      "Morador nao informado."
    );
  }

  const nome =
    dados.nome.trim();

  const telefone =
    dados.telefone.trim();

  if (!nome) {
    throw new Error(
      "Informe o nome do morador."
    );
  }

  if (!telefone) {
    throw new Error(
      "Informe o telefone do morador."
    );
  }

  await update(
    ref(
      db,
      `qrCentral/moradores/${moradorId}`
    ),
    {
      nome:
        formatarNome(nome),

      telefone,

      email:
        dados.email?.trim() || "",

      prioridade:
        Number(dados.prioridade),

      ordemAtendimento:
        Number(dados.prioridade),

      recebeChamadas:
        dados.recebeChamadas,

      podeAbrirPortao:
        dados.podeAbrirPortao,

      status:
        dados.status,

      atualizadoEm:
        new Date().toISOString(),

      ultimoStatusEm:
        Date.now(),
    }
  );
}

  const atualizacoesDoLocal =
    useMemo(
      () =>
        atualizacoesCadastrais
          .filter((item) => {
            const candidatos = [
              item.condominioId,
              item.condominioSlug,
            ]
              .filter(Boolean)
              .map((valor) =>
                String(valor)
                  .trim()
                  .toLowerCase()
              );

            const contexto = [
              localIdAtual,
              identificadorVinculoAtual,
              vinculoSelecionadoId,
              vinculoAtual?.localId,
              vinculoAtual?.localSlug,
              vinculoAtual?.condominioId,
              vinculoAtual?.condominioSlug,
            ]
              .filter(Boolean)
              .map((valor) =>
                String(valor)
                  .trim()
                  .toLowerCase()
              );

            const aliasesLegados: Record<string, string[]> = {
          "residencial-tulipas": [
            "cnd-tulipas",
            "tulipas",
          ],
        };

        const contextoExpandido =
          Array.from(
            new Set(
              contexto.flatMap(
                (valor) => [
                  valor,
                  ...(aliasesLegados[valor] ?? []),
                ]
              )
            )
          );

        const pertencePorIdentificador =
          candidatos.some(
            (valor) =>
              contextoExpandido.includes(valor)
          );

        const pertencePorUnidade =
          unidades.some(
            (unidade) =>
              unidade.localId === localIdAtual &&
              unidade.id === item.unidadeId
          );

        const pertencePorNome =
          String(item.condominioNome || "")
            .trim()
            .toLowerCase() ===
          String(nomeLocalAtual || "")
            .trim()
            .toLowerCase();

        return (
          pertencePorIdentificador ||
          pertencePorUnidade ||
          pertencePorNome
        );
          })
          .sort(
            (a, b) =>
              new Date(
                b.criadoEm || 0
              ).getTime() -
              new Date(
                a.criadoEm || 0
              ).getTime()
          ),
      [
        atualizacoesCadastrais,
        localIdAtual,
        identificadorVinculoAtual,
        vinculoSelecionadoId,
        vinculoAtual,
          unidades,
    nomeLocalAtual,
  ]
    );

  const atualizacoesPendentes =
    atualizacoesDoLocal.filter(
      (item) =>
        item.status === "pendente"
    );

  const atualizacoesAnalisadas =
    atualizacoesDoLocal.filter(
      (item) =>
        item.status !== "pendente"
    );

  if (
    carregando ||
    !usuario
  ) {
    return null;
  }

  if (
    modoResidencia &&
    !podeGerenciarResidencia
  ) {
    return null;
  }

  if (modoResidencia) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto w-full max-w-[1600px] p-3 md:p-6">
          <CentralResidencia />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {vinculoSelecionadoId && (
      <aside className="fixed left-4 top-4 z-40 hidden max-h-[calc(100vh-32px)] w-[210px] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur xl:block">

        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
            QR CONDOMINIO
          </p>

          <p className="mt-2 text-base font-black leading-tight text-white break-words">
            {nomeLocalAtual}
          </p>
        </div>

        <nav className="space-y-2">

          <button
            type="button"
            onClick={() =>
              setTelaAtiva(
                "inicio"
              )
            }
            className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-left text-sm font-black text-slate-950 transition hover:bg-cyan-400"
          >
            Inicio
          </button>

          <button
            type="button"
            onClick={() =>
              setTelaAtiva(
                "unidades"
              )
            }
            className={[
              "w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold transition",
              telaAtiva ===
              "unidades"
                ? "border-cyan-400 bg-cyan-500 text-slate-950"
                : "border-slate-700 bg-slate-800 text-slate-100 hover:border-cyan-500 hover:bg-slate-700",
            ].join(" ")}
          >
            Unidades
          </button>

          {[
            ["moradores", "Moradores"],
            ["acessos", "Acessos / Visitantes"],
            ["prestadores", "Prestadores"],
            ["agendamentos", "Agendamentos"],
            ["reservas", "Reservas"],
            ["documentos", "Documentos / Contratos"],
            ["historico", "Historico Geral"],
            ["pendentes", "Pendentes"],
            ["configuracoes", "Configuracoes"],
            ["materiais", "QR e Materiais"],
            ["planos", "Planos"],
            ["contingencia", "Contingencia"],
          ].map(
            ([id, titulo]) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setTelaAtiva(
                    id as TelaCondominio
                  )
                }
                className={[
                  "w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold transition",
                  telaAtiva === id
                    ? "border-cyan-400 bg-cyan-500 text-slate-950"
                    : "border-slate-700 bg-slate-800 text-slate-100 hover:border-cyan-500 hover:bg-slate-700",
                ].join(" ")}
              >
                {titulo}
              </button>
            )
          )}

        </nav>
      </aside>
      )}

      <div
        className={`mx-auto w-full max-w-[1600px] p-3 md:p-6 ${
          vinculoSelecionadoId ? "xl:pl-[246px]" : ""
        }`}
      >

        {telaAtiva ===
        "unidades" ? (

                    <div className="space-y-4">

          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setTelaAtiva("inicio")}
              className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-black text-white transition hover:border-cyan-500 hover:bg-slate-700 active:scale-[0.98]"
            >
              Voltar ao painel
            </button>
          </div>

<Unidades
            modoChamadoUnidade={
              modoChamadoUnidade
            }

            setModoChamadoUnidade={
              setModoChamadoUnidade
            }

            locais={
              locais.filter(
                (local) =>
                  local.id ===
                  localIdAtual
              )
            }

            unidades={
              unidades.filter(
                (unidade) =>
                  unidade.localId ===
                  localIdAtual
              )
            }

            localSelecionadoId={
              localIdAtual
            }

            setLocalSelecionadoId={() => {
              // Contexto travado no condom?nio atual.
            }}

            blocoUnidade={
              blocoUnidade
            }

            setBlocoUnidade={
              setBlocoUnidade
            }

            nomeUnidade={
              nomeUnidade
            }

            setNomeUnidade={
              setNomeUnidade
            }

            tipoUnidade={
              tipoUnidade
            }

            setTipoUnidade={
              setTipoUnidade
            }

            modoCondominio={
              true
            }

            cadastrarUnidade={
              cadastrarUnidade
            }

            salvandoUnidade={
              salvandoUnidade
            }
          />

        </div>

        ) : telaAtiva ===
        "moradores" ? (

          <div className="space-y-4">

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setTelaAtiva(
                    "inicio"
                  )
                }
                className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-black text-white transition hover:border-cyan-500 hover:bg-slate-700 active:scale-[0.98]"
              >
                Voltar ao painel
              </button>
            </div>

            {(() => {
          const ana = moradores.find((morador) =>
            String(morador.nome || "")
              .toLowerCase()
              .includes("ana carolina")
          );



          return null;
        })()}

        <Moradores
              unidades={
                unidades.filter(
                  (unidade) =>
                    unidade.localId ===
                    localIdAtual
                )
              }

              moradores={
                moradores.filter(
                  (morador) =>
                    unidades.some(
                      (unidade) =>
                        unidade.localId ===
                          localIdAtual &&
                        unidade.id ===
                          morador.unidadeId
                    )
                )
              }

              unidadeMoradorId={
                unidadeMoradorId
              }

              setUnidadeMoradorId={
                setUnidadeMoradorId
              }

              nomeMorador={
                nomeMorador
              }

              setNomeMorador={
                setNomeMorador
              }

              telefoneMorador={
                telefoneMorador
              }

              setTelefoneMorador={
                setTelefoneMorador
              }

              prioridadeMorador={
                prioridadeMorador
              }

              setPrioridadeMorador={
                setPrioridadeMorador
              }

              podeAbrirPortao={
                podeAbrirPortao
              }

              setPodeAbrirPortao={
                setPodeAbrirPortao
              }

              cadastrarMorador={
                cadastrarMorador
              }

              atualizarMorador={
                atualizarMoradorCadastrado
              }

              salvandoMorador={
                salvandoMorador
              }
            />

          </div>

        ) : telaAtiva ===
        "pendentes" ? (

          <div className="space-y-5">

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setTelaAtiva(
                    "inicio"
                  )
                }
                className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-black text-white transition hover:border-cyan-500 hover:bg-slate-700 active:scale-[0.98]"
              >
                Voltar ao painel
              </button>
            </div>

            <div>
              <p className="text-sm font-black text-cyan-300">
                {nomeLocalAtual}
              </p>

              <h1 className="mt-1 text-3xl font-black text-white">
                Pendentes
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Cadastros, atualizaÃ§Ãµes e solicitaÃ§Ãµes aguardando anÃ¡lise.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Total recebido
                </p>

                <p className="mt-2 text-3xl font-black">
                  {atualizacoesDoLocal.length}
                </p>
              </div>

              <div className="rounded-2xl border border-yellow-800 bg-yellow-950/30 p-5">
                <p className="text-sm font-bold text-yellow-300">
                  Aguardando anÃ¡lise
                </p>

                <p className="mt-2 text-3xl font-black">
                  {atualizacoesPendentes.length}
                </p>
              </div>

              <div className="rounded-2xl border border-green-800 bg-green-950/30 p-5">
                <p className="text-sm font-bold text-green-300">
                  JÃ¡ analisadas
                </p>

                <p className="mt-2 text-3xl font-black">
                  {atualizacoesAnalisadas.length}
                </p>
              </div>

            </div>

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-6">

              <h2 className="text-2xl font-black">
                AtualizaÃ§Ãµes cadastrais
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                SolicitaÃ§Ãµes recebidas deste condomÃ­nio.
              </p>

              {atualizacoesPendentes.length === 0 ? (

                <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
                  <p className="font-black text-slate-300">
                    Nenhuma atualizaÃ§Ã£o pendente
                  </p>
                </div>

              ) : (

                <div className="mt-5 space-y-3">

                  {atualizacoesPendentes.map(
                    (item) => (

                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-700 bg-slate-800 p-4 md:p-5"
                      >

                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                          <div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-yellow-800 bg-yellow-950/50 px-3 py-1 text-xs font-black text-yellow-300">
                                Pendente
                              </span>

                              <span className="text-xs text-slate-500">
                                {item.codigo}
                              </span>
                            </div>

                            <h3 className="mt-3 text-xl font-black">
                              {item.nome}
                            </h3>

                            <p className="mt-1 text-sm text-slate-300">
                              {item.unidadeNome}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                              <span>
                                Tel: {item.telefone}
                              </span>

                              {item.email && (
                                <span>
                                  E-mail: {item.email}
                                </span>
                              )}

                              <span>
                                Perfil: {item.perfil}
                              </span>
                            </div>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setAtualizacaoSelecionada(
                                item
                              )
                            }
                            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 active:scale-95"
                          >
                            Visualizar
                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </section>

          </div>

        ) : telaAtiva ===
        "inicio" ? (

          <CentralSindico />

        ) : telaAtiva ===
        "materiais" ? (

          <div className="space-y-4">

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setTelaAtiva(
                    "inicio"
                  )
                }
                className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-black text-white transition hover:border-cyan-500 hover:bg-slate-700 active:scale-[0.98]"
              >
                Voltar ao painel
              </button>
            </div>

            <MateriaisDoLocal
              localId={localIdAtual}
              visitante={`/acesso-v2/${
                vinculoAtual?.localSlug ||
                vinculoAtual?.condominioSlug ||
                localIdAtual
              }`}
              painel="/dashboard/condominio"
              titulo="QR, placa e links do condomínio"
            />

          </div>
        ) : (

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs font-black uppercase tracking-wider text-cyan-400">
              {nomeLocalAtual}
            </p>

            <h1 className="mt-2 text-3xl font-black text-white">
              Modulo em preparacao
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              Vamos conectar esta area na sequencia.
            </p>

            <button
              type="button"
              onClick={() =>
                setTelaAtiva(
                  "inicio"
                )
              }
              className="mt-5 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-400"
            >
              Voltar ao painel
            </button>
          </section>

        )}

      </div>

      {atualizacaoSelecionada && (() => {
        const partesUnidade =
          String(
            atualizacaoSelecionada.unidadeNome || ""
          )
            .split("/")
            .map((parte) => parte.trim());

        const blocoSolicitacao =
          normalizar(
            atualizacaoSelecionada.bloco ||
            partesUnidade[0] ||
            ""
          )
            .replace(/^bloco\s*/i, "")
            .replace(/^torre\s*/i, "")
            .trim();

        const numeroSolicitacao =
          normalizar(
            atualizacaoSelecionada.nomeUnidade ||
            partesUnidade[1] ||
            ""
          );

        const unidadeOficialAtualizacao =
          unidades.find((unidade) => {
            const blocoUnidade =
              normalizar(unidade.bloco)
                .replace(/^bloco\s*/i, "")
                .replace(/^torre\s*/i, "")
                .trim();

            const numeroUnidade =
              normalizar(unidade.nome);

            return (
              blocoUnidade === blocoSolicitacao &&
              numeroUnidade === numeroSolicitacao
            );
          }) || null;


        return (
          <AtualizacaoPendenteModal
            atualizacao={
              atualizacaoSelecionada
            }

            localIdOficial={
              unidadeOficialAtualizacao?.localId ||
              localIdAtual
            }

            localNomeOficial={
              unidadeOficialAtualizacao?.localNome ||
              nomeLocalAtual
            }

            unidadeIdOficial={
              unidadeOficialAtualizacao?.id
            }

            unidadeNomeOficial={
              unidadeOficialAtualizacao
                ? `${
                    unidadeOficialAtualizacao.bloco
                  } / ${
                    unidadeOficialAtualizacao.nome
                  }`
                : atualizacaoSelecionada.unidadeNome
            }

            onClose={() =>
              setAtualizacaoSelecionada(
                null
              )
            }
          />
        );
      })()}

    </main>
  );
}


