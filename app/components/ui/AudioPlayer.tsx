"use client";

import { useEffect, useRef } from "react";

type AudioPlayerProps = {
  src: string;
  autoPlay?: boolean;
  titulo?: string;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
};

export default function AudioPlayer({
  src,
  autoPlay = false,
  titulo,
  onPlay,
  onPause,
  className = "",
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [src, autoPlay]);

  const parar = () => {
    onPlay?.();
  };

  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-4 ${className}`}>
      {titulo && (
        <p className="text-sm font-bold text-blue-300 mb-3">{titulo}</p>
      )}

      <audio
        ref={audioRef}
        controls
        className="w-full"
        src={src}
        autoPlay={autoPlay}
        onLoadedMetadata={parar}
        onCanPlay={parar}
        onPlaying={parar}
        onPlay={parar}
        onPause={onPause}
      />

      <p className="text-xs text-slate-400 mt-2">
        Compatível com Android, iPhone e Desktop.
      </p>
    </div>
  );
}
