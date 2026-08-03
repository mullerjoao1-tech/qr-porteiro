export type ProtocoloCamera =
  | "rtsp"
  | "http-snapshot";

export type ConfiguracaoCamera = {
  id: string;
  nome: string;
  protocolo: ProtocoloCamera;
  ativa: boolean;

  rtspUrl?: string;
  snapshotUrl?: string;

  usuario?: string;
  senha?: string;

  timeoutMs?: number;
};

export type ResultadoSnapshotCamera = {
  sucesso: boolean;
  imagem?: string;
  atualizadoEm?: string;
  erro?: string;
};