import { exec } from "child_process";
import { existsSync } from "fs";
import { NextResponse } from "next/server";

export async function GET() {
  return new Promise((resolve) => {
    const caminhoImagem = "public/camera-qr1.jpg";

    const comando =
      'ffmpeg -y -i "rtsp://admin:teste123@192.168.15.13:554/onvif1" -frames:v 1 public/camera-qr1.jpg';

    exec(comando, () => {
      if (existsSync(caminhoImagem)) {
        resolve(
          NextResponse.json({
            sucesso: true,
            mensagem: "Foto capturada com sucesso.",
            imagem: "/camera-qr1.jpg",
            atualizadoEm: new Date().toISOString(),
          })
        );

        return;
      }

      resolve(
        NextResponse.json(
          {
            sucesso: false,
            erro: "A imagem não foi criada.",
          },
          { status: 500 }
        )
      );
    });
  });
}