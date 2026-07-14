import { NextRequest, NextResponse } from "next/server";

import { capturarSnapshotCamera } from "../../modules/camera/services/cameraService";
import type { ConfiguracaoCamera } from "../../modules/camera/types/camera";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest
): Promise<Response> {
  const cameraSelecionada =
    request.nextUrl.searchParams.get("camera") ?? "yoosee";

  let camera: ConfiguracaoCamera;

  switch (cameraSelecionada) {
    case "jortan":
      camera = {
        id: "jortan",
        nome: "Câmera Jortan 3 em 1",
        protocolo: "rtsp",
        ativa: true,
        rtspUrl:
          process.env.CAMERA_JORTAN_RTSP_URL ||
          "rtsp://admin:qr12345678@192.168.15.27:554/onvif1",
        timeoutMs: 15000,
      };
      break;

    case "yoosee":
    default:
      camera = {
        id: "portao-principal",
        nome: "Câmera do portão principal",
        protocolo: "rtsp",
        ativa: true,
        rtspUrl:
          process.env.CAMERA_PORTAO_RTSP_URL ||
          "rtsp://admin:qr12345678@192.168.15.17:554/onvif1",
        timeoutMs: 15000,
      };
      break;
  }

  const resultado = await capturarSnapshotCamera(camera);

  if (!resultado.sucesso) {
    return NextResponse.json(
      {
        sucesso: false,
        erro:
          resultado.erro ??
          "A imagem não foi criada.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    sucesso: true,
    camera: cameraSelecionada,
    mensagem: "Foto capturada com sucesso.",
    imagem: resultado.imagem,
    atualizadoEm:
      resultado.atualizadoEm ??
      new Date().toISOString(),
  });
}