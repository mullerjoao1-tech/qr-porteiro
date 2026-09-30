export type QrCallLiveTipoMidia =
  | "audio"
  | "video";

export type QrCallLiveEstado =
  | "novo"
  | "preparando"
  | "conectando"
  | "conectado"
  | "encerrado"
  | "erro";

export type QrCallLiveConfiguracao = {
  tipo: QrCallLiveTipoMidia;

  iceServers?: RTCIceServer[];

  onEstado?: (
    estado: QrCallLiveEstado
  ) => void;

  onLocalStream?: (
    stream: MediaStream
  ) => void;

  onRemoteStream?: (
    stream: MediaStream
  ) => void;

  onIceCandidate?: (
    candidate: RTCIceCandidateInit
  ) => void;

  onErro?: (
    erro: Error
  ) => void;
};

const ICE_SERVERS_PADRAO: RTCIceServer[] = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
    ],
  },
];

export class QrCallLivePeer {
  private peer:
    RTCPeerConnection | null =
    null;

  private localStream:
    MediaStream | null =
    null;

  private remoteStream:
    MediaStream | null =
    null;

  private encerrado =
    false;

  private readonly config:
    QrCallLiveConfiguracao;

  constructor(
    config: QrCallLiveConfiguracao
  ) {
    this.config = config;
  }

  private alterarEstado(
    estado: QrCallLiveEstado
  ) {
    this.config.onEstado?.(
      estado
    );
  }

  private informarErro(
    erro: unknown
  ) {
    const erroFinal =
      erro instanceof Error
        ? erro
        : new Error(
            String(erro)
          );

    this.alterarEstado(
      "erro"
    );

    this.config.onErro?.(
      erroFinal
    );

    return erroFinal;
  }

  private garantirPeer() {
    if (this.encerrado) {
      throw new Error(
        "Sessao QrCall Live ja encerrada."
      );
    }

    if (this.peer) {
      return this.peer;
    }

    const peer =
      new RTCPeerConnection({
        iceServers:
          this.config
            .iceServers ||
          ICE_SERVERS_PADRAO,
      });

    const remoteStream =
      new MediaStream();

    this.remoteStream =
      remoteStream;

    peer.ontrack = (
      evento
    ) => {
      for (
        const track
        of evento.streams[0]
          ?.getTracks() || [
          evento.track,
        ]
      ) {
        const jaExiste =
          remoteStream
            .getTracks()
            .some(
              (item) =>
                item.id ===
                track.id
            );

        if (!jaExiste) {
          remoteStream.addTrack(
            track
          );
        }
      }

      this.config
        .onRemoteStream?.(
          remoteStream
        );
    };

    peer.onicecandidate = (
      evento
    ) => {
      if (
        evento.candidate
      ) {
        this.config
          .onIceCandidate?.(
            evento.candidate.toJSON()
          );
      }
    };

    peer.onconnectionstatechange =
      () => {
        switch (
          peer.connectionState
        ) {
          case "new":
            this.alterarEstado(
              "novo"
            );
            break;

          case "connecting":
            this.alterarEstado(
              "conectando"
            );
            break;

          case "connected":
            this.alterarEstado(
              "conectado"
            );
            break;

          case "closed":
            this.alterarEstado(
              "encerrado"
            );
            break;

          case "failed":
            this.alterarEstado(
              "erro"
            );
            break;
        }
      };

    this.peer = peer;

    // QRCALL_DIAGNOSTICO_RTP_V17
    // Mede trafego RTP real sem alterar a negociacao.
    const diagnosticarRtp =
      async () => {
        if (
          this.encerrado ||
          this.peer !== peer
        ) {
          return;
        }

        try {
          const stats =
            await peer.getStats();

          let audioEnviadoBytes = 0;
          let audioEnviadoPacotes = 0;
          let audioRecebidoBytes = 0;
          let audioRecebidoPacotes = 0;

          stats.forEach(
            (report: any) => {
              const tipo =
                String(
                  report.type || ""
                );

              const kind =
                String(
                  report.kind ||
                  report.mediaType ||
                  ""
                );

              if (
                kind !== "audio"
              ) {
                return;
              }

              if (
                tipo ===
                "outbound-rtp" &&
                !report.isRemote
              ) {
                audioEnviadoBytes +=
                  Number(
                    report.bytesSent || 0
                  );

                audioEnviadoPacotes +=
                  Number(
                    report.packetsSent || 0
                  );
              }

              if (
                tipo ===
                "inbound-rtp" &&
                !report.isRemote
              ) {
                audioRecebidoBytes +=
                  Number(
                    report.bytesReceived || 0
                  );

                audioRecebidoPacotes +=
                  Number(
                    report.packetsReceived || 0
                  );
              }
            }
          );

          console.log(
            "[QRCALL_RTP_VISITANTE]",
            {
              connectionState:
                peer.connectionState,

              iceConnectionState:
                peer.iceConnectionState,

              signalingState:
                peer.signalingState,

              audioEnviadoBytes,
              audioEnviadoPacotes,
              audioRecebidoBytes,
              audioRecebidoPacotes,
            }
          );

          try {
            const chave =
              `qrcall_rtp_visitante_${Date.now()}`;

            localStorage.setItem(
              "qrcall_rtp_ultimo",
              JSON.stringify({
                chave,
                connectionState:
                  peer.connectionState,
                iceConnectionState:
                  peer.iceConnectionState,
                signalingState:
                  peer.signalingState,
                audioEnviadoBytes,
                audioEnviadoPacotes,
                audioRecebidoBytes,
                audioRecebidoPacotes,
                atualizadoEmMs:
                  Date.now(),
              })
            );
          } catch {
            // Diagnostico local nunca derruba a chamada.
          }

        } catch (erro) {
          console.warn(
            "[QRCALL_RTP_VISITANTE_ERRO]",
            erro
          );
        }
      };

    const timerRtp =
      window.setInterval(
        () => {
          void diagnosticarRtp();
        },
        2000
      );

    peer.addEventListener(
      "connectionstatechange",
      () => {
        if (
          peer.connectionState ===
            "closed" ||
          peer.connectionState ===
            "failed"
        ) {
          window.clearInterval(
            timerRtp
          );
        }
      }
    );

    return peer;
  }

