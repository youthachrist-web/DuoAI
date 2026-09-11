import type { ReactNode } from "react";

/* ------------------------------------------------------------- estrutura */

export function Cabecalho({ titulo, descricao, accao }: { titulo: string; descricao?: string; accao?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold leading-tight tracking-tight">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm leading-relaxed text-suave">{descricao}</p>}
      </div>
      {accao && <div className="shrink-0">{accao}</div>}
    </div>
  );
}

export function Cartao({
  titulo,
  etiqueta,
  accao,
  children,
  semPadding = false,
  className = "",
}: {
  titulo?: ReactNode;
  etiqueta?: ReactNode;
  accao?: ReactNode;
  children: ReactNode;
  semPadding?: boolean;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-borda bg-cartao ${className}`}>
      {(titulo || accao || etiqueta) && (
        <header className="flex items-start justify-between gap-3 border-b border-borda px-4 py-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
            {/* O título envolve em vez de ser cortado: "Contactos em espera — nada sai
                sem a tua ordem" perde o sentido todo se acabar em reticências. */}
            {titulo && <h2 className="text-[15px] font-semibold leading-snug">{titulo}</h2>}
            {etiqueta && <span className="etiqueta shrink-0">{etiqueta}</span>}
          </div>
          {accao && <div className="shrink-0">{accao}</div>}
        </header>
      )}
      <div className={semPadding ? "" : "p-4"}>{children}</div>
    </section>
  );
}

/* --------------------------------------------------------------- métricas */

export function Metrica({
  rotulo,
  valor,
  nota,
  marca,
}: {
  rotulo: string;
  valor: ReactNode;
  nota?: ReactNode;
  marca?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-borda bg-cartao p-5">
      {/* A marca de água só existe para dar peso ao cartão; não carrega informação,
          por isso fica escondida dos leitores de ecrã. */}
      {marca && (
        <div aria-hidden className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 text-marca/10">
          {marca}
        </div>
      )}
      <p className="etiqueta">{rotulo}</p>
      <p className="mt-2 text-[34px] font-bold leading-none tabular-nums tracking-tight">{valor}</p>
      {/* Sem percentagens inventadas: a nota só aparece quando há mesmo algo a dizer. */}
      {nota && <div className="mt-2.5 text-xs text-suave">{nota}</div>}
    </div>
  );
}

export function Selo({ children, tom = "neutro" }: { children: ReactNode; tom?: "neutro" | "bom" | "aviso" | "marca" }) {
  const cores = {
    neutro: "bg-fundo text-suave",
    bom: "bg-bom/10 text-bom",
    aviso: "bg-aviso/10 text-aviso",
    marca: "bg-marca-tenue text-marca",
  }[tom];
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${cores}`}>{children}</span>;
}

export function Pastilha({ ok, children }: { ok: boolean | null; children: ReactNode }) {
  const cor =
    ok === null ? "bg-suave/12 text-suave" : ok ? "bg-bom/10 text-bom" : "bg-aviso/10 text-aviso";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cor}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- controlos */

export function Botao({
  children,
  onClick,
  variante = "principal",
  disabled,
  pequeno = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: "principal" | "contorno" | "perigo";
  disabled?: boolean;
  pequeno?: boolean;
  className?: string;
}) {
  const tamanho = pequeno ? "px-2.5 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  const estilo = {
    principal: "bg-marca text-white hover:bg-marca-forte",
    contorno: "border border-borda bg-cartao hover:bg-fundo",
    perigo: "border border-alerta/40 text-alerta hover:bg-alerta/8",
  }[variante];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${tamanho} ${estilo} ${className}`}
    >
      {children}
    </button>
  );
}

export const campo =
  "w-full rounded-xl border border-borda bg-cartao px-3 py-2.5 text-sm text-texto outline-none focus:border-marca";

/* ------------------------------------------------------------ mensagens */

export function Aviso({ children, tom = "aviso" }: { children: ReactNode; tom?: "aviso" | "erro" }) {
  const cor =
    tom === "erro" ? "border-alerta/30 bg-alerta/8 text-alerta" : "border-aviso/30 bg-aviso-tenue text-aviso";
  return <p className={`rounded-xl border px-3 py-2.5 text-sm leading-relaxed ${cor}`}>{children}</p>;
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-suave">{children}</p>;
}

export function ACarregar({ children = "A carregar…" }: { children?: ReactNode }) {
  return <p className="py-10 text-center font-mono text-sm text-tenue">{children}</p>;
}

/* --------------------------------------------------------------- tabela */

export function Tabela({ colunas, children }: { colunas: string[]; children: ReactNode }) {
  return (
    <div className="sem-barra -mx-px overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-borda">
            {colunas.map((c, i) => (
              <th
                key={c}
                className={`etiqueta whitespace-nowrap px-4 py-3 text-left ${i === colunas.length - 1 ? "text-right" : ""}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Barra({ valor, maximo }: { valor: number; maximo: number }) {
  const pct = maximo > 0 ? Math.min(100, (valor / maximo) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-fundo">
      <div className="h-full rounded-full bg-marca transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}
