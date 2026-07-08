"use client";

import Card from "./Card";
import StatusChip from "./StatusChip";
import Botao from "./Botao";

export type AgendaItemProps = {
  titulo: string;
  horario: string;
  local?: string;
  responsavel?: string;
  status?: "online"|"offline"|"ocupado"|"pendente"|"sucesso"|"erro"|"alerta"|"info";
  onAbrir?: ()=>void;
};

export default function AgendaCard({
  titulo,
  horario,
  local,
  responsavel,
  status="pendente",
  onAbrir,
}:AgendaItemProps){
  return(
    <Card
      titulo={titulo}
      subtitulo={horario}
      icone="📅"
      acao={<StatusChip status={status} pequeno />}
    >
      {local && <p className="text-slate-300">📍 {local}</p>}
      {responsavel && <p className="text-slate-400 mt-2">👤 {responsavel}</p>}

      {onAbrir && (
        <div className="mt-4">
          <Botao variante="primario" icone="👁️" onClick={onAbrir}>
            Ver detalhes
          </Botao>
        </div>
      )}
    </Card>
  );
}
