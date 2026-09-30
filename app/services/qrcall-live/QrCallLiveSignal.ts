import {
  Database,
  Unsubscribe,
  get,
  onChildAdded,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
} from "firebase/database";

export type QrCallLiveLado =
  | "visitante"
  | "morador";

export type QrCallLiveTipo =
  | "audio"
  | "video";

export type QrCallLiveSinalizacaoConfig = {
  db: Database;
  unidadeId: string;
  criadoEm: string;
  lado: QrCallLiveLado;
};

type QrCallLiveDescricao = {
  type: RTCSdpType;
  sdp: string;
};

type QrCallLiveSessao = {
  unidadeId?: string;
  criadoEm?: string;
  tipo?: QrCallLiveTipo;
  estado?: string;
  iniciadaPor?: QrCallLiveLado;
  criadaEmMs?: number;
  atualizadaEmMs?: number;
  offer?: QrCallLiveDescricao;
  answer?: QrCallLiveDescricao;
};

function validarSegmento(
  valor: string,
  nome: string
) {
  const limpo =
    String(valor || "").trim();

  if (!limpo) {
    throw new Error(
      `${nome} e obrigatorio.`
    );
  }

  if (
    /[.#$[\]/]/.test(
      limpo
    )
  ) {
    throw new Error(
      `${nome} contem caractere invalido para Firebase.`
    );
  }

  return limpo;
}

export function criarQrCallLiveSessaoId(
  criadoEm: string
) {
  const original =
    String(criadoEm || "").trim();

  if (!original) {
    throw new Error(
      "criadoEm e obrigatorio."
    );
  }

  const timestamp =
    Date.parse(original);

  if (
    !Number.isFinite(
      timestamp
    )
  ) {
    throw new Error(
      "criadoEm invalido para QrCall Live."
    );
  }

  return String(timestamp);
}

export class QrCallLiveSignal {
  private readonly db:
    Database;

  private readonly unidadeId:
    string;

  private readonly criadoEm:
    string;

  private readonly lado:
    QrCallLiveLado;

  private readonly sessaoId:
    string;

  private readonly caminho:
    string;

  private unsubscribes:
    Unsubscribe[] = [];

  private candidatosRecebidos =
    new Set<string>();

  // QRCALL_LIVE_NEGOCIACAO_GERACAO_V2
  // Cada tentativa de mídia tem uma geracao propria.
  private negociacaoId:
    string | null =
    null;

  constructor(
    config:
      QrCallLiveSinalizacaoConfig
  ) {
    this.db =
      config.db;

    this.unidadeId =
      validarSegmento(
        config.unidadeId,
        "unidadeId"
      );

    this.criadoEm =
      String(
        config.criadoEm || ""
      ).trim();

    this.lado =
      config.lado;

    this.sessaoId =
      criarQrCallLiveSessaoId(
        this.criadoEm
      );

    this.caminho =
      `qrcall-live/${this.unidadeId}/${this.sessaoId}`;
  }

  getSessaoId() {
    return this.sessaoId;
  }

  getCaminho() {
    return this.caminho;
  }

  private referencia(
    complemento = ""
  ) {
    const caminho =
      complemento
        ? `${this.caminho}/${complemento}`
        : this.caminho;

    return ref(
      this.db,
      caminho
    );
  }

  async validarIdentidadeChamada() {
    const snapshot =
      await get(
        ref(
          this.db,
          `unidades-v2/${this.unidadeId}/chamada`
        )
      );

    const chamada =
      snapshot.val();

    if (!chamada) {
      throw new Error(
        "Chamada QrCall nao encontrada."
      );
    }

    const criadoEmAtual =
      String(
        chamada.criadoEm || ""
      ).trim();

    if (
      criadoEmAtual !==
      this.criadoEm
    ) {
      throw new Error(
        "A chamada mudou. Sessao Live recusada."
      );
    }

    return chamada;
  }

