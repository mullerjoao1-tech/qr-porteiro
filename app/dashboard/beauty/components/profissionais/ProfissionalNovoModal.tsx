"use client";

import { useState } from "react";
import type { NovoProfissionalBeauty } from "./ProfissionalTypes";

interface Props {
  fechar: () => void;
  salvar: (dados: NovoProfissionalBeauty) => Promise<void>;
}

export default function ProfissionalNovoModal({
  fechar,
  salvar,
}: Props) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [especialidades, setEspecialidades] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar() {
    try {
      setErro("");
      setSalvando(true);

      await salvar({
        nome,
        telefone,
        email,
        especialidades: especialidades
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean),
        status: "ativo",
      });

      fechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 p-6">
        <h2 className="text-2xl font-black text-white">Novo profissional</h2>

        <div className="mt-5 space-y-3">
          <input className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" placeholder="Nome" value={nome} onChange={e=>setNome(e.target.value)} />
          <input className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" placeholder="Telefone" value={telefone} onChange={e=>setTelefone(e.target.value)} />
          <input className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" placeholder="Especialidades (separadas por vírgula)" value={especialidades} onChange={e=>setEspecialidades(e.target.value)} />
        </div>

        {erro && <p className="mt-4 text-red-400 font-bold">{erro}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={fechar} className="rounded-xl border border-slate-700 px-5 py-3 text-white">Cancelar</button>
          <button disabled={salvando} onClick={enviar} className="rounded-xl bg-pink-600 px-5 py-3 font-bold text-white">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
