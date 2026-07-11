"use client";

type Unidade = {
  id: string;
  codigo: string;
  localNome: string;
  bloco: string;
  nome: string;
  modoChamado?: string;
};

type Morador = {
  id: string;
  codigo: string;
  nome: string;
  telefone: string;
  unidadeId: string;
  unidadeNome: string;
  prioridade: number;
  podeAbrirPortao: boolean;
  status: string;
};

type Props = {
  unidades: Unidade[];
  moradores: Morador[];
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
  function nomeUnidade(unidade: Unidade) {
    return unidade.bloco
      ? `${unidade.localNome} • ${unidade.bloco}/${unidade.nome}`
      : `${unidade.localNome} • ${unidade.nome}`;
  }

  return (
    <div>
      <h2 className="text-3xl font-black text-blue-300 mb-2">Moradores</h2>

      <p className="text-slate-400 mb-8">
        Cadastre moradores, prioridades e permissões por unidade.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h3 className="text-2xl font-bold mb-5">Cadastro de morador</h3>

          <div className="space-y-4">
            <select
              value={unidadeMoradorId}
              onChange={(e) => setUnidadeMoradorId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            >
              <option value="">Selecione a unidade</option>

              {unidades.map((unidade) => (
                <option key={unidade.id} value={unidade.id}>
                  {nomeUnidade(unidade)}
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

            <label className="flex gap-3 items-center bg-slate-800 rounded-xl p-3">
              <input
                type="checkbox"
                checked={podeAbrirPortao}
                onChange={(e) => setPodeAbrirPortao(e.target.checked)}
              />
              <span>Pode abrir portão remotamente</span>
            </label>

            <div className="bg-slate-800 rounded-xl p-3 text-sm text-slate-400">
              O modo de chamada agora é configurado na unidade: Família ou
              Prioridade.
            </div>

            <button
              onClick={cadastrarMorador}
              disabled={salvandoMorador}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 py-3 rounded-xl font-black"
            >
              {salvandoMorador ? "Salvando..." : "Cadastrar morador"}
            </button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h3 className="text-2xl font-bold mb-5">Moradores cadastrados</h3>

          <div className="space-y-3">
            {moradores.map((morador) => (
              <div
                key={morador.id}
                className="bg-slate-800 rounded-xl p-4 border border-slate-700"
              >
                <p className="text-xs text-blue-300 font-bold">
                  {morador.codigo}
                </p>

                <h4 className="text-lg font-black">{morador.nome}</h4>

                <p className="text-sm text-slate-400">
                  {morador.unidadeNome} • Prioridade {morador.prioridade}
                </p>

                <p className="text-xs mt-2 font-bold text-green-300">
                  {morador.podeAbrirPortao
                    ? "Pode abrir portão"
                    : "Sem permissão de portão"}
                </p>
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