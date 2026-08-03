import { writeFile } from "fs/promises";
import path from "path";

import type {
  ConfiguracaoCamera,
  ResultadoSnapshotCamera,
} from "../types/camera";

export async function capturarSnapshotHttp(
  camera: ConfiguracaoCamera
): Promise<ResultadoSnapshotCamera> {
  if (!camera.snapshotUrl) {
    return {
      sucesso: false,
      erro:
        "A câmera não possui URL de snapshot configurada.",
    };
  }

  const controlador = new AbortController();

  const timeout = setTimeout(
    () => controlador.abort(),
    camera.timeoutMs ?? 15000
  );

  try {
    const cabecalhos: HeadersInit = {};

    if (camera.usuario && camera.senha) {
      const credenciais = Buffer.from(
        `${camera.usuario}:${camera.senha}`
      ).toString("base64");

      cabecalhos.Authorization =
        `Basic ${credenciais}`;
    }

    const resposta = await fetch(
      camera.snapshotUrl,
      {
        cache: "no-store",
        signal: controlador.signal,
        headers: cabecalhos,
      }
    );

    if (!resposta.ok) {
      return {
        sucesso: false,
        erro:
          `A câmera respondeu com status ${resposta.status}.`,
      };
    }

    const buffer = Buffer.from(
      await resposta.arrayBuffer()
    );

    const agora = Date.now();

    const nomeArquivo =
      `camera-${camera.id}-${agora}.jpg`;

    const caminhoArquivo = path.join(
      process.cwd(),
      "public",
      nomeArquivo
    );

    await writeFile(caminhoArquivo, buffer);

    return {
      sucesso: true,
      imagem: `/${nomeArquivo}`,
      atualizadoEm: new Date().toISOString(),
    };
  } catch (erro) {
    console.error(
      "Erro ao capturar snapshot HTTP:",
      erro
    );

    return {
      sucesso: false,
      erro:
        "Não foi possível capturar a imagem HTTP.",
    };
  } finally {
    clearTimeout(timeout);
  }
}