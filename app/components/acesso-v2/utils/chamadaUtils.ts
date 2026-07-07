export const TEMPO_AGUARDANDO_MS = 5 * 60 * 1000;

export const TEMPO_EM_ATENDIMENTO_MS = 3 * 60 * 1000;

export function chamadaEstaAtiva(chamada?: any) {
  if (!chamada) return false;

  const status = chamada.status || "";

  return (
    status === "Aguardando atendimento" ||
    status === "Em atendimento"
  );
}

export function textoStatusChamada(chamada?: any) {
  if (!chamada) return "Disponível";

  if (chamada.status === "Aguardando atendimento") {
    return "Chamando";
  }

  if (chamada.status === "Em atendimento") {
    return "Em atendimento";
  }

  return "Disponível";
}

export function pegarTempoBase(chamada?: any) {
  if (!chamada) return Date.now();

  if (chamada.ultimaAtividade) return chamada.ultimaAtividade;

  if (chamada.enviadoEm) return chamada.enviadoEm;

  if (chamada.atendidoEm) {
    const tempo = new Date(chamada.atendidoEm).getTime();

    if (!Number.isNaN(tempo)) return tempo;
  }

  if (chamada.criadoEm) {
    const tempo = new Date(chamada.criadoEm).getTime();

    if (!Number.isNaN(tempo)) return tempo;
  }

  return Date.now();
}

export function ordenarMensagens(mensagens?: Record<string, any>) {
  if (!mensagens) return [];

  return Object.entries(mensagens)
    .map(([id, mensagem]) => ({
      id,
      ...mensagem,
    }))
    .sort((a: any, b: any) => (a.criadoEm || 0) - (b.criadoEm || 0));
}