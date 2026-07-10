import DashboardLayout from "../../components/DashboardLayout";

import HeaderCondominio from "../../components/condominio/HeaderCondominio";
import ResumoCondominio from "../../components/condominio/ResumoCondominio";
import GridModulos from "../../components/condominio/GridModulos";
import TimelineCondominio from "../../components/condominio/TimelineCondominio";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const dadosCondominio: Record<
  string,
  {
    nome: string;
    cidade: string;
    status: string;
  }
> = {
  tulipas: {
    nome: "Residencial Tulipas",
    cidade: "Curitiba / PR",
    status: "🟢 Operação normal",
  },
  "solar-das-flores": {
    nome: "Solar das Flores",
    cidade: "São José dos Pinhais / PR",
    status: "🔴 Crítico",
  },
  "residencial-italia": {
    nome: "Residencial Itália",
    cidade: "Curitiba / PR",
    status: "🟢 Operação normal",
  },
};

export default async function CondominioLabPage({ params }: PageProps) {
  const { id } = await params;

  const condominio = dadosCondominio[id] || {
    nome: id,
    cidade: "Cidade não informada",
    status: "🟡 Em análise",
  };

  return (
    <DashboardLayout>
      <HeaderCondominio
        nome={condominio.nome}
        cidade={condominio.cidade}
        status={condominio.status}
      />

      <ResumoCondominio />

      <GridModulos />

      <TimelineCondominio />
    </DashboardLayout>
  );
}