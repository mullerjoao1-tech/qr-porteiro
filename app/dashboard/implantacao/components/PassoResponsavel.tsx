"use client";

type Props = {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  senha: string;
  mostrarSenha: boolean;

  onNomeChange: (
    valor: string
  ) => void;

  onEmailChange: (
    valor: string
  ) => void;

  onTelefoneChange: (
    valor: string
  ) => void;

  onCpfChange: (
    valor: string
  ) => void;

  onSenhaChange: (
    valor: string
  ) => void;

  onMostrarSenhaChange: (
    valor: boolean
  ) => void;
};

function formatarCpf(
  valor:
    string
): string {
  const numeros =
    valor
      .replace(
        /\D/g,
        ""
      )
      .slice(
        0,
        11
      );

  return numeros
    .replace(
      /^(\d{3})(\d)/,
      "$1.$2"
    )
    .replace(
      /^(\d{3})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(
      /^(\d{3})\.(\d{3})\.(\d{3})(\d)/,
      "$1.$2.$3-$4"
    );
}

export default function PassoResponsavel({
  nome,
  email,
  telefone,
  cpf,
  senha,
  mostrarSenha,
  onNomeChange,
  onEmailChange,
  onTelefoneChange,
  onCpfChange,
  onSenhaChange,
  onMostrarSenhaChange,
}: Props) {
  return (
    <section>
      <p className="text-xs font-black uppercase tracking-wider text-green-400">
        Responsável
      </p>

      <h2 className="mt-1 text-2xl font-black text-white">
        Criar o primeiro acesso
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Informe os dados da pessoa responsável
        pelo local. Nesta primeira versão, o
        perfil inicial será de síndico.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="responsavel-nome"
            className="mb-2 block text-sm font-bold text-slate-200"
          >
            Nome completo
          </label>

          <input
            id="responsavel-nome"
            type="text"
            value={nome}
            onChange={(evento) =>
              onNomeChange(
                evento.target.value
              )
            }
            placeholder="Nome do responsável"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="responsavel-cpf"
            className="mb-2 block text-sm font-bold text-slate-200"
          >
            CPF
          </label>

          <input
            id="responsavel-cpf"
            type="text"
            value={cpf}
            onChange={(evento) =>
              onCpfChange(
                formatarCpf(
                  evento.target.value
                )
              )
            }
            inputMode="numeric"
            autoComplete="off"
            maxLength={14}
            placeholder="000.000.000-00"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-green-500"
          />

          <p className="mt-2 text-xs text-slate-500">
            O CPF será usado para localizar uma
            pessoa já existente e evitar cadastros
            duplicados.
          </p>
        </div>

        <div>
          <label
            htmlFor="responsavel-email"
            className="mb-2 block text-sm font-bold text-slate-200"
          >
            E-mail de acesso
          </label>

          <input
            id="responsavel-email"
            type="email"
            value={email}
            onChange={(evento) =>
              onEmailChange(
                evento.target.value
              )
            }
            inputMode="email"
            autoComplete="off"
            placeholder="responsavel@exemplo.com"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="responsavel-telefone"
            className="mb-2 block text-sm font-bold text-slate-200"
          >
            Telefone
            <span className="ml-2 text-xs font-normal text-slate-500">
              opcional
            </span>
          </label>

          <input
            id="responsavel-telefone"
            type="tel"
            value={telefone}
            onChange={(evento) =>
              onTelefoneChange(
                evento.target.value
              )
            }
            inputMode="tel"
            placeholder="(41) 99999-9999"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="responsavel-senha"
            className="mb-2 block text-sm font-bold text-slate-200"
          >
            Senha provisória
          </label>

          <div className="relative">
            <input
              id="responsavel-senha"
              type={
                mostrarSenha
                  ? "text"
                  : "password"
              }
              value={senha}
              onChange={(evento) =>
                onSenhaChange(
                  evento.target.value
                )
              }
              autoComplete="new-password"
              placeholder="Mínimo de 6 caracteres"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 pr-24 text-white outline-none transition placeholder:text-slate-600 focus:border-green-500"
            />

            <button
              type="button"
              onClick={() =>
                onMostrarSenhaChange(
                  !mostrarSenha
                )
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-green-400"
            >
              {mostrarSenha
                ? "Ocultar"
                : "Mostrar"}
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            O usuário será marcado para trocar
            essa senha no primeiro acesso.
          </p>
        </div>
      </div>
    </section>
  );
}
