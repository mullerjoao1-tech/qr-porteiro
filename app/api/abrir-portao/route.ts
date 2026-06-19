import { TuyaContext } from "@tuya/tuya-connector-nodejs";

export const runtime = "nodejs";

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET() {
  try {
    const accessId = process.env.TUYA_ACCESS_ID?.trim();
    const accessKey = process.env.TUYA_ACCESS_SECRET?.trim();
    const endpoint = process.env.TUYA_ENDPOINT?.trim().replace(/\/$/, "");
    const deviceId = process.env.TUYA_DEVICE_ID?.trim();

    if (!accessId || !accessKey || !endpoint || !deviceId) {
      throw new Error("Variáveis Tuya ausentes no .env.local.");
    }

    const tuya = new TuyaContext({
      baseUrl: endpoint,
      accessKey: accessId,
      secretKey: accessKey,
    });

    console.log("ENVIANDO OFF PARA PREPARAR O PORTÃO...");

    const desligarAntes = await tuya.request({
      method: "POST",
      path: `/v1.0/devices/${deviceId}/commands`,
      body: {
        commands: [
          {
            code: "switch_1",
            value: false,
          },
        ],
      },
    });

    console.log("TUYA OFF:", desligarAntes);

    await esperar(700);

    console.log("ENVIANDO ON PARA ACIONAR O PORTÃO...");

    const acionar = await tuya.request({
      method: "POST",
      path: `/v1.0/devices/${deviceId}/commands`,
      body: {
        commands: [
          {
            code: "switch_1",
            value: true,
          },
        ],
      },
    });

    console.log("TUYA ON:", acionar);

    await esperar(1500);

    const status = await tuya.request({
      method: "GET",
      path: `/v1.0/devices/${deviceId}/status`,
    });

    console.log("STATUS DEPOIS DO COMANDO:", status);

    return Response.json({
  success: desligarAntes.success === true && acionar.success === true,
  mensagem: "Comando OFF → ON enviado ao portão",
  desligarAntes,
  acionar,
  status,
});
  } catch (error) {
    console.error("ERRO TUYA SDK:", error);

    return Response.json(
      {
        success: false,
        erro: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}