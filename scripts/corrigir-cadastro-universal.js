const fs = require("fs");

const arquivoVinculos =
  "app/components/dashboard/cadastro-universal/PainelVinculos.tsx";

const arquivoPessoas =
  "app/components/dashboard/cadastro-universal/PainelPessoas.tsx";

const arquivoNovo =
  "app/components/dashboard/cadastro-universal/NovoVinculoModal.tsx";

function ler(caminho) {
  return fs.readFileSync(caminho, "utf8");
}

function salvar(caminho, conteudo) {
  fs.writeFileSync(caminho, conteudo, "utf8");
}

function exigir(condicao, mensagem) {
  if (!condicao) {
    console.error("\nERRO:", mensagem);
    process.exit(1);
  }
}

/*
==========================================================
1. PAINEL VÍNCULOS
==========================================================
*/

let vinculos = ler(arquivoVinculos);

/*
Guarda a chave REAL usada dentro de:
usuarios-v2/{uid}/locais/{chave}

Isso resolve vínculo antigo salvo por slug.
*/
if (!vinculos.includes("chaveVinculo: string;")) {
  vinculos = vinculos.replace(
    /type VinculoNormalizado = \{\s*id: string;/,
`type VinculoNormalizado = {
  id: string;
  chaveVinculo: string;`
  );
}

if (!vinculos.includes("chaveVinculo:\n                  chaveLocal")) {
  vinculos = vinculos.replace(
    /id:\s*`\$\{pessoa\.id\}-\$\{localId\}`,\s*\n\s*pessoaId:/,
`id:
                  \`\${pessoa.id}-\${localId}\`,

                chaveVinculo:
                  chaveLocal,

                pessoaId:`
  );
}

/*
Função real de exclusão.
Apaga tanto a chave antiga quanto a chave oficial.
NÃO apaga a pessoa.
*/
if (!vinculos.includes("async function excluirVinculo(")) {
  const marcador =
    "  async function salvarVinculo() {";

  exigir(
    vinculos.includes(marcador),
    "Não encontrei salvarVinculo() no PainelVinculos."
  );

  const funcaoExcluir = `  async function excluirVinculo(
    vinculo: VinculoNormalizado
  ) {
    if (excluindoVinculoId) {
      return;
    }

    const confirmado =
      window.confirm(
        \`Excluir o vínculo de "\${vinculo.pessoaNome}" com "\${vinculo.localNome}"?

A pessoa continuará cadastrada no QR Core.

Somente este vínculo será removido.\`
      );

    if (!confirmado) {
      return;
    }

    try {
      setExcluindoVinculoId(
        vinculo.id
      );

      const agora =
        Date.now();

      const atualizacoes: Record<
        string,
        unknown
      > = {};

      const chaves =
        new Set<string>([
          vinculo.chaveVinculo,
          vinculo.localId,
          vinculo.localSlug,
        ].filter(Boolean));

      chaves.forEach(
        (chave) => {
          atualizacoes[
            \`usuarios-v2/\${vinculo.pessoaId}/locais/\${chave}\`
          ] = null;

          atualizacoes[
            \`usuarios-v2/\${vinculo.pessoaId}/condominios/\${chave}\`
          ] = null;

          atualizacoes[
            \`vinculos-locais-v2/\${chave}/\${vinculo.pessoaId}\`
          ] = null;
        }
      );

      /*
       * Também limpa representações do vínculo
       * dentro do local quando a chave for UID.
       */
      atualizacoes[
        \`locais-v2/\${vinculo.localId}/usuarios/\${vinculo.pessoaId}\`
      ] = null;

      atualizacoes[
        \`locais-v2/\${vinculo.localId}/responsaveis/\${vinculo.pessoaId}\`
      ] = null;

      atualizacoes[
        \`usuarios-v2/\${vinculo.pessoaId}/atualizadoEm\`
      ] = agora;

      await update(
        ref(db),
        atualizacoes
      );

      if (
        vinculoEditando?.id ===
        vinculo.id
      ) {
        setVinculoEditando(
          null
        );
      }
    } catch (erro) {
      console.error(
        "Erro ao excluir vínculo:",
        erro
      );

      alert(
        "Não foi possível excluir o vínculo."
      );
    } finally {
      setExcluindoVinculoId(
        null
      );
    }
  }

`;

  vinculos =
    vinculos.replace(
      marcador,
      funcaoExcluir + marcador
    );
}

salvar(
  arquivoVinculos,
  vinculos
);

/*
==========================================================
2. NOVO VÍNCULO
Reconhece vínculo por:
- ID
- slug
- localId interno
- localSlug interno
==========================================================
*/

let novo =
  ler(arquivoNovo);

const inicio =
  novo.indexOf(
    "  const vinculoExistente ="
  );

const fim =
  novo.indexOf(
    "  const jaExiste =",
    inicio
  );

exigir(
  inicio !== -1 &&
  fim !== -1,
  "Não encontrei o bloco vinculoExistente no NovoVinculoModal."
);

const novoBloco = `  const entradaVinculoExistente =
    useMemo(() => {
      if (
        !pessoaSelecionada ||
        !localSelecionado
      ) {
        return null;
      }

      const procurar = (
        origem:
          Record<
            string,
            VinculoExistente
          > | undefined
      ) => {
        if (!origem) {
          return null;
        }

        const encontrado =
          Object.entries(
            origem
          ).find(
            ([
              chave,
              dados,
            ]) =>
              chave ===
                localSelecionado.id ||
              chave ===
                localSelecionado.slug ||
              dados.localId ===
                localSelecionado.id ||
              (
                Boolean(
                  localSelecionado.slug
                ) &&
                dados.localSlug ===
                  localSelecionado.slug
              )
          );

        if (!encontrado) {
          return null;
        }

        return {
          chave:
            encontrado[0],

          dados:
            encontrado[1],
        };
      };

      return (
        procurar(
          pessoaSelecionada.locais
        ) ||
        procurar(
          pessoaSelecionada.condominios
        )
      );
    }, [
      pessoaSelecionada,
      localSelecionado,
    ]);

  const vinculoExistente =
    entradaVinculoExistente
      ?.dados ||
    null;

  const chaveVinculoExistente =
    entradaVinculoExistente
      ?.chave ||
    "";

`;

novo =
  novo.slice(0, inicio) +
  novoBloco +
  novo.slice(fim);

/*
O carregamento antigo fazia GET somente por localId.
Agora, quando existe vínculo legado, usa a chave real.
*/
novo = novo.replace(
  "`usuarios-v2/${pessoaId}/locais/${localId}`",
  "`usuarios-v2/${pessoaId}/locais/${chaveVinculoExistente || localId}`"
);

novo = novo.replace(
  "`usuarios-v2/${pessoaId}/condominios/${localId}`",
  "`usuarios-v2/${pessoaId}/condominios/${chaveVinculoExistente || localId}`"
);

/*
Na hora de salvar um vínculo existente legado,
remove a chave velha depois de gravar a oficial.
*/
const trechoUpdate =
`      await update(
        ref(db),
        {`;

if (
  novo.includes(trechoUpdate) &&
  !novo.includes("limpezaChaveAntiga")
) {
  novo = novo.replace(
    trechoUpdate,
`      const limpezaChaveAntiga =
        jaExiste &&
        chaveVinculoExistente &&
        chaveVinculoExistente !==
          localSelecionado.id
          ? {
              [\`usuarios-v2/\${pessoaSelecionada.id}/locais/\${chaveVinculoExistente}\`]:
                null,

              [\`usuarios-v2/\${pessoaSelecionada.id}/condominios/\${chaveVinculoExistente}\`]:
                null,
            }
          : {};

      await update(
        ref(db),
        {
          ...limpezaChaveAntiga,`
  );
}

salvar(
  arquivoNovo,
  novo
);

/*
==========================================================
3. PAINEL PESSOAS
Lixeira para limpar usuários fictícios.
==========================================================
*/

let pessoas =
  ler(arquivoPessoas);

/*
Adiciona update ao import Firebase.
*/
pessoas = pessoas.replace(
`import {
  onValue,
  ref,
} from "firebase/database";`,
`import {
  onValue,
  ref,
  update,
} from "firebase/database";`
);

/*
Estado da exclusão.
*/
if (
  !pessoas.includes(
    "excluindoPessoaId"
  )
) {
  const marcador =
`  const [
    pessoaSelecionada,
    setPessoaSelecionada,
  ] = useState<
    PessoaUniversal | null
  >(
    null
  );`;

  exigir(
    pessoas.includes(
      marcador
    ),
    "Não encontrei pessoaSelecionada no PainelPessoas."
  );

  pessoas =
    pessoas.replace(
      marcador,
marcador + `

  const [
    excluindoPessoaId,
    setExcluindoPessoaId,
  ] = useState<
    string | null
  >(
    null
  );`
    );
}

/*
Função excluir pessoa.
Remove cadastro do Realtime Database e seus vínculos.
Não mexe no Firebase Authentication.
*/
if (
  !pessoas.includes(
    "async function excluirPessoa("
  )
) {
  const marcador =
    "  return (\n";

  const posicao =
    pessoas.indexOf(
      marcador,
      pessoas.indexOf(
        "export default function PainelPessoas"
      )
    );

  exigir(
    posicao !== -1,
    "Não encontrei o return principal do PainelPessoas."
  );

  const funcao = `  async function excluirPessoa(
    pessoa: PessoaUniversal
  ) {
    if (excluindoPessoaId) {
      return;
    }

    const confirmado =
      window.confirm(
        \`Excluir a pessoa "\${pessoa.nome || pessoa.email || pessoa.id}"?

Isso removerá o cadastro dela do Realtime Database e todos os vínculos encontrados.

Use somente para cadastros fictícios/testes.

A conta do Firebase Authentication NÃO será apagada por esta ação.\`
      );

    if (!confirmado) {
      return;
    }

    try {
      setExcluindoPessoaId(
        pessoa.id
      );

      const atualizacoes: Record<
        string,
        unknown
      > = {};

      const todasEntradas = [
        ...Object.entries(
          pessoa.locais || {}
        ),
        ...Object.entries(
          pessoa.condominios || {}
        ),
      ];

      todasEntradas.forEach(
        ([
          chave,
          dados,
        ]) => {
          const localId =
            dados.localId ||
            chave;

          const chaves =
            new Set<string>([
              chave,
              localId,
              dados.localSlug || "",
            ].filter(Boolean));

          chaves.forEach(
            (chaveLocal) => {
              atualizacoes[
                \`vinculos-locais-v2/\${chaveLocal}/\${pessoa.id}\`
              ] = null;
            }
          );

          atualizacoes[
            \`locais-v2/\${localId}/usuarios/\${pessoa.id}\`
          ] = null;

          atualizacoes[
            \`locais-v2/\${localId}/responsaveis/\${pessoa.id}\`
          ] = null;
        }
      );

      atualizacoes[
        \`usuarios-v2/\${pessoa.id}\`
      ] = null;

      await update(
        ref(db),
        atualizacoes
      );

      if (
        pessoaSelecionada?.id ===
        pessoa.id
      ) {
        setPessoaSelecionada(
          null
        );
      }
    } catch (erro) {
      console.error(
        "Erro ao excluir pessoa:",
        erro
      );

      alert(
        "Não foi possível excluir a pessoa."
      );
    } finally {
      setExcluindoPessoaId(
        null
      );
    }
  }

`;

  pessoas =
    pessoas.slice(
      0,
      posicao
    ) +
    funcao +
    pessoas.slice(
      posicao
    );
}

/*
Coloca lixeira ao lado do status no card.
*/
if (
  !pessoas.includes(
    'title="Excluir pessoa de teste"'
  )
) {
  const antigo =
`                      <span
                        className={\`rounded-full px-3 py-1 text-[10px] font-black \${
                          ativo
                            ? "bg-green-950 text-green-300"
                            : "bg-red-950 text-red-300"
                        }\`}
                      >
                        {ativo
                          ? "🟢 ATIVO"
                          : "🔴 INATIVO"}
                      </span>`;

  exigir(
    pessoas.includes(
      antigo
    ),
    "Não encontrei o badge ATIVO do card de Pessoas."
  );

  const novoBadge =
`                      <div className="flex items-center gap-2">
                        <span
                          className={\`rounded-full px-3 py-1 text-[10px] font-black \${
                            ativo
                              ? "bg-green-950 text-green-300"
                              : "bg-red-950 text-red-300"
                          }\`}
                        >
                          {ativo
                            ? "🟢 ATIVO"
                            : "🔴 INATIVO"}
                        </span>

                        <button
                          type="button"
                          title="Excluir pessoa de teste"
                          onClick={() =>
                            void excluirPessoa(
                              pessoa
                            )
                          }
                          disabled={
                            excluindoPessoaId ===
                            pessoa.id
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-900 bg-red-950/30 text-sm transition hover:bg-red-900 disabled:opacity-40"
                        >
                          {excluindoPessoaId ===
                          pessoa.id
                            ? "…"
                            : "🗑"}
                        </button>
                      </div>`;

  pessoas =
    pessoas.replace(
      antigo,
      novoBadge
    );
}

salvar(
  arquivoPessoas,
  pessoas
);

console.log("");
console.log("============================================");
console.log("CORREÇÕES APLICADAS");
console.log("============================================");
console.log("OK - vínculo antigo reconhecido por ID/slug");
console.log("OK - exclusão de vínculo usando chave real");
console.log("OK - lixeira adicionada aos cards de Pessoas");
console.log("============================================");
