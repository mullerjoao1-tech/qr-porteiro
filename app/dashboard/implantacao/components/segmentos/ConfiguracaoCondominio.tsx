"use client";

export type TipoCondominio =
  | "vertical"
  | "horizontal"
  | "misto";

export type TipoPortaria =
  | "sem-portaria"
  | "presencial-24h"
  | "presencial-horario"
  | "remota"
  | "hibrida";

export type ConfiguracaoCondominioDados = {
  tipoCondominio: TipoCondominio;

  quantidadeBlocos: number;

  apartamentosPorBloco: number;

  quantidadeCasas: number;

  possuiPortaria: boolean;

  tipoPortaria: TipoPortaria;

  possuiVisitantes: boolean;

  possuiEntregas: boolean;

  possuiReservas: boolean;

  possuiCameras: boolean;

  possuiAberturaRemota: boolean;

  possuiPrestadores: boolean;

  possuiComunicados: boolean;
};

type Props = {
  valor: ConfiguracaoCondominioDados;

  onChange: (
    dados: ConfiguracaoCondominioDados
  ) => void;
};

type CampoBooleanoProps = {
  titulo: string;

  descricao: string;

  valor: boolean;

  onChange: (
    valor: boolean
  ) => void;
};

function CampoBooleano({
  titulo,
  descricao,
  valor,
  onChange,
}: CampoBooleanoProps) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!valor)
      }
      className={`rounded-2xl border p-4 text-left transition active:scale-[0.98] ${
        valor
          ? "border-green-500 bg-green-500/10"
          : "border-slate-700 bg-slate-950 hover:border-slate-500"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-black text-white">
            {titulo}
          </p>

          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {descricao}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            valor
              ? "bg-green-500 text-slate-950"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          {valor ? "Sim" : "Não"}
        </span>
      </div>
    </button>
  );
}

function normalizarNumero(
  valor: string
): number {
  const numero =
    Number.parseInt(
      valor,
      10
    );

  if (
    Number.isNaN(numero) ||
    numero < 0
  ) {
    return 0;
  }

  return numero;
}

export default function ConfiguracaoCondominio({
  valor,
  onChange,
}: Props) {
  function atualizar<
    Chave extends keyof ConfiguracaoCondominioDados
  >(
    chave: Chave,
    novoValor:
      ConfiguracaoCondominioDados[Chave]
  ) {
    onChange({
      ...valor,
      [chave]:
        novoValor,
    });
  }

  const possuiEstruturaVertical =
    valor.tipoCondominio ===
      "vertical" ||
    valor.tipoCondominio ===
      "misto";

  const possuiEstruturaHorizontal =
    valor.tipoCondominio ===
      "horizontal" ||
    valor.tipoCondominio ===
      "misto";

  return (
    <section>
      <p className="text-xs font-black uppercase tracking-wider text-green-400">
        Configuração do condomínio
      </p>

      <h2 className="mt-1 text-2xl font-black text-white">
        Como funciona este condomínio?
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Essas respostas serão usadas para
        criar automaticamente a estrutura,
        os módulos e as configurações
        iniciais do condomínio.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <p className="mb-3 text-sm font-black text-slate-200">
            Tipo do condomínio
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                atualizar(
                  "tipoCondominio",
                  "vertical"
                )
              }
              className={`rounded-2xl border p-4 text-left transition ${
                valor.tipoCondominio ===
                "vertical"
                  ? "border-green-500 bg-green-500/10"
                  : "border-slate-700 bg-slate-950"
              }`}
            >
              <p className="text-2xl">
                🏢
              </p>

              <p className="mt-2 font-black text-white">
                Vertical
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Blocos e apartamentos
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                atualizar(
                  "tipoCondominio",
                  "horizontal"
                )
              }
              className={`rounded-2xl border p-4 text-left transition ${
                valor.tipoCondominio ===
                "horizontal"
                  ? "border-green-500 bg-green-500/10"
                  : "border-slate-700 bg-slate-950"
              }`}
            >
              <p className="text-2xl">
                🏠
              </p>

              <p className="mt-2 font-black text-white">
                Horizontal
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Casas e residências
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                atualizar(
                  "tipoCondominio",
                  "misto"
                )
              }
              className={`rounded-2xl border p-4 text-left transition ${
                valor.tipoCondominio ===
                "misto"
                  ? "border-green-500 bg-green-500/10"
                  : "border-slate-700 bg-slate-950"
              }`}
            >
              <p className="text-2xl">
                🏘️
              </p>

              <p className="mt-2 font-black text-white">
                Misto
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Blocos, apartamentos
                e casas
              </p>
            </button>
          </div>
        </div>

        {possuiEstruturaVertical && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="quantidade-blocos"
                className="mb-2 block text-sm font-bold text-slate-200"
              >
                Quantidade de blocos
              </label>

              <input
                id="quantidade-blocos"
                type="number"
                min={0}
                value={
                  valor.quantidadeBlocos
                }
                onChange={(evento) =>
                  atualizar(
                    "quantidadeBlocos",
                    normalizarNumero(
                      evento.target.value
                    )
                  )
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label
                htmlFor="apartamentos-por-bloco"
                className="mb-2 block text-sm font-bold text-slate-200"
              >
                Apartamentos por bloco
              </label>

              <input
                id="apartamentos-por-bloco"
                type="number"
                min={0}
                value={
                  valor.apartamentosPorBloco
                }
                onChange={(evento) =>
                  atualizar(
                    "apartamentosPorBloco",
                    normalizarNumero(
                      evento.target.value
                    )
                  )
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none focus:border-green-500"
              />
            </div>
          </div>
        )}

        {possuiEstruturaHorizontal && (
          <div>
            <label
              htmlFor="quantidade-casas"
              className="mb-2 block text-sm font-bold text-slate-200"
            >
              Quantidade de casas
            </label>

            <input
              id="quantidade-casas"
              type="number"
              min={0}
              value={
                valor.quantidadeCasas
              }
              onChange={(evento) =>
                atualizar(
                  "quantidadeCasas",
                  normalizarNumero(
                    evento.target.value
                  )
                )
              }
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none focus:border-green-500"
            />
          </div>
        )}

        <CampoBooleano
          titulo="Possui portaria?"
          descricao="Ative para configurar o tipo de operação da portaria."
          valor={valor.possuiPortaria}
          onChange={(novoValor) => {
            onChange({
              ...valor,

              possuiPortaria:
                novoValor,

              tipoPortaria:
                novoValor
                  ? valor.tipoPortaria ===
                    "sem-portaria"
                    ? "presencial-24h"
                    : valor.tipoPortaria
                  : "sem-portaria",
            });
          }}
        />

        {valor.possuiPortaria && (
          <div>
            <label
              htmlFor="tipo-portaria"
              className="mb-2 block text-sm font-bold text-slate-200"
            >
              Tipo de portaria
            </label>

            <select
              id="tipo-portaria"
              value={
                valor.tipoPortaria
              }
              onChange={(evento) =>
                atualizar(
                  "tipoPortaria",
                  evento.target
                    .value as TipoPortaria
                )
              }
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none focus:border-green-500"
            >
              <option value="presencial-24h">
                Presencial 24 horas
              </option>

              <option value="presencial-horario">
                Presencial em horário
                definido
              </option>

              <option value="remota">
                Portaria remota
              </option>

              <option value="hibrida">
                Operação híbrida
              </option>
            </select>
          </div>
        )}

        <div>
          <p className="mb-3 text-sm font-black text-slate-200">
            Recursos iniciais
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <CampoBooleano
              titulo="Controle de visitantes"
              descricao="Chamadas, autorizações e histórico de visitantes."
              valor={
                valor.possuiVisitantes
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiVisitantes",
                  novoValor
                )
              }
            />

            <CampoBooleano
              titulo="Entregas e encomendas"
              descricao="Registro e acompanhamento de entregas."
              valor={
                valor.possuiEntregas
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiEntregas",
                  novoValor
                )
              }
            />

            <CampoBooleano
              titulo="Reservas"
              descricao="Reservas de salão, churrasqueira e áreas comuns."
              valor={
                valor.possuiReservas
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiReservas",
                  novoValor
                )
              }
            />

            <CampoBooleano
              titulo="Câmeras"
              descricao="Integração e gestão de câmeras do local."
              valor={
                valor.possuiCameras
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiCameras",
                  novoValor
                )
              }
            />

            <CampoBooleano
              titulo="Abertura remota"
              descricao="Abertura de portões e acessos pelo sistema."
              valor={
                valor.possuiAberturaRemota
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiAberturaRemota",
                  novoValor
                )
              }
            />

            <CampoBooleano
              titulo="Prestadores"
              descricao="Cadastro, agenda e controle de prestadores."
              valor={
                valor.possuiPrestadores
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiPrestadores",
                  novoValor
                )
              }
            />

            <CampoBooleano
              titulo="Comunicados"
              descricao="Envio de avisos e confirmação de ciência."
              valor={
                valor.possuiComunicados
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiComunicados",
                  novoValor
                )
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
