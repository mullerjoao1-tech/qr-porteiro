import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function GET(): Promise<Response> {
  const comando =
    'ffmpeg -y -rtsp_transport tcp -i "rtsp://admin:teste123@192.168.15.13:554/onvif1" -frames:v 1 public/camera-qr1.jpg';

  return new Promise<Response>((resolve) => {
    exec(comando, (erro) => {
      if (erro) {
        console.error("Erro ao capturar imagem:", erro);

        resolve(
          NextResponse.json(
            {
              sucesso: false,
              erro: "A imagem não foi criada.",
            },
            { status: 500 }
          )
        );

        return;
      }

      resolve(
        NextResponse.json({
          sucesso: true,
          mensagem: "Foto capturada com sucesso.",
          imagem: "/camera-qr1.jpg",
          atualizadoEm: new Date().toISOString(),
        })
      );
    });
  });
}