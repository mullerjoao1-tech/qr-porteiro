"use client";

import Card from "./Card";
import Badge from "./Badge";
import Botao from "./Botao";

type AlertCardProps = {
  titulo: string;
  descricao: string;
  nivel?: "info" | "aviso" | "critico" | "sucesso";
  horario?: string;
  acaoTexto?: string;
  onAcao?: () => void;
};

export default function AlertCard({
  titulo,
  descricao,
  nivel="info",
  horario,
  acaoTexto,
  onAcao,
}: AlertCardProps){

  const mapa = {
    info:{icone:"ℹ️",card:"info" as const,badge:"Info",badgeVar:"info" as const},
    aviso:{icone:"⚠️",card:"aviso" as const,badge:"Atenção",badgeVar:"aviso" as const},
    critico:{icone:"🚨",card:"perigo" as const,badge:"Crítico",badgeVar:"perigo" as const},
    sucesso:{icone:"✅",card:"sucesso" as const,badge:"Resolvido",badgeVar:"sucesso" as const},
  };

  const atual=mapa[nivel];

  return (
    <Card
      variante={atual.card}
      titulo={titulo}
      subtitulo={horario}
      icone={atual.icone}
      acao={<Badge variante={atual.badgeVar}>{atual.badge}</Badge>}
    >
      <p className="text-slate-300 leading-relaxed">{descricao}</p>

      {acaoTexto && onAcao && (
        <div className="mt-4">
          <Botao
            variante={nivel==="critico"?"perigo":"primario"}
            icone="➡️"
            onClick={onAcao}
          >
            {acaoTexto}
          </Botao>
        </div>
      )}
    </Card>
  );
}
