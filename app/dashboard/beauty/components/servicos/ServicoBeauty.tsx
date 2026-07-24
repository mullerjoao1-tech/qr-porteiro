"use client";

import { useEffect, useMemo, useState } from "react";
import ServicoCard from "./ServicoCard";
import ServicoDetalhesModal from "./ServicoDetalhesModal";
import ServicoFiltros from "./ServicoFiltros";
import {
  alterarStatusServico,
  criarServico,
  observarServicos,
} from "./ServicoFirebase";
import ServicoIndicadores from "./ServicoIndicadores";
import ServicoNovoModal from "./ServicoNovoModal";
import type {
  FiltroStatusServico,
  NovoServicoBeauty,
  ServicoBeauty as ServicoBeautyType,
} from "./ServicoTypes";

export default function ServicoBeauty() {
  const [servicos,setServicos]=useState<ServicoBeautyType[]>([]);
  const [busca,setBusca]=useState("");
  const [filtroStatus,setFiltroStatus]=useState<FiltroStatusServico>("todos");
  const [carregando,setCarregando]=useState(true);
  const [erro,setErro]=useState("");
  const [novoAberto,setNovoAberto]=useState(false);
  const [selecionado,setSelecionado]=useState<ServicoBeautyType|null>(null);

  useEffect(()=>{
    return observarServicos(
      s=>{setServicos(s);setCarregando(false);setErro("");},
      e=>{setErro(e.message);setCarregando(false);}
    );
  },[]);

  const filtrados=useMemo(()=>{
    const t=busca.trim().toLowerCase();
    return servicos.filter(s=>{
      const okStatus=filtroStatus==="todos"||s.status===filtroStatus;
      const okBusca=!t||s.nome.toLowerCase().includes(t)||s.categoria.toLowerCase().includes(t);
      return okStatus&&okBusca;
    });
  },[servicos,busca,filtroStatus]);

  async function salvar(d:NovoServicoBeauty){await criarServico(d);}
  async function mudar(id:string,status:"ativo"|"inativo"){await alterarStatusServico(id,status);}

  const ativos=servicos.filter(s=>s.status==="ativo").length;
  const inativos=servicos.filter(s=>s.status==="inativo").length;
  const categorias=new Set(servicos.map(s=>s.categoria)).size;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-pink-300">QR Beauty</p>
        <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">Serviços</h1>
        <p className="mt-2 text-sm text-slate-400">Gerencie serviços, valores e duração.</p>
      </div>

      <ServicoIndicadores total={servicos.length} ativos={ativos} inativos={inativos} categorias={categorias}/>

      <ServicoFiltros
        busca={busca}
        filtroStatus={filtroStatus}
        onBuscaChange={setBusca}
        onFiltroChange={setFiltroStatus}
        onNovoServico={()=>setNovoAberto(true)}
      />

      {carregando&&<div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">Carregando serviços...</div>}
      {erro&&<div className="rounded-2xl border border-red-800 bg-red-950/30 p-4 text-red-300">{erro}</div>}

      {!carregando&&filtrados.length===0&&(
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
          <p className="text-lg font-black text-white">Nenhum serviço encontrado</p>
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtrados.map(s=>(
          <ServicoCard key={s.id} servico={s} onAbrir={setSelecionado}/>
        ))}
      </section>

      {novoAberto&&<ServicoNovoModal fechar={()=>setNovoAberto(false)} salvar={salvar}/>}
      {selecionado&&<ServicoDetalhesModal servico={selecionado} fechar={()=>setSelecionado(null)} alterarStatus={mudar}/>}
    </div>
  );
}
