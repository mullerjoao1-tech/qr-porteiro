import { NextResponse } from "next/server";

import { capturarSnapshotCamera } from "../../modules/camera/services/cameraService";
import type { ConfiguracaoCamera } from "../../modules/camera/types/camera";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const cameraPortao: ConfiguracaoCamera = {
    id: "portao-principal",
    nome: "Câmera do portão principal",
    protocolo: "rtsp",
    ativa: true,
    rtspUrl:
      process.env.CAMERA_PORTAO_RTSP_URL ||
      "rtsp://admin:teste123@192.168.15.16:554/onvif1",
    timeoutMs: 15000,
  };

  const resultado = await capturarSnapshotCamera(cameraPortao);

  if (!resultado.sucesso) {
    return NextResponse.json(
      {
        sucesso: false,
        erro:
          resultado.erro ||
          "A imagem não foi criada.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    sucesso: true,
    mensagem: "Foto capturada com sucesso.",
    imagem: resultado.imagem,
    atualizadoEm:
      resultado.atualizadoEm ||
      new Date().toISOString(),
  });
}
