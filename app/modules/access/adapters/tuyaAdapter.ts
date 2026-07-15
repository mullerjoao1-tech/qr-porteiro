import type {
  ConfiguracaoMetodoAcesso,
  ResultadoAcesso,
} from "../types/access";

export async function executarTuya(
  configuracao: ConfiguracaoMetodoAcesso
): Promise<ResultadoAcesso> {
  return {
    sucesso: false,
    metodo: "tuya",
    erro: "Adapter Tuya ainda não implementado.",
    executadoEm: new Date().toISOString(),
  };
}