  async criarSessao(
    tipo: QrCallLiveTipo
  ) {
    await this
      .validarIdentidadeChamada();

    const agora =
      Date.now();

    await set(
      this.referencia(),
      {
        unidadeId:
          this.unidadeId,

        criadoEm:
          this.criadoEm,

        sessaoId:
          this.sessaoId,

        tipo,

        estado:
          "chamando",

        iniciadaPor:
          this.lado,

        criadaEmMs:
          agora,

        atualizadaEmMs:
          agora,
      }
    );
  }

  async prepararNovaNegociacaoVisitante() {
    if (
      this.lado !==
      "visitante"
    ) {
      throw new Error(
        "Somente o visitante pode preparar a negociacao."
      );
    }

    await this
      .validarIdentidadeChamada();

    const snapshot =
      await get(
        this.referencia()
      );

    if (!snapshot.exists()) {
      throw new Error(
        "Sessao QrCall Live nao encontrada."
      );
    }

    const dados =
      snapshot.val() as
        QrCallLiveSessao;

    if (
      String(
        dados.criadoEm || ""
      ) !== this.criadoEm
    ) {
      throw new Error(
        "Identidade da sessao Live invalida."
      );
    }

    const negociacaoId =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

    this.negociacaoId =
      negociacaoId;

    this.candidatosRecebidos
      .clear();

    await update(
      this.referencia(),
      {
        negociacaoId,

        offer:
          null,

        answer:
          null,

        iceVisitante:
          null,

        iceMorador:
          null,

        estado:
          "negociando",

        atualizadaEmMs:
          Date.now(),
      }
    );

    return negociacaoId;
  }

  async entrarNaSessao() {
    await this
      .validarIdentidadeChamada();

    let snapshot =
      await get(
        this.referencia()
      );

    if (!snapshot.exists()) {
      const limite =
        Date.now() + 8000;

      while (
        !snapshot.exists() &&
        Date.now() < limite
      ) {
        await new Promise<void>(
          (resolve) => {
            setTimeout(
              resolve,
              250
            );
          }
        );

        await this
          .validarIdentidadeChamada();

        snapshot =
          await get(
            this.referencia()
          );
      }
    }

    if (!snapshot.exists()) {
      throw new Error(
        "Sessao QrCall Live nao encontrada."
      );
    }

    const dados =
      snapshot.val() as
        QrCallLiveSessao;

    if (
      String(
        dados.criadoEm || ""
      ) !== this.criadoEm
    ) {
      throw new Error(
        "Identidade da sessao Live invalida."
      );
    }

    await update(
      this.referencia(),
      {
        estado:
          "conectando",

        atualizadaEmMs:
          Date.now(),
      }
    );

    return dados;
  }

  async publicarOferta(
    oferta:
      RTCSessionDescriptionInit
  ) {
    if (
      oferta.type !==
        "offer" ||
      !oferta.sdp
    ) {
      throw new Error(
        "Oferta WebRTC invalida."
      );
    }

    await set(
      this.referencia(
        "offer"
      ),
      {
        type:
          "offer",

        sdp:
          oferta.sdp,
      }
    );

    await update(
      this.referencia(),
      {
        estado:
          "oferta-criada",

        atualizadaEmMs:
          Date.now(),
      }
    );
  }

  async publicarResposta(
    resposta:
      RTCSessionDescriptionInit
  ) {
    if (
      resposta.type !==
        "answer" ||
      !resposta.sdp
    ) {
      throw new Error(
        "Resposta WebRTC invalida."
      );
    }

    await set(
      this.referencia(
        "answer"
      ),
      {
        type:
          "answer",

        sdp:
          resposta.sdp,
      }
    );

    await update(
      this.referencia(),
      {
        estado:
          "respondida",

        atualizadaEmMs:
          Date.now(),
      }
    );
  }

