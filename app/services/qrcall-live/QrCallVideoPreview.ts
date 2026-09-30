import {
  Database,
  get,
  onChildAdded,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
  Unsubscribe,
} from "firebase/database";

type Config = {
  db: Database;
  unidadeId: string;
  criadoEm: string;
};

const iceServers: RTCIceServer[] = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
    ],
  },
];

/*
 * QRCALL_A9_1_VIDEO_PREVIEW_VISITANTE
 *
 * Preview totalmente separado da Live principal.
 *
 * Visitante:
 * - envia somente video;
 * - nao solicita microfone;
 * - nao transmite audio.
 *
 * Morador:
 * - somente recebe o video;
 * - nao abre camera;
 * - nao abre microfone.
 */
export class QrCallVideoPreviewVisitante {
  private readonly db: Database;
  private readonly unidadeId: string;
  private readonly criadoEm: string;
  private readonly sessaoId: string;

  private peer:
    RTCPeerConnection | null =
    null;

  private stream:
    MediaStream | null =
    null;

  private desconexao:
    ReturnType<typeof onDisconnect> | null =
    null;

  private unsubscribes:
    Unsubscribe[] =
    [];

  private encerrado =
    false;

  private respostaAplicada =
    false;

  private descricaoRemotaAplicada =
    false;

  private icePendente:
    RTCIceCandidateInit[] =
    [];

  constructor(config: Config) {
    this.db =
      config.db;

    this.unidadeId =
      String(
        config.unidadeId || ""
      ).trim();

    this.criadoEm =
      String(
        config.criadoEm || ""
      ).trim();

    const criadoMs =
      Date.parse(
        this.criadoEm
      );

    if (
      !this.unidadeId ||
      !Number.isFinite(
        criadoMs
      )
    ) {
      throw new Error(
        "Identidade invalida para preview."
      );
    }

    this.sessaoId =
      String(criadoMs);
  }

  private caminho() {
    return (
      `qrcall-video-preview/` +
      `${this.unidadeId}/` +
      `${this.sessaoId}`
    );
  }

  private async validarChamada() {
    const snapshot =
      await get(
        ref(
          this.db,
          `unidades-v2/${this.unidadeId}/chamada`
        )
      );

    const chamada =
      snapshot.val();

    if (
      !chamada ||
      String(
        chamada.criadoEm || ""
      ) !== this.criadoEm
    ) {
      throw new Error(
        "A chamada mudou antes do preview."
      );
    }
  }

