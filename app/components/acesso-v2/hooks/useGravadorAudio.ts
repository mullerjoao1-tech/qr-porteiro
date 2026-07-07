"use client";

import { useRef, useState } from "react";

type UseGravadorAudioProps = {
  podeGravar?: boolean;
  aoGravarErro?: () => void;
  aoIniciarGravacao?: () => void;
  aoFinalizarGravacao?: (blob: Blob) => void;
};

export function useGravadorAudio({
  podeGravar = true,
  aoGravarErro,
  aoIniciarGravacao,
  aoFinalizarGravacao,
}: UseGravadorAudioProps = {}) {
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  async function iniciarGravacao() {
    if (!podeGravar) {
      alert("Selecione uma unidade antes de gravar.");
      return;
    }

    if (typeof window === "undefined") return;

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Microfone não disponível neste navegador.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        setAudioBlob(blob);
        setGravandoAudio(false);

        stream.getTracks().forEach((track) => track.stop());

        aoFinalizarGravacao?.(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();

      setAudioBlob(null);
      setGravandoAudio(true);

      aoIniciarGravacao?.();

      setTimeout(() => {
        if (recorder.state === "recording") {
          pararGravacao();
        }
      }, 15000);
    } catch (erro) {
      console.error("Erro ao gravar áudio:", erro);
      alert("Não foi possível acessar o microfone.");
      setGravandoAudio(false);
      aoGravarErro?.();
    }
  }

  function pararGravacao() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      setGravandoAudio(false);
    }
  }

  return {
    gravandoAudio,
    setGravandoAudio,
    audioBlob,
    setAudioBlob,
    iniciarGravacao,
    pararGravacao,
  };
}