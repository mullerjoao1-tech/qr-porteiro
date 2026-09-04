import {
  NextRequest,
  NextResponse,
} from "next/server";

import crypto from "node:crypto";
import nodemailer from "nodemailer";

import {
  obterFirebaseAdmin,
} from "@/app/services/server/firebaseAdmin";

import {
  buscarOuCriarPessoaUniversal,
} from "@/app/services/usuarios/CadastroPessoaUniversal";

type UsuarioAdministrador = {
  status?: string;
  perfilPrincipal?: string;
  perfis?: Record<string, boolean>;
  locais?: Record<
    string,
    {
      ativo?: boolean;
      perfilPrincipal?: string;
      perfis?: Record<string, boolean>;
    }
  >;
  condominios?: Record<
    string,
    {
      ativo?: boolean;
      perfilPrincipal?: string;
      perfis?: Record<string, boolean>;
    }
  >;
};

type SolicitacaoCadastral = {
  id?: string;
  codigo?: string;

  condominioId?: string;
  condominioNome?: string;
  condominioSlug?: string;

  unidadeId?: string;
  unidadeCodigo?: string;
  unidadeNome?: string;
  bloco?: string;
  nomeUnidade?: string;

  nome?: string;
  telefone?: string;
  email?: string;
  cpf?: string;

  perfil?: string;
  recebeChamadas?: boolean;

  status?: string;
  origem?: string;
  moradorId?: string;
};

