"use client";

type UnidadeCadastrada = {
  id: string;
  codigo: string;
  localId: string;
  localNome: string;
  tipoLocal: string;
  tipo: string;
  bloco: string;
  nome: string;
  modoChamado?: string;
  status: string;
};

type Props = {
  unidade: UnidadeCadastrada;
  onClose: () => void;
};

export default function NovoMoradorModal({
  unidade,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-xl">
        <h2 className="text-2xl font-black text-white mb-2">
          ➕ Novo morador
        </h2>

        <p className="text-slate-400 mb-6">
          Cadastro para {unidade.bloco ? `${unidade.bloco} / ${unidade.nome}` : unidade.nome}
        </p>

        <button
          onClick={onClose}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-3 rounded-xl"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}