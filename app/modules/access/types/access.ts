export type MetodoAcesso =
  | "tuya"
  | "ble"
  | "nfc"
  | "esp32";

export interface ConfiguracaoMetodoAcesso {
  id: string;
  nome: string;

  metodo: MetodoAcesso;

  ativo: boolean;

  prioridade: number;
}

export interface ResultadoAcesso {
  sucesso: boolean;

  metodo?: MetodoAcesso;

  mensagem?: string;

  erro?: string;

  executadoEm?: string;
}