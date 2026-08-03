import "server-only";

import {
  NextResponse,
} from "next/server";

import {
  obterFirebaseAdminQr,
} from "../../../services/server/firebaseAdminQr";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const LOCAL_ID =
  "residencial-costa";

const UNIDADE_ID =
  "residencial-costa-casa-principal";

export async function POST():
  Promise<Response> {
  try {
    const {
      database,
    } = obterFirebaseAdminQr();

    const agora =
      Date.now();

    const localRef =
      database.ref(
        `locais-v2/${LOCAL_ID}`
      );

    const localExistente =
      await localRef.get();

    if (
      localExistente.exists()
    ) {
      return NextResponse.json(
        {
          sucesso: false,

          mensagem:
            "A Residência Costa já está cadastrada em locais-v2.",

          localId:
            LOCAL_ID,
        },
        {
          status: 409,
        }
      );
    }

    const atualizacoes = {
      [`locais-v2/${LOCAL_ID}`]: {
        id:
          LOCAL_ID,

        nome:
          "Residencial Costa",

        slug:
          LOCAL_ID,

        tipo:
          "residencia",

        tipoLocal:
          "residencia",

        segmento:
          "residencia",

        status:
          "ativo",

        origem:
          "migracao-cadastro-universal",

        criadoEm:
          agora,

        atualizadoEm:
          agora,

        configuracao: {
          modeloMaterial:
            "clean",

          modoAtendimento:
            "residencia",

          permiteVisitante:
            true,

          permiteEntrega:
            true,

          permiteEntregaComida:
            true,

          permiteOutros:
            true,
        },

        modulos: {
          acesso:
            true,

          morador:
            true,

          chamadas:
            true,

          mensagens:
            true,

          audio:
            true,

          materiais:
            true,

          qrCode:
            true,
        },

        estruturas: {
          tipo:
            "casa",

          totalUnidades:
            1,

          unidadePrincipalId:
            UNIDADE_ID,

          unidades: {
            [UNIDADE_ID]: {
              id:
                UNIDADE_ID,

              nome:
                "Casa Principal",

              slug:
                "casa-principal",

              tipo:
                "casa",

              status:
                "ativo",
            },
          },
        },

        links: {
          acesso:
            `/acesso-v2/${LOCAL_ID}`,

          morador:
            `/morador-v2/${UNIDADE_ID}`,

          qrPrincipal:
            `/api/qrcode/${LOCAL_ID}`,

          materialA4:
            `/api/materiais/qrcode/${LOCAL_ID}`,
        },

        estatisticas: {
          totalUnidades:
            1,

          totalMoradores:
            0,

          totalResponsaveis:
            0,
        },
      },

      [`unidades-v2/${UNIDADE_ID}`]: {
        id:
          UNIDADE_ID,

        localId:
          LOCAL_ID,

        condominioId:
          LOCAL_ID,

        localSlug:
          LOCAL_ID,

        nome:
          "Casa Principal",

        identificacao:
          "Casa Principal",

        slug:
          "casa-principal",

        tipo:
          "casa",

        status:
          "ativo",

        modoChamada:
          "familia",

        prioridade:
          1,

        recebeChamadas:
          true,

        criadoEm:
          agora,

        atualizadoEm:
          agora,
      },
    };

    await database
      .ref()
      .update(
        atualizacoes
      );

    return NextResponse.json(
      {
        sucesso:
          true,

        mensagem:
          "Residência Costa cadastrada no Cadastro Universal do Studio.",

        local: {
          id:
            LOCAL_ID,

          nome:
            "Residencial Costa",

          slug:
            LOCAL_ID,

          tipo:
            "residencia",
        },

        unidade: {
          id:
            UNIDADE_ID,

          nome:
            "Casa Principal",
        },

        testes: {
          acesso:
            `/acesso-v2/${LOCAL_ID}`,

          morador:
            `/morador-v2/${UNIDADE_ID}`,

          qr:
            `/api/qrcode/${LOCAL_ID}`,

          placa:
            `/api/materiais/qrcode/${LOCAL_ID}`,
        },
      },
      {
        status: 201,
      }
    );
  } catch (erro) {
    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Não foi possível cadastrar a Residência Costa.";

    console.error(
      "Erro na migração da Residência Costa:",
      erro
    );

    return NextResponse.json(
      {
        sucesso:
          false,

        mensagem,
      },
      {
        status: 500,
      }
    );
  }
}