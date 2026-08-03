import type { ConfiguracaoCamera } from "../types/camera";

/**
 * ==========================================================
 * CÂMERAS HOMOLOGADAS - QR ACESSO STUDIO
 * ==========================================================
 *
 * Todas as câmeras do sistema devem ser cadastradas aqui.
 *
 * Não espalhar URLs RTSP ou Snapshot pelo projeto.
 *
 * Os módulos (Painel, Hardware Lab, Histórico, etc.)
 * devem importar sempre deste arquivo.
 *
 */

export const cameraPortaoPrincipal: ConfiguracaoCamera = {
  id: "portao-principal",

  nome: "Portão Principal",

  protocolo: "rtsp",

  ativa: true,

  rtspUrl:
    process.env.NEXT_PUBLIC_CAMERA_PORTAO_RTSP,

  timeoutMs: 10000,
};

export const cameraYoosee: ConfiguracaoCamera = {
  id: "yoosee",

  nome: "Yoosee",

  protocolo: "rtsp",

  ativa: true,

  rtspUrl:
    process.env.NEXT_PUBLIC_CAMERA_YOOSEE_RTSP,

  timeoutMs: 10000,
};

export const cameraJortan: ConfiguracaoCamera = {
  id: "jortan",

  nome: "Jortan",

  protocolo: "rtsp",

  ativa: true,

  rtspUrl:
    process.env.NEXT_PUBLIC_CAMERA_JORTAN_RTSP,

  timeoutMs: 10000,
};

/**
 * ==========================================================
 * LISTA DE CÂMERAS
 * ==========================================================
 */

export const camerasHomologadas: ConfiguracaoCamera[] = [
  cameraPortaoPrincipal,

  cameraYoosee,

  cameraJortan,
];