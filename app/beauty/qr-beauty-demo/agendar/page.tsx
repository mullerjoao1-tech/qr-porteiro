"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  criarAgendamento,
  observarAgendamentos,
} from "../../../dashboard/beauty/components/agenda/AgendaFirebase";
import { observarServicos } from "../../../dashboard/beauty/components/servicos/ServicoFirebase";
import { observarProfissionais } from "../../../dashboard/beauty/components/profissionais/ProfissionalFirebase";

type ServicoPublico = {
  id: string;
  nome: string;
  valor: number;
  duracaoMinutos: number;
  profissionalIds?: string[];
  status?: "ativo" | "inativo";
};

type ProfissionalPublico = {
  id: string;
  nome: string;
  status?: "ativo" | "inativo";
};

type AgendamentoExistente = {
  horario: string;
  profissional: string;
  status: string;
};

const HORARIOS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

function dataISO(data: Date) {
  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, "0"),
    String(data.getDate()).padStart(2, "0"),
  ].join("-");
}

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function dataCurta(data: Date) {
  return data.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function BeautyAgendarPage() {
  const router = useRouter();

  const [servicos, setServicos] = useState<ServicoPublico[]>([]);
  const [profissionais, setProfissionais] = useState<
    ProfissionalPublico[]
  >([]);
  const [agendamentos, setAgendamentos] = useState<
    AgendamentoExistente[]
  >([]);

  const [servicoId, setServicoId] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState<Date>(
    new Date()
  );
  const [horario, setHorario] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const datas = useMemo(() => {
    return Array.from({ length: 7 }, (_, indice) => {
      const data = new Date();
      data.setHours(12, 0, 0, 0);
      data.setDate(data.getDate() + indice);
      return data;
    });
  }, []);

  useEffect(() => {
    let servicosOk = false;
    let profissionaisOk = false;

    function finalizar() {
      if (servicosOk && profissionaisOk) {
        setCarregando(false);
      }
    }

    const pararServicos = observarServicos(
      (lista) => {
        setServicos(
          (lista as ServicoPublico[]).filter(
            (item) => item.status !== "inativo"
          )
        );
        servicosOk = true;
        finalizar();
      },
      (e) => {
        console.error(e);
        setErro("NÃ£o foi possÃ­vel carregar os serviÃ§os.");
        servicosOk = true;
        finalizar();
      }
    );

    const pararProfissionais = observarProfissionais(
      (lista) => {
        setProfissionais(
          (lista as ProfissionalPublico[]).filter(
            (item) => item.status !== "inativo"
          )
        );
        profissionaisOk = true;
        finalizar();
      },
      (e) => {
        console.error(e);
        setErro("NÃ£o foi possÃ­vel carregar os profissionais.");
        profissionaisOk = true;
        finalizar();
      }
    );

    return () => {
      pararServicos();
      pararProfissionais();
    };
  }, []);

  useEffect(() => {
    setHorario("");

    return observarAgendamentos(
      dataISO(dataSelecionada),
      (lista) =>
        setAgendamentos(
          lista as unknown as AgendamentoExistente[]
        ),
      (e) => {
        console.error(e);
        setErro("NÃ£o foi possÃ­vel consultar os horÃ¡rios.");
      }
    );
  }, [dataSelecionada]);

  const servicoSelecionado = useMemo(
    () => servicos.find((item) => item.id === servicoId) ?? null,
    [servicos, servicoId]
  );

  const profissionaisDisponiveis = useMemo(() => {
    if (!servicoSelecionado) {
      return [];
    }

    const ids = servicoSelecionado.profissionalIds ?? [];

    if (ids.length === 0) {
      return profissionais;
    }

    return profissionais.filter((item) => ids.includes(item.id));
  }, [profissionais, servicoSelecionado]);

  const profissionalSelecionado = useMemo(
    () =>
      profissionaisDisponiveis.find(
        (item) => item.id === profissionalId
      ) ?? null,
    [profissionaisDisponiveis, profissionalId]
  );

  const horariosOcupados = useMemo(() => {
    if (!profissionalSelecionado) {
      return new Set<string>();
    }

    return new Set(
      agendamentos
        .filter(
          (item) =>
            item.profissional === profissionalSelecionado.nome &&
            item.status !== "cancelado"
        )
        .map((item) => item.horario)
    );
  }, [agendamentos, profissionalSelecionado]);

  function escolherServico(id: string) {
    setServicoId(id);
    setProfissionalId("");
    setHorario("");
  }

  async function confirmar() {
    if (!servicoSelecionado) {
      alert("Escolha o serviÃ§o.");
      return;
    }

    if (!profissionalSelecionado) {
      alert("Escolha o profissional.");
      return;
    }

    if (!horario) {
      alert("Escolha o horÃ¡rio.");
      return;
    }

    if (!nome.trim()) {
      alert("Digite seu nome.");
      return;
    }

    if (!telefone.trim()) {
      alert("Digite seu telefone.");
      return;
    }

    setSalvando(true);

    try {
      await criarAgendamento({
        dataISO: dataISO(dataSelecionada),
        horario,
        cliente: nome.trim(),
        telefone: telefone.trim(),
        servico: servicoSelecionado.nome,
        profissional: profissionalSelecionado.nome,
        duracaoMinutos:
          Number(servicoSelecionado.duracaoMinutos) || 60,
        valor: Number(servicoSelecionado.valor) || 0,
        status: "aguardando",
        observacoes: observacoes.trim() || undefined,
        origem: "cliente",
      });

      const parametros = new URLSearchParams({
        data: dataISO(dataSelecionada),
        horario,
        cliente: nome.trim(),
        servico: servicoSelecionado.nome,
        profissional: profissionalSelecionado.nome,
      });

      router.push(
        `/beauty/qr-beauty-demo/confirmado?${parametros.toString()}`
      );
    } catch (e) {
      console.error(e);
      alert(
        e instanceof Error
          ? e.message
          : "NÃ£o foi possÃ­vel concluir o agendamento."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-white">
      <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-black text-slate-300"
        >
          â† Voltar
        </button>

        <section className="rounded-3xl border border-pink-500/30 bg-gradient-to-br from-pink-700 via-fuchsia-700 to-purple-800 p-5 shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-100">
            ðŸ“… Agendamento online
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Escolha seu horÃ¡rio
          </h1>

          <p className="mt-2 text-sm font-semibold text-pink-100">
            SalÃ£o de testes QR Beauty
          </p>
        </section>

        {erro && (
          <div className="mt-4 rounded-2xl border border-red-800 bg-red-950/30 p-4 text-sm font-bold text-red-300">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Carregando opÃ§Ãµes...
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <Bloco titulo="1. Escolha o serviÃ§o">
              <div className="grid gap-3">
                {servicos.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => escolherServico(item.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      servicoId === item.id
                        ? "border-pink-500 bg-pink-950/40"
                        : "border-slate-700 bg-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{item.nome}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {item.duracaoMinutos} minutos
                        </p>
                      </div>

                      <p className="font-black text-pink-300">
                        {moeda(item.valor)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </Bloco>

            {servicoSelecionado && (
              <Bloco titulo="2. Escolha o profissional">
                <div className="grid grid-cols-2 gap-3">
                  {profissionaisDisponiveis.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setProfissionalId(item.id);
                        setHorario("");
                      }}
                      className={`rounded-2xl border p-4 text-center transition ${
                        profissionalId === item.id
                          ? "border-pink-500 bg-pink-950/40"
                          : "border-slate-700 bg-slate-800"
                      }`}
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-2xl">
                        ðŸ’‡
                      </div>
                      <p className="mt-2 font-black">{item.nome}</p>
                    </button>
                  ))}
                </div>
              </Bloco>
            )}

            {profissionalSelecionado && (
              <Bloco titulo="3. Escolha o dia">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {datas.map((data) => {
                    const selecionada =
                      dataISO(data) === dataISO(dataSelecionada);

                    return (
                      <button
                        key={dataISO(data)}
                        type="button"
                        onClick={() => setDataSelecionada(data)}
                        className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-black capitalize ${
                          selecionada
                            ? "border-pink-500 bg-pink-600"
                            : "border-slate-700 bg-slate-800 text-slate-300"
                        }`}
                      >
                        {dataCurta(data)}
                      </button>
                    );
                  })}
                </div>
              </Bloco>
            )}

            {profissionalSelecionado && (
              <Bloco titulo="4. Escolha o horÃ¡rio">
                <div className="grid grid-cols-3 gap-2">
                  {HORARIOS.map((item) => {
                    const ocupado = horariosOcupados.has(item);

                    return (
                      <button
                        key={item}
                        type="button"
                        disabled={ocupado}
                        onClick={() => setHorario(item)}
                        className={`rounded-xl border px-3 py-3 text-sm font-black ${
                          ocupado
                            ? "cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600 line-through"
                            : horario === item
                            ? "border-pink-500 bg-pink-600"
                            : "border-slate-700 bg-slate-800 text-slate-300"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </Bloco>
            )}

            {horario && (
              <Bloco titulo="5. Seus dados">
                <div className="space-y-3">
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-pink-500"
                  />

                  <input
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="Telefone ou WhatsApp"
                    inputMode="tel"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-pink-500"
                  />

                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="ObservaÃ§Ãµes (opcional)"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-pink-500"
                  />
                </div>
              </Bloco>
            )}

            {horario && (
              <button
                type="button"
                onClick={confirmar}
                disabled={salvando}
                className="w-full rounded-2xl bg-pink-600 px-5 py-4 text-lg font-black transition hover:bg-pink-500 active:scale-[0.98] disabled:bg-slate-700"
              >
                {salvando
                  ? "Confirmando..."
                  : "Confirmar agendamento"}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Bloco({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="mb-4 text-sm font-black text-pink-300">
        {titulo}
      </h2>

      {children}
    </section>
  );
}