  async prepararMidia() {
    try {
      this.alterarEstado(
        "preparando"
      );

      const stream =
        await navigator
          .mediaDevices
          .getUserMedia({
            audio: true,

            video:
              this.config.tipo ===
              "video"
                ? {
                    facingMode:
                      "user",
                  }
                : false,
          });

      this.localStream =
        stream;

      const peer =
        this.garantirPeer();

      for (
        const track
        of stream.getTracks()
      ) {
        peer.addTrack(
          track,
          stream
        );
      }

      this.config
        .onLocalStream?.(
          stream
        );

      return stream;

    } catch (erro) {
      throw this.informarErro(
        erro
      );
    }
  }

  async criarOferta() {
    try {
      const peer =
        this.garantirPeer();

      const offer =
        await peer.createOffer();

      await peer
        .setLocalDescription(
          offer
        );

      return {
        type:
          offer.type,
        sdp:
          offer.sdp || "",
      } satisfies RTCSessionDescriptionInit;

    } catch (erro) {
      throw this.informarErro(
        erro
      );
    }
  }

  async aplicarOferta(
    offer:
      RTCSessionDescriptionInit
  ) {
    try {
      const peer =
        this.garantirPeer();

      await peer
        .setRemoteDescription(
          offer
        );

    } catch (erro) {
      throw this.informarErro(
        erro
      );
    }
  }

  async criarResposta() {
    try {
      const peer =
        this.garantirPeer();

      const answer =
        await peer.createAnswer();

      await peer
        .setLocalDescription(
          answer
        );

      return {
        type:
          answer.type,
        sdp:
          answer.sdp || "",
      } satisfies RTCSessionDescriptionInit;

    } catch (erro) {
      throw this.informarErro(
        erro
      );
    }
  }

  async aplicarResposta(
    answer:
      RTCSessionDescriptionInit
  ) {
    try {
      const peer =
        this.garantirPeer();

      await peer
        .setRemoteDescription(
          answer
        );

    } catch (erro) {
      throw this.informarErro(
        erro
      );
    }
  }

  async adicionarIceCandidate(
    candidate:
      RTCIceCandidateInit
  ) {
    try {
      const peer =
        this.garantirPeer();

      await peer
        .addIceCandidate(
          candidate
        );

    } catch (erro) {
      throw this.informarErro(
        erro
      );
    }
  }

  definirMicrofoneAtivo(
    ativo: boolean
  ) {
    this.localStream
      ?.getAudioTracks()
      .forEach(
        (track) => {
          track.enabled =
            ativo;
        }
      );
  }

  definirCameraAtiva(
    ativa: boolean
  ) {
    this.localStream
      ?.getVideoTracks()
      .forEach(
        (track) => {
          track.enabled =
            ativa;
        }
      );
  }

  cameraDisponivel() {
    return (
      (
        this.localStream
          ?.getVideoTracks()
          .length || 0
      ) > 0
    );
  }

  encerrar() {
    if (this.encerrado) {
      return;
    }

    this.encerrado =
      true;

    this.localStream
      ?.getTracks()
      .forEach(
        (track) =>
          track.stop()
      );

    this.remoteStream
      ?.getTracks()
      .forEach(
        (track) =>
          track.stop()
      );

    if (this.peer) {
      this.peer.ontrack =
        null;

      this.peer
        .onicecandidate =
        null;

      this.peer
        .onconnectionstatechange =
        null;

      this.peer.close();
    }

    this.peer = null;
    this.localStream =
      null;
    this.remoteStream =
      null;

    this.alterarEstado(
      "encerrado"
    );
  }
}