"use client";

type UnidadeCadastrada = {
  id: string;
  codigo: string;
  localId: string;
  localNome: string;
  tipoLocal: string;
  bloco: string;
  nome: string;
  tipo: string;
  modoChamado?: string;
  status: string;
  possuiResponsavel?: boolean;
  responsavelAdministrativo?: any;
  criadoEm: string;
  atualizadoEm?: string;
};

type MoradorCadastrado = {
  id: string;
  codigo: string;
  nome: string;
  telefone: string;
  unidadeId: string;
  unidadeNome: string;
  prioridade: number;
  podeAbrirPortao: boolean;
  status: string;
  criadoEm: string;
};

type Props = {
  unidades: UnidadeCadastrada[];
  moradores: MoradorCadastrado[];

  unidadeMoradorId: string;
  setUnidadeMoradorId: (valor: string) => void;

  nomeMorador: string;
  setNomeMorador: (valor: string) => void;

  telefoneMorador: string;
  setTelefoneMorador: (valor: string) => void;

  prioridadeMorador: string;
  setPrioridadeMorador: (valor: string) => void;

  podeAbrirPortao: boolean;
  setPodeAbrirPortao: (valor: boolean) => void;

  cadastrarMorador: () => void;
  salvandoMorador: boolean;
};

export default function Moradores({
  unidades,
  moradores,
  unidadeMoradorId,
  setUnidadeMoradorId,
  nomeMorador,
  setNomeMorador,
  telefoneMorador,
  setTelefoneMorador,
  prioridadeMorador,
  setPrioridadeMorador,
  podeAbrirPortao,
  setPodeAbrirPortao,
  cadastrarMorador,
  salvandoMorador,
}: Props) {
  function nomeCompletoUnidade(unidade: UnidadeCadastrada) {
    return unidade.bloco ? `${unidade.bloco} / ${unidade.nome}` : unidade.nome;
  }

  return (
    <div>
      <h2 className="text-3xl font-black text-blue-300 mb-2">Moradores</h2>

      <p className="text-slate-400 mb-8">
        Cadastre moradores e vincule cada pessoa a uma unidade.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h3 className="text-2xl font-bold mb-5">Cadastrar morador</h3>

          <div className="space-y-4">
            <select
              value={unidadeMoradorId}
              onChange={(e) => setUnidadeMoradorId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            >
              <option value="">Selecione a unidade</option>

              {unidades.map((unidade) => (
                <option key={unidade.id} value={unidade.id}>
                  {unidade.localNome} • {nomeCompletoUnidade(unidade)}
                </option>
              ))}
            </select>

            <input
              value={nomeMorador}
              onChange={(e) => setNomeMorador(e.target.value)}
              placeholder="Nome do morador"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            />

            <input
              value={telefoneMorador}
              onChange={(e) => setTelefoneMorador(e.target.value)}
              placeholder="Telefone / WhatsApp"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            />

            <select
              value={prioridadeMorador}
              onChange={(e) => setPrioridadeMorador(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            >
              <option value="1">Prioridade 1</option>
              <option value="2">Prioridade 2</option>
              <option value="3">Prioridade 3</option>
              <option value="4">Prioridade 4</option>
              <option value="5">Prioridade 5</option>
            </select>

            <label className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={podeAbrirPortao}
                onChange={(e) => setPodeAbrirPortao(e.target.checked)}
              />

              <span className="font-bold">Pode abrir portão</span>
            </label>

            <button
              onClick={cadastrarMorador}
              disabled={salvandoMorador}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-black py-3 rounded-xl"
            >
              {salvandoMorador ? "Salvando..." : "Cadastrar morador"}
            </button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h3 className="text-2xl font-bold mb-5">Moradores cadastrados</h3>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {moradores.map((morador) => (
              <div
                key={morador.id}
                className="bg-slate-800 rounded-xl p-4 border border-slate-700"
              >
                <p className="text-xs text-blue-300 font-bold">
                  {morador.codigo}
                </p>

                <h4 className="text-lg font-black">{morador.nome}</h4>

                <p className="text-sm text-slate-400 mt-1">
                  📱 {morador.telefone}
                </p>

                <p className="text-sm text-slate-400">
                  {morador.unidadeNome}
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-blue-300 font-bold">
                    Prioridade {morador.prioridade}
                  </span>

                  <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-green-300 font-bold">
                    {morador.status === "ativo" ? "🟢 Ativo" : "🔴 Inativo"}
                  </span>

                  {morador.podeAbrirPortao && (
                    <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-yellow-300 font-bold">
                      🚪 Abre portão
                    </span>
                  )}
                </div>
              </div>
            ))}

            {moradores.length === 0 && (
              <div className="bg-slate-800 rounded-xl p-4 text-slate-400">
                Nenhum morador cadastrado ainda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
