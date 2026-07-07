export type MensagemConversa = {
  id?: string;
  autor: "visitante" | "morador";
  tipo: "texto" | "audio";
  texto?: string;
  audioBase64?: string;
  criadoEm: number;
};

export type Chamada = {
  nome?: string;
  motivo?: string;
  status?: string;
  criadoEm?: string;
  atendidoEm?: string;
  mensagemRapida?: string;
  respostaRapida?: string;
  resposta?: string;
  mensagemMorador?: string;
  mensagemResponsavel?: string;
  enviadoEm?: number;
  ultimaAtividade?: number;
  audioBase64?: string;
  mensagens?: Record<string, MensagemConversa>;
};

export type Unidade = {
  id: string;
  nome: string;
  tipo?: string;
  bloco?: string;
  chamada?: Chamada;
};