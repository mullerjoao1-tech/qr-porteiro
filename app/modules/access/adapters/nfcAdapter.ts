import type {
  ConfiguracaoMetodoAcesso,
  ResultadoAcesso,
} from "../types/access";

export async function executarNfc(
  configuracao: ConfiguracaoMetodoAcesso
): Promise<ResultadoAcesso> {
  if (typeof window === "undefined") {
    return {
      sucesso: false,
      metodo: "nfc",
      erro: "O NFC precisa ser executado no celular do usuário.",
      executadoEm: new Date().toISOString(),
    };
  }

  return {
    sucesso: false,
    metodo: "nfc",
    mensagem: `${configuracao.nome} está preparado para receber integração NFC.`,
    erro: "A leitura e a validação NFC ainda não foram implementadas.",
    executadoEm: new Date().toISOString(),
  };
}