function texto(
  valor: unknown
): string {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function obterTokenBearer(
  request: NextRequest
): string {
  const cabecalho =
    request.headers.get(
      "authorization"
    );

  if (
    !cabecalho ||
    !cabecalho.startsWith(
      "Bearer "
    )
  ) {
    throw new Error(
      "Token de autenticacao nao informado."
    );
  }

  const token =
    cabecalho
      .slice(
        "Bearer ".length
      )
      .trim();

  if (!token) {
    throw new Error(
      "Token de autenticacao invalido."
    );
  }

  return token;
}

function possuiPerfilAdministradorMaster(
  usuario: UsuarioAdministrador
): boolean {
  if (
    usuario.perfilPrincipal ===
      "administrador_master" ||
    usuario.perfis
      ?.administrador_master ===
      true
  ) {
    return true;
  }

  const vinculos = [
    ...Object.values(
      usuario.locais ?? {}
    ),
    ...Object.values(
      usuario.condominios ?? {}
    ),
  ];

  return vinculos.some(
    (vinculo) => {
      if (
        vinculo.ativo === false
      ) {
        return false;
      }

      return (
        vinculo.perfilPrincipal ===
          "administrador_master" ||
        vinculo.perfis
          ?.administrador_master ===
          true
      );
    }
  );
}

async function validarAdministradorMaster(
  request: NextRequest
) {
  const {
    auth,
    database,
  } =
    obterFirebaseAdmin();

  const token =
    obterTokenBearer(
      request
    );

  const tokenDecodificado =
    await auth.verifyIdToken(
      token
    );

  const snapshot =
    await database
      .ref(
        `usuarios-v2/${tokenDecodificado.uid}`
      )
      .get();

  if (!snapshot.exists()) {
    throw new Error(
      "Administrador sem cadastro no QR Core."
    );
  }

  const usuario =
    snapshot.val() as
      UsuarioAdministrador;

  if (
    usuario.status ===
    "inativo"
  ) {
    throw new Error(
      "Administrador inativo."
    );
  }

  if (
    !possuiPerfilAdministradorMaster(
      usuario
    )
  ) {
    throw new Error(
      "Apenas o Administrador Master pode aprovar cadastros."
    );
  }

  return tokenDecodificado.uid;
}

function gerarSenhaInterna(): string {
  return (
    "Qr!" +
    crypto
      .randomBytes(24)
      .toString("base64url")
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const administradorUid =
      await validarAdministradorMaster(
        request
      );

    const {
      auth,
      database,
    } =
      obterFirebaseAdmin();

    const corpo =
      (
        await request.json()
      ) as {
        atualizacaoId?: unknown;
        modo?: unknown;
        email?: unknown;
      };


    async function resolverUnidadeCanonicaTulipas(
      solicitacao: SolicitacaoCadastral
    ): Promise<string> {
      const unidadeIdOriginal =
        texto(
          solicitacao.unidadeId
        );

      const blocoTexto =
        texto(
          solicitacao.bloco
        );

      const unidadeNome =
        texto(
          solicitacao.unidadeNome
        );

      const unidadesSnapshot =
        await database
          .ref(
            "locais-v2/residencial-tulipas/unidades"
          )
          .get();

      if (
        !unidadesSnapshot.exists()
      ) {
        throw new Error(
          "Unidades canonicas do Residencial Tulipas nao encontradas."
        );
      }

      const unidades =
        unidadesSnapshot.val() as Record<
          string,
          {
            unidadeId?: string;
            numero?: string;
            estruturaPaiNome?: string;
            nome?: string;
          }
        >;

      const entradaCanonica =
        Object.entries(
          unidades
        ).find(
          ([chave, unidade]) =>
            chave === unidadeIdOriginal ||
            texto(
              unidade.unidadeId
            ) === unidadeIdOriginal
        );

      if (entradaCanonica) {
        return (
          texto(
            entradaCanonica[1].unidadeId
          ) ||
          entradaCanonica[0]
        );
      }

      const blocoNumero =
        blocoTexto.match(
          /\d+/
        )?.[0] ||
        unidadeNome.match(
          /^\s*(\d+)\s*\//
        )?.[1] ||
        "";

      const apartamentoNumero =
        unidadeNome.match(
          /\/\s*(\d+)\s*$/
        )?.[1] || "";

      if (
        !blocoNumero ||
        !apartamentoNumero
      ) {
        throw new Error(
          "Nao foi possivel identificar bloco e apartamento do morador."
        );
      }

      const correspondencias =
        Object.entries(
          unidades
        ).filter(
          ([, unidade]) => {
            const numero =
              texto(
                unidade.numero
              );

            const bloco =
              texto(
                unidade.estruturaPaiNome
              );

            const numeroBloco =
              bloco.match(
                /\d+/
              )?.[0] || "";

            return (
              numero === apartamentoNumero &&
              numeroBloco === blocoNumero
            );
          }
        );

      if (
        correspondencias.length !== 1
      ) {
        throw new Error(
          `Unidade canonica nao resolvida de forma unica para bloco ${blocoNumero}, apartamento ${apartamentoNumero}.`
        );
      }

      const [
        chave,
        unidade,
      ] =
        correspondencias[0];

      return (
        texto(
          unidade.unidadeId
        ) ||
        chave
      );
    }

    const modo =
      texto(
        corpo.modo
      );

    if (
      modo ===
      "simular-regularizacao-tulipas"
    ) {
      const todasSnapshot =
        await database
          .ref(
            "qrCentral/atualizacoesCadastrais"
          )
          .get();

      const todas =
        todasSnapshot.exists()
          ? todasSnapshot.val() as Record<
              string,
              SolicitacaoCadastral
            >
          : {};

      const resultados = [];

      for (
        const [id, solicitacao]
        of Object.entries(todas)
      ) {
        if (
          solicitacao.status !==
          "aprovada"
        ) {
          continue;
        }

        const condominioId =
          texto(
            solicitacao.condominioId
          ).toLowerCase();

        const condominioSlug =
          texto(
            solicitacao.condominioSlug
          ).toLowerCase();

        const condominioNome =
          texto(
            solicitacao.condominioNome
          ).toLowerCase();

        const ehTulipas =
          condominioId.includes(
            "tulipas"
          ) ||
          condominioSlug.includes(
            "tulipas"
          ) ||
          condominioNome.includes(
            "tulipas"
          );

        if (!ehTulipas) {
          continue;
        }

        const email =
          texto(
            solicitacao.email
          ).toLowerCase();

        const unidadeIdOriginal =
          texto(
            solicitacao.unidadeId
          );

        const unidadeId =
          await resolverUnidadeCanonicaTulipas(
            solicitacao
          );

        const nomeNormalizado =
          texto(
            solicitacao.nome
          )
            .trim()
            .toLowerCase();

        const emailCompartilhado =
          email
            ? Object.entries(todas).some(
                ([
                  outroId,
                  outraSolicitacao,
                ]) => {
                  if (
                    outroId === id ||
                    outraSolicitacao.status !==
                      "aprovada"
                  ) {
                    return false;
                  }

                  const outroCondominioId =
                    texto(
                      outraSolicitacao.condominioId
                    ).toLowerCase();

                  const outroCondominioSlug =
                    texto(
                      outraSolicitacao.condominioSlug
                    ).toLowerCase();

                  const outroCondominioNome =
                    texto(
                      outraSolicitacao.condominioNome
                    ).toLowerCase();

                  const outraEhTulipas =
                    outroCondominioId.includes(
                      "tulipas"
                    ) ||
                    outroCondominioSlug.includes(
                      "tulipas"
                    ) ||
                    outroCondominioNome.includes(
                      "tulipas"
                    );

                  if (!outraEhTulipas) {
                    return false;
                  }

                  const outroEmail =
                    texto(
                      outraSolicitacao.email
                    ).toLowerCase();

                  const outroNome =
                    texto(
                      outraSolicitacao.nome
                    )
                      .trim()
                      .toLowerCase();

                  return (
                    outroEmail === email &&
                    outroNome !==
                      nomeNormalizado
                  );
                }
              )
            : false;

        let uid = "";

        if (
          email &&
          !emailCompartilhado
        ) {
          const chaveEmail =
            email.replace(
              /[.#$[\]]/g,
              "_"
            );

          const indiceSnapshot =
            await database
              .ref(
                `indices-v2/email/${chaveEmail}`
              )
              .get();

          if (
            indiceSnapshot.exists()
          ) {
            uid =
              texto(
                indiceSnapshot.val()
              );
          }

          if (!uid) {
            try {
              const usuarioAuth =
                await auth
                  .getUserByEmail(
                    email
                  );

              uid =
                usuarioAuth.uid;
            } catch {
              uid = "";
            }
          }
        }

        let temUsuario = false;
        let temVinculo = false;
        let temResponsavel = false;

        if (uid) {
          const usuarioSnapshot =
            await database
              .ref(
                `usuarios-v2/${uid}`
              )
              .get();

          temUsuario =
            usuarioSnapshot.exists();

          if (
            temUsuario &&
            unidadeId
          ) {
            const usuario =
              usuarioSnapshot.val();

            const localId =
              texto(
                solicitacao.condominioId
              );

            temVinculo =
              usuario
                ?.locais
                ?.[localId]
                ?.unidades
                ?.[unidadeId] ===
                true ||
              usuario
                ?.condominios
                ?.[localId]
                ?.unidades
                ?.[unidadeId] ===
                true;
          }

          if (unidadeId) {
            const responsavelSnapshot =
              await database
                .ref(
                  `unidades-v2/${unidadeId}/responsaveis/${uid}`
                )
                .get();

            temResponsavel =
              responsavelSnapshot.exists() &&
              responsavelSnapshot
                .val()
                ?.ativo !== false;
          }
        }

        let situacao =
          !email
            ? "SEM_EMAIL"
            : emailCompartilhado
              ? "EMAIL_COMPARTILHADO"
              : "SEM_USUARIO";

        if (
          !emailCompartilhado &&
          temUsuario
        ) {
          if (
            temVinculo &&
            temResponsavel
          ) {
            situacao = "OK";
          } else if (
            !temVinculo &&
            !temResponsavel
          ) {
            situacao =
              "SEM_VINCULO_E_RESPONSAVEL";
          } else if (!temVinculo) {
            situacao =
              "SEM_VINCULO";
          } else {
            situacao =
              "SEM_RESPONSAVEL";
          }
        }

        resultados.push({
          id,
          codigo:
            texto(
              solicitacao.codigo
            ),
          nome:
            texto(
              solicitacao.nome
            ),
          unidadeId,
          unidadeNome:
            texto(
              solicitacao.unidadeNome
            ),
          email,
          situacao,
          temUsuario,
          temVinculo,
          temResponsavel,
          emailCompartilhado,
        });
      }

      resultados.sort(
        (a, b) =>
          a.unidadeNome.localeCompare(
            b.unidadeNome,
            "pt-BR",
            {
              numeric: true,
            }
          )
      );

      return NextResponse.json(
        {
          sucesso: true,
          somenteLeitura: true,
          total:
            resultados.length,
          resultados,
          administradorUid,
        },
        {
          status: 200,
        }
      );
    }

    const atualizacaoId =
      texto(
        corpo.atualizacaoId
      );

    if (!atualizacaoId) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Informe a atualizacao cadastral.",
        },
        {
          status: 400,
        }
      );
    }

    const solicitacaoRef =
      database.ref(
        `qrCentral/atualizacoesCadastrais/${atualizacaoId}`
      );

    const solicitacaoSnapshot =
      await solicitacaoRef.get();

    if (
      !solicitacaoSnapshot.exists()
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Atualizacao cadastral nao encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const solicitacao =
      solicitacaoSnapshot.val() as
        SolicitacaoCadastral;

    const informarEmailAprovadoTulipas =
      modo ===
      "informar-email-aprovado-tulipas";

    if (informarEmailAprovadoTulipas) {
      if (
        solicitacao.status !==
        "aprovada"
      ) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Somente cadastros aprovados podem receber e-mail.",
          },
          {
            status: 409,
          }
        );
      }

      const condominioIdTeste =
        texto(
          solicitacao.condominioId
        ).toLowerCase();

      const condominioSlugTeste =
        texto(
          solicitacao.condominioSlug
        ).toLowerCase();

      const condominioNomeTeste =
        texto(
          solicitacao.condominioNome
        ).toLowerCase();

      const ehTulipas =
        condominioIdTeste.includes(
          "tulipas"
        ) ||
        condominioSlugTeste.includes(
          "tulipas"
        ) ||
        condominioNomeTeste.includes(
          "tulipas"
        );

      if (!ehTulipas) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Esta operacao esta limitada ao Residencial Tulipas.",
          },
          {
            status: 403,
          }
        );
      }

      const emailAtual =
        texto(
          solicitacao.email
        ).toLowerCase();

      if (emailAtual) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Este cadastro ja possui e-mail.",
          },
          {
            status: 409,
          }
        );
      }

      const novoEmail =
        texto(
          corpo.email
        ).toLowerCase();

      if (
        !novoEmail ||
        !novoEmail.includes("@")
      ) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Informe um e-mail valido.",
          },
          {
            status: 400,
          }
        );
      }

      const todasSnapshot =
        await database
          .ref(
            "qrCentral/atualizacoesCadastrais"
          )
          .get();

      const todas =
        todasSnapshot.exists()
          ? todasSnapshot.val() as Record<
              string,
              SolicitacaoCadastral
            >
          : {};

      const nomeAtual =
        texto(
          solicitacao.nome
        )
          .trim()
          .toLowerCase();

      const conflito =
        Object.entries(todas).find(
          ([
            outroId,
            outraSolicitacao,
          ]) => {
            if (
              outroId === atualizacaoId ||
              outraSolicitacao.status !==
                "aprovada"
            ) {
              return false;
            }

            const outroEmail =
              texto(
                outraSolicitacao.email
              ).toLowerCase();

            if (outroEmail !== novoEmail) {
              return false;
            }

            const outroNome =
              texto(
                outraSolicitacao.nome
              )
                .trim()
                .toLowerCase();

            return (
              outroNome !== nomeAtual
            );
          }
        );

      if (conflito) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Este e-mail ja esta vinculado a outro morador aprovado.",
          },
          {
            status: 409,
          }
        );
      }

      const moradorId =
        texto(
          solicitacao.moradorId
        );

      const agora =
        Date.now();

      const alteracoes: Record<
        string,
        unknown
      > = {
        [`qrCentral/atualizacoesCadastrais/${atualizacaoId}/email`]:
          novoEmail,
        [`qrCentral/atualizacoesCadastrais/${atualizacaoId}/atualizadoEm`]:
          agora,
      };

      if (moradorId) {
        alteracoes[
          `qrCentral/moradores/${moradorId}/email`
        ] = novoEmail;

        alteracoes[
          `qrCentral/moradores/${moradorId}/atualizadoEm`
        ] = agora;
      }

      await database
        .ref()
        .update(
          alteracoes
        );

      return NextResponse.json(
        {
          sucesso: true,
          email: novoEmail,
        },
        {
          status: 200,
        }
      );
    }

    const enviarAcessoAprovadoTulipas =
      modo ===
      "enviar-acesso-aprovado-tulipas";

    if (enviarAcessoAprovadoTulipas) {
      if (
        solicitacao.status !==
        "aprovada"
      ) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Somente cadastros aprovados podem receber acesso.",
          },
          {
            status: 409,
          }
        );
      }

      const condominioIdTeste =
        texto(
          solicitacao.condominioId
        ).toLowerCase();

      const condominioSlugTeste =
        texto(
          solicitacao.condominioSlug
        ).toLowerCase();

      const condominioNomeTeste =
        texto(
          solicitacao.condominioNome
        ).toLowerCase();

      const ehTulipas =
        condominioIdTeste.includes(
          "tulipas"
        ) ||
        condominioSlugTeste.includes(
          "tulipas"
        ) ||
        condominioNomeTeste.includes(
          "tulipas"
        );

      if (!ehTulipas) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Esta operacao esta limitada ao Residencial Tulipas.",
          },
          {
            status: 403,
          }
        );
      }

      const email =
        texto(
          solicitacao.email
        ).toLowerCase();

      if (
        !email ||
        !email.includes("@")
      ) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Este cadastro nao possui e-mail valido.",
          },
          {
            status: 409,
          }
        );
      }

      const todasSnapshot =
        await database
          .ref(
            "qrCentral/atualizacoesCadastrais"
          )
          .get();

      const todas =
        todasSnapshot.exists()
          ? todasSnapshot.val() as Record<
              string,
              SolicitacaoCadastral
            >
          : {};

      const nomeNormalizado =
        texto(
          solicitacao.nome
        )
          .trim()
          .toLowerCase();

      const emailCompartilhado =
        Object.entries(todas).some(
          ([
            outroId,
            outraSolicitacao,
          ]) => {
            if (
              outroId === atualizacaoId ||
              outraSolicitacao.status !==
                "aprovada"
            ) {
              return false;
            }

            const outroEmail =
              texto(
                outraSolicitacao.email
              ).toLowerCase();

            if (
              outroEmail !== email
            ) {
              return false;
            }

            const outroNome =
              texto(
                outraSolicitacao.nome
              )
                .trim()
                .toLowerCase();

            return (
              outroNome !==
              nomeNormalizado
            );
          }
        );

      if (emailCompartilhado) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Este e-mail esta compartilhado com outro morador. O envio foi bloqueado.",
          },
          {
            status: 409,
          }
        );
      }

      let uid = "";

      const moradorId =
        texto(
          solicitacao.moradorId
        );

      if (moradorId) {
        const moradorSnapshot =
          await database
            .ref(
              `qrCentral/moradores/${moradorId}`
            )
            .get();

        if (
          moradorSnapshot.exists()
        ) {
          uid =
            texto(
              moradorSnapshot
                .val()
                ?.uid
            );
        }
      }

      if (!uid) {
        try {
          const usuarioAuth =
            await auth
              .getUserByEmail(
                email
              );

          uid =
            usuarioAuth.uid;
        } catch {
          uid = "";
        }
      }

      if (!uid) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Usuario do morador nao encontrado.",
          },
          {
            status: 409,
          }
        );
      }

      const unidadeId =
        await resolverUnidadeCanonicaTulipas(
          solicitacao
        );

      const usuarioSnapshot =
        await database
          .ref(
            `usuarios-v2/${uid}`
          )
          .get();

      const temUsuario =
        usuarioSnapshot.exists();

      const usuario =
        temUsuario
          ? usuarioSnapshot.val()
          : null;

      const localId =
        texto(
          solicitacao.condominioId
        );

      const temVinculo =
        temUsuario &&
        (
          usuario
            ?.locais
            ?.[localId]
            ?.unidades
            ?.[unidadeId] ===
            true ||
          usuario
            ?.condominios
            ?.[localId]
            ?.unidades
            ?.[unidadeId] ===
            true
        );

      const responsaveisSnapshot =
        await database
          .ref(
            `unidades-v2/${unidadeId}/responsaveis`
          )
          .get();

      const responsaveis =
        responsaveisSnapshot.exists()
          ? responsaveisSnapshot.val() as Record<
              string,
              {
                usuarioId?: string;
                ativo?: boolean;
              }
            >
          : {};

      const temResponsavel =
        Object.values(
          responsaveis
        ).some(
          (responsavel) =>
            texto(
              responsavel.usuarioId
            ) === uid &&
            responsavel.ativo !== false
        );

      if (
        !temUsuario ||
        !temVinculo ||
        !temResponsavel
      ) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "O cadastro ainda nao esta com VINCULO OK.",
          },
          {
            status: 409,
          }
        );
      }

      const usuarioEmail =
        await auth
          .getUser(
            uid
          );

      if (
        texto(
          usuarioEmail.email
        ).toLowerCase() !==
        email
      ) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "O e-mail do cadastro nao corresponde ao usuario autenticado.",
          },
          {
            status: 409,
          }
        );
      }

      const remetente =
        texto(
          process.env
            .QR_ACESSO_EMAIL
        );

      const senhaApp =
        texto(
          process.env
            .QR_ACESSO_EMAIL_APP_PASSWORD
        ).replace(
          /\s/g,
          ""
        );

      if (
        !remetente ||
        !senhaApp
      ) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Servico de e-mail do QR Acesso nao configurado.",
          },
          {
            status: 500,
          }
        );
      }

      const linkSenha =
        await auth
          .generatePasswordResetLink(
            email
          );

      const transportador =
        nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: remetente,
            pass: senhaApp,
          },
        });

      const nome =
        texto(
          solicitacao.nome
        ) || "Morador";

      await transportador.sendMail({
        from:
          `"QR Acesso" <${remetente}>`,
        to: email,
        subject:
          "QR Acesso - Seu acesso esta liberado",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;line-height:1.6">
            <h2>QR Acesso</h2>

            <p>Ola, ${nome}.</p>

            <p>
              Seu acesso ao
              <strong>QR Acesso</strong>
              do Residencial Tulipas esta liberado.
            </p>

            <p>
              Para criar ou redefinir sua senha,
              clique abaixo:
            </p>

            <p>
              <a
                href="${linkSenha}"
                style="display:inline-block;padding:12px 18px;background:#0f766e;color:white;text-decoration:none;border-radius:8px;font-weight:bold"
              >
                DEFINIR MINHA SENHA
              </a>
            </p>

            <p>
              Depois de definir sua senha,
              entre no aplicativo usando
              <strong>${email}</strong>.
            </p>

            <p>
              Para instalar o QR Acesso no Android:
            </p>

            <p>
              <a href="https://qracesso.vercel.app/downloads/qr-acesso.apk">
                BAIXAR QR ACESSO PARA ANDROID
              </a>
            </p>

            <p>
              Se voce nao reconhece este acesso,
              ignore esta mensagem.
            </p>

            <p>
              Atenciosamente,<br>
              <strong>Equipe QR Acesso</strong>
            </p>
          </div>
        `,
      });

      const agora =
        Date.now();

      await solicitacaoRef.update({
        acessoEnviadoEm:
          agora,
        acessoEnviadoPor:
          administradorUid,
      });

      return NextResponse.json(
        {
          sucesso: true,
          email,
          acessoEnviadoEm:
            agora,
        },
        {
          status: 200,
        }
      );
    }

    const regularizacaoAprovadaTulipas =
      modo ===
      "regularizar-aprovado-tulipas";

    if (
      regularizacaoAprovadaTulipas
    ) {
      if (
        solicitacao.status !==
        "aprovada"
      ) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Somente cadastros aprovados podem ser regularizados.",
          },
          {
            status: 409,
          }
        );
      }

      const condominioIdTeste =
        texto(
          solicitacao.condominioId
        ).toLowerCase();

      const condominioSlugTeste =
        texto(
          solicitacao.condominioSlug
        ).toLowerCase();

      const condominioNomeTeste =
        texto(
          solicitacao.condominioNome
        ).toLowerCase();

      const ehTulipas =
        condominioIdTeste.includes(
          "tulipas"
        ) ||
        condominioSlugTeste.includes(
          "tulipas"
        ) ||
        condominioNomeTeste.includes(
          "tulipas"
        );

      if (!ehTulipas) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Esta regularizacao esta limitada ao Residencial Tulipas.",
          },
          {
            status: 403,
          }
        );
      }
    } else if (
      solicitacao.status !==
      "pendente"
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Esta atualizacao cadastral ja foi analisada.",
        },
        {
          status: 409,
        }
      );
    }

    const nome =
      texto(
        solicitacao.nome
      );

    const email =
      texto(
        solicitacao.email
      ).toLowerCase();

    const telefone =
      texto(
        solicitacao.telefone
      );

    const cpf =
      texto(
        solicitacao.cpf
      );

    const localId =
      texto(
        solicitacao.condominioId
      );

    const localNome =
      texto(
        solicitacao.condominioNome
      );

    const localSlug =
      texto(
        solicitacao.condominioSlug
      );

    const unidadeIdOriginal =
      texto(
        solicitacao.unidadeId
      );

    const solicitacaoEhTulipas =
      [
        localId,
        localNome,
        localSlug,
      ].some(
        (valor) =>
          valor
            .toLowerCase()
            .includes(
              "tulipas"
            )
      );

    const unidadeId =
      solicitacaoEhTulipas
        ? await resolverUnidadeCanonicaTulipas(
            solicitacao
          )
        : unidadeIdOriginal;

    const moradorId =
      texto(
        solicitacao.moradorId
      );

    if (
      regularizacaoAprovadaTulipas &&
      email
    ) {
      const todasSnapshot =
        await database
          .ref(
            "qrCentral/atualizacoesCadastrais"
          )
          .get();

      const todas =
        todasSnapshot.exists()
          ? todasSnapshot.val() as Record<
              string,
              SolicitacaoCadastral
            >
          : {};

      const nomeNormalizado =
        nome
          .trim()
          .toLowerCase();

      const conflitoEmail =
        Object.entries(todas).find(
          ([
            outroId,
            outraSolicitacao,
          ]) => {
            if (
              outroId === atualizacaoId ||
              outraSolicitacao.status !==
                "aprovada"
            ) {
              return false;
            }

            const outroCondominioId =
              texto(
                outraSolicitacao.condominioId
              ).toLowerCase();

            const outroCondominioSlug =
              texto(
                outraSolicitacao.condominioSlug
              ).toLowerCase();

            const outroCondominioNome =
              texto(
                outraSolicitacao.condominioNome
              ).toLowerCase();

            const outraEhTulipas =
              outroCondominioId.includes(
                "tulipas"
              ) ||
              outroCondominioSlug.includes(
                "tulipas"
              ) ||
              outroCondominioNome.includes(
                "tulipas"
              );

            if (!outraEhTulipas) {
              return false;
            }

            const outroEmail =
              texto(
                outraSolicitacao.email
              ).toLowerCase();

            const outroNome =
              texto(
                outraSolicitacao.nome
              )
                .trim()
                .toLowerCase();

            return (
              outroEmail === email &&
              outroNome !==
                nomeNormalizado
            );
          }
        );

      if (conflitoEmail) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Este e-mail esta compartilhado com outro morador. A regularizacao automatica foi bloqueada para evitar vincular duas pessoas ao mesmo usuario.",
          },
          {
            status: 409,
          }
        );
      }
    }

    if (!nome) {
      throw new Error(
        "Nome do morador nao informado."
      );
    }

    if (!email) {
      throw new Error(
        "E-mail do morador nao informado."
      );
    }

    if (!localId) {
      throw new Error(
        "Condominio nao informado."
      );
    }

    if (!unidadeId) {
      throw new Error(
        "Unidade nao informada."
      );
    }

    const pessoa =
      await buscarOuCriarPessoaUniversal({
        auth,
        database,
        nome,
        email,
        telefone,
        cpf:
          cpf || undefined,
        senhaProvisoria:
          gerarSenhaInterna(),
        origem:
          "atualizacao-cadastral-aprovada",
      });

    const uid =
      pessoa.uid;

    const agora =
      Date.now();

    const usuarioRef =
      database.ref(
        `usuarios-v2/${uid}`
      );

    const usuarioSnapshot =
      await usuarioRef.get();

    const usuarioAtual =
      usuarioSnapshot.exists()
        ? usuarioSnapshot.val()
        : {};

    const localAtual =
      usuarioAtual
        ?.locais
        ?.[localId] ??
      {};

    const condominioAtual =
      usuarioAtual
        ?.condominios
        ?.[localId] ??
      {};

    const perfilPrincipal =
      "morador";

    const unidadesLocalAtuais = {
      ...(
        localAtual.unidades ??
        {}
      ),
    };

    const unidadesCondominioAtuais = {
      ...(
        condominioAtual.unidades ??
        {}
      ),
    };

    if (
      solicitacaoEhTulipas &&
      unidadeIdOriginal &&
      unidadeIdOriginal !== unidadeId
    ) {
      delete unidadesLocalAtuais[
        unidadeIdOriginal
      ];

      delete unidadesCondominioAtuais[
        unidadeIdOriginal
      ];
    }

    const vinculo = {
      localId,
      localNome:
        localNome || undefined,
      localSlug:
        localSlug || undefined,
      tipoLocal:
        "condominio",
      perfilPrincipal,
      perfis: {
        ...(
          localAtual.perfis ??
          {}
        ),
        morador: true,
      },
      unidades: {
        ...unidadesLocalAtuais,
        [unidadeId]: true,
      },
      permissoes: {
        ...(
          localAtual.permissoes ??
          {}
        ),
      },
      ativo: true,
      criadoEm:
        localAtual.criadoEm ??
        agora,
      atualizadoEm:
        agora,
    };

    const vinculoCondominio = {
      ...vinculo,
      condominioId:
        localId,
      condominioNome:
        localNome || undefined,
      condominioSlug:
        localSlug || undefined,
      perfis: {
        ...(
          condominioAtual.perfis ??
          {}
        ),
        ...vinculo.perfis,
      },
      unidades: {
        ...unidadesCondominioAtuais,
        ...vinculo.unidades,
      },
      criadoEm:
        condominioAtual.criadoEm ??
        vinculo.criadoEm,
      atualizadoEm:
        agora,
    };

    const responsaveisRef =
      database.ref(
        `unidades-v2/${unidadeId}/responsaveis`
      );

    const responsaveisSnapshot =
      await responsaveisRef.get();

    const responsaveis =
      responsaveisSnapshot.exists()
        ? responsaveisSnapshot.val() as
            Record<
              string,
              {
                prioridade?: number;
                status?: string;
                ativo?: boolean;
                criadoEm?: number;
              }
            >
        : {};

    let responsaveisAntigos:
      Record<
        string,
        {
          prioridade?: number;
          status?: string;
          ativo?: boolean;
          criadoEm?: number;
        }
      > = {};

    if (
      solicitacaoEhTulipas &&
      unidadeIdOriginal &&
      unidadeIdOriginal !== unidadeId
    ) {
      const antigosSnapshot =
        await database
          .ref(
            `unidades-v2/${unidadeIdOriginal}/responsaveis`
          )
          .get();

      responsaveisAntigos =
        antigosSnapshot.exists()
          ? antigosSnapshot.val()
          : {};
    }

    const responsavelExistenteUid =
      responsaveis[uid] ??
      responsaveisAntigos[uid];

    const responsavelExistenteLegado =
      moradorId
        ? (
            responsaveis[
              moradorId
            ] ??
            responsaveisAntigos[
              moradorId
            ]
          )
        : undefined;

    const responsavelExistente =
      responsavelExistenteUid ??
      responsavelExistenteLegado;

    let prioridade =
      Number(
        responsavelExistente
          ?.prioridade
      );

    if (
      !Number.isFinite(
        prioridade
      ) ||
      prioridade < 1
    ) {
      const prioridadesAtivas =
        Object.values(
          responsaveis
        )
          .filter(
            (responsavel) =>
              responsavel.ativo !==
              false
          )
          .map(
            (responsavel) =>
              Number(
                responsavel.prioridade
              )
          )
          .filter(
            (valor) =>
              Number.isFinite(
                valor
              ) &&
              valor >= 1
          );

      prioridade =
        prioridadesAtivas.length > 0
          ? Math.max(
              ...prioridadesAtivas
            ) + 1
          : 1;
    }

    const responsavel = {
      usuarioId:
        uid,
      unidadeId,
      nome,
      telefone:
        telefone || null,
      prioridade:
        Math.floor(
          prioridade
        ),
      status:
        responsavelExistente?.status ??
        "disponivel",
      ativo:
        responsavelExistente?.ativo ??
        true,
      criadoEm:
        responsavelExistente
          ?.criadoEm ??
        agora,
      atualizadoEm:
        agora,
    };

    const atualizacoes:
      Record<
        string,
        unknown
      > = {
        [`usuarios-v2/${uid}/locais/${localId}`]:
          vinculo,

        [`usuarios-v2/${uid}/condominios/${localId}`]:
          vinculoCondominio,

        [`usuarios-v2/${uid}/atualizadoEm`]:
          agora,

        [`unidades-v2/${unidadeId}/responsaveis/${uid}`]:
          responsavel,
      };

    if (
      solicitacaoEhTulipas &&
      unidadeIdOriginal &&
      unidadeIdOriginal !== unidadeId
    ) {
      atualizacoes[
        `unidades-v2/${unidadeIdOriginal}/responsaveis/${uid}`
      ] = null;

      if (
        moradorId &&
        moradorId !== uid
      ) {
        atualizacoes[
          `unidades-v2/${unidadeIdOriginal}/responsaveis/${moradorId}`
        ] = null;
      }
    }

    if (
      regularizacaoAprovadaTulipas &&
      moradorId
    ) {
      atualizacoes[
        `qrCentral/moradores/${moradorId}/uid`
      ] = uid;

      atualizacoes[
        `qrCentral/moradores/${moradorId}/atualizadoEm`
      ] = agora;

      if (
        moradorId !== uid &&
        responsavelExistenteLegado
      ) {
        atualizacoes[
          `unidades-v2/${unidadeId}/responsaveis/${moradorId}`
        ] = null;
      }
    }

    await database
      .ref()
      .update(
        atualizacoes
      );

    return NextResponse.json(
      {
        sucesso: true,
        preparado: true,
        usuario: {
          uid,
          nome,
          email:
            pessoa.emailPrincipal,
          reutilizado:
            pessoa.reutilizado,
          criadoNoAuthentication:
            pessoa.criadoNoAuthentication,
        },
        vinculo: {
          localId,
          unidadeId,
          prioridade:
            responsavel.prioridade,
        },
        administradorUid,
      },
      {
        status: 200,
      }
    );
  } catch (erro) {
    console.error(
      "Erro ao preparar aprovacao cadastral:",
      erro
    );

    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Nao foi possivel preparar o acesso do morador.";

    const naoAutorizado =
      mensagem.includes(
        "Token"
      ) ||
      mensagem.includes(
        "Administrador"
      );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          mensagem,
      },
      {
        status:
          naoAutorizado
            ? 403
            : 500,
      }
    );
  }
}
