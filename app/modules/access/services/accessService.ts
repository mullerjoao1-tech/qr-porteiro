import { executarBle } from "../adapters/bleAdapter";
import { executarEsp32 } from "../adapters/esp32Adapter";
import { executarNfc } from "../adapters/nfcAdapter";
import { executarTuya } from "../adapters/tuyaAdapter";

import type {
  ConfiguracaoMetodoAcesso,
  ResultadoAcesso,
} from "../types/access";

export async function executarAcesso(
  configuracao: ConfiguracaoMetodoAcesso
): Promise<ResultadoAcesso> {
  if (!configuracao.ativo) {
    return {
      sucesso: false,
      metodo: configuracao.metodo,
      erro: "Este método de acesso está desativado.",
      executadoEm: new Date().toISOString(),
    };
  }

  switch (configuracao.metodo) {
    case "tuya":
      return executarTuya(configuracao);

    case "ble":
      return executarBle(configuracao);

    case "nfc":
      return executarNfc(configuracao);

    case "esp32":
      return executarEsp32(configuracao);

    default:
      return {
        sucesso: false,
        erro: "Método de acesso desconhecido.",
        executadoEm: new Date().toISOString(),
      };
  }
}