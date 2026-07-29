"use client";

export type ConfiguracaoBeautyDados = {
  quantidadeProfissionais: number;

  trabalhaComAgenda: boolean;

  possuiFilaEspera: boolean;

  possuiAntecipacaoAgenda: boolean;

  possuiConfirmacaoAutomatica: boolean;

  possuiCaixa: boolean;

  possuiEstoque: boolean;

  possuiCRM: boolean;

  possuiWhatsApp: boolean;

  possuiPainelTV: boolean;
};

type Props = {
  valor: ConfiguracaoBeautyDados;

  onChange: (
    dados: ConfiguracaoBeautyDados
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

export default function ConfiguracaoBeauty({
  valor,
  onChange,
}: Props) {
  function atualizar<
    Chave extends keyof ConfiguracaoBeautyDados
  >(
    chave: Chave,
    novoValor:
      ConfiguracaoBeautyDados[Chave]
  ) {
    onChange({
      ...valor,
      [chave]:
        novoValor,
    });
  }

  return (
    <section>
      <p className="text-xs font-black uppercase tracking-wider text-green-400">
        Configuração do Beauty
      </p>

      <h2 className="mt-1 text-2xl font-black text-white">
        Como funciona este estabelecimento?
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Essas respostas serão usadas para
        preparar agenda, profissionais,
        atendimento e recursos iniciais do
        QR Beauty.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <label
            htmlFor="quantidade-profissionais"
            className="mb-2 block text-sm font-bold text-slate-200"
          >
            Quantidade inicial de profissionais
          </label>

          <input
            id="quantidade-profissionais"
            type="number"
            min={0}
            value={
              valor.quantidadeProfissionais
            }
            onChange={(evento) =>
              atualizar(
                "quantidadeProfissionais",
                normalizarNumero(
                  evento.target.value
                )
              )
            }
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none focus:border-green-500"
          />
        </div>

        <div>
          <p className="mb-3 text-sm font-black text-slate-200">
            Agenda e operação
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <CampoBooleano
              titulo="Agenda"
              descricao="Permite organizar horários, serviços e profissionais."
              valor={
                valor.trabalhaComAgenda
              }
              onChange={(novoValor) =>
                atualizar(
                  "trabalhaComAgenda",
                  novoValor
                )
              }
            />

            <CampoBooleano
              titulo="Fila de espera"
              descricao="Permite oferecer vagas quando houver cancelamento."
              valor={
                valor.possuiFilaEspera
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiFilaEspera",
                  novoValor
                )
              }
            />

            <CampoBooleano
              titulo="Antecipação de agenda"
              descricao="Convida clientes para antecipar quando houver horário livre."
              valor={
                valor.possuiAntecipacaoAgenda
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiAntecipacaoAgenda",
                  novoValor
                )
              }
            />

            <CampoBooleano
              titulo="Confirmação automática"
              descricao="Envia confirmação antes do atendimento."
              valor={
                valor.possuiConfirmacaoAutomatica
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiConfirmacaoAutomatica",
                  novoValor
                )
              }
            />

            <CampoBooleano
              titulo="Caixa"
              descricao="Controle de entradas, saídas e fechamento."
              valor={
                valor.possuiCaixa
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiCaixa",
                  novoValor
                )
              }
            />

            <CampoBooleano
              titulo="Estoque"
              descricao="Controle de produtos, insumos e consumo."
              valor={
                valor.possuiEstoque
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiEstoque",
                  novoValor
                )
              }
            />

            <CampoBooleano
              titulo="CRM"
              descricao="Histórico, preferências e relacionamento com clientes."
              valor={
                valor.possuiCRM
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiCRM",
                  novoValor
                )
              }
            />

            <CampoBooleano
              titulo="WhatsApp"
              descricao="Integração para confirmações, avisos e relacionamento."
              valor={
                valor.possuiWhatsApp
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiWhatsApp",
                  novoValor
                )
              }
            />

            <CampoBooleano
              titulo="Painel TV"
              descricao="Exibe horários, confirmados e cancelamentos em uma tela."
              valor={
                valor.possuiPainelTV
              }
              onChange={(novoValor) =>
                atualizar(
                  "possuiPainelTV",
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