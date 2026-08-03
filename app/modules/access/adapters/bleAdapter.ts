import type {
  ConfiguracaoMetodoAcesso,
  ResultadoAcesso,
} from "../types/access";

export async function executarBle(
  configuracao: ConfiguracaoMetodoAcesso
): Promise<ResultadoAcesso> {
  if (typeof window === "undefined") {
    return {
      sucesso: false,
      metodo: "ble",
      erro: "O BLE precisa ser executado no celular ou navegador do usuário.",
      executadoEm: new Date().toISOString(),
    };
  }

  if (!navigator.bluetooth) {
    return {
      sucesso: false,
      metodo: "ble",
      erro: "Este navegador não oferece suporte ao Bluetooth.",
      executadoEm: new Date().toISOString(),
    };
  }

  return {
    sucesso: false,
    metodo: "ble",
    mensagem: `${configuracao.nome} está preparado para iniciar um teste BLE seguro.`,
    erro: "A conexão e o comando do relé ainda não foram implementados.",
    executadoEm: new Date().toISOString(),
  };
}