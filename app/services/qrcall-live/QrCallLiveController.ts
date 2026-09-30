import {
  Database,
} from "firebase/database";

import {
  QrCallLiveEstado,
  QrCallLivePeer,
  QrCallLiveTipoMidia,
} from "./QrCallLivePeer";

import {
  QrCallLiveLado,
  QrCallLiveSignal,
} from "./QrCallLiveSignal";

export type QrCallLiveControllerConfig = {
  db: Database;

  unidadeId: string;

  criadoEm: string;

  lado: QrCallLiveLado;

  tipo?: QrCallLiveTipoMidia;

  onEstado?: (
    estado: QrCallLiveEstado
  ) => void;

  onLocalStream?: (
    stream: MediaStream
  ) => void;

  onRemoteStream?: (
    stream: MediaStream
  ) => void;

  onErro?: (
    erro: Error
  ) => void;
};

export class QrCallLiveController {
  private readonly config:
    QrCallLiveControllerConfig;

  private readonly signal:
    QrCallLiveSignal;

  private peer:
    QrCallLivePeer | null =
    null;

  private iniciado =
    false;

  private encerrado =
    false;

  private descricaoRemotaAplicada =
    false;

  private respostaAplicada =
    false;

  private ofertaAplicada =
    false;

  private candidatosPendentes:
    RTCIceCandidateInit[] = [];

  constructor(
    config:
      QrCallLiveControllerConfig
  ) {
    this.config =
      config;

    this.signal =
      new QrCallLiveSignal({
        db:
          config.db,

        unidadeId:
          config.unidadeId,

        criadoEm:
          config.criadoEm,

        lado:
          config.lado,
      });
  }

  private criarPeer() {
    if (this.peer) {
      return this.peer;
    }

    const peer =
      new QrCallLivePeer({
        tipo:
          this.config.tipo ||
          "audio",

        onEstado:
          (estado) => {
            this.config
              .onEstado?.(
                estado
              );

            if (
              estado ===
              "conectado"
            ) {
              void this.signal
                .marcarConectado()
                .catch(
                  () => {
                    // Estado remoto nao deve
                    // derrubar uma chamada
                    // WebRTC ja conectada.
                  }
                );
            }
          },

        onLocalStream:
          (stream) => {
            this.config
              .onLocalStream?.(
                stream
              );
          },

        onRemoteStream:
          (stream) => {
            this.config
              .onRemoteStream?.(
                stream
              );
          },

        onIceCandidate:
          (candidate) => {
            void this.signal
              .publicarIceCandidate(
                candidate
              )
              .catch(
                (erro) => {
                  this.informarErro(
                    erro
                  );
                }
              );
          },

        onErro:
          (erro) => {
            this.config
              .onErro?.(
                erro
              );
          },
      });

    this.peer =
      peer;

    return peer;
  }

  private informarErro(
    erro: unknown
  ) {
    const final =
      erro instanceof Error
        ? erro
        : new Error(
            String(erro)
          );

    this.config.onErro?.(
      final
    );

    return final;
  }

  private async aplicarCandidatosPendentes() {
    if (
      !this.peer ||
      !this.descricaoRemotaAplicada
    ) {
      return;
    }

    const candidatos =
      [
        ...this.candidatosPendentes,
      ];

    this.candidatosPendentes =
      [];

    for (
      const candidate
      of candidatos
    ) {
      try {
        await this.peer
          .adicionarIceCandidate(
            candidate
          );
      } catch (erro) {
        this.informarErro(
          erro
        );
      }
    }
  }

  private async receberIce(
    candidate:
      RTCIceCandidateInit
  ) {
    if (
      this.encerrado
    ) {
      return;
    }

    if (
      !this.peer ||
      !this.descricaoRemotaAplicada
    ) {
      this.candidatosPendentes
        .push(
          candidate
        );

      return;
    }

    try {
      await this.peer
        .adicionarIceCandidate(
          candidate
        );
    } catch (erro) {
      this.informarErro(
        erro
      );
    }
  }

