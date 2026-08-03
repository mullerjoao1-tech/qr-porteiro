import "server-only";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  obterFirebaseAdminQr,
} from "../../../../services/server/firebaseAdminQr";

import {
  gerarMaterialPdf,
  type DadosMaterial,
  type SegmentoMaterial,
} from "../../../../services/implantacao/materiais";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type LocalBanco = {
  id?: string;
  codigo?: string;
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
  dados: LocalBanco;
  colecao: string;
};

function comTimeout<T>(
  promessa: Promise<T>,
  milissegundos: number,
  descricao: string
): Promise<T> {
  return new Promise<T>((resolver, rejeitar) => {
    const temporizador = setTimeout(() => {
      rejeitar(
        new Error(
          `Tempo limite excedido durante: ${descricao}.`
        )
      );
    }, milissegundos);

    promessa
      .then((resultado) => {
        clearTimeout(temporizador);
        resolver(resultado);
      })
      .catch((erro) => {
        clearTimeout(temporizador);
        rejeitar(erro);
      });
  });
}

function obterBaseUrl(
  request: NextRequest
): string {
  const configurada =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (configurada) {
    if (
      configurada.startsWith("http://") ||
      configurada.startsWith("https://")
    ) {
      return configurada.replace(/\/+$/g, "");
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
  valor?: string
): string {
  return (
    valor
      ?.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-_]/g, "-") ||
    ""
  );
}

function obterSegmentoMaterial(
  local: LocalBanco
): SegmentoMaterial {
  const tipo = normalizarTipo(
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
  const { database } = obterFirebaseAdminQr();

  const snapshotDireto = await comTimeout(
    database
      .ref(`${colecao}/${identificador}`)
      .get(),
    8_000,
    `consulta direta em ${colecao}`
  );

  if (snapshotDireto.exists()) {
    return {
      localId: identificador,
      dados: snapshotDireto.val() as LocalBanco,
      colecao,
    };
  }

  const snapshotColecao = await comTimeout(
    database
      .ref(colecao)
      .get(),
    8_000,
    `leitura da coleção ${colecao}`
  );

  if (!snapshotColecao.exists()) {
    return null;
  }

  const valor = snapshotColecao.val();

  if (
    !valor ||
    typeof valor !== "object"
  ) {
    return null;
  }

  const registros = valor as Record<
    string,
    LocalBanco
  >;

  for (
    const [chave, dados]
    of Object.entries(registros)
  ) {
    const slug = dados.slug?.trim();
    const id = dados.id?.trim();
    const codigo = dados.codigo?.trim();

    if (
      slug === identificador ||
      id === identificador ||
      codigo === identificador
    ) {
      return {
        localId: chave,
        dados,
        colecao,
      };
    }
  }

  return null;
}

async function buscarLocal(
  identificador: string
): Promise<LocalEncontrado | null> {
  const colecoes = [
    "locais",
    "qrCentral/locais",
    "locais-v2",
    "condominios-v2",
    "residencias-v2",
    "empresas-v2",
    "estabelecimentos-v2",
  ];

  for (const colecao of colecoes) {
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
    params: Promise<{
      localId: string;
    }>;
  }
): Promise<Response> {
  try {
    const {
      localId: localIdRecebido,
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
      await comTimeout(
        buscarLocal(identificador),
        30_000,
        "busca do local no Firebase"
      );

    if (!encontrado) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "Local não encontrado pelo ID, slug ou código.",
          identificador,
        },
        {
          status: 404,
        }
      );
    }

    const local = encontrado.dados;

    if (
      local.status
        ?.trim()
        .toLowerCase() === "inativo"
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
      obterSegmentoMaterial(local);

    const baseUrl =
      obterBaseUrl(request);

    const urlQr =
      `${baseUrl}/acesso-v2/${encodeURIComponent(slug)}`;

    const dadosMaterial:
      DadosMaterial = {
        localId:
          encontrado.localId,
        slug,
        nome,
        segmento,
        cidade: local.cidade,
        estado: local.estado,
        telefone: local.telefone,
        whatsapp: local.whatsapp,
        email: local.email,
        site: local.site,
        instagram: local.instagram,
        facebook: local.facebook,
        logo: local.logo,
        urlQr,
        corPrimaria:
          local.corPrimaria,
        corSecundaria:
          local.corSecundaria,
        corTexto:
          local.corTexto,
      };

    const resultado =
      await comTimeout(
        gerarMaterialPdf(
          dadosMaterial
        ),
        25_000,
        "geração do PDF"
      );

    return new Response(
      Buffer.from(
        resultado.bytes
      ),
      {
        status: 200,
        headers: {
          "Content-Type":
            resultado.mimeType,
          "Content-Disposition":
            `inline; filename="${resultado.nomeArquivo}"`,
          "Content-Length":
            String(
              resultado.bytes
                .byteLength
            ),
          "Cache-Control":
            "no-store, max-age=0",
          "X-Local-Id":
            encontrado.localId,
          "X-Local-Slug":
            slug,
          "X-Local-Colecao":
            encontrado.colecao,
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

    const tempoExcedido =
      mensagem
        .toLowerCase()
        .includes("tempo limite");

    return NextResponse.json(
      {
        sucesso: false,
        mensagem,
      },
      {
        status:
          tempoExcedido
            ? 504
            : 500,
      }
    );
  }
}
