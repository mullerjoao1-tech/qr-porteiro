"use client";

import Card from "./Card";
import StatusChip from "./StatusChip";
import Botao from "./Botao";
import Avatar from "./Avatar";

type PrestadorCardProps = {
  nome: string;
  servico: string;
  horario?: string;
  empresa?: string;
  foto?: string;
  confirmado?: boolean;
  onDetalhes?: () => void;
  onContato?: () => void;
};

export default function PrestadorCard({
  nome,
  servico,
  horario,
  empresa,
  foto,
  confirmado = false,
  onDetalhes,
  onContato,
}: PrestadorCardProps) {
  return (
    <Card
      titulo={nome}
      subtitulo={servico}
      icone="👷"
      acao={
        <StatusChip
          status={confirmado ? "sucesso" : "pendente"}
          pequeno
          texto={confirmado ? "Confirmado" : "Aguardando"}
        />
      }
    >
      <div className="flex items-center gap-4 mb-4">
        <Avatar nome={nome} foto={foto} />

        <div>
          {empresa && (
            <p className="text-slate-300 font-semibold">
              🏢 {empresa}
            </p>
          )}

          {horario && (
            <p className="text-slate-400 text-sm mt-1">
              🕒 {horario}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Botao
          variante="secundario"
          icone="👁️"
          onClick={onDetalhes}
        >
          Detalhes
        </Botao>

        <Botao
          variante="primario"
          icone="💬"
          onClick={onContato}
        >
          Contato
        </Botao>
      </div>
    </Card>
  );
}
