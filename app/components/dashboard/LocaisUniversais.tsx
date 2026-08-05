"use client";

import { useEffect, useMemo, useState } from "react";
import { get, onValue, ref, update } from "firebase/database";
import {
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { db } from "../../services/firebase";

type TipoLocalUniversal =
  | "condominio"
  | "beauty"
  | "barbearia"
  | "clinica"
  | "empresa"
  | "residencia"
  | "restaurante"
  | "outro";

type LocalUniversal = {
  id: string;
  nome: string;
  slug: string;
  tipoLocal: TipoLocalUniversal;
  status?: string;

  documento?: {
    tipo?: "cpf" | "cnpj";
    numero?: string;
  };

  cpf?: string | null;
  cnpj?: string | null;

bairro?: string;

cep?: string;

numero?: string;

complemento?: string;
  ativo?: boolean;
  cidade?: string;
  estado?: string;
  endereco?: string;
  criadoEm?: number | string;
  responsaveis?: Record<string, {
    uid?: string;
    nome?: string;
    email?: string;
    telefone?: string;
    cpf?: string;
    perfil?: string;
    ativo?: boolean;
    atualizadoEm?: number;
  }>;
  implantacao?: {
    status?: string;
    tipoImplantacao?: string;
    implantadoEm?: number | string;
  };
};

type FormularioEdicaoLocal = {
  nome: string;
  status: string;
  tipoDocumento: "cpf" | "cnpj";
  numeroDocumento: string;
  bairro: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  cidade: string;
  estado: string;
};

type ResponsavelLocal = {
  id: string;
  uid?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  perfil?: string;
  ativo?: boolean;
  atualizadoEm?: number;
};

type FormularioEdicaoResponsavel = {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  perfil: string;
  status: "ativo" | "inativo";
};

function iconeTipo(tipo: TipoLocalUniversal) {
  const icones: Record<TipoLocalUniversal, string> = {
    condominio: "🏢",
    beauty: "💇",
    barbearia: "💈",
    clinica: "🏥",
    empresa: "🏭",
    residencia: "🏠",
    restaurante: "🍽️",
    outro: "📍",
  };

  return icones[tipo] || "📍";
}

function nomeTipo(tipo: TipoLocalUniversal) {
  const nomes: Record<TipoLocalUniversal, string> = {
    condominio: "Condomínio",
    beauty: "Beauty",
    barbearia: "Barbearia",
    clinica: "Clínica",
    empresa: "Empresa",
    residencia: "Residência",
    restaurante: "Restaurante",
    outro: "Outro",
  };

  return nomes[tipo] || tipo;
}

function somenteNumeros(
  valor: string
): string {
  return valor.replace(/\D/g, "");
}

function formatarCpf(
  valor: string
): string {
  const numeros =
    somenteNumeros(valor).slice(0, 11);

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
      /\.(\d{3})(\d)/,
      ".$1-$2"
    );
}

