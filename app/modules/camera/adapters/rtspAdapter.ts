import { execFile } from "child_process";
import path from "path";

import type {
  ConfiguracaoCamera,
  ResultadoSnapshotCamera,
} from "../types/camera";

function executarFFmpeg(
  argumentos: string[],
  timeoutMs: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      argumentos,
      {
        timeout: timeoutMs,
        windowsHide: true,
      },
      (erro, _stdout, stderr) => {
        if (erro) {
          console.error(
            "Erro do FFmpeg:",
            stderr || erro
          );

          reject(erro);
          return;
        }

        resolve();
      }
    );
  });
}

export async function capturarSnapshotRtsp(
  camera: ConfiguracaoCamera
): Promise<ResultadoSnapshotCamera> {
  if (!camera.rtspUrl) {
    return {
      sucesso: false,
      erro:
        "A câmera RTSP não possui URL configurada.",
    };
  }

  const agora = Date.now();

  const nomeArquivo =
    `camera-${camera.id}-${agora}.jpg`;

  const caminhoArquivo = path.join(
    process.cwd(),
    "public",
    nomeArquivo
  );

  const caminhoPublico = `/${nomeArquivo}`;

  const argumentos = [
    "-y",
    "-rtsp_transport",
    "udp",
    "-i",
    camera.rtspUrl,
    "-frames:v",
    "1",
    "-q:v",
    "2",
    caminhoArquivo,
  ];

  try {
    await executarFFmpeg(
      argumentos,
      camera.timeoutMs ?? 15000
    );

    return {
      sucesso: true,
      imagem: caminhoPublico,
      atualizadoEm: new Date().toISOString(),
    };
  } catch (erro) {
    console.error(
      "Erro ao capturar câmera RTSP:",
      erro
    );

    return {
      sucesso: false,
      erro:
        "Não foi possível capturar a imagem RTSP.",
    };
  }
}