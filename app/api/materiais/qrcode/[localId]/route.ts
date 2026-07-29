import "server-only";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  obterFirebaseAdmin,
} from "../../../../services/server/firebaseAdmin";

import {
  gerarMaterialPdf,
  type DadosMaterial,
  type SegmentoMaterial,
} from "../../../../services/implantacao/materiais";

type LocalBanco = {
  id?: string;

  nome?: string;

  slug?: string;

  tipo?: string;

  tipoLocal?: string;

  segmento?: string;

  status?: string;

  cidade?: string;

  estado?: string;

  telefone?: string;

  whatsapp?: string;

  email?: string;

  site?: string;

  instagram?: string;

  facebook?: string;

  logo?: string;

  corPrimaria?: string;

  corSecundaria?: string;

  corTexto?: string;
};

type LocalEncontrado = {
  localId: string;

  dados:
    LocalBanco;
};

function obterBaseUrl(
  request: NextRequest
): string {
  const configurada =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL;

  if (configurada) {
    if (
      configurada.startsWith(
        "http://"
      ) ||
      configurada.startsWith(
        "https://"
      )
    ) {
      return configurada.replace(
        /\/+$/g,
        ""
      );
    }

    return `https://${configurada}`.replace(
      /\/+$/g,
      ""
    );
  }

  return request.nextUrl.origin.replace(
    /\/+$/g,
    ""
  );
}

function normalizarTipo(
  valor:
    string | undefined
): string {
  return (
    valor
      ?.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-z0-9-_]/g,
        "-"
      ) ||
    ""
  );
}

function obterSegmentoMaterial(
  local:
    LocalBanco
): SegmentoMaterial {
  const tipo =
    normalizarTipo(
      local.segmento ||
      local.tipoLocal ||
      local.tipo
    );

  if (
    tipo === "residencia" ||
    tipo === "residencial" ||
    tipo === "casa"
  ) {
    return "residencia";
  }

  if (
    tipo === "beauty" ||
    tipo === "salao" ||
    tipo === "esmalteria"
  ) {
    return "beauty";
  }

  if (
    tipo === "barbearia" ||
    tipo === "barber"
  ) {
    return "barbearia";
  }

  if (
    tipo === "clinica" ||
    tipo === "consultorio"
  ) {
    return "clinica";
  }

  if (
    tipo === "empresa" ||
    tipo === "escritorio"
  ) {
    return "empresa";
  }

  if (
    tipo === "pet" ||
    tipo === "petshop" ||
    tipo === "pet-shop"
  ) {
    return "pet";
  }

  if (
    tipo === "restaurante" ||
    tipo === "bar" ||
    tipo === "alimentacao"
  ) {
    return "restaurante";
  }

  return "condominio";
}

async function buscarEmColecao(
  colecao: string,
  identificador: string
): Promise<LocalEncontrado | null> {
  const {
    database,
  } = obterFirebaseAdmin();

  const snapshotDireto =
    await database
      .ref(
        `${colecao}/${identificador}`
      )
      .get();

  if (
    snapshotDireto.exists()
  ) {
    return {
      localId:
        identificador,

      dados:
        snapshotDireto.val() as
          LocalBanco,
    };
  }

  const snapshotColecao =
    await database
      .ref(colecao)
      .get();

  if (
    !snapshotColecao.exists()
  ) {
    return null;
  }

  const registros =
    snapshotColecao.val() as
      Record<
        string,
        LocalBanco
      >;

  for (
    const [
      chave,
      dados,
    ] of Object.entries(
      registros
    )
  ) {
    const slug =
      dados.slug?.trim();

    const id =
      dados.id?.trim();

    if (
      slug === identificador ||
      id === identificador
    ) {
      return {
        localId:
          chave,

        dados,
      };
    }
  }

  return null;
}

async function buscarLocal(
  identificador: string
): Promise<LocalEncontrado | null> {
  const colecoes = [
    "locais-v2",
    "condominios-v2",
    "estabelecimentos-v2",
    "residencias-v2",
    "empresas-v2",
  ];

  for (
    const colecao of
      colecoes
  ) {
    const encontrado =
      await buscarEmColecao(
        colecao,
        identificador
      );

    if (encontrado) {
      return encontrado;
    }
  }

  return null;
}

export async function GET(
  request: NextRequest,
  contexto: {
    params:
      Promise<{
        localId: string;
      }>;
  }
): Promise<Response> {
  try {
    const {
      localId:
        localIdRecebido,
    } = await contexto.params;

    const identificador =
      decodeURIComponent(
        localIdRecebido
      ).trim();

    if (!identificador) {
      return NextResponse.json(
        {
          sucesso: false,

          mensagem:
            "O local não foi informado.",
        },
        {
          status: 400,
        }
      );
    }

    const encontrado =
      await buscarLocal(
        identificador
      );

    if (!encontrado) {
      return NextResponse.json(
        {
          sucesso: false,

          mensagem:
            "Local não encontrado pelo ID nem pelo slug.",
        },
        {
          status: 404,
        }
      );
    }

    const local =
      encontrado.dados;

    if (
      local.status ===
      "inativo"
    ) {
      return NextResponse.json(
        {
          sucesso: false,

          mensagem:
            "O local está inativo.",
        },
        {
          status: 410,
        }
      );
    }

    const nome =
      local.nome?.trim() ||
      identificador;

    const slug =
      local.slug?.trim() ||
      local.id?.trim() ||
      identificador;

    const segmento =
      obterSegmentoMaterial(
        local
      );

    const baseUrl =
      obterBaseUrl(
        request
      );

    const urlQr =
      `${baseUrl}/acesso-v2/${slug}`;

    const dadosMaterial:
      DadosMaterial = {
        localId:
          encontrado.localId,

        slug,

        nome,

        segmento,

        cidade:
          local.cidade,

        estado:
          local.estado,

        telefone:
          local.telefone,

        whatsapp:
          local.whatsapp,

        email:
          local.email,

        site:
          local.site,

        instagram:
          local.instagram,

        facebook:
          local.facebook,

        logo:
          local.logo,

        urlQr,

        corPrimaria:
          local.corPrimaria,

        corSecundaria:
          local.corSecundaria,

        corTexto:
          local.corTexto,
      };

    const resultado =
      await gerarMaterialPdf(
        dadosMaterial
      );

    return new Response(
      resultado.bytes,
      {
        status: 200,

        headers: {
          "Content-Type":
            resultado.mimeType,

          "Content-Disposition":
            `attachment; filename="${resultado.nomeArquivo}"`,

          "Content-Length":
            String(
              resultado.bytes
                .byteLength
            ),

          "Cache-Control":
            "no-store",

          "X-Local-Id":
            encontrado.localId,

          "X-Local-Slug":
            slug,

          "X-Material-Segmento":
            segmento,
        },
      }
    );
  } catch (erro) {
    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Não foi possível gerar o material.";

    console.error(
      "Erro ao gerar material do QR:",
      erro
    );

    return NextResponse.json(
      {
        sucesso: false,

        mensagem,
      },
      {
        status: 500,
      }
    );
  }
}
