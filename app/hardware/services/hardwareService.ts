import {
  AtualizarHardwareInput,
  CriarHardwareInput,
  Hardware,
  ResultadoTesteHardware,
} from "../types/hardware";

class HardwareService {
  private hardwares = new Map<string, Hardware>();

  listar(): Hardware[] {
    return Array.from(this.hardwares.values()).sort(
      (a, b) => a.nome.localeCompare(b.nome)
    );
  }

  buscar(id: string): Hardware | undefined {
    return this.hardwares.get(id);
  }

  criar(dados: CriarHardwareInput): Hardware {
    const agora = Date.now();

    const hardware: Hardware = {
      id: crypto.randomUUID(),

      nome: dados.nome,
      descricao: dados.descricao,

      tipo: dados.tipo,
      ambiente: dados.ambiente ?? "studio",

      status: "offline",

      ativo: dados.ativo ?? true,
      homologado: dados.homologado ?? false,

      protocolos: dados.protocolos ?? [],

      fabricante: dados.fabricante,
      modelo: dados.modelo,
      numeroSerie: dados.numeroSerie,
      versaoFirmware: dados.versaoFirmware,

      ip: dados.ip,
      porta: dados.porta,
      macAddress: dados.macAddress,

      localizacao: dados.localizacao,

      credenciais: dados.credenciais,

      camera: dados.camera,
      controleAcesso: dados.controleAcesso,

      criadoEm: agora,
      atualizadoEm: agora,

      metadados: dados.metadados,
    };

    this.hardwares.set(hardware.id, hardware);

    return hardware;
  }

  atualizar(
    id: string,
    dados: AtualizarHardwareInput
  ): Hardware | undefined {
    const atual = this.hardwares.get(id);

    if (!atual) return;

    const atualizado: Hardware = {
      ...atual,
      ...dados,
      atualizadoEm: Date.now(),
    };

    this.hardwares.set(id, atualizado);

    return atualizado;
  }

  remover(id: string): boolean {
    return this.hardwares.delete(id);
  }

  alterarStatus(id: string, status: Hardware["status"]) {
    return this.atualizar(id, {
      status,
      ultimaComunicacaoEm: Date.now(),
    });
  }

  async testar(id: string): Promise<ResultadoTesteHardware> {
    const inicio = Date.now();

    const hardware = this.buscar(id);

    if (!hardware) {
      throw new Error("Hardware não encontrado.");
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    const fim = Date.now();

    this.alterarStatus(id, "online");

    return {
      hardwareId: id,
      sucesso: true,
      status: "online",
      mensagem: "Teste executado com sucesso.",

      iniciadoEm: inicio,
      finalizadoEm: fim,
      duracaoMs: fim - inicio,
    };
  }
}

export const hardwareService = new HardwareService();