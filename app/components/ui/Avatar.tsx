"use client";

type AvatarProps = {
  nome?: string;
  foto?: string;
  tamanho?: "sm" | "md" | "lg";
  online?: boolean;
};

export default function Avatar({
  nome = "",
  foto,
  tamanho = "md",
  online = false,
}: AvatarProps) {
  const tamanhos = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-20 h-20 text-2xl",
  };

  const iniciais = nome
    .trim()
    .split(" ")
    .slice(0,2)
    .map(p=>p[0]?.toUpperCase())
    .join("") || "👤";

  return (
    <div className="relative inline-flex">
      {foto ? (
        <img
          src={foto}
          alt={nome}
          className={`${tamanhos[tamanho]} rounded-full object-cover border-2 border-slate-700`}
        />
      ) : (
        <div className={`${tamanhos[tamanho]} rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-black text-white`}>
          {iniciais}
        </div>
      )}

      {online && (
        <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-slate-900"></span>
      )}
    </div>
  );
}
