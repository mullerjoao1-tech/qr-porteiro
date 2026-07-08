"use client";

import Card from "./Card";
import StatusChip from "./StatusChip";
import Botao from "./Botao";

type StatisticCardProps = {
  titulo: string;
  valor: number | string;
  icone?: string;
  variacao?: string;
  status?: "online"|"offline"|"ocupado"|"pendente"|"sucesso"|"erro"|"alerta"|"info";
  onDetalhes?: ()=>void;
};

export default function StatisticCard({
  titulo,
  valor,
  icone="📊",
  variacao,
  status="info",
  onDetalhes,
}:StatisticCardProps){
  return (
    <Card
      titulo={titulo}
      icone={icone}
      acao={<StatusChip status={status} pequeno />}
    >
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-white">
          {valor}
        </h2>

        {variacao && (
          <p className="text-sm text-slate-400">
            {variacao}
          </p>
        )}
      </div>

      {onDetalhes && (
        <div className="mt-5">
          <Botao
            variante="secundario"
            icone="📈"
            onClick={onDetalhes}
          >
            Ver relatório
          </Botao>
        </div>
      )}
    </Card>
  );
}
