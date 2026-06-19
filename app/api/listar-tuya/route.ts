import { TuyaContext } from "@tuya/tuya-connector-nodejs";

export const runtime = "nodejs";

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

    const funcoes = await tuya.request({
      method: "GET",
      path: `/v1.0/devices/${deviceId}/functions`,
    });

    const status = await tuya.request({
      method: "GET",
      path: `/v1.0/devices/${deviceId}/status`,
    });

    console.log("FUNÇÕES TUYA:", funcoes);
    console.log("STATUS TUYA:", status);

    return Response.json({
      success: true,
      funcoes,
      status,
    });
  } catch (error) {
    console.error("ERRO AO LISTAR TUYA:", error);

    return Response.json(
      {
        success: false,
        erro: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}