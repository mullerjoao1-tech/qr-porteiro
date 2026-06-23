import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function GET(): Promise<Response> {
  const agora = Date.now();
  const nomeArquivo = `camera-qr1-${agora}.jpg`;
  const caminhoArquivo = `public/${nomeArquivo}`;
  const caminhoPublico = `/${nomeArquivo}`;

  const comando = `ffmpeg -y -rtsp_transport udp -i "rtsp://admin:teste123@192.168.15.16:554/onvif1" -frames:v 1 -q:v 2 "${caminhoArquivo}"`;

  return new Promise<Response>((resolve) => {
    exec(comando, { timeout: 15000 }, (erro) => {
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
          imagem: caminhoPublico,
          atualizadoEm: new Date().toISOString(),
        })
      );
    });
  });
}