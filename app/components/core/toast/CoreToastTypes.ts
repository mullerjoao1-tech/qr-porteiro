export type CoreToastTipo =
  | "success"
  | "info"
  | "warning"
  | "error";

export type CoreToast = {
  id: string;

  tipo: CoreToastTipo;

  titulo: string;

  descricao?: string;

  duracao?: number;
};

export type CoreToastContext = {
  mostrarToast: (
    toast: Omit<CoreToast, "id">
  ) => void;
};