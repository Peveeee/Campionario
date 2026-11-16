"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

/**
 * Scelta tra poche opzioni mutuamente esclusive, accessibile come gruppo radio:
 * le frecce spostano la selezione, Tab entra ed esce dal gruppo.
 */
export function Segmented<T extends string>({
  etichetta,
  opzioni,
  valore,
  onCambia,
  className,
}: {
  etichetta: string;
  opzioni: readonly { valore: T; etichetta: string; conteggio?: number }[];
  valore: T;
  onCambia: (valore: T) => void;
  className?: string;
}) {
  const rif = useRef<HTMLDivElement>(null);

  function suTasto(e: KeyboardEvent, indice: number) {
    const passo = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!passo) return;
    e.preventDefault();
    const prossimo = (indice + passo + opzioni.length) % opzioni.length;
    const opzione = opzioni[prossimo];
    if (!opzione) return;
    onCambia(opzione.valore);
    rif.current?.querySelectorAll<HTMLButtonElement>("[role=radio]")[prossimo]?.focus();
  }

  return (
    <div
      ref={rif}
      role="radiogroup"
      aria-label={etichetta}
      className={cn("inline-flex rounded-md bg-nebbia p-1", className)}
    >
      {opzioni.map((o, i) => {
        const attivo = o.valore === valore;
        return (
          <button
            key={o.valore}
            type="button"
            role="radio"
            aria-checked={attivo}
            tabIndex={attivo ? 0 : -1}
            onClick={() => onCambia(o.valore)}
            onKeyDown={(e) => suTasto(e, i)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-sm whitespace-nowrap transition-colors",
              attivo ? "bg-carta font-medium text-grafite shadow-etichetta" : "text-pietra-scura hover:text-grafite",
            )}
          >
            {o.etichetta}
            {o.conteggio !== undefined && (
              <span className={cn("cifre text-xs", attivo ? "text-pietra-scura" : "text-pietra")}>{o.conteggio}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
