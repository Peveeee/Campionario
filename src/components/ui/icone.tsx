import type { ReactNode, SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { dimensione?: number };

function Icona({ dimensione = 20, children, ...props }: Props & { children: ReactNode }) {
  return (
    <svg
      width={dimensione}
      height={dimensione}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/* Navigazione */

export const IconaProgetti = (p: Props) => (
  <Icona {...p}>
    <rect x="4" y="6" width="13" height="14" rx="1" />
    <path d="M7 3h12a1 1 0 0 1 1 1v13" />
    <path d="M7.5 15.5h6" />
  </Icona>
);

export const IconaLibreria = (p: Props) => (
  <Icona {...p}>
    <rect x="3.5" y="4" width="7" height="7" rx="0.5" />
    <rect x="13.5" y="4" width="7" height="7" rx="0.5" />
    <rect x="3.5" y="13" width="7" height="7" rx="0.5" />
    <path d="M13.5 16.5h7M17 13v7" />
  </Icona>
);

export const IconaClienti = (p: Props) => (
  <Icona {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
  </Icona>
);

export const IconaFornitori = (p: Props) => (
  <Icona {...p}>
    <path d="M3 8.5 12 4l9 4.5v11H3z" />
    <path d="M8 19.5v-6h8v6" />
  </Icona>
);

export const IconaCruscotto = (p: Props) => (
  <Icona {...p}>
    <path d="M4 19.5h16" />
    <path d="M7 16v-5M12 16V7M17 16v-3" />
  </Icona>
);

export const IconaStile = (p: Props) => (
  <Icona {...p}>
    <rect x="3.5" y="3.5" width="8" height="17" rx="0.5" />
    <path d="M11.5 7.5 17 5l3.5 8.5-9 4" />
    <circle cx="7.5" cy="16.5" r="1" />
  </Icona>
);

/* Stati */

export const IconaApprovato = (p: Props) => (
  <Icona strokeWidth={2} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icona>
);

export const IconaRifiutato = (p: Props) => (
  <Icona strokeWidth={2} {...p}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Icona>
);

export const IconaDaRivedere = (p: Props) => (
  <Icona strokeWidth={2} {...p}>
    <path d="M19 12a7 7 0 1 1-2.1-5" />
    <path d="M19 4.5V8h-3.5" />
  </Icona>
);

export const IconaProposto = (p: Props) => (
  <Icona strokeWidth={2} {...p}>
    <circle cx="12" cy="12" r="6" />
  </Icona>
);

export const IconaAttenzione = (p: Props) => (
  <Icona strokeWidth={2} {...p}>
    <path d="M12 4 21 19.5H3z" />
    <path d="M12 10v4M12 17v.01" />
  </Icona>
);

export const IconaOrologio = (p: Props) => (
  <Icona strokeWidth={2} {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7.5V12l3 2" />
  </Icona>
);

/* Azioni */

export const IconaEsci = (p: Props) => (
  <Icona {...p}>
    <path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5" />
    <path d="M10 8l-4 4 4 4M6 12h10" />
  </Icona>
);

export const IconaRipristina = (p: Props) => (
  <Icona {...p}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
    <path d="M4.5 4.5v4h4" />
  </Icona>
);

export const IconaFreccia = (p: Props) => (
  <Icona {...p}>
    <path d="M9 6l6 6-6 6" />
  </Icona>
);
