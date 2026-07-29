"use client";

import type { TipoLocal } from "./PassoTipoLocal";

type Props = {
  tipoLocal: TipoLocal;

  localNome: string;
  localSlug: string;
  cidade: string;
  estado: string;
  endereco: string;

  responsavelNome: string;
  responsavelEmail: string;
  responsavelTelefone: string;
};

function obterNomeTipo(
  tipoLocal: TipoLocal
): string {
  const nomes: Record<
    TipoLocal,
    string
  > = {
    condominio: "Condomínio",
    beauty: "Beauty",
    barbearia: "Barbearia",
    clinica: "Clínica",
    empresa: "Empresa",
    residencia: "Residência",
    restaurante: "Restaurante",
    outro: "Outro",
  };

  return nomes[tipoLocal];
}

export default function PassoResumo({
  tipoLocal,
  localNome,
  localSlug,
  cidade,
  estado,
  endereco,
  responsavelNome,
  responsavelEmail,
  responsavelTelefone,
}: Props) {
  return (
    <section>
      <p className="text-xs font-black uppercase tracking-wider text-green-400">
        Resumo
      </p>

      <h2 className="mt-1 text-2xl font-black text-white">
        Revise antes de implantar
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Confira os dados abaixo. Ao confirmar,
        o QR Core criará o local, o login, o
        usuário, o vínculo e as permissões
        iniciais.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p className="text-xs font-black uppercase tracking-wider text-cyan-400">
            Local
          </p>

          <h3 className="mt-2 text-xl font-black text-white">
            🏢 {localNome}
          </h3>

          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>
              <strong>Tipo:</strong>{" "}
              {obterNomeTipo(tipoLocal)}
            </p>

            <p>
              <strong>Slug:</strong>{" "}
              {localSlug}
            </p>

            <p>
              <strong>Cidade:</strong>{" "}
              {cidade || "Não informada"}
            </p>

            <p>
              <strong>Estado:</strong>{" "}
              {estado || "Não informado"}
            </p>

            <p>
              <strong>Endereço:</strong>{" "}
              {endereco || "Não informado"}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p className="text-xs font-black uppercase tracking-wider text-violet-400">
            Responsável
          </p>

          <h3 className="mt-2 text-xl font-black text-white">
            👤 {responsavelNome}
          </h3>

          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>
              <strong>E-mail:</strong>{" "}
              {responsavelEmail}
            </p>

            <p>
              <strong>Telefone:</strong>{" "}
              {responsavelTelefone ||
                "Não informado"}
            </p>

            <p>
              <strong>Perfil inicial:</strong>{" "}
              Síndico
            </p>

            <p>
              <strong>Primeiro acesso:</strong>{" "}
              Troca de senha obrigatória
            </p>
          </div>
        </article>
      </div>

      <div className="mt-5 rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
        <p className="font-black text-green-300">
          Automação que será executada
        </p>

        <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          <p>✅ Criar registro em locais-v2</p>
          <p>✅ Criar Firebase Authentication</p>
          <p>✅ Criar usuário em usuarios-v2</p>
          <p>✅ Criar vínculo universal</p>
          <p>✅ Manter vínculo compatível</p>
          <p>✅ Aplicar permissões iniciais</p>
          <p>✅ Registrar o responsável</p>
          <p>✅ Registrar o histórico</p>
        </div>
      </div>
    </section>
  );
}