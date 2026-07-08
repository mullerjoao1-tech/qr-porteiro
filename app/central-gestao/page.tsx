"use client";

import AlertCard from "../components/ui/AlertCard";
import AgendaCard from "../components/ui/AgendaCard";
import EntregaCard from "../components/ui/EntregaCard";
import InfoCard from "../components/ui/InfoCard";
import PrestadorCard from "../components/ui/PrestadorCard";
import QuickAction from "../components/ui/QuickAction";
import StatisticCard from "../components/ui/StatisticCard";
import Timeline from "../components/ui/Timeline";
import VisitanteCard from "../components/ui/VisitanteCard";
import Badge from "../components/ui/Badge";

export default function CentralGestaoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-4">
      <div className="w-full max-w-md mx-auto space-y-5 pb-10">

        <section className="bg-gradient-to-br from-blue-900/80 to-slate-900 border border-blue-500/40 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-blue-200 text-sm font-bold">
                Central de Gestão
              </p>

              <h1 className="text-3xl font-black mt-1">
                Bom dia, João 👋
              </h1>

              <p className="text-slate-300 text-sm mt-2">
                Condomínio Tulipas • Operação em tempo real
              </p>
            </div>

            <Badge variante="sucesso" icone="🟢">
              Online
            </Badge>
          </div>

          <div className="mt-5 bg-slate-950/40 border border-white/10 rounded-2xl p-4">
            <p className="text-white font-black text-lg">
              O que precisa da sua atenção agora?
            </p>

            <p className="text-slate-300 text-sm mt-1">
              1 visitante aguardando, 2 entregas pendentes e 1 prestador confirmado.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3">
            🚨 Atenção agora
          </h2>

          <div className="space-y-3">
            <AlertCard
              nivel="aviso"
              titulo="Visitante aguardando"
              descricao="Carlos informou visita para o apartamento 203 e ainda não foi atendido."
              horario="Agora"
              acaoTexto="Ver chamada"
              onAcao={() => alert("Abrir detalhes da chamada")}
            />

            <AlertCard
              nivel="critico"
              titulo="Portão aberto há 3 minutos"
              descricao="O sensor indica que o portão social permanece aberto acima do tempo recomendado."
              horario="Há 3 min"
              acaoTexto="Verificar"
              onAcao={() => alert("Abrir monitoramento do portão")}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3">
            🚶 Visitantes
          </h2>

          <VisitanteCard
            nome="Carlos Almeida"
            motivo="Visita ao apto 203"
            horario="13:42"
            status="aguardando"
            onAtender={() => alert("Atender visitante")}
            onDetalhes={() => alert("Detalhes do visitante")}
          />
        </section>

        <section>
          <h2 className="text-xl font-black mb-3">
            📦 Entregas
          </h2>

          <div className="space-y-3">
            <EntregaCard
              destinatario="Apto 104"
              tipo="Entrega de comida"
              empresa="iFood"
              horario="13:35"
              status="pendente"
              urgente
              onAutorizar={() => alert("Autorizar entrega")}
              onDetalhes={() => alert("Detalhes da entrega")}
            />

            <EntregaCard
              destinatario="Apto 302"
              tipo="Pacote"
              empresa="Mercado Livre"
              horario="12:58"
              status="entregue"
              onAutorizar={() => alert("Entrega já autorizada")}
              onDetalhes={() => alert("Detalhes da entrega")}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3">
            📅 Agenda de hoje
          </h2>

          <div className="space-y-3">
            <AgendaCard
              titulo="Manutenção do portão"
              horario="14:00"
              local="Entrada principal"
              responsavel="João Eletricista"
              status="sucesso"
              onAbrir={() => alert("Abrir agendamento")}
            />

            <AgendaCard
              titulo="Limpeza da área comum"
              horario="16:00"
              local="Salão de festas"
              responsavel="Equipe de limpeza"
              status="pendente"
              onAbrir={() => alert("Abrir agendamento")}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3">
            👷 Prestadores
          </h2>

          <PrestadorCard
            nome="João Eletricista"
            servico="Manutenção do portão"
            empresa="JH Elétrica"
            horario="Chegada prevista: 14:00"
            confirmado
            onDetalhes={() => alert("Ver prestador")}
            onContato={() => alert("Entrar em contato")}
          />
        </section>

        <section>
          <h2 className="text-xl font-black mb-3">
            📊 Indicadores rápidos
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <StatisticCard
              titulo="Chamadas"
              valor={12}
              icone="🔔"
              variacao="Hoje"
              status="info"
            />

            <StatisticCard
              titulo="Entregas"
              valor={8}
              icone="📦"
              variacao="Hoje"
              status="sucesso"
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3">
            ⚡ Ações rápidas
          </h2>

          <div className="space-y-3">
            <QuickAction
              titulo="Abrir portão"
              descricao="Acionar abertura manual do portão principal."
              icone="🚪"
              textoBotao="Abrir agora"
              variante="sucesso"
              onClick={() => alert("Abrir portão")}
            />

            <QuickAction
              titulo="Novo comunicado"
              descricao="Enviar aviso para moradores do condomínio."
              icone="📢"
              textoBotao="Criar comunicado"
              variante="primario"
              onClick={() => alert("Criar comunicado")}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3">
            📋 Linha do tempo
          </h2>

          <Timeline
            itens={[
              {
                titulo: "Visitante chamou",
                descricao: "Carlos Almeida chamou o apto 203.",
                horario: "13:42",
                icone: "🚶",
                status: "aviso",
              },
              {
                titulo: "Entrega registrada",
                descricao: "iFood aguardando autorização para o apto 104.",
                horario: "13:35",
                icone: "📦",
                status: "info",
              },
              {
                titulo: "Prestador confirmou presença",
                descricao: "João Eletricista confirmou chegada às 14:00.",
                horario: "13:30",
                icone: "👷",
                status: "sucesso",
              },
              {
                titulo: "Portão aberto",
                descricao: "Abertura manual realizada pela administração.",
                horario: "13:12",
                icone: "🚪",
                status: "padrao",
              },
            ]}
          />
        </section>

        <section>
          <InfoCard
            titulo="Próxima evolução"
            valor="QR Acesso"
            descricao="Esta tela é o primeiro protótipo da Central de Gestão. A próxima etapa é ligar esses cards aos dados reais do Firebase."
            icone="🚀"
            badge="Beta"
            badgeVariante="aviso"
          />
        </section>

      </div>
    </main>
  );
}
