import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    mensagem: "Rota funcionando",
  });
}

export async function POST() {
  return NextResponse.json({
    ok: true,
    mensagem: "Rota funcionando",
  });
}