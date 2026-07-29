"use client";

import type {
  TipoLocal,
} from "./PassoTipoLocal";

import ConfiguracaoCondominio, {
  type ConfiguracaoCondominioDados,
} from "./segmentos/ConfiguracaoCondominio";

import ConfiguracaoBeauty, {
  type ConfiguracaoBeautyDados,
} from "./segmentos/ConfiguracaoBeauty";

export type ConfiguracaoSegmento =
  | {
      tipo: "condominio";
      dados: ConfiguracaoCondominioDados;
    }
  | {
      tipo: "beauty";
      dados: ConfiguracaoBeautyDados;
    }
  | {
      tipo:
        | "barbearia"
        | "clinica"
        | "empresa"
        | "residencia"
        | "restaurante"
        | "outro";

      dados: Record<
        string,
        boolean | number | string
      >;
    };

type Props = {
  tipoLocal: TipoLocal;

  configuracao:
    ConfiguracaoSegmento;

  onChange: (
    configuracao:
      ConfiguracaoSegmento
  ) => void;
};

function ConfiguracaoAindaNaoDisponivel({
  tipoLocal,
}: {
  tipoLocal: TipoLocal;
}) {
  return (
    <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
      <p className="font-black text-amber-300">
        ⚠️ Configuração específica ainda não disponível
      </p>

      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        O segmento{" "}
        <strong>{tipoLocal}</strong>{" "}
        já pode ser selecionado, mas as perguntas específicas serão
        adicionadas depois.
      </p>
    </section>
  );
}

export default function PassoConfiguracaoSegmento({
  tipoLocal,
  configuracao,
  onChange,
}: Props) {
  if (
    tipoLocal === "condominio" &&
    configuracao.tipo ===
      "condominio"
  ) {
    return (
      <ConfiguracaoCondominio
        valor={configuracao.dados}
        onChange={(dados) =>
          onChange({
            tipo: "condominio",
            dados,
          })
        }
      />
    );
  }

  if (
    tipoLocal === "beauty" &&
    configuracao.tipo ===
      "beauty"
  ) {
    return (
      <ConfiguracaoBeauty
        valor={configuracao.dados}
        onChange={(dados) =>
          onChange({
            tipo: "beauty",
            dados,
          })
        }
      />
    );
  }

  return (
    <ConfiguracaoAindaNaoDisponivel
      tipoLocal={tipoLocal}
    />
  );
}