  async publicarIceCandidate(
    candidate:
      RTCIceCandidateInit
  ) {
    if (!candidate.candidate) {
      return;
    }

    const destino =
      this.lado ===
      "visitante"
        ? "iceVisitante"
        : "iceMorador";

    await push(
      this.referencia(
        destino
      ),
      {
        candidate:
          candidate.candidate,

        sdpMid:
          candidate.sdpMid ??
          null,

        sdpMLineIndex:
          candidate.sdpMLineIndex ??
          null,

        usernameFragment:
          candidate.usernameFragment ??
          null,

        criadoEmMs:
          Date.now(),
      }
    );
  }

  observarOferta(
    callback: (
      oferta:
        RTCSessionDescriptionInit
    ) => void
  ) {
    const unsubscribe =
      onValue(
        this.referencia(
          "offer"
        ),
        (snapshot) => {
          const dados =
            snapshot.val() as
              QrCallLiveDescricao |
              null;

          if (
            dados?.type ===
              "offer" &&
            dados.sdp
          ) {
            callback({
              type:
                "offer",
              sdp:
                dados.sdp,
            });
          }
        }
      );

    this.unsubscribes.push(
      unsubscribe
    );

    return unsubscribe;
  }

  observarResposta(
    callback: (
      resposta:
        RTCSessionDescriptionInit
    ) => void
  ) {
    const unsubscribe =
      onValue(
        this.referencia(
          "answer"
        ),
        (snapshot) => {
          const dados =
            snapshot.val() as
              QrCallLiveDescricao |
              null;

          if (
            dados?.type ===
              "answer" &&
            dados.sdp
          ) {
            callback({
              type:
                "answer",
              sdp:
                dados.sdp,
            });
          }
        }
      );

    this.unsubscribes.push(
      unsubscribe
    );

    return unsubscribe;
  }

  observarIceRemoto(
    callback: (
      candidate:
        RTCIceCandidateInit
    ) => void
  ) {
    const origem =
      this.lado ===
      "visitante"
        ? "iceMorador"
        : "iceVisitante";

    const unsubscribe =
      onChildAdded(
        this.referencia(
          origem
        ),
        (snapshot) => {
          if (
            this.candidatosRecebidos.has(
              snapshot.key || ""
            )
          ) {
            return;
          }

          if (snapshot.key) {
            this.candidatosRecebidos.add(
              snapshot.key
            );
          }

          const dados =
            snapshot.val();

          if (
            !dados?.candidate
          ) {
            return;
          }

          callback({
            candidate:
              dados.candidate,

            sdpMid:
              dados.sdpMid ??
              null,

            sdpMLineIndex:
              dados.sdpMLineIndex ??
              null,

            usernameFragment:
              dados.usernameFragment ??
              null,
          });
        }
      );

    this.unsubscribes.push(
      unsubscribe
    );

    return unsubscribe;
  }

  observarEstado(
    callback: (
      estado: string
    ) => void
  ) {
    const unsubscribe =
      onValue(
        this.referencia(
          "estado"
        ),
        (snapshot) => {
          const estado =
            String(
              snapshot.val() ||
              ""
            );

          if (estado) {
            callback(
              estado
            );
          }
        }
      );

    this.unsubscribes.push(
      unsubscribe
    );

    return unsubscribe;
  }

  async marcarConectado() {
    await update(
      this.referencia(),
      {
        estado:
          "conectado",

        atualizadaEmMs:
          Date.now(),
      }
    );
  }

  async marcarEncerrado() {
    await update(
      this.referencia(),
      {
        estado:
          "encerrado",

        encerradoPor:
          this.lado,

        encerradoEmMs:
          Date.now(),

        atualizadaEmMs:
          Date.now(),
      }
    );
  }

  pararListeners() {
    for (
      const unsubscribe
      of this.unsubscribes
    ) {
      unsubscribe();
    }

    this.unsubscribes =
      [];

    this.candidatosRecebidos
      .clear();
  }

  async removerSessao() {
    this.pararListeners();

    await remove(
      this.referencia()
    );
  }
}