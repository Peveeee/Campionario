import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ETICHETTA_STATO } from "@/dominio/etichette";
import type { StatoApprovazione } from "@/dominio/tipi";
import {
  IconaApprovato,
  IconaAttenzione,
  IconaDaRivedere,
  IconaOrologio,
  IconaProposto,
  IconaRifiutato,
} from "./icone";

const stiliBadge = cva(
  "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-sm pl-1.5 pr-2 text-xs font-medium leading-none whitespace-nowrap",
  {
    variants: {
      tono: {
        bosco: "bg-bosco-velo text-bosco",
        mattone: "bg-mattone-velo text-mattone",
        ocra: "bg-ocra-velo text-ocra",
        prugna: "bg-prugna-velo text-prugna",
        neutro: "bg-neutro-velo text-pietra-scura",
        avio: "bg-avio-velo text-avio",
      },
    },
    defaultVariants: { tono: "neutro" },
  },
);

export function Badge({
  tono,
  icona,
  children,
  className,
}: VariantProps<typeof stiliBadge> & { icona?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn(stiliBadge({ tono }), className)}>
      {icona}
      {children}
    </span>
  );
}

const STATO: Record<StatoApprovazione, { tono: VariantProps<typeof stiliBadge>["tono"]; icona: ReactNode }> = {
  proposto: { tono: "neutro", icona: <IconaProposto dimensione={12} /> },
  approvato: { tono: "bosco", icona: <IconaApprovato dimensione={12} /> },
  rifiutato: { tono: "mattone", icona: <IconaRifiutato dimensione={12} /> },
  da_rivedere: { tono: "ocra", icona: <IconaDaRivedere dimensione={12} /> },
};

export function BadgeStato({ stato, className }: { stato: StatoApprovazione; className?: string }) {
  const { tono, icona } = STATO[stato];
  return (
    <Badge tono={tono} icona={icona} className={className}>
      {ETICHETTA_STATO[stato]}
    </Badge>
  );
}

export function BadgeFuoriBudget({ className }: { className?: string }) {
  return (
    <Badge tono="prugna" icona={<IconaAttenzione dimensione={12} />} className={className}>
      Fuori budget
    </Badge>
  );
}

export function BadgeInRitardo({ className }: { className?: string }) {
  return (
    <Badge tono="prugna" icona={<IconaOrologio dimensione={12} />} className={className}>
      In ritardo
    </Badge>
  );
}
