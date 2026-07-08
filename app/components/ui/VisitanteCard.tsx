"use client";

import Card from "./Card";
import StatusChip from "./StatusChip";
import Botao from "./Botao";

type VisitanteStatus = "aguardando" | "atendimento" | "finalizado";

type StatusChipTipo =
  | "online"
  | "offline"
  | "ocupado"
  | "pendente"
  | "sucesso"
  | "erro"
  | "alerta"
  | "info";

type VisitanteCardProps = {
  nome: string;
  motivo: string;
  horario?: string;
  foto?: string;
  status?: VisitanteStatus;
  onAtender?: () => void;
  onDetalhes?: () => void;
};

export default function VisitanteCard({
  nome,
  motivo,
  horario,
  foto,
  status = "aguardando",
  onAtender,
  onDetalhes,
}: VisitanteCardProps) {
  let statusChip: StatusChipTipo = "pendente";
  let textoChip = "Aguardando";

  if (status === "atendimento") {
    statusChip = "ocupado";
    textoChip = "Em atendimento";
  }

  if (status === "finalizado") {
    statusChip = "sucesso";
    textoChip = "Finalizado";
  }

  return (
    <Card
      titulo={nome}
      subtitulo={motivo}
      icone="🚶"
      acao={<StatusChip status={statusChip} texto={textoChip} pequeno />}
    >
      {horario && (
        <p className="text-slate-400 mb-4">🕒 {horario}</p>
      )}

      {foto && (
        <img
          src={foto}
          alt={nome}
          className="w-full rounded-2xl border border-slate-700 mb-4"
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Botao
          variante="sucesso"
          icone="✅"
          onClick={onAtender}
          disabled={status === "finalizado"}
        >
          Atender
        </Botao>

        <Botao
          variante="secundario"
          icone="👁️"
          onClick={onDetalhes}
        >
          Detalhes
        </Botao>
      </div>
    </Card>
  );
}
