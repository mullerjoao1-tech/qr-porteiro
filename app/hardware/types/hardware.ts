export type TipoHardware =
  | "camera"
  | "controle-acesso"
  | "portao"
  | "interfone"
  | "sensor"
  | "esp32"
  | "tuya"
  | "ble"
  | "nfc"
  | "outro";

export type StatusHardware =
  | "online"
  | "offline"
  | "alerta"
  | "configurando"
  | "desconhecido";

export type AmbienteHardware =
  | "studio"
  | "homologacao"
  | "producao";

export type ProtocoloHardware =
  | "rtsp"
  | "onvif"
  | "http"
  | "https"
  | "mqtt"
  | "tuya"
  | "ble"
  | "nfc"
  | "wifi"
  | "ethernet"
  | "serial"
  | "outro";

export interface CredenciaisHardware {
  usuario?: string;
  senha?: string;
  token?: string;
  clientId?: string;
  clientSecret?: string;
  deviceId?: string;
  localKey?: string;
}

export interface ConfiguracaoCamera {
  ip?: string;
  porta?: number;
  protocolo?: ProtocoloHardware;
  urlRtsp?: string;
  urlSnapshot?: string;
  canal?: number;
  transporteRtsp?: "tcp" | "udp";
  fabricante?: string;
  modelo?: string;
}

export interface ConfiguracaoControleAcesso {
  protocolo?: ProtocoloHardware;
  deviceId?: string;
  localKey?: string;
  macAddress?: string;
  serviceUuid?: string;
  characteristicUuid?: string;
  pinoEsp32?: number;
  tempoPulsoMs?: number;
  normalmenteAberto?: boolean;
}

export interface LocalizacaoHardware {
  condominioId?: string;
  unidadeId?: string;
  bloco?: string;
  local?: string;
  descricao?: string;
}

export interface LogHardware {
  id: string;
  hardwareId: string;
  tipo:
    | "conexao"
    | "desconexao"
    | "captura"
    | "acionamento"
    | "erro"
    | "teste"
    | "configuracao"
    | "informacao";
  mensagem: string;
  sucesso: boolean;
  criadoEm: number;
  detalhes?: Record<string, unknown>;
}

export interface Hardware {
  id: string;
  nome: string;
  descricao?: string;

  tipo: TipoHardware;
  status: StatusHardware;
  ambiente: AmbienteHardware;

  ativo: boolean;
  homologado: boolean;

  protocolos: ProtocoloHardware[];

  fabricante?: string;
  modelo?: string;
  numeroSerie?: string;
  versaoFirmware?: string;

  ip?: string;
  porta?: number;
  macAddress?: string;

  localizacao?: LocalizacaoHardware;

  credenciais?: CredenciaisHardware;

  camera?: ConfiguracaoCamera;
  controleAcesso?: ConfiguracaoControleAcesso;

  ultimaComunicacaoEm?: number;
  ultimoTesteEm?: number;
  ultimoErro?: string;

  criadoEm: number;
  atualizadoEm: number;

  metadados?: Record<string, unknown>;
}

export interface CriarHardwareInput {
  nome: string;
  descricao?: string;

  tipo: TipoHardware;
  ambiente?: AmbienteHardware;

  ativo?: boolean;
  homologado?: boolean;

  protocolos?: ProtocoloHardware[];

  fabricante?: string;
  modelo?: string;
  numeroSerie?: string;
  versaoFirmware?: string;

  ip?: string;
  porta?: number;
  macAddress?: string;

  localizacao?: LocalizacaoHardware;

  credenciais?: CredenciaisHardware;

  camera?: ConfiguracaoCamera;
  controleAcesso?: ConfiguracaoControleAcesso;

  metadados?: Record<string, unknown>;
}

export interface AtualizarHardwareInput
  extends Partial<CriarHardwareInput> {
  status?: StatusHardware;
  ultimaComunicacaoEm?: number;
  ultimoTesteEm?: number;
  ultimoErro?: string;
}

export interface ResultadoTesteHardware {
  hardwareId: string;
  sucesso: boolean;
  status: StatusHardware;
  mensagem: string;
  iniciadoEm: number;
  finalizadoEm: number;
  duracaoMs: number;
  detalhes?: Record<string, unknown>;
}