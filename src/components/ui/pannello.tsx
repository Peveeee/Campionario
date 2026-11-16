"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconaRifiutato } from "./icone";

/**
 * Pannello laterale (da desktop) o a tutto schermo dal basso (da telefono).
 * Esc chiude, il fuoco entra nel pannello e torna dove era alla chiusura.
 * In shadcn/ui questo ruolo è del componente Sheet; qui è scritto a mano per non dipendere da Radix nel prototipo.
 */
export function Pannello({
  aperto,
  onChiudi,
  titolo,
  sottotitolo,
  children,
  piede,
  largo = false,
}: {
  aperto: boolean;
  onChiudi: () => void;
  titolo: string;
  sottotitolo?: ReactNode;
  children: ReactNode;
  piede?: ReactNode;
  largo?: boolean;
}) {
  const rif = useRef<HTMLDivElement>(null);
  const idTitolo = useId();

  useEffect(() => {
    if (!aperto) return;
    const precedente = document.activeElement as HTMLElement | null;
    rif.current?.focus();
    const suTasto = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChiudi();
    };
    document.addEventListener("keydown", suTasto);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", suTasto);
      document.body.style.overflow = overflow;
      precedente?.focus();
    };
  }, [aperto, onChiudi]);

  if (!aperto) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-grafite/30 animate-[dissolvenza_160ms_ease-out]" onClick={onChiudi} aria-hidden="true" />
      <div
        ref={rif}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitolo}
        tabIndex={-1}
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-xl bg-carta shadow-pannello outline-none animate-[sale_220ms_var(--ease-morbido)]",
          "sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[30rem] sm:rounded-none sm:animate-[entra_220ms_var(--ease-morbido)]",
          largo && "sm:w-[40rem]",
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-linea px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={idTitolo} className="titolo-display text-2xl leading-tight">
              {titolo}
            </h2>
            {sottotitolo && <div className="mt-1 text-sm text-pietra-scura">{sottotitolo}</div>}
          </div>
          <button
            type="button"
            onClick={onChiudi}
            className="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-md text-pietra-scura hover:bg-nebbia hover:text-grafite"
            aria-label="Chiudi"
          >
            <IconaRifiutato dimensione={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {piede && <footer className="flex flex-wrap items-center gap-3 border-t border-linea px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">{piede}</footer>}
      </div>
    </div>
  );
}