  async iniciar() {
    if (
      this.peer ||
      this.encerrado
    ) {
      return;
    }

    await this.validarChamada();

    const referencia =
      ref(
        this.db,
        this.caminho()
      );

    /*
     * Se navegador desaparecer,
     * remove SOMENTE o preview.
     */
    this.desconexao =
      onDisconnect(
        referencia
      );

    await this.desconexao
      .remove();

    await set(
      referencia,
      {
        unidadeId:
          this.unidadeId,

        criadoEm:
          this.criadoEm,

        sessaoId:
          this.sessaoId,

        tipo:
          "video",

        estado:
          "preparando",

        criadoEmMs:
          Date.now(),
      }
    );

    /*
     * CAMERA SIM.
     * MICROFONE NAO.
     */
    const stream =
      await navigator
        .mediaDevices
        .getUserMedia({
          audio: false,

          video: {
            facingMode:
              "user",
          },
        });

    if (this.encerrado) {
      stream
        .getTracks()
        .forEach(
          (track) => {
            track.stop();
          }
        );

      return;
    }

    this.stream =
      stream;

    const peer =
      new RTCPeerConnection({
        iceServers,
      });

    this.peer =
      peer;

    peer.onicecandidate =
      (evento) => {
        if (
          !evento.candidate ||
          this.encerrado
        ) {
          return;
        }

        void push(
          ref(
            this.db,
            `${this.caminho()}/iceVisitante`
          ),
          {
            ...evento.candidate
              .toJSON(),

            criadoEmMs:
              Date.now(),
          }
        );
      };

    peer.onconnectionstatechange =
      () => {
        if (
          peer.connectionState ===
          "connected"
        ) {
          void update(
            referencia,
            {
              estado:
                "conectado",

              atualizadoEmMs:
                Date.now(),
            }
          );
        }
      };

    for (
      const track
      of stream.getVideoTracks()
    ) {
      peer.addTrack(
        track,
        stream
      );
    }

    const pararResposta =
      onValue(
        ref(
          this.db,
          `${this.caminho()}/answer`
        ),
        (snapshot) => {
          const answer =
            snapshot.val();

          if (
            this.encerrado ||
            this.respostaAplicada ||
            answer?.type !==
              "answer" ||
            !answer?.sdp
          ) {
            return;
          }

          this.respostaAplicada =
            true;

          void (
            async () => {
              try {
                await peer
                  .setRemoteDescription({
                    type:
                      "answer",

                    sdp:
                      String(
                        answer.sdp
                      ),
                  });

                this.descricaoRemotaAplicada =
                  true;

                const pendentes =
                  [
                    ...this.icePendente,
                  ];

                this.icePendente =
                  [];

                for (
                  const candidate
                  of pendentes
                ) {
                  await peer
                    .addIceCandidate(
                      candidate
                    );
                }
              } catch (erro) {
                console.warn(
                  "QRCALL_A9_1_PREVIEW_ANSWER:",
                  erro
                );
              }
            }
          )();
        }
      );

    this.unsubscribes.push(
      pararResposta
    );

    const pararIce =
      onChildAdded(
        ref(
          this.db,
          `${this.caminho()}/iceMorador`
        ),
        (snapshot) => {
          const dados =
            snapshot.val();

          if (
            this.encerrado ||
            !dados?.candidate
          ) {
            return;
          }

          const candidate:
            RTCIceCandidateInit =
          {
            candidate:
              String(
                dados.candidate
              ),

            sdpMid:
              dados.sdpMid ??
              null,

            sdpMLineIndex:
              dados.sdpMLineIndex ??
              null,

            usernameFragment:
              dados.usernameFragment ??
              null,
          };

          if (
            !this.descricaoRemotaAplicada
          ) {
            this.icePendente.push(
              candidate
            );

            return;
          }

          void peer
            .addIceCandidate(
              candidate
            )
            .catch(
              (erro) => {
                console.warn(
                  "QRCALL_A9_1_PREVIEW_ICE:",
                  erro
                );
              }
            );
        }
      );

    this.unsubscribes.push(
      pararIce
    );

    const offer =
      await peer.createOffer();

    await peer
      .setLocalDescription(
        offer
      );

    await set(
      ref(
        this.db,
        `${this.caminho()}/offer`
      ),
      {
        type:
          "offer",

        sdp:
          offer.sdp || "",
      }
    );

    await update(
      referencia,
      {
        estado:
          "oferta-criada",

        atualizadoEmMs:
          Date.now(),
      }
    );

    console.log(
      "QRCALL_A9_1_PREVIEW_PRONTO"
    );
  }

  async encerrar() {
    if (this.encerrado) {
      return;
    }

    this.encerrado =
      true;

    for (
      const unsubscribe
      of this.unsubscribes
    ) {
      try {
        unsubscribe();
      } catch {
      }
    }

    this.unsubscribes =
      [];

    try {
      if (
        this.desconexao
      ) {
        await this.desconexao
          .cancel();
      }
    } catch {
    }

    this.desconexao =
      null;

    this.stream
      ?.getTracks()
      .forEach(
        (track) => {
          try {
            track.stop();
          } catch {
          }
        }
      );

    this.stream =
      null;

    if (this.peer) {
      try {
        this.peer
          .close();
      } catch {
      }
    }

    this.peer =
      null;

    try {
      await remove(
        ref(
          this.db,
          this.caminho()
        )
      );
    } catch {
    }
  }
}