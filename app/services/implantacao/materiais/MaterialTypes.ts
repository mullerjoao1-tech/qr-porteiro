export type TipoMaterial =
  | "a4"
  | "a5"
  | "banner"
  | "display"
  | "adesivo"
  | "cartao"
  | "qr-png"
  | "qr-svg";

export type SegmentoMaterial =
  | "condominio"
  | "residencia"
  | "empresa"
  | "beauty"
  | "barbearia"
  | "clinica"
  | "pet"
  | "restaurante";

export type TemaMaterial =
  | "clean"
  | "institucional"
  | "premium";

export interface DadosMaterial {
  localId: string;
  slug: string;

  nome: string;
  subtitulo?: string;

  segmento: SegmentoMaterial;

  tema?: TemaMaterial;

  cidade?: string;
  estado?: string;

  telefone?: string;
  whatsapp?: string;
  email?: string;

  site?: string;
  instagram?: string;
  facebook?: string;

  logo?: string;

  urlQr: string;

  qrBase64?: string;

  corPrimaria?: string;
  corSecundaria?: string;
  corTexto?: string;

  observacoes?: string[];
}

export interface ResultadoMaterial {
  nomeArquivo: string;

  mimeType: string;

  bytes: Uint8Array;
}

export interface TemplateMaterial {
  gerar(
    dados: DadosMaterial
  ): Promise<ResultadoMaterial>;
}
