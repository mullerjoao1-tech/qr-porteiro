import { NextResponse } from "next/server";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type PDFFont,
} from "pdf-lib";

import { obterFirebaseAdmin } from "@/app/services/server/firebaseAdmin";

export const runtime = "nodejs";

type RegistroChamada = {
  id: string;
  unidadeId: string;
  unidadeNome: string;
  ordem: number;
  nome?: string;
  nomeVisitante?: string;
  motivo?: string;
  status?: string;
  statusFinal?: string;
  tipoFinalizacao?: string;
  criadoEm?: string | number;
  atendidoEm?: string | number;
  encerradoEm?: string | number;
};

function timestamp(valor: unknown): number {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor === "string" && valor.trim()) {
    const convertido = Date.parse(valor);
    if (Number.isFinite(convertido)) return convertido;
  }

  return 0;
}

function texto(valor: unknown): string {
  return String(valor ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function limitar(valor: string, maximo: number): string {
  if (valor.length <= maximo) return valor;
  return `${valor.slice(0, Math.max(0, maximo - 3))}...`;
}

function dataHora(valor: number): string {
  if (!valor) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

function dataSimples(valor: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(valor));
}

function desenharCabecalho(
  pagina: PDFPage,
  fonte: PDFFont,
  fonteNegrito: PDFFont,
  nomeLocal: string,
  inicio: number,
  fim: number,
  total: number
) {
  pagina.drawText("RELATORIO DE HISTORICO DE CHAMADAS", {
    x: 42,
    y: 800,
    size: 15,
    font: fonteNegrito,
    color: rgb(0.08, 0.12, 0.2),
  });

  pagina.drawText(limitar(nomeLocal, 75), {
    x: 42,
    y: 779,
    size: 11,
    font: fonteNegrito,
    color: rgb(0.15, 0.2, 0.3),
  });

  pagina.drawText(
    `Periodo: ${dataSimples(inicio)} a ${dataSimples(fim)}   |   Registros: ${total}`,
    {
      x: 42,
      y: 760,
      size: 9,
      font: fonte,
      color: rgb(0.3, 0.35, 0.42),
    }
  );

  pagina.drawLine({
    start: { x: 42, y: 748 },
    end: { x: 553, y: 748 },
    thickness: 1,
    color: rgb(0.75, 0.78, 0.82),
  });

  pagina.drawText("Data / hora", {
    x: 42,
    y: 730,
    size: 8,
    font: fonteNegrito,
  });

  pagina.drawText("Unidade", {
    x: 145,
    y: 730,
    size: 8,
    font: fonteNegrito,
  });

  pagina.drawText("Visitante", {
    x: 245,
    y: 730,
    size: 8,
    font: fonteNegrito,
  });

  pagina.drawText("Motivo", {
    x: 350,
    y: 730,
    size: 8,
    font: fonteNegrito,
  });

  pagina.drawText("Status", {
    x: 475,
    y: 730,
    size: 8,
    font: fonteNegrito,
  });

  pagina.drawLine({
    start: { x: 42, y: 722 },
    end: { x: 553, y: 722 },
    thickness: 0.7,
    color: rgb(0.82, 0.84, 0.87),
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const localId = texto(url.searchParams.get("localId"));
    const inicio = Number(url.searchParams.get("inicio"));
    const fim = Number(url.searchParams.get("fim"));

    if (!localId || !Number.isFinite(inicio) || !Number.isFinite(fim)) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "localId, inicio e fim sao obrigatorios",
        },
        { status: 400 }
      );
    }

    if (inicio <= 0 || fim <= 0 || inicio > fim) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Periodo invalido",
        },
        { status: 400 }
      );
    }

    const { database } = obterFirebaseAdmin();

    const [localSnapshot, unidadesSnapshot] = await Promise.all([
      database.ref(`locais-v2/${localId}`).get(),
      database.ref("unidades-v2").get(),
    ]);

    if (!localSnapshot.exists()) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Local nao encontrado",
        },
        { status: 404 }
      );
    }

    const local = localSnapshot.val() || {};
    const nomeLocal = texto(local.nome) || localId;
    const unidadesDados = unidadesSnapshot.val() || {};

    const unidadesDoLocal = Object.entries(unidadesDados)
      .filter(([unidadeId, unidade]: any) => {
        const status = texto(unidade?.status).toLowerCase();

        const ativa = ![
          "inativa",
          "inativo",
          "arquivada",
          "arquivado",
          "excluida",
          "excluido",
        ].includes(status);

        const pertence =
          unidade?.localId === localId ||
          unidade?.condominioId === localId ||
          unidadeId.startsWith(`${localId}-`);

        return ativa && pertence;
      })
      .map(([unidadeId, unidade]: any) => ({
        unidadeId,
        unidadeNome: texto(unidade?.nome) || unidadeId,
      }));

    const resultados = await Promise.all(
      unidadesDoLocal.map(async ({ unidadeId, unidadeNome }) => {
        const snapshot = await database
          .ref(`historico-v2/${unidadeId}`)
          .orderByKey()
          .startAt(String(inicio))
          .endAt(String(fim))
          .get();

        const dados = snapshot.val() || {};

        return Object.entries(dados)
          .map(([id, chamada]: any): RegistroChamada => {
            const ordem =
              timestamp(chamada?.encerradoEm) ||
              timestamp(chamada?.atendidoEm) ||
              timestamp(chamada?.criadoEm) ||
              Number(id) ||
              0;

            return {
              id,
              unidadeId,
              unidadeNome,
              ordem,
              ...chamada,
            };
          })
          .filter(
            (registro: RegistroChamada) =>
              registro.ordem >= inicio && registro.ordem <= fim
          );
      })
    );

    const registros = resultados
      .flat()
      .sort((a, b) => b.ordem - a.ordem);

    const pdf = await PDFDocument.create();
    const fonte = await pdf.embedFont(StandardFonts.Helvetica);
    const fonteNegrito = await pdf.embedFont(StandardFonts.HelveticaBold);

    let pagina = pdf.addPage([595.28, 841.89]);

    desenharCabecalho(
      pagina,
      fonte,
      fonteNegrito,
      nomeLocal,
      inicio,
      fim,
      registros.length
    );

    let y = 704;

    for (const registro of registros) {
      if (y < 72) {
        pagina = pdf.addPage([595.28, 841.89]);

        desenharCabecalho(
          pagina,
          fonte,
          fonteNegrito,
          nomeLocal,
          inicio,
          fim,
          registros.length
        );

        y = 704;
      }

      const visitante =
        texto(registro.nome) ||
        texto(registro.nomeVisitante) ||
        "Nao informado";

      const motivo = texto(registro.motivo) || "Nao informado";

      const status =
        texto(registro.statusFinal) ||
        texto(registro.status) ||
        "Encerrado";

      pagina.drawText(dataHora(registro.ordem), {
        x: 42,
        y,
        size: 7,
        font: fonte,
      });

      pagina.drawText(limitar(registro.unidadeNome, 21), {
        x: 145,
        y,
        size: 7,
        font: fonte,
      });

      pagina.drawText(limitar(visitante, 25), {
        x: 245,
        y,
        size: 7,
        font: fonte,
      });

      pagina.drawText(limitar(motivo, 27), {
        x: 350,
        y,
        size: 7,
        font: fonte,
      });

      pagina.drawText(limitar(status, 18), {
        x: 475,
        y,
        size: 7,
        font: fonte,
      });

      pagina.drawLine({
        start: { x: 42, y: y - 7 },
        end: { x: 553, y: y - 7 },
        thickness: 0.35,
        color: rgb(0.9, 0.91, 0.93),
      });

      y -= 19;
    }

    if (registros.length === 0) {
      pagina.drawText("Nenhuma chamada encontrada no periodo selecionado.", {
        x: 42,
        y: 690,
        size: 10,
        font: fonte,
        color: rgb(0.35, 0.38, 0.42),
      });
    }

    const emitidoEm = dataHora(Date.now());

    pagina.drawText(`Emitido em ${emitidoEm}`, {
      x: 42,
      y: 38,
      size: 7,
      font: fonte,
      color: rgb(0.45, 0.48, 0.52),
    });

    const bytes = await pdf.save();

    const nomeArquivo = `historico-chamadas-${localId}-${dataSimples(inicio)
      .replace(/\//g, "-")}-${dataSimples(fim).replace(/\//g, "-")}.pdf`;

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (erro) {
    console.error("Erro ao gerar PDF do historico:", erro);

    return NextResponse.json(
      {
        sucesso: false,
        erro: "Nao foi possivel gerar o PDF",
      },
      { status: 500 }
    );
  }
}