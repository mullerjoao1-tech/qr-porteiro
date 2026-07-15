import type {
  ConfiguracaoMetodoAcesso,
  ResultadoAcesso,
} from "../types/access";

export async function executarEsp32(
  configuracao: ConfiguracaoMetodoAcesso
): Promise<ResultadoAcesso> {
  return {
    sucesso: false,
    metodo: "esp32",
    mensagem: `${configuracao.nome} está preparado para integração com ESP32.`,
    erro: "O comando do ESP32 ainda não foi implementado.",
    executadoEm: new Date().toISOString(),
  };
}