import "server-only";

import { NextResponse } from "next/server";

import {
  obterFirebaseAdminQr,
} from "../../../services/server/firebaseAdminQr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const inicio = Date.now();

  let projectId: string | null = null;
  let databaseUrl: string | null = null;

  try {
    const { app, database } =
      obterFirebaseAdminQr();

    projectId =
      app.options.projectId ?? null;

    databaseUrl =
      app.options.databaseURL ?? null;

    const leituraBanco =
      database
        .ref("locais-v2")
        .get();

    const limiteTempo =
      new Promise<never>((_, rejeitar) => {
        setTimeout(() => {
          rejeitar(
            new Error(
              "A leitura de locais-v2 ultrapassou 10 segundos."
            )
          );
        }, 10000);
      });

    const snapshot =
      await Promise.race([
        leituraBanco,
        limiteTempo,
      ]);

    if (!snapshot.exists()) {
      return NextResponse.json(
        {
          sucesso: true,

          projectId,
          databaseUrl,

          firebaseAdmin: "OK",
          leituraBanco: "OK",
          locaisV2:
            "VAZIO OU INEXISTENTE",

          duracaoMs:
            Date.now() - inicio,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const locais =
      snapshot.val() as Record<
        string,
        {
          id?: string;
          localId?: string;
          slug?: string;
          nome?: string;
        }
      >;

    const procurar = (
      identificadores: string[]
    ) => {
      for (
        const [chave, local] of
        Object.entries(locais)
      ) {
        const valores = [
          chave,
          local.id,
          local.localId,
          local.slug,
        ]
          .filter(
            (valor): valor is string =>
              typeof valor === "string"
          )
          .map((valor) =>
            valor
              .trim()
              .toLowerCase()
          );

        const encontrado =
          identificadores.some(
            (identificador) =>
              valores.includes(
                identificador
                  .trim()
                  .toLowerCase()
              )
          );

        if (encontrado) {
          return {
            encontrado: true,
            chave,
            nome:
              local.nome ?? null,
            slug:
              local.slug ?? null,
          };
        }
      }

      return {
        encontrado: false,
      };
    };

    return NextResponse.json(
      {
        sucesso: true,

        projectId,
        databaseUrl,

        firebaseAdmin: "OK",
        leituraBanco: "OK",

        totalLocais:
          Object.keys(locais).length,

        tulipas: procurar([
          "residencial-tulipas",
        ]),

        muller: procurar([
          "muller",
          "muller-principal",
        ]),

        costa: procurar([
          "residencial-costa",
          "residencial-costa-casa-principal",
        ]),

        duracaoMs:
          Date.now() - inicio,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (erro) {
    return NextResponse.json(
      {
        sucesso: false,

        projectId,
        databaseUrl,

        etapa:
          "inicialização ou leitura do Firebase",

        erro:
          erro instanceof Error
            ? erro.message
            : String(erro),

        duracaoMs:
          Date.now() - inicio,
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}