  async iniciarComoVisitante() {
    if (this.iniciado) {
      throw new Error(
        "QrCall Live ja iniciado."
      );
    }

    if (
      this.config.lado !==
      "visitante"
    ) {
      throw new Error(
        "Controlador nao pertence ao visitante."
      );
    }

    this.iniciado =
      true;

    try {
      const peer =
        this.criarPeer();

      // QRCALL_LIVE_VISITANTE_SESSAO_EXISTENTE
      // O handshake ja criou e validou a sessao.
      // A sinalizacao WebRTC recebe uma geracao limpa
      // antes de offer/answer/ICE.
      await this.signal
        .prepararNovaNegociacaoVisitante();

      this.signal
        .observarIceRemoto(
          (candidate) => {
            void this.receberIce(
              candidate
            );
          }
        );

      this.signal
        .observarResposta(
          (answer) => {
            void (
              async () => {
                if (
                  this.encerrado ||
                  this.respostaAplicada
                ) {
                  return;
                }

                try {
                  await peer
                    .aplicarResposta(
                      answer
                    );

                  this.respostaAplicada =
                    true;

                  this.descricaoRemotaAplicada =
                    true;

                  await this
                    .aplicarCandidatosPendentes();

                } catch (erro) {
                  this.informarErro(
                    erro
                  );
                }
              }
            )();
          }
        );

      await peer
        .prepararMidia();

      const oferta =
        await peer
          .criarOferta();

      await this.signal
        .publicarOferta(
          oferta
        );

    } catch (erro) {
      this.iniciado =
        false;

      throw this.informarErro(
        erro
      );
    }
  }

  async iniciarComoMorador() {
    if (this.iniciado) {
      throw new Error(
        "QrCall Live ja iniciado."
      );
    }

    if (
      this.config.lado !==
      "morador"
    ) {
      throw new Error(
        "Controlador nao pertence ao morador."
      );
    }

    this.iniciado =
      true;

    try {
      const peer =
        this.criarPeer();

      await this.signal
        .entrarNaSessao();

      this.signal
        .observarIceRemoto(
          (candidate) => {
            void this.receberIce(
              candidate
            );
          }
        );

      this.signal
        .observarOferta(
          (offer) => {
            void (
              async () => {
                if (
                  this.encerrado ||
                  this.ofertaAplicada
                ) {
                  return;
                }

                this.ofertaAplicada =
                  true;

                try {
                  await peer
                    .prepararMidia();

                  await peer
                    .aplicarOferta(
                      offer
                    );

                  this.descricaoRemotaAplicada =
                    true;

                  await this
                    .aplicarCandidatosPendentes();

                  const resposta =
                    await peer
                      .criarResposta();

                  await this.signal
                    .publicarResposta(
                      resposta
                    );

                } catch (erro) {
                  this.ofertaAplicada =
                    false;

                  this.informarErro(
                    erro
                  );
                }
              }
            )();
          }
        );

    } catch (erro) {
      this.iniciado =
        false;

      throw this.informarErro(
        erro
      );
    }
  }

  definirMicrofoneAtivo(
    ativo: boolean
  ) {
    this.peer
      ?.definirMicrofoneAtivo(
        ativo
      );
  }

  definirCameraAtiva(
    ativa: boolean
  ) {
    this.peer
      ?.definirCameraAtiva(
        ativa
      );
  }

  async encerrar() {
    if (this.encerrado) {
      return;
    }

    this.encerrado =
      true;

    try {
      if (this.iniciado) {
        await this.signal
          .marcarEncerrado();
      }
    } catch {
      // Encerramento local deve
      // continuar mesmo se Firebase
      // estiver indisponivel.
    }

    this.signal
      .pararListeners();

    this.peer
      ?.encerrar();

    this.peer =
      null;

    this.candidatosPendentes =
      [];
  }
}