function formatarCnpj(
  valor: string
): string {
  const numeros =
    somenteNumeros(valor).slice(0, 14);

  return numeros
    .replace(
      /^(\d{2})(\d)/,
      "$1.$2"
    )
    .replace(
      /^(\d{2})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(
      /\.(\d{3})(\d)/,
      ".$1/$2"
    )
    .replace(
      /(\d{4})(\d)/,
      "$1-$2"
    );
}

function formatarDocumento(
  tipo: "cpf" | "cnpj",
  valor: string
): string {
  return tipo === "cpf"
    ? formatarCpf(valor)
    : formatarCnpj(valor);
}

function obterDocumentoLocal(
  local: LocalUniversal
): {
  tipo: "cpf" | "cnpj";
  numero: string;
} {
  const tipoDocumento =
    local.documento?.tipo === "cpf"
      ? "cpf"
      : local.documento?.tipo === "cnpj"
      ? "cnpj"
      : local.cpf
      ? "cpf"
      : "cnpj";

  const numeroDocumento =
    local.documento?.numero ||
    local.cpf ||
    local.cnpj ||
    "";

  return {
    tipo: tipoDocumento,
    numero: formatarDocumento(
      tipoDocumento,
      numeroDocumento
    ),
  };
}

function formatarTelefone(
  valor?: string
): string {
  if (!valor) {
    return "Telefone não informado";
  }

  const numeros =
    valor.replace(/\D/g, "");

  if (numeros.length === 11) {
    return numeros.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  if (numeros.length === 10) {
    return numeros.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  return valor;
}

function nomePerfil(
  valor?: string
): string {
  const perfis: Record<
    string,
    string
  > = {
    sindico:
      "Síndico",

    proprietario:
      "Proprietário",

    administrador:
      "Administrador",

    gestor_local:
      "Gestor local",

    gerente:
      "Gerente",

    responsavel:
      "Responsável",
  };

  return perfis[
    valor || ""
  ] || valor || "Responsável";
}

function ambienteAtual(): {
  nome: string;
  classe: string;
  icone: string;
} {
  if (
    typeof window !==
    "undefined"
  ) {
    const hostname =
      window.location.hostname;

    const ambienteLocal =
      hostname ===
        "localhost" ||
      hostname ===
        "127.0.0.1";

    if (
      ambienteLocal
    ) {
      return {
        nome:
          "STUDIO",

        classe:
          "border-amber-500 bg-amber-500/15 text-amber-300",

        icone:
          "🧪",
      };
    }
  }

  return {
    nome:
      "PRODUÇÃO",

    classe:
      "border-green-500 bg-green-500/15 text-green-300",

    icone:
      "🟢",
  };
}

function formatarData(valor?: number | string) {
  if (!valor) return "Data não informada";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return String(valor);
  }

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function obterResponsavelComId(
  local: LocalUniversal
): ResponsavelLocal | null {
  const responsaveis =
    Object.entries(
      local.responsaveis || {}
    ).map(
      ([
        id,
        responsavel,
      ]) => ({
        id,
        ...responsavel,
      })
    );

  return (
    responsaveis.find(
      (responsavel) =>
        responsavel.ativo !== false
    ) ||
    responsaveis[0] ||
    null
  );
}

function obterResponsavel(
  local: LocalUniversal
) {
  return obterResponsavelComId(
    local
  );
}

export default function LocaisUniversais() {
  const [locais, setLocais] = useState<LocalUniversal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [localSelecionado, setLocalSelecionado] =
    useState<LocalUniversal | null>(null);

  const [editandoLocal, setEditandoLocal] =
    useState(false);

  const [salvandoLocal, setSalvandoLocal] =
    useState(false);

  const [
    editandoResponsavel,
    setEditandoResponsavel,
  ] =
    useState(false);

  const [
    salvandoResponsavel,
    setSalvandoResponsavel,
  ] =
    useState(false);

  const [
    responsavelSelecionado,
    setResponsavelSelecionado,
  ] =
    useState<ResponsavelLocal | null>(
      null
    );

  const [
    formularioResponsavel,
    setFormularioResponsavel,
  ] =
    useState<FormularioEdicaoResponsavel>({
      nome: "",
      email: "",
      telefone: "",
      cpf: "",
      perfil: "responsavel",
      status: "ativo",
    });

  const [formularioEdicao, setFormularioEdicao] =
    useState<FormularioEdicaoLocal>({
      nome: "",
      status: "ativo",
      tipoDocumento: "cnpj",
      numeroDocumento: "",
      bairro: "",
      cep: "",
      endereco: "",
      numero: "",
      complemento: "",
      cidade: "",
      estado: "",
    });

const [selecionados, setSelecionados] = useState<string[]>([]);
const [modoSelecao, setModoSelecao] = useState(false);
const [modalExclusaoAberto, setModalExclusaoAberto] =
  useState(false);
const [excluindo, setExcluindo] = useState(false);
  useEffect(() => {
    const locaisRef = ref(db, "locais-v2");

    const desligar = onValue(
      locaisRef,
      (snapshot) => {
        const dados = snapshot.val();

        if (!dados) {
          setLocais([]);
          setCarregando(false);
          return;
        }

        const lista = Object.entries(dados)
          .map(([id, valor]) => ({
            id,
            ...(valor as Omit<LocalUniversal, "id">),
          }))
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

        setLocais(lista);
        setCarregando(false);
      },
      (erro) => {
        console.error("Erro ao carregar locais-v2:", erro);
        setLocais([]);
        setCarregando(false);
      }
    );

    return () => desligar();
  }, []);

  const locaisFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return locais.filter((local) => {
      const passaBusca =
        !termo ||
        [
          local.nome,
          local.slug,
          local.id,
          local.tipoLocal,
          local.cidade,
          local.estado,
          local.endereco,
          local.documento?.numero,
          local.cpf,
          local.cnpj,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(termo);

      const passaTipo =
        filtroTipo === "todos" || local.tipoLocal === filtroTipo;

      return passaBusca && passaTipo;
    });
  }, [locais, busca, filtroTipo]);
const locaisSelecionados = useMemo(
  () =>
    locais.filter((local) =>
      selecionados.includes(local.id)
    ),
  [locais, selecionados]
);
  const totalAtivos = locais.filter(
    (local) => local.ativo !== false && local.status !== "inativo"
  ).length;

  const totalResidencias = locais.filter(
    (local) => local.tipoLocal === "residencia"
  ).length;

  const totalCondominios = locais.filter(
    (local) => local.tipoLocal === "condominio"
  ).length;

  const ambiente =
    ambienteAtual();

function abrirDetalhesLocal(
  local: LocalUniversal
) {
  const documentoLocal =
    obterDocumentoLocal(local);

  setLocalSelecionado(local);

  setFormularioEdicao({
    nome:
      local.nome || "",

    status:
      local.status ||
      (
        local.ativo === false
          ? "inativo"
          : "ativo"
      ),

    tipoDocumento:
      local.tipoLocal === "residencia"
        ? documentoLocal.tipo
        : "cnpj",

    numeroDocumento:
      formatarDocumento(
        local.tipoLocal === "residencia"
          ? documentoLocal.tipo
          : "cnpj",
        documentoLocal.numero
      ),

    bairro:
      local.bairro || "",

    cep:
      local.cep || "",

    endereco:
      local.endereco || "",

    numero:
      local.numero || "",

    complemento:
      local.complemento || "",

    cidade:
      local.cidade || "",

    estado:
      local.estado || "",
  });

  const responsavel =
    obterResponsavelComId(local);

  setResponsavelSelecionado(
    responsavel
  );

  setFormularioResponsavel({
    nome:
      responsavel?.nome || "",

    email:
      responsavel?.email || "",

    telefone:
      responsavel?.telefone || "",

    cpf:
      formatarCpf(
        responsavel?.cpf || ""
      ),

    perfil:
      responsavel?.perfil ||
      (
        local.tipoLocal ===
          "condominio"
          ? "sindico"
          : "responsavel"
      ),

    status:
      responsavel?.ativo === false
        ? "inativo"
        : "ativo",
  });

  setEditandoLocal(false);
  setEditandoResponsavel(false);
}

function fecharDetalhesLocal() {
  if (
    salvandoLocal ||
    salvandoResponsavel
  ) {
    return;
  }

  setEditandoLocal(false);
  setEditandoResponsavel(false);
  setResponsavelSelecionado(null);
  setLocalSelecionado(null);
}

function alterarCampoEdicao(
  campo: keyof FormularioEdicaoLocal,
  valor: string
) {
  setFormularioEdicao(
    (
      atual
    ) => ({
      ...atual,
      [campo]:
        valor,
    })
  );
}

function cancelarEdicaoLocal() {
  if (
    !localSelecionado ||
    salvandoLocal
  ) {
    return;
  }

  setFormularioEdicao({
    nome:
      localSelecionado.nome || "",

    status:
      localSelecionado.status ||
      (
        localSelecionado.ativo === false
          ? "inativo"
          : "ativo"
      ),

    tipoDocumento:
      localSelecionado.tipoLocal === "residencia"
        ? obterDocumentoLocal(
            localSelecionado
          ).tipo
        : "cnpj",

    numeroDocumento:
      formatarDocumento(
        localSelecionado.tipoLocal === "residencia"
          ? obterDocumentoLocal(
              localSelecionado
            ).tipo
          : "cnpj",
        obterDocumentoLocal(
          localSelecionado
        ).numero
      ),

    bairro:
      localSelecionado.bairro || "",

    cep:
      localSelecionado.cep || "",

    endereco:
      localSelecionado.endereco || "",

    numero:
      localSelecionado.numero || "",

    complemento:
      localSelecionado.complemento || "",

    cidade:
      localSelecionado.cidade || "",

    estado:
      localSelecionado.estado || "",
  });

  setEditandoLocal(false);
}

async function salvarEdicaoLocal() {
  if (
    !localSelecionado ||
    salvandoLocal
  ) {
    return;
  }

  const nome =
    formularioEdicao.nome
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  if (
    !nome
  ) {
    alert(
      "O nome do local é obrigatório."
    );

    return;
  }

  const status =
    formularioEdicao.status ===
      "inativo"
      ? "inativo"
      : "ativo";

  const tipoDocumento:
    "cpf" | "cnpj" =
      localSelecionado.tipoLocal ===
        "residencia"
        ? formularioEdicao.tipoDocumento
        : "cnpj";

  const numeroDocumento =
    formatarDocumento(
      tipoDocumento,
      formularioEdicao.numeroDocumento
    );

  const dadosAtualizados = {
    nome,

    status,

    ativo:
      status !==
      "inativo",

    documento: {
      tipo:
        tipoDocumento,

      numero:
        numeroDocumento,
    },

    cpf:
      tipoDocumento === "cpf"
        ? numeroDocumento
        : null,

    cnpj:
      tipoDocumento === "cnpj"
        ? numeroDocumento
        : null,

    bairro:
      formularioEdicao.bairro.trim(),

    cep:
      formularioEdicao.cep.trim(),

    endereco:
      formularioEdicao.endereco
        .trim(),

    numero:
      formularioEdicao.numero.trim(),

    complemento:
      formularioEdicao.complemento
        .trim(),

    cidade:
      formularioEdicao.cidade.trim(),

    estado:
      formularioEdicao.estado
        .trim()
        .toUpperCase(),

    atualizadoEm:
      Date.now(),
  };

  try {
    setSalvandoLocal(true);

    await update(
      ref(
        db,
        `locais-v2/${localSelecionado.id}`
      ),
      dadosAtualizados
    );

    setLocalSelecionado(
      (
        atual
      ) =>
        atual
          ? {
              ...atual,
              ...dadosAtualizados,
            }
          : null
    );

    setFormularioEdicao(
      (
        atual
      ) => ({
        ...atual,
        nome:
          dadosAtualizados.nome,
        status:
          dadosAtualizados.status,
        tipoDocumento,
        numeroDocumento,
        estado:
          dadosAtualizados.estado,
      })
    );

    setEditandoLocal(false);

    alert(
      "Dados do local atualizados com sucesso."
    );
  } catch (
    erro
  ) {
    console.error(
      "Erro ao atualizar o local:",
      erro
    );

    alert(
      "Não foi possível salvar as alterações."
    );
  } finally {
    setSalvandoLocal(false);
  }
}

function iniciarEdicaoResponsavel() {
  if (
    !localSelecionado
  ) {
    return;
  }

  const responsavel =
    obterResponsavelComId(
      localSelecionado
    );

  setResponsavelSelecionado(
    responsavel
  );

  setFormularioResponsavel({
    nome:
      responsavel?.nome || "",

    email:
      responsavel?.email || "",

    telefone:
      responsavel?.telefone || "",

    cpf:
      formatarCpf(
        responsavel?.cpf || ""
      ),

    perfil:
      responsavel?.perfil ||
      (
        localSelecionado.tipoLocal ===
          "condominio"
          ? "sindico"
          : "responsavel"
      ),

    status:
      responsavel?.ativo === false
        ? "inativo"
        : "ativo",
  });

  setEditandoLocal(false);
  setEditandoResponsavel(true);
}

function alterarCampoResponsavel(
  campo: keyof FormularioEdicaoResponsavel,
  valor: string
) {
  setFormularioResponsavel(
    (
      atual
    ) => ({
      ...atual,
      [campo]:
        valor,
    })
  );
}

function cancelarEdicaoResponsavel() {
  if (
    salvandoResponsavel
  ) {
    return;
  }

  setEditandoResponsavel(false);
}

async function salvarEdicaoResponsavel() {
  if (
    !localSelecionado ||
    salvandoResponsavel
  ) {
    return;
  }

  const nome =
    formularioResponsavel.nome
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  const email =
    formularioResponsavel.email
      .trim()
      .toLowerCase();

  const telefone =
    formularioResponsavel.telefone
      .trim();

  const cpf =
    formatarCpf(
      formularioResponsavel.cpf
    );

  const perfil =
    formularioResponsavel.perfil
      .trim()
      .toLowerCase()
      .replace(
        /\s+/g,
        "_"
      ) ||
    "responsavel";

  const ativo =
    formularioResponsavel.status !==
      "inativo";

  if (
    !nome
  ) {
    alert(
      "O nome do responsável é obrigatório."
    );

    return;
  }

  if (
    !email
  ) {
    alert(
      "O e-mail do responsável é obrigatório."
    );

    return;
  }

  const emailValido =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );

  if (
    !emailValido
  ) {
    alert(
      "Digite um e-mail válido."
    );

    return;
  }

  const agora =
    Date.now();

  const idResponsavel =
    responsavelSelecionado?.id ||
    responsavelSelecionado?.uid ||
    `responsavel-${agora}`;

  const uidResponsavel =
    responsavelSelecionado?.uid ||
    (
      responsavelSelecionado?.id &&
      !responsavelSelecionado.id.startsWith(
        "responsavel-"
      )
        ? responsavelSelecionado.id
        : ""
    );

  const dadosResponsavel = {
    uid:
      uidResponsavel ||
      idResponsavel,

    nome,

    email,

    telefone,

    cpf,

    perfil,

    ativo,

    atualizadoEm:
      agora,
  };

  const atualizacoes: Record<
    string,
    string | boolean | number | null
  > = {
    [`locais-v2/${localSelecionado.id}/responsaveis/${idResponsavel}/uid`]:
      dadosResponsavel.uid,

    [`locais-v2/${localSelecionado.id}/responsaveis/${idResponsavel}/nome`]:
      dadosResponsavel.nome,

    [`locais-v2/${localSelecionado.id}/responsaveis/${idResponsavel}/email`]:
      dadosResponsavel.email,

    [`locais-v2/${localSelecionado.id}/responsaveis/${idResponsavel}/telefone`]:
      dadosResponsavel.telefone,

    [`locais-v2/${localSelecionado.id}/responsaveis/${idResponsavel}/cpf`]:
      dadosResponsavel.cpf,

    [`locais-v2/${localSelecionado.id}/responsaveis/${idResponsavel}/perfil`]:
      dadosResponsavel.perfil,

    [`locais-v2/${localSelecionado.id}/responsaveis/${idResponsavel}/ativo`]:
      dadosResponsavel.ativo,

    [`locais-v2/${localSelecionado.id}/responsaveis/${idResponsavel}/atualizadoEm`]:
      agora,
  };

  if (
    uidResponsavel
  ) {
    atualizacoes[
      `usuarios-v2/${uidResponsavel}/nome`
    ] =
      dadosResponsavel.nome;

    atualizacoes[
      `usuarios-v2/${uidResponsavel}/email`
    ] =
      dadosResponsavel.email;

    atualizacoes[
      `usuarios-v2/${uidResponsavel}/telefone`
    ] =
      dadosResponsavel.telefone;

    atualizacoes[
      `usuarios-v2/${uidResponsavel}/cpf`
    ] =
      dadosResponsavel.cpf;

    atualizacoes[
      `usuarios-v2/${uidResponsavel}/atualizadoEm`
    ] =
      agora;
  }

  try {
    setSalvandoResponsavel(
      true
    );

    await update(
      ref(db),
      atualizacoes
    );

    const responsavelAtualizado:
      ResponsavelLocal = {
        id:
          idResponsavel,

        ...dadosResponsavel,
      };

    setResponsavelSelecionado(
      responsavelAtualizado
    );

    setLocalSelecionado(
      (
        atual
      ) => {
        if (
          !atual
        ) {
          return null;
        }

        return {
          ...atual,

          responsaveis: {
            ...(
              atual.responsaveis ||
              {}
            ),

            [idResponsavel]:
              dadosResponsavel,
          },
        };
      }
    );

    setEditandoResponsavel(
      false
    );

    alert(
      "Responsável atualizado com sucesso."
    );
  } catch (
    erro
  ) {
    console.error(
      "Erro ao atualizar o responsável:",
      erro
    );

    alert(
      "Não foi possível salvar os dados do responsável."
    );
  } finally {
    setSalvandoResponsavel(
      false
    );
  }
}

function abrirAcesso(local: LocalUniversal) {
  window.open(
    `/acesso-v2/${local.slug}`,
    "_blank",
    "noopener,noreferrer"
  );
}

function abrirPainel(local: LocalUniversal) {
  if (local.tipoLocal === "residencia") {
    const unidadePrincipal =
      local.slug === "residencial-costa"
        ? "residencial-costa-casa-principal"
        : `${local.slug}-principal`;

    window.open(
      `/morador-v2/${unidadePrincipal}`,
      "_blank",
      "noopener,noreferrer"
    );

    return;
  }

  window.open(
    "/dashboard",
    "_blank",
    "noopener,noreferrer"
  );
}
  async function copiarLink(local: LocalUniversal) {
    const link = `${window.location.origin}/acesso-v2/${local.slug}`;

    try {
      await navigator.clipboard.writeText(link);
      alert("Link copiado.");
    } catch (erro) {
      console.error("Erro ao copiar link:", erro);
      alert("Não foi possível copiar o link.");
    }
  }
function alternarSelecao(id: string) {
  setSelecionados((atual) =>
    atual.includes(id)
      ? atual.filter((item) => item !== id)
      : [...atual, id]
  );
}

function selecionarTodos() {
  if (selecionados.length === locaisFiltrados.length) {
    setSelecionados([]);
    return;
  }

  setSelecionados(locaisFiltrados.map((local) => local.id));
}

function abrirModalExclusao() {
  if (selecionados.length === 0) {
    return;
  }

  setModalExclusaoAberto(true);
}

function fecharModalExclusao() {
  if (excluindo) {
    return;
  }

  setModalExclusaoAberto(false);
}

async function excluirLocaisDefinitivamente() {
  if (
    excluindo ||
    locaisSelecionados.length === 0
  ) {
    return;
  }

  try {
    setExcluindo(true);

    const atualizacoes: Record<
      string,
      null
    > = {};

    /*
     * Carrega as unidades uma única vez para identificar
     * todas as unidades pertencentes aos locais selecionados.
     */
    const unidadesSnapshot =
      await get(
        ref(db, "unidades-v2")
      );

    const unidades =
      unidadesSnapshot.val() as
        | Record<
            string,
            {
              localId?: string;
              condominioId?: string;
            }
          >
        | null;

    for (
      const local of
      locaisSelecionados
    ) {
      const localId =
        local.id;

      /*
       * Estruturas principais do Cadastro Universal.
       * Caminhos inexistentes são ignorados pelo Firebase.
       */
      atualizacoes[
        `locais-v2/${localId}`
      ] = null;

      atualizacoes[
        `residencias-v2/${localId}`
      ] = null;

      atualizacoes[
        `configuracoes-locais-v2/${localId}`
      ] = null;

      atualizacoes[
        `configuracoes-chamadas-v2/${localId}`
      ] = null;

      atualizacoes[
        `vinculos-locais-v2/${localId}`
      ] = null;

      atualizacoes[
        `implantacoes-v2/${localId}`
      ] = null;

      atualizacoes[
        `historico-implantacoes-v2/${localId}`
      ] = null;

      atualizacoes[
        `qr-codes-v2/${localId}`
      ] = null;

      /*
       * Compatibilidade com a unidade principal criada
       * automaticamente para residências.
       */
      atualizacoes[
        `unidades-v2/${localId}-principal`
      ] = null;

      /*
       * Remove todas as unidades vinculadas ao local,
       * inclusive condomínios com várias unidades.
       */
      if (unidades) {
        Object.entries(
          unidades
        ).forEach(
          ([
            unidadeId,
            unidade,
          ]) => {
            if (
              unidade.localId ===
                localId ||
              unidade.condominioId ===
                localId
            ) {
              atualizacoes[
                `unidades-v2/${unidadeId}`
              ] = null;
            }
          }
        );
      }

      /*
       * Remove os vínculos do local dentro dos usuários.
       * Não exclui a conta do Firebase Authentication nem
       * o cadastro-base do usuário, pois ele pode possuir
       * vínculos com outros locais do ecossistema.
       */
      const uidsResponsaveis =
        new Set<string>();

      Object.values(
        local.responsaveis ||
          {}
      ).forEach(
        (responsavel) => {
          if (
            responsavel.uid
          ) {
            uidsResponsaveis.add(
              responsavel.uid
            );
          }
        }
      );

      const vinculosSnapshot =
        await get(
          ref(
            db,
            `vinculos-locais-v2/${localId}`
          )
        );

      const vinculos =
        vinculosSnapshot.val() as
          | Record<
              string,
              {
                uid?: string;
              }
            >
          | null;

      if (vinculos) {
        Object.entries(
          vinculos
        ).forEach(
          ([
            chaveUid,
            vinculo,
          ]) => {
            const uid =
              vinculo.uid ||
              chaveUid;

            if (uid) {
              uidsResponsaveis.add(
                uid
              );
            }
          }
        );
      }

      uidsResponsaveis.forEach(
        (uid) => {
          atualizacoes[
            `usuarios-v2/${uid}/vinculos/${localId}`
          ] = null;
        }
      );
    }

    await update(
      ref(db),
      atualizacoes
    );

    const quantidade =
      locaisSelecionados.length;

    setModalExclusaoAberto(
      false
    );
    setModoSelecao(false);
    setSelecionados([]);

    alert(
      `${quantidade} local${
        quantidade === 1
          ? ""
          : "is"
      } excluído${
        quantidade === 1
          ? ""
          : "s"
      } com sucesso.`
    );
  } catch (erroExclusao) {
    console.error(
      "Erro ao excluir locais:",
      erroExclusao
    );

    alert(
      "Não foi possível concluir a exclusão. Nenhuma nova tentativa será feita automaticamente."
    );
  } finally {
    setExcluindo(false);
  }
}
  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-600 p-5 text-white md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-100">🌐 QR CORE</p>
            <h2 className="mt-1 text-3xl font-black md:text-4xl">
              Cadastro Universal
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-blue-100 md:text-base">
              Todos os locais implantados pelo novo motor do QR Core,
              independentemente do segmento.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-xs font-black text-blue-100">BASE FIREBASE</p>
            <p className="mt-1 text-lg font-black">locais-v2</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-xs font-bold text-slate-400">TOTAL</p>
          <p className="mt-2 text-3xl font-black">{locais.length}</p>
        </div>

        <div className="rounded-2xl border border-green-800 bg-green-950/25 p-4">
          <p className="text-xs font-bold text-green-300">ATIVOS</p>
          <p className="mt-2 text-3xl font-black">{totalAtivos}</p>
        </div>

        <div className="rounded-2xl border border-blue-800 bg-blue-950/25 p-4">
          <p className="text-xs font-bold text-blue-300">CONDOMÍNIOS</p>
          <p className="mt-2 text-3xl font-black">{totalCondominios}</p>
        </div>

        <div className="rounded-2xl border border-cyan-800 bg-cyan-950/25 p-4">
          <p className="text-xs font-bold text-cyan-300">RESIDÊNCIAS</p>
          <p className="mt-2 text-3xl font-black">{totalResidencias}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Pesquisar por nome, slug, cidade ou tipo..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
          />

          <select
            value={filtroTipo}
            onChange={(event) => setFiltroTipo(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
          >
            <option value="todos">Todos os tipos</option>
            <option value="condominio">🏢 Condomínio</option>
            <option value="residencia">🏠 Residência</option>
            <option value="beauty">💇 Beauty</option>
            <option value="barbearia">💈 Barbearia</option>
            <option value="clinica">🏥 Clínica</option>
            <option value="empresa">🏭 Empresa</option>
            <option value="restaurante">🍽️ Restaurante</option>
            <option value="outro">📍 Outro</option>
          </select>
        </div>

        <p className="mt-3 text-sm text-slate-400">
          {locaisFiltrados.length} local
          {locaisFiltrados.length === 1 ? "" : "is"} encontrado
          {locaisFiltrados.length === 1 ? "" : "s"}.
        </p>
      </section>

      
<section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <p className="text-xs font-black text-blue-300">
      LOCAIS IMPLANTADOS
    </p>

    <h3 className="mt-1 text-2xl font-black">
      Ecossistema QR
    </h3>
  </div>

  {!modoSelecao && (
    <button
      type="button"
      onClick={() => setModoSelecao(true)}
      className="rounded-xl bg-blue-600 px-4 py-2.5 font-black text-white transition hover:bg-blue-500 active:scale-95"
    >
      Selecionar
    </button>
  )}
</div>
{modoSelecao && (
<div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-4">
  <label className="flex cursor-pointer items-center gap-3">
    <input
      type="checkbox"
      checked={
        locaisFiltrados.length > 0 &&
        selecionados.length === locaisFiltrados.length
      }
      onChange={selecionarTodos}
      className="h-5 w-5 cursor-pointer"
    />

    <span className="font-black text-slate-200">
      Selecionar todos
    </span>
  </label>

  <div className="flex flex-wrap items-center gap-3">
    <span className="text-sm font-bold text-slate-400">
      {selecionados.length} selecionado(s)
    </span>
<button
  type="button"
  onClick={() => {
    setModoSelecao(false);
    setSelecionados([]);
  }}
  className="rounded-xl bg-slate-700 px-4 py-2.5 font-black text-white transition hover:bg-slate-600 active:scale-95"
>
  Cancelar
</button>
    <button
      type="button"
      onClick={abrirModalExclusao}
      disabled={selecionados.length === 0}
      className="rounded-xl bg-red-600 px-4 py-2.5 font-black text-white transition hover:bg-red-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
    >
      🗑 Excluir selecionados
    </button>
  </div>
</div>
)}
        {carregando ? (
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
            <p className="font-black text-slate-300">Carregando locais...</p>
          </div>
        ) : locaisFiltrados.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
            <div className="text-4xl">🌐</div>
            <p className="mt-3 font-black text-slate-300">
              Nenhum local encontrado
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Os locais implantados pelo Cadastro Universal aparecerão aqui
              automaticamente.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {locaisFiltrados.map((local) => {
              const responsavel = obterResponsavel(local);
              const ativo =
                local.ativo !== false && local.status !== "inativo";

              return (
                <article
                  key={local.id}
                  className="flex h-full flex-col rounded-2xl border border-slate-700 bg-slate-800 p-4 transition-all hover:border-blue-500"
                >
                 {modoSelecao && (
  <div className="mb-3 flex justify-end">
    <input
      type="checkbox"
      checked={selecionados.includes(local.id)}
      onChange={() => alternarSelecao(local.id)}
      className="h-5 w-5 cursor-pointer"
      aria-label={`Selecionar ${local.nome}`}
    />
  </div>
)}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-3xl">
                      {iconeTipo(local.tipoLocal)}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black ${
                        ativo
                          ? "bg-green-950 text-green-300"
                          : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      {ativo ? "🟢 ATIVO" : "⚪ INATIVO"}
                    </span>
                  </div>

                  <p className="mt-4 text-xs font-black text-blue-300">
                    {nomeTipo(local.tipoLocal)}
                  </p>

                  <h4 className="mt-1 text-xl font-black text-white">
                    {local.nome}
                  </h4>

                  <p className="mt-2 break-all text-sm text-slate-400">
                    Slug: {local.slug}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    📍 {local.cidade || "Cidade não informada"}
                    {local.estado ? `/${local.estado}` : ""}
                  </p>

                  <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-3">
                    <p className="text-[10px] font-black text-slate-500">
                      RESPONSÁVEL
                    </p>
                    <p className="mt-1 font-bold text-slate-200">
                      {responsavel?.nome || "Não informado"}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {responsavel?.email || "E-mail não informado"}
                    </p>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Implantado em: {formatarData(
                      local.implantacao?.implantadoEm || local.criadoEm
                    )}
                  </p>

                 <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
  <button
    type="button"
    onClick={() => abrirDetalhesLocal(local)}
    className="rounded-xl bg-slate-700 px-3 py-2.5 text-sm font-black text-white transition-all hover:bg-slate-600 active:scale-95"
  >
    Ver detalhes
  </button>

  <button
    type="button"
    onClick={() => abrirAcesso(local)}
    className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-black text-white transition-all hover:bg-blue-500 active:scale-95"
  >
    🌐 Visitante
  </button>

  <button
    type="button"
    onClick={() => abrirPainel(local)}
    className="rounded-xl bg-green-600 px-3 py-2.5 text-sm font-black text-white transition-all hover:bg-green-500 active:scale-95"
  >
    🏠 Painel
  </button>

  <button
    type="button"
    onClick={() => copiarLink(local)}
    className="rounded-xl border border-cyan-700 bg-cyan-950/30 px-3 py-2.5 text-sm font-black text-cyan-300 transition-all hover:bg-cyan-950/60 active:scale-95"
  >
    🔗 Copiar link
  </button>
  
  <button
    type="button"
    onClick={() =>
      window.open(
        `/api/materiais/qrcode/${encodeURIComponent(local.slug)}`,
        "_blank",
        "noopener,noreferrer"
      )
    }
    className="col-span-2 rounded-xl bg-fuchsia-600 px-3 py-2.5 text-sm font-black text-white transition-all hover:bg-fuchsia-500 active:scale-95"
  >
    🖨️ Visualizar / imprimir placa A4
  </button>
</div>
                </article>
              );
            })}
          </div>
        )}
      </section>

{modalExclusaoAberto && (
  <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/80 p-3 md:p-6">
    <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-red-800 bg-slate-900 p-5 shadow-2xl md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-red-400">
            ⚠️ AÇÃO IRREVERSÍVEL
          </p>

          <h3 className="mt-2 text-2xl font-black text-white">
            Excluir locais
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Você está prestes a excluir{" "}
            <strong className="text-white">
              {locaisSelecionados.length} local
              {locaisSelecionados.length === 1 ? "" : "is"}
            </strong>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={fecharModalExclusao}
          disabled={excluindo}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl font-black text-white transition hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ✕
        </button>
      </div>

      <div className="mt-5 max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-3">
        {locaisSelecionados.map((local) => (
          <div
            key={local.id}
            className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3"
          >
            <span className="text-2xl">
              {iconeTipo(local.tipoLocal)}
            </span>

            <div className="min-w-0">
              <p className="truncate font-black text-white">
                {local.nome}
              </p>

              <p className="truncate text-xs text-slate-500">
                {nomeTipo(local.tipoLocal)} • {local.slug}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-red-900 bg-red-950/30 p-4">
        <p className="font-black text-red-300">
          Esta ação também removerá:
        </p>

        <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          <p>✓ Cadastro do local</p>
          <p>✓ Unidade principal</p>
          <p>✓ Responsáveis e vínculos</p>
          <p>✓ Configurações do local</p>
          <p>✓ Configurações de chamadas</p>
          <p>✓ Estrutura de implantação</p>
        </div>

        <p className="mt-4 text-sm font-bold text-red-300">
          A conta de autenticação do responsável não será apagada. Depois de confirmada, a exclusão dos vínculos e dados do local não poderá ser desfeita.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={fecharModalExclusao}
          disabled={excluindo}
          className="rounded-xl bg-slate-700 px-5 py-3 font-black text-white transition hover:bg-slate-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={
            excluirLocaisDefinitivamente
          }
          disabled={
            excluindo ||
            locaisSelecionados.length ===
              0
          }
          className="rounded-xl bg-red-600 px-5 py-3 font-black text-white transition hover:bg-red-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {excluindo
            ? "Excluindo..."
            : "🗑 Excluir definitivamente"}
        </button>
      </div>
    </div>
  </div>
)}
      {localSelecionado && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-3 md:p-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-blue-300">
                  {iconeTipo(localSelecionado.tipoLocal)}{" "}
                  {nomeTipo(localSelecionado.tipoLocal)}
                </p>

                <h3 className="mt-1 text-2xl font-black">
                  {editandoLocal
                    ? "Editar local"
                    : editandoResponsavel
                    ? "Editar responsável"
                    : localSelecionado.nome}
                </h3>

                {editandoLocal && (
                  <p className="mt-1 text-sm text-slate-400">
                    Altere os dados cadastrais e clique em salvar.
                  </p>
                )}

                {editandoResponsavel && (
                  <p className="mt-1 text-sm text-slate-400">
                    Atualize os dados da pessoa responsável pelo local.
                  </p>
                )}

                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${ambiente.classe}`}
                  >
                    <span>
                      {ambiente.icone}
                    </span>

                    {ambiente.nome}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={fecharDetalhesLocal}
                disabled={salvandoLocal || salvandoResponsavel}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-xl font-black hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {editandoResponsavel ? (
              <div className="mt-5 space-y-4">
                {!responsavelSelecionado && (
                  <div className="rounded-2xl border border-amber-700 bg-amber-950/30 p-4 text-sm font-bold text-amber-200">
                    Nenhum responsável estava cadastrado. Ao salvar, um novo responsável será criado para este local.
                  </div>
                )}

                <div>
                  <label className="text-xs font-black text-slate-400">
                    NOME DO RESPONSÁVEL
                  </label>

                  <input
                    value={formularioResponsavel.nome}
                    onChange={(evento) =>
                      alterarCampoResponsavel(
                        "nome",
                        evento.target.value
                      )
                    }
                    placeholder="Nome completo"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400">
                    E-MAIL
                  </label>

                  <input
                    type="email"
                    value={formularioResponsavel.email}
                    onChange={(evento) =>
                      alterarCampoResponsavel(
                        "email",
                        evento.target.value
                      )
                    }
                    placeholder="responsavel@email.com"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />

                  <p className="mt-2 text-xs text-amber-300">
                    Este campo altera o e-mail cadastral no banco. A troca do e-mail usado para login no Firebase Authentication será tratada separadamente.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black text-slate-400">
                      TELEFONE
                    </label>

                    <input
                      value={formularioResponsavel.telefone}
                      onChange={(evento) =>
                        alterarCampoResponsavel(
                          "telefone",
                          evento.target.value
                        )
                      }
                      placeholder="(41) 99999-9999"
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-400">
                      CPF
                    </label>

                    <input
                      inputMode="numeric"
                      value={formularioResponsavel.cpf}
                      onChange={(evento) =>
                        alterarCampoResponsavel(
                          "cpf",
                          formatarCpf(
                            evento.target.value
                          )
                        )
                      }
                      placeholder="000.000.000-00"
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black text-slate-400">
                      CARGO / PERFIL
                    </label>

                    <select
                      value={formularioResponsavel.perfil}
                      onChange={(evento) =>
                        alterarCampoResponsavel(
                          "perfil",
                          evento.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none focus:border-blue-500"
                    >
                      <option value="sindico">
                        Síndico
                      </option>

                      <option value="proprietario">
                        Proprietário
                      </option>

                      <option value="administrador">
                        Administrador
                      </option>

                      <option value="gestor_local">
                        Gestor local
                      </option>

                      <option value="gerente">
                        Gerente
                      </option>

                      <option value="responsavel">
                        Responsável
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-400">
                      STATUS
                    </label>

                    <select
                      value={formularioResponsavel.status}
                      onChange={(evento) =>
                        alterarCampoResponsavel(
                          "status",
                          evento.target.value === "inativo"
                            ? "inativo"
                            : "ativo"
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none focus:border-blue-500"
                    >
                      <option value="ativo">
                        Ativo
                      </option>

                      <option value="inativo">
                        Inativo
                      </option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={cancelarEdicaoResponsavel}
                    disabled={salvandoResponsavel}
                    className="rounded-xl bg-slate-700 px-5 py-3 font-black text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={salvarEdicaoResponsavel}
                    disabled={salvandoResponsavel}
                    className="rounded-xl bg-green-600 px-5 py-3 font-black text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {salvandoResponsavel
                      ? "Salvando..."
                      : "💾 Salvar responsável"}
                  </button>
                </div>
              </div>
            ) : editandoLocal ? (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400">
                    NOME DO LOCAL
                  </label>

                  <input
                    value={formularioEdicao.nome}
                    onChange={(evento) =>
                      alterarCampoEdicao(
                        "nome",
                        evento.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black text-slate-400">
                      ID
                    </label>

                    <input
                      value={localSelecionado.id}
                      disabled
                      className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-700 bg-slate-950 p-3 font-bold text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-400">
                      SLUG
                    </label>

                    <input
                      value={localSelecionado.slug}
                      disabled
                      className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-700 bg-slate-950 p-3 font-bold text-slate-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black text-slate-400">
                      TIPO
                    </label>

                    <input
                      value={nomeTipo(localSelecionado.tipoLocal)}
                      disabled
                      className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-700 bg-slate-950 p-3 font-bold text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-400">
                      STATUS
                    </label>

                    <select
                      value={formularioEdicao.status}
                      onChange={(evento) =>
                        alterarCampoEdicao(
                          "status",
                          evento.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none focus:border-blue-500"
                    >
                      <option value="ativo">
                        Ativo
                      </option>

                      <option value="inativo">
                        Inativo
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black text-slate-400">
                      DOCUMENTO
                    </label>

                    <div
                      className={
                        localSelecionado.tipoLocal === "residencia"
                          ? "mt-2 grid grid-cols-[120px_1fr] gap-2"
                          : "mt-2"
                      }
                    >
                      {localSelecionado.tipoLocal === "residencia" && (
                        <select
                          value={formularioEdicao.tipoDocumento}
                          onChange={(evento) => {
                            const novoTipo =
                              evento.target.value === "cpf"
                                ? "cpf"
                                : "cnpj";

                            setFormularioEdicao(
                              (atual) => ({
                                ...atual,
                                tipoDocumento:
                                  novoTipo,
                                numeroDocumento:
                                  formatarDocumento(
                                    novoTipo,
                                    atual.numeroDocumento
                                  ),
                              })
                            );
                          }}
                          className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none focus:border-blue-500"
                        >
                          <option value="cpf">
                            CPF
                          </option>

                          <option value="cnpj">
                            CNPJ
                          </option>
                        </select>
                      )}

                      <input
                        value={formularioEdicao.numeroDocumento}
                        onChange={(evento) =>
                          alterarCampoEdicao(
                            "numeroDocumento",
                            formatarDocumento(
                              localSelecionado.tipoLocal === "residencia"
                                ? formularioEdicao.tipoDocumento
                                : "cnpj",
                              evento.target.value
                            )
                          )
                        }
                        inputMode="numeric"
                        placeholder={
                          (
                            localSelecionado.tipoLocal === "residencia"
                              ? formularioEdicao.tipoDocumento
                              : "cnpj"
                          ) === "cpf"
                            ? "000.000.000-00"
                            : "00.000.000/0000-00"
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                      />
                    </div>

                    {localSelecionado.tipoLocal !== "residencia" && (
                      <p className="mt-2 text-xs font-bold text-slate-500">
                        CNPJ
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-400">
                      CEP
                    </label>

                    <input
                      value={formularioEdicao.cep}
                      onChange={(evento) =>
                        alterarCampoEdicao(
                          "cep",
                          evento.target.value
                        )
                      }
                      placeholder="00000-000"
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400">
                    ENDEREÇO
                  </label>

                  <input
                    value={formularioEdicao.endereco}
                    onChange={(evento) =>
                      alterarCampoEdicao(
                        "endereco",
                        evento.target.value
                      )
                    }
                    placeholder="Rua, avenida ou estrada"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black text-slate-400">
                      NÚMERO
                    </label>

                    <input
                      value={formularioEdicao.numero}
                      onChange={(evento) =>
                        alterarCampoEdicao(
                          "numero",
                          evento.target.value
                        )
                      }
                      placeholder="123"
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-400">
                      COMPLEMENTO
                    </label>

                    <input
                      value={formularioEdicao.complemento}
                      onChange={(evento) =>
                        alterarCampoEdicao(
                          "complemento",
                          evento.target.value
                        )
                      }
                      placeholder="Bloco, sala, sobrado..."
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400">
                    BAIRRO
                  </label>

                  <input
                    value={formularioEdicao.bairro}
                    onChange={(evento) =>
                      alterarCampoEdicao(
                        "bairro",
                        evento.target.value
                      )
                    }
                    placeholder="Nome do bairro"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                  <div>
                    <label className="text-xs font-black text-slate-400">
                      CIDADE
                    </label>

                    <input
                      value={formularioEdicao.cidade}
                      onChange={(evento) =>
                        alterarCampoEdicao(
                          "cidade",
                          evento.target.value
                        )
                      }
                      placeholder="Cidade"
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-400">
                      ESTADO
                    </label>

                    <input
                      value={formularioEdicao.estado}
                      onChange={(evento) =>
                        alterarCampoEdicao(
                          "estado",
                          evento.target.value
                            .slice(0, 2)
                            .toUpperCase()
                        )
                      }
                      maxLength={2}
                      placeholder="PR"
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-center font-bold uppercase text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={cancelarEdicaoLocal}
                    disabled={salvandoLocal}
                    className="rounded-xl bg-slate-700 px-5 py-3 font-black text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={salvarEdicaoLocal}
                    disabled={salvandoLocal}
                    className="rounded-xl bg-green-600 px-5 py-3 font-black text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {salvandoLocal
                      ? "Salvando..."
                      : "💾 Salvar alterações"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-5 space-y-3">
                  {(
                    [
                      ["ID", localSelecionado.id],
                      ["Slug", localSelecionado.slug],
                      [
                        "Tipo",
                        nomeTipo(localSelecionado.tipoLocal),
                      ],
                      [
                        "Status",
                        localSelecionado.status || "ativo",
                      ],
                      [
                        localSelecionado.tipoLocal === "residencia"
                          ? `Documento (${
                              obterDocumentoLocal(
                                localSelecionado
                              ).tipo.toUpperCase()
                            })`
                          : "CNPJ",
                        obterDocumentoLocal(
                          localSelecionado
                        ).numero ||
                          "Não informado",
                      ],
                      [
                        "Bairro",
                        localSelecionado.bairro || "Não informado",
                      ],
                      [
                        "CEP",
                        localSelecionado.cep || "Não informado",
                      ],
                      [
                        "Endereço",
                        localSelecionado.endereco ||
                          "Não informado",
                      ],
                      [
                        "Número",
                        localSelecionado.numero || "Não informado",
                      ],
                      [
                        "Complemento",
                        localSelecionado.complemento ||
                          "Não informado",
                      ],
                      [
                        "Cidade",
                        localSelecionado.cidade || "Não informado",
                      ],
                      [
                        "Estado",
                        localSelecionado.estado || "Não informado",
                      ],
                      [
                        "Implantação",
                        localSelecionado.implantacao?.status ||
                          "Não informada",
                      ],
                    ] as Array<[string, string]>
                  ).map(([titulo, valor]) => (
                    <div
                      key={titulo}
                      className="rounded-xl border border-slate-700 bg-slate-800 p-3"
                    >
                      <p className="text-[10px] font-black text-slate-500">
                        {titulo}
                      </p>

                      <p className="mt-1 break-all font-bold text-slate-200">
                        {valor}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-3xl border border-slate-700 bg-slate-950 p-6">
  <div className="flex items-center gap-2">
    <UserRound
      className="h-5 w-5 text-blue-400"
      strokeWidth={2.3}
    />

    <span className="text-sm font-black uppercase tracking-wide text-blue-300">
      Responsável
    </span>
  </div>

  <h3 className="mt-5 text-3xl font-black leading-tight text-white">
    {obterResponsavel(localSelecionado)?.nome ||
      "Não informado"}
  </h3>

  <div className="mt-6 space-y-4">
    <div className="flex items-start gap-3 text-slate-300">
      <Mail
        className="mt-0.5 h-5 w-5 shrink-0 text-slate-400"
        strokeWidth={2.2}
      />

      <span className="break-all">
        {obterResponsavel(localSelecionado)?.email ||
          "E-mail não informado"}
      </span>
    </div>

    <div className="flex items-center gap-3 text-slate-300">
      <Phone
        className="h-5 w-5 shrink-0 text-slate-400"
        strokeWidth={2.2}
      />

      <span>
        {formatarTelefone(
          obterResponsavel(localSelecionado)?.telefone
        )}
      </span>
    </div>
  </div>

  <div className="mt-7 flex flex-wrap gap-3">
    <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2">
      <ShieldCheck
        className="h-4 w-4 text-blue-400"
        strokeWidth={2.3}
      />

      <span className="font-black text-blue-300">
        {nomePerfil(
          obterResponsavel(localSelecionado)?.perfil
        )}
      </span>
    </div>

    <div
      className={
        obterResponsavel(localSelecionado)?.ativo === false
          ? "inline-flex items-center gap-2 rounded-full border border-slate-500/30 bg-slate-500/10 px-4 py-2"
          : "inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2"
      }
    >
      <span
        className={
          obterResponsavel(localSelecionado)?.ativo === false
            ? "h-2.5 w-2.5 rounded-full bg-slate-400"
            : "h-2.5 w-2.5 rounded-full bg-green-400"
        }
      />

      <span
        className={
          obterResponsavel(localSelecionado)?.ativo === false
            ? "font-black text-slate-300"
            : "font-black text-green-300"
        }
      >
        {obterResponsavel(localSelecionado)?.ativo === false
          ? "Inativo"
          : "Ativo"}
      </span>
    </div>
  </div>
</div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditandoResponsavel(false);
                      setEditandoLocal(true);
                    }}
                    className="flex h-14 items-center justify-center rounded-2xl bg-amber-500 px-4 text-base font-black text-black transition-all hover:scale-[1.02] hover:bg-amber-400 active:scale-95"
                  >
                    ✏️ Editar local
                  </button>

                  <button
                    type="button"
                    onClick={iniciarEdicaoResponsavel}
                    className="flex h-14 items-center justify-center rounded-2xl bg-violet-600 px-4 text-base font-black text-white transition-all hover:scale-[1.02] hover:bg-violet-500 active:scale-95"
                  >
                    👤 Editar responsável
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => copiarLink(localSelecionado)}
                    className="flex h-14 items-center justify-center rounded-2xl bg-slate-700 px-4 text-base font-black text-white transition-all hover:scale-[1.02] hover:bg-slate-600 active:scale-95"
                  >
                    🔗 Copiar link
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirAcesso(localSelecionado)}
                    className="flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-4 text-base font-black text-white transition-all hover:scale-[1.02] hover:bg-blue-500 active:scale-95"
                  >
                    🌐 Visitante
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirPainel(localSelecionado)}
                    className="col-span-2 flex h-14 items-center justify-center rounded-2xl bg-green-600 px-4 text-base font-black text-white transition-all hover:scale-[1.02] hover:bg-green-500 active:scale-95"
                  >
                    🚀 Entrar no painel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
