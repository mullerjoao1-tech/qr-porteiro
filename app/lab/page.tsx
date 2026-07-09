import DashboardLayout from "./components/DashboardLayout";

import HeaderSindico from "./components/dashboard/HeaderSindico";
import KPIs from "./components/dashboard/KPIs";
import ResumoDia from "./components/dashboard/ResumoDia";
import Timeline from "./components/dashboard/Timeline";
import AcessoRapido from "./components/dashboard/AcessoRapido";

import MenuPrincipal from "./components/shared/MenuPrincipal";

import ResumoInteligente from "./components/ResumoInteligente";
import SaudeCondominio from "./components/SaudeCondominio";

export default function LabPage() {
  return (
    <DashboardLayout>

      <HeaderSindico />

      <KPIs />

      <ResumoDia />

      <MenuPrincipal />

      <Timeline />

      <AcessoRapido />

      <ResumoInteligente />

      <SaudeCondominio />

    </DashboardLayout>
  );
}