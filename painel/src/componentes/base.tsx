import type { ReactNode } from "react";

export function Cartao({
  titulo,
  accao,
  children,
  className = "",
}: {
  titulo?: ReactNode;
  accao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-borda bg-cartao ${className}`}
    >
      {(titulo || accao) && (
        <header className="flex items-center justify-between gap-3 border-b border-borda px-4 py-3">
          <h2 className="text-sm font-semibold">{titulo}</h2>
          {accao}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Metrica({ rotulo, valor, nota }: { rotulo: string; valor: ReactNode; nota?: string }) {
  return (
    <div className="rounded-xl border border-borda bg-cartao p-4">
      <p className="text-xs text-suave">{rotulo}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{valor}</p>
      {/* Sem percentagens inventadas: a nota só aparece quando há mesmo algo a dizer. */}
      {nota && <p className="mt-1 text-xs text-suave">{nota}</p>}
    </div>
  );
}

export function Pastilha({ ok, children }: { ok: boolean | null; children: ReactNode }) {
  const cor =
    ok === null
      ? "bg-suave/15 text-suave"
      : ok
        ? "bg-bom/12 text-bom"
        : "bg-aviso/12 text-aviso";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${cor}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Botao({
  children,
  onClick,
  variante = "principal",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: "principal" | "contorno";
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const estilo =
    variante === "principal"
      ? "bg-marca text-white hover:bg-marca-clara"
      : "border border-borda hover:bg-fundo";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${estilo} ${className}`}>
      {children}
    </button>
  );
}

export function Aviso({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-aviso/30 bg-aviso/8 px-3 py-2 text-sm text-aviso">
      {children}
    </p>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-suave">{children}</p>;
}
