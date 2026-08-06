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
  type TemaMaterial,
} from "../../../../services/implantacao/materiais";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type IdentidadeVisualBanco = {
  tema?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  corTexto?: string;
  logoUrl?: string;
  bannerUrl?: string;
};

type LocalBanco = {
  id?: string;
  localId?: string;
  nome?: string;
  slug?: string;
  tipo?: string;
  tipoLocal?: string;
  segmento?: string;
  status?: string;
  ativo?: boolean;
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
  identidadeVisual?: IdentidadeVisualBanco;
  configuracao?: {
    identidadeVisual?: IdentidadeVisualBanco;
  };
};

type LocalEncontrado = {
  localId: string;
  dados: LocalBanco;
};

function texto(
  valor: unknown
): string {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function obterBaseUrl(
  request: NextRequest
): string {
  const configurada =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL;

  if (configurada) {
    if (
      configurada.startsWith("http://") ||
      configurada.startsWith("https://")
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
  valor: string | undefined
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
  local: LocalBanco
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

function obterTemaMaterial(
  identidade: IdentidadeVisualBanco
): TemaMaterial {
  const tema =
    texto(
      identidade.tema
    ).toLowerCase();

  if (
    tema === "institucional" ||
    tema === "premium"
  ) {
    return tema;
  }

  return "clean";
}

function obterIdentidadeVisual(
  local: LocalBanco
): IdentidadeVisualBanco {
  return {
    ...(
      local.configuracao
        ?.identidadeVisual ??
      {}
    ),

    ...(
      local.identidadeVisual ??
      {}
    ),
  };
}

async function buscarLocal(
  identificador: string
): Promise<LocalEncontrado | null> {
  const {
    database,
  } = obterFirebaseAdminQr();

  const snapshotDireto =
    await database
      .ref(
        `locais-v2/${identificador}`
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

  const snapshotLocais =
    await database
      .ref(
        "locais-v2"
      )
      .get();

  if (
    !snapshotLocais.exists()
  ) {
    return null;
  }

  const locais =
    snapshotLocais.val() as
      Record<string, LocalBanco>;

  for (
    const [
      chave,
      dados,
    ] of Object.entries(
      locais
    )
  ) {
    const id =
      texto(
        dados.id ||
        dados.localId
      );

    const slug =
      texto(
        dados.slug
      );

    if (
      chave === identificador ||
      id === identificador ||
      slug === identificador
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
          sucesso:
            false,

          mensagem:
            "O local não foi informado.",
        },
        {
          status:
            400,
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
          sucesso:
            false,

          mensagem:
            "Local não encontrado em locais-v2 pelo ID ou slug.",
        },
        {
          status:
            404,
        }
      );
    }

    const local =
      encontrado.dados;

    if (
      local.status ===
        "inativo" ||
      local.ativo ===
        false
    ) {
      return NextResponse.json(
        {
          sucesso:
            false,

          mensagem:
            "O local está inativo.",
        },
        {
          status:
            410,
        }
      );
    }

    const nome =
      texto(
        local.nome
      ) ||
      identificador;

    const slug =
      texto(
        local.slug ||
        local.id ||
        local.localId
      ) ||
      identificador;

    const segmento =
      obterSegmentoMaterial(
        local
      );

    const identidadeVisual =
      obterIdentidadeVisual(
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

        tema:
          obterTemaMaterial(
            identidadeVisual
          ),

        cidade:
          texto(
            local.cidade
          ) ||
          undefined,

        estado:
          texto(
            local.estado
          ) ||
          undefined,

        telefone:
          texto(
            local.telefone
          ) ||
          undefined,

        whatsapp:
          texto(
            local.whatsapp
          ) ||
          undefined,

        email:
          texto(
            local.email
          ) ||
          undefined,

        site:
          texto(
            local.site
          ) ||
          undefined,

        instagram:
          texto(
            local.instagram
          ) ||
          undefined,

        facebook:
          texto(
            local.facebook
          ) ||
          undefined,

        logo:
          texto(
            identidadeVisual.logoUrl ||
            local.logo
          ) ||
          undefined,

        urlQr,

        corPrimaria:
          texto(
            identidadeVisual.corPrimaria ||
            local.corPrimaria
          ) ||
          undefined,

        corSecundaria:
          texto(
            identidadeVisual.corSecundaria ||
            local.corSecundaria
          ) ||
          undefined,

        corTexto:
          texto(
            identidadeVisual.corTexto ||
            local.corTexto
          ) ||
          undefined,
      };

    const resultado =
      await gerarMaterialPdf(
        dadosMaterial
      );

    return new Response(
      Buffer.from(
        resultado.bytes
      ),
      {
        status:
          200,

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
    console.error(
      "Erro ao gerar material do QR:",
      erro
    );

    return NextResponse.json(
      {
        sucesso:
          false,

        mensagem:
          erro instanceof Error
            ? erro.message
            : String(erro),

        stack:
          erro instanceof Error
            ? erro.stack
            : null,
      },
      {
        status:
          500,
      }
    );
  }
}
