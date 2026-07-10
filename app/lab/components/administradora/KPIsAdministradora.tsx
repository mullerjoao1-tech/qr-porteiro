"use client";

import { useState } from "react";
import CardIndicador from "./CardIndicador";
import PopupCentral from "./PopupCentral";

type ItemPopup = {
  nome: string;
  descricao: string;
  horario: string;
  status?: string;
  acao?: string;
};

type PopupAberto = {
  icone: string;
  titulo: string;
  valor: string;
  descricao: string;
  texto: string;
  detalhes: ItemPopup[];
};

const indicadores: PopupAberto[] = [
  {
    icone: "🟢",
    titulo: "Operação",
    valor: "47",
    descricao: "normais",
    texto: "text-emerald-700",
    detalhes: [
      {
        nome: "Residencial Tulipas",
        status: "🟢 Operação normal",
        descricao: "Portaria online, portão online e sem pendências críticas.",
        horario: "Atualizado 09:18",
      },
      {
        nome: "Residencial Itália",
        status: "🟢 Operação normal",
        descricao: "Sem ocorrências relevantes no momento.",
        horario: "Atualizado 08:55",
      },
      {
        nome: "Solar Primavera",
        status: "🟢 Operação normal",
        descricao: "Tudo atualizado na carteira.",
        horario: "Atualizado 08:10",
      },
    ],
  },
  {
    icone: "🟡",
    titulo: "Atenção",
    valor: "4",
    descricao: "pendências",
    texto: "text-amber-700",
    detalhes: [
      {
        nome: "Jardim Europa",
        status: "🟡 Atenção",
        descricao: "Contrato de limpeza vence amanhã.",
        horario: "Atualizado 08:40",
        acao: "Revisar",
      },
      {
        nome: "Residencial América",
        status: "🟡 Atenção",
        descricao: "Balancete aguardando conferência.",
        horario: "Atualizado ontem",
        acao: "Conferir",
      },
    ],
  },
  {
    icone: "🔴",
    titulo: "Crítico",
    valor: "1",
    descricao: "urgente",
    texto: "text-red-700",
    detalhes: [
      {
        nome: "Solar das Flores",
        status: "🔴 Crítico",
        descricao: "Portão principal aberto há 12 minutos.",
        horario: "Atualizado 09:12",
        acao: "Resolver",
      },
    ],
  },
  {
    icone: "📄",
    titulo: "Contratos",
    valor: "8",
    descricao: "30 dias",
    texto: "text-slate-700",
    detalhes: [
      {
        nome: "Jardim Europa",
        status: "📄 Vencimento próximo",
        descricao: "Contrato de limpeza vence amanhã.",
        horario: "Vencimento próximo",
        acao: "Renovar",
      },
      {
        nome: "Residencial Tulipas",
        status: "📄 Revisar contrato",
        descricao: "Manutenção do portão vence em 12 dias.",
        horario: "Revisar este mês",
        acao: "Ver contrato",
      },
      {
        nome: "Solar Primavera",
        status: "📄 Atenção",
        descricao: "Contrato de elevador vence em 18 dias.",
        horario: "Revisar esta semana",
        acao: "Ver contrato",
      },
      {
        nome: "Residencial América",
        status: "📄 Renovação",
        descricao: "Contrato de jardinagem vence em 25 dias.",
        horario: "Dentro de 30 dias",
        acao: "Renovar",
      },
      {
        nome: "Residencial Itália",
        status: "📄 Documentação",
        descricao: "Seguro predial aguardando conferência.",
        horario: "Pendente hoje",
        acao: "Conferir",
      },
      {
        nome: "Solar das Flores",
        status: "📄 Crítico",
        descricao: "Contrato de portaria terceirizada sem confirmação.",
        horario: "Ação recomendada",
        acao: "Resolver",
      },
      {
        nome: "Residencial Aurora",
        status: "📄 Vencimento próximo",
        descricao: "Manutenção de bombas vence em 29 dias.",
        horario: "Revisar este mês",
        acao: "Ver contrato",
      },
    ],
  },
];

const fundoPorTitulo: Record<string, string> = {
  Operação: "bg-emerald-50",
  Atenção: "bg-amber-50",
  Crítico: "bg-red-50",
  Contratos: "bg-slate-50",
};

const acaoPorTitulo: Record<string, string> = {
  Operação: "Ver condomínios",
  Atenção: "Abrir lista",
  Crítico: "Resolver agora",
  Contratos: "Ver contratos",
};

export default function KPIsAdministradora() {
  const [popup, setPopup] = useState<PopupAberto | null>(null);

  return (
    <>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {indicadores.map((item) => (
          <CardIndicador
            key={item.titulo}
            icone={item.icone}
            titulo={item.titulo}
            valor={item.valor}
            descricao={item.descricao}
            fundo={fundoPorTitulo[item.titulo]}
            texto={item.texto}
            acao={acaoPorTitulo[item.titulo]}
            detalhes={item.detalhes}
            aoAbrir={setPopup}
          />
        ))}
      </section>

      {popup && (
        <PopupCentral
          aberto={popup !== null}
          titulo={popup.titulo}
          icone={popup.icone}
          valor={popup.valor}
          descricao={popup.descricao}
          corTexto={popup.texto}
          itens={popup.detalhes}
          aoFechar={() => setPopup(null)}
        />
      )}
    </>
  );
}