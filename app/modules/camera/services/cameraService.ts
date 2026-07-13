import { capturarSnapshotHttp } from "../adapters/httpSnapshotAdapter";
import { capturarSnapshotRtsp } from "../adapters/rtspAdapter";

import type {
  ConfiguracaoCamera,
  ResultadoSnapshotCamera,
} from "../types/camera";

export async function capturarSnapshotCamera(
  camera: ConfiguracaoCamera
): Promise<ResultadoSnapshotCamera> {
  if (!camera.ativa) {
    return {
      sucesso: false,
      erro: "A câmera está desativada.",
    };
  }

  if (camera.protocolo === "rtsp") {
    return capturarSnapshotRtsp(camera);
  }

  if (camera.protocolo === "http-snapshot") {
    return capturarSnapshotHttp(camera);
  }

  return {
    sucesso: false,
    erro:
      "O protocolo dessa câmera não é suportado.",
  };
}