export type ModuloDashboard = {
  id: string;

  titulo: string;

  descricao: string;

  rota: string;

  icone: string;

  permissao: string;

  ordem: number;

  ativo: boolean;
};

export const MODULOS_DASHBOARD: ModuloDashboard[] = [
  {
    id: "dashboard",
    titulo: "Dashboard",
    descricao: "Visão geral",
    rota: "/dashboard",
    icone: "📊",
    permissao: "dashboard",
    ordem: 1,
    ativo: true,
  },

  {
    id: "central-inteligente",
    titulo: "Central Inteligente",
    descricao: "Monitoramento",
    rota: "/dashboard/central-inteligente",
    icone: "🧠",
    permissao: "central-inteligente",
    ordem: 2,
    ativo: true,
  },

  {
    id: "condominio",
    titulo: "Condomínio",
    descricao: "Gestão de condomínios",
    rota: "/dashboard/condominio",
    icone: "🏢",
    permissao: "condominio",
    ordem: 3,
    ativo: true,
  },
{
 
  
    id: "beauty",
    titulo: "QR Beauty",
    descricao: "Agenda e gestão de serviços",
    rota: "/dashboard/beauty",
    icone: "✨",
    permissao: "beauty",
    ordem: 4,
    ativo: true,
  },

  {
    id: "financeiro",
    titulo: "Financeiro",
    descricao: "Receitas e despesas",
    rota: "/dashboard/financeiro",
    icone: "💰",
    permissao: "financeiro",
    ordem: 5,
    ativo: true,
  },

  {
    id: "marketplace",
    titulo: "Marketplace",
    descricao: "Parceiros",
    rota: "/dashboard/marketplace",
    icone: "🛍️",
    permissao: "marketplace",
    ordem: 6,
    ativo: true,
  },

  {
    id: "security",
    titulo: "Security",
    descricao: "Segurança",
    rota: "/dashboard/security",
    icone: "🛡️",
    permissao: "security",
    ordem: 7,
    ativo: true,
  },

  {
    id: "hardware",
    titulo: "Hardware",
    descricao: "Dispositivos",
    rota: "/hardware",
    icone: "📷",
    permissao: "hardware",
    ordem: 8,
    ativo: true,
  },

  {
    id: "airbnb",
    titulo: "Airbnb",
    descricao: "Hospedagens",
    rota: "/dashboard/airbnb",
    icone: "🏠",
    permissao: "airbnb",
    ordem: 9,
    ativo: true,
  },
];