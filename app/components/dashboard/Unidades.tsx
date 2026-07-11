"use client";

type LocalCadastrado = {
  id: string;
  nome: string;
  tipo: string;
};

type UnidadeCadastrada = {
  id: string;
  codigo: string;
  localId: string;
  localNome: string;
  tipo: string;
  bloco: string;
  nome: string;
  modoChamado?: string;
};

type Props = {
  locais: LocalCadastrado[];
  unidades: UnidadeCadastrada[];
  localSelecionadoId: string;
  setLocalSelecionadoId: (valor: string) => void;
  blocoUnidade: string;
  setBlocoUnidade: (valor: string) => void;
  nomeUnidade: string;
  setNomeUnidade: (valor: string) => void;
  tipoUnidade: string;
  setTipoUnidade: (valor: string) => void;
  modoChamadoUnidade: string;
  setModoChamadoUnidade: (valor: string) => void;
  modoCondominio: boolean;
  cadastrarUnidade: () => void;
  salvandoUnidade: boolean;
};

export default function Unidades({
  locais,
  unidades,
  localSelecionadoId,
  setLocalSelecionadoId,
  blocoUnidade,
  setBlocoUnidade,
  nomeUnidade,
  setNomeUnidade,
  tipoUnidade,
  setTipoUnidade,
  modoChamadoUnidade,
  setModoChamadoUnidade,
  modoCondominio,
  cadastrarUnidade,
  salvandoUnidade,
}: Props) {
  function textoModoChamado(modo?: string) {
    if (modo === "prioridade") return "Modo Prioridade";
    return "Modo Família";
  }

  return (
    <div>
      <h2 className="text-3xl font-black text-blue-300 mb-2">Unidades</h2>

      <p className="text-slate-400 mb-8">
        Cadastre apartamentos, casas, salas, lojas, quartos ou chalés.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h3 className="text-2xl font-bold mb-5">Cadastrar unidade</h3>

          <div className="space-y-4">
            <select
              value={localSelecionadoId}
              onChange={(e) => setLocalSelecionadoId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            >
              <option value="">Selecione o local</option>

              {locais.map((local) => (
                <option key={local.id} value={local.id}>
                  {local.nome}
                </option>
              ))}
            </select>

            {modoCondominio && (
              <input
                value={blocoUnidade}
                onChange={(e) => setBlocoUnidade(e.target.value)}
                placeholder="Bloco ou torre. Ex: Bloco A"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
              />
            )}

            <input
              value={nomeUnidade}
              onChange={(e) => setNomeUnidade(e.target.value)}
              placeholder={
                modoCondominio
                  ? "Número da unidade. Ex: 101"
                  : "Nome livre"
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            />

            <select
              value={tipoUnidade}
              onChange={(e) => setTipoUnidade(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            >
              {modoCondominio ? (
                <>
                  <option value="apartamento">Apartamento</option>
                  <option value="sala">Sala</option>
                  <option value="loja">Loja</option>
                </>
              ) : (
                <>
                  <option value="livre">Livre</option>
                  <option value="casa">Casa</option>
                  <option value="quarto">Quarto</option>
                  <option value="chale">Chalé</option>
                </>
              )}
            </select>

            <select
              value={modoChamadoUnidade}
              onChange={(e) => setModoChamadoUnidade(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            >
              <option value="familia">Modo Família — todos juntos</option>
              <option value="prioridade">Modo Prioridade — em fila</option>
            </select>

            <button
              onClick={cadastrarUnidade}
              disabled={salvandoUnidade}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-black py-3 rounded-xl"
            >
              {salvandoUnidade ? "Salvando..." : "Cadastrar unidade"}
            </button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h3 className="text-2xl font-bold mb-5">Unidades cadastradas</h3>

          <div className="space-y-3">
            {unidades.map((unidade) => (
              <div
                key={unidade.id}
                className="bg-slate-800 rounded-xl p-4 border border-slate-700"
              >
                <p className="text-xs text-blue-300 font-bold">
                  {unidade.codigo}
                </p>

                <h4 className="text-lg font-black">
                  {unidade.bloco
                    ? `${unidade.bloco} / ${unidade.nome}`
                    : unidade.nome}
                </h4>

                <p className="text-sm text-slate-400">
                  {unidade.localNome} • {unidade.tipo}
                </p>

                <p className="text-xs text-green-300 mt-2 font-bold">
                  {textoModoChamado(unidade.modoChamado)}
                </p>
              </div>
            ))}

            {unidades.length === 0 && (
              <div className="bg-slate-800 rounded-xl p-4 text-slate-400">
                Nenhuma unidade cadastrada ainda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}