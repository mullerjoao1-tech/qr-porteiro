"use client";

import Card from "./Card";
import StatusChip from "./StatusChip";
import Botao from "./Botao";
import Badge from "./Badge";

type EntregaCardProps = {
  destinatario: string;
  tipo: string;
  empresa?: string;
  horario?: string;
  status?: "pendente" | "entregue" | "retirada";
  urgente?: boolean;
  onAutorizar?: () => void;
  onDetalhes?: () => void;
};

export default function EntregaCard({
  destinatario,
  tipo,
  empresa,
  horario,
  status = "pendente",
  urgente = false,
  onAutorizar,
  onDetalhes,
}: EntregaCardProps) {

  const statusChip =
    status === "entregue"
      ? "sucesso"
      : status === "retirada"
      ? "online"
      : "pendente";

  return (
    <Card
      titulo={destinatario}
      subtitulo={tipo}
      icone="📦"
      acao={
        <div className="flex flex-col items-end gap-2">
          <StatusChip
            status={statusChip}
            pequeno
            texto={
              status === "entregue"
                ? "Entregue"
                : status === "retirada"
                ? "Retirada"
                : "Pendente"
            }
          />

          {urgente && (
            <Badge variante="perigo" icone="🚨">
              Urgente
            </Badge>
          )}
        </div>
      }
    >
      {empresa && (
        <p className="text-slate-300">
          🏢 {empresa}
        </p>
      )}

      {horario && (
        <p className="text-slate-400 mt-2">
          🕒 {horario}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mt-5">

        <Botao
          variante="sucesso"
          icone="✅"
          onClick={onAutorizar}
        >
          Autorizar
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
