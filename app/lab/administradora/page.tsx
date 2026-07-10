import DashboardLayout from "../components/DashboardLayout";

import HeaderAdministradora from "../components/administradora/HeaderAdministradora";
import KPIsAdministradora from "../components/administradora/KPIsAdministradora";
import RankingCondominios from "../components/administradora/RankingCondominios";

import MenuPrincipal from "../components/shared/MenuPrincipal";

export default function AdministradoraPage() {
  return (
    <DashboardLayout>
      <HeaderAdministradora />

      <KPIsAdministradora />

      <MenuPrincipal />

      <RankingCondominios />
    </DashboardLayout>
  );
}