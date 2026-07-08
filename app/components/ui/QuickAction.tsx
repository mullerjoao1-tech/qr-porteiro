"use client";

import Card from "./Card";
import Botao from "./Botao";

type QuickActionProps = {
  titulo: string;
  descricao?: string;
  icone?: string;
  textoBotao?: string;
  onClick?: () => void;
  variante?:
    | "primario"
    | "secundario"
    | "sucesso"
    | "perigo"
    | "aviso"
    | "neutro"
    | "fantasma";
};

export default function QuickAction({
  titulo,
  descricao,
  icone = "⚡",
  textoBotao = "Executar",
  onClick,
  variante = "primario",
}: QuickActionProps) {
  return (
    <Card
      titulo={titulo}
      subtitulo={descricao}
      icone={icone}
    >
      <div className="mt-4">
        <Botao
          variante={variante}
          icone={icone}
          onClick={onClick}
        >
          {textoBotao}
        </Botao>
      </div>
    </Card>
  );
}
