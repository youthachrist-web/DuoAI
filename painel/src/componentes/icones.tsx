/**
 * Os ícones do painel, desenhados à mão em SVG.
 *
 * Sem biblioteca de propósito: são vinte e poucos traços e uma dependência a
 * menos é uma forma a menos de o painel deixar de construir. Todos herdam a cor
 * do texto e o tamanho vem da classe, para servirem tanto num botão como numa
 * marca de água gigante atrás de um número.
 */
import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { className?: string };

function Svg({ children, className = "h-5 w-5", ...resto }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...resto}
    >
      {children}
    </svg>
  );
}

export const Grelha = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Svg>
);

export const Calendario = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
    <path d="M8 2.5v4M16 2.5v4M3 10h18" />
    <path d="m9 15.5 2 2 4-4" />
  </Svg>
);

export const Enviar = (p: Props) => (
  <Svg {...p}>
    <path d="M12 20V5" />
    <path d="m5.5 11.5 6.5-6.5 6.5 6.5" />
  </Svg>
);

export const Robo = (p: Props) => (
  <Svg {...p}>
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 4v4M8 14h.01M16 14h.01M9.5 17.5h5" />
  </Svg>
);

export const Pessoas = (p: Props) => (
  <Svg {...p}>
    <path d="M15.5 20v-1.5a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4V20" />
    <circle cx="9.5" cy="7.5" r="3.5" />
    <path d="M21 20v-1.5a4 4 0 0 0-3-3.87M16.5 4.13a4 4 0 0 1 0 6.74" />
  </Svg>
);

export const Alvo = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </Svg>
);

export const Documento = (p: Props) => (
  <Svg {...p}>
    <path d="M14 2.5H7A2.5 2.5 0 0 0 4.5 5v14A2.5 2.5 0 0 0 7 21.5h10a2.5 2.5 0 0 0 2.5-2.5V8z" />
    <path d="M14 2.5V8h5.5M8.5 13h7M8.5 17h4" />
  </Svg>
);

export const Contrato = (p: Props) => (
  <Svg {...p}>
    <path d="M14 2.5H7A2.5 2.5 0 0 0 4.5 5v14A2.5 2.5 0 0 0 7 21.5h6" />
    <path d="M14 2.5V8h5.5" />
    <path d="m16 18.5 5-5 2 2-5 5H16z" />
  </Svg>
);

export const Jornal = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <path d="M7 9h6M7 13h6M7 16h3M16.5 9h1M16.5 13h1" />
  </Svg>
);

export const Pulso = (p: Props) => (
  <Svg {...p}>
    <path d="M3 12h3.5l2-6 3.5 12 2.5-8 1.5 2H21" />
  </Svg>
);

export const Sino = (p: Props) => (
  <Svg {...p}>
    <path d="M18 8.5a6 6 0 1 0-12 0c0 6-2 7.5-2 7.5h16s-2-1.5-2-7.5" />
    <path d="M10.3 20a2 2 0 0 0 3.4 0" />
  </Svg>
);

export const Caixa = (p: Props) => (
  <Svg {...p}>
    <path d="M21 12.5V18a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18v-5.5" />
    <path d="M3 12.5 5.5 5A2 2 0 0 1 7.4 3.5h9.2A2 2 0 0 1 18.5 5L21 12.5h-5l-1.5 2.5h-5L8 12.5H3z" />
  </Svg>
);

export const Recarregar = (p: Props) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
    <path d="M3 21v-5h5" />
  </Svg>
);

export const Atencao = (p: Props) => (
  <Svg {...p}>
    <path d="M10.3 3.6 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4.5M12 17.2h.01" />
  </Svg>
);

export const Conversa = (p: Props) => (
  <Svg {...p}>
    <path d="M20.5 11.6a8 8 0 0 1-11.7 7.1L3.5 20.5l1.8-5.3A8 8 0 1 1 20.5 11.6z" />
  </Svg>
);

export const Dinheiro = (p: Props) => (
  <Svg {...p}>
    <path d="M12 2.5v19" />
    <path d="M17 6.5H9.8a3.3 3.3 0 0 0 0 6.5h4.4a3.3 3.3 0 0 1 0 6.5H6" />
  </Svg>
);

export const Escudo = (p: Props) => (
  <Svg {...p}>
    <path d="M12 2.5 4 6v6c0 5 3.4 8.7 8 9.5 4.6-.8 8-4.5 8-9.5V6z" />
  </Svg>
);

export const Tocar = (p: Props) => (
  <Svg {...p}>
    <path d="M6 4.5 19 12 6 19.5z" />
  </Svg>
);

export const Apagar = (p: Props) => (
  <Svg {...p}>
    <path d="m5 15 6-6 5 5-4 4H7z" />
    <path d="M11 9 16 4l4 4-5 5M4 21h16" />
  </Svg>
);

export const Descarregar = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3v12" />
    <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
    <path d="M4 20h16" />
  </Svg>
);

export const Lupa = (p: Props) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.3-4.3" />
  </Svg>
);

export const Telemovel = (p: Props) => (
  <Svg {...p}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </Svg>
);

export const Relogio = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.2 1.9" />
  </Svg>
);

export const Estrela = (p: Props) => (
  <Svg {...p}>
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
  </Svg>
);

export const Marca = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden>
    <rect width="40" height="40" rx="11" className="fill-marca" />
    <circle cx="12" cy="14" r="2.6" fill="white" fillOpacity="0.55" />
    <circle cx="12" cy="26" r="2.6" fill="white" fillOpacity="0.55" />
    <path
      d="M20 11h4.5a9 9 0 0 1 0 18H20a1.6 1.6 0 0 1-1.6-1.6V12.6A1.6 1.6 0 0 1 20 11zm3.4 4.4v9.2a4.6 4.6 0 0 0 0-9.2z"
      fill="white"
    />
  </svg>
);
