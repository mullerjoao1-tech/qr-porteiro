import { NextResponse } from "next/server";
import {
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

const UID_ADMIN = "zOsew1mVu4SkMsUcB1xO6rxs0bw1";

function obterFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApp();
  }

  const chaveTexto =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!chaveTexto) {
    throw new Error(
      "A variável FIREBASE_SERVICE_ACCOUNT_KEY não foi encontrada."
    );
  }

  const serviceAccount = JSON.parse(
    chaveTexto
  );

  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL:
      "https://qr-porteiro-app-default-rtdb.firebaseio.com",
  });
}

export async function GET() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Esta rota de inicialização só pode ser usada no ambiente local.",
        },
        {
          status: 403,
        }
      );
    }

    const app = obterFirebaseAdmin();

    const auth = getAuth(app);
    const database = getDatabase(app);

    const usuarioAuthentication =
      await auth.getUser(UID_ADMIN);

    if (!usuarioAuthentication.email) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "O usuário existe no Authentication, mas não possui e-mail.",
        },
        {
          status: 400,
        }
      );
    }

    const agora = Date.now();

    const usuarioAdmin = {
      uid: UID_ADMIN,
      nome:
        usuarioAuthentication.displayName ||
        "Administrador Studio",
      email: usuarioAuthentication.email,
      telefone: "",
      status: "ativo",
      criadoEm: agora,
      atualizadoEm: agora,
      ultimoLogin: 0,

      condominios: {
        studio: {
          condominioId: "studio",
          condominioNome: "QR Acesso Studio",
          ativo: true,
          perfilPrincipal:
            "administrador-master",

          perfis: {
            "administrador-master": true,
          },

          unidades: {},

          permissoes: {
            dashboard: true,
            "central-inteligente": true,
            administradora: true,
            condominio: true,
            financeiro: true,
            marketplace: true,
            security: true,
            airbnb: true,
            hardware: true,
            studio: true,
            usuarios: true,
            configuracoes: true,
            moradores: true,
            unidades: true,
            comunicados: true,
            prestadores: true,
            relatorios: true,
          },
        },
      },
    };

    await database
      .ref(`usuarios-v2/${UID_ADMIN}`)
      .set(usuarioAdmin);

    return NextResponse.json({
      sucesso: true,
      mensagem:
        "Administrador Studio criado com sucesso.",
      caminho: `usuarios-v2/${UID_ADMIN}`,
      usuario: {
        uid: UID_ADMIN,
        nome: usuarioAdmin.nome,
        email: usuarioAdmin.email,
        perfil: "administrador-master",
      },
    });
  } catch (erro) {
    console.error(
      "Erro ao inicializar administrador:",
      erro
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          erro instanceof Error
            ? erro.message
            : "Erro desconhecido ao criar administrador.",
      },
      {
        status: 500,
      }
    );
  }
}