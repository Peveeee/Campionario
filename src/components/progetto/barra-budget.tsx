import { BadgeFuoriBudget } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { StatoBudget } from "@/lib/budget";
import { formatEuroArrotondato, formatPercentuale } from "@/lib/formato";

/**
 * Totale a preventivo confrontato con il budget. Oltre il 100% la barra resta piena
 * e l'eccedenza compare in parole, con il badge "Fuori budget".
 */
export function BarraBudget({ stato, compatta = false }: { stato: StatoBudget; compatta?: boolean }) {
  if (stato.tipo === "senza_budget") {
    return (
      <p className="cifre text-sm text-pietra-scura">
        <span className="text-grafite">{formatEuroArrotondato(stato.totale)}</span> a preventivo, senza budget
      </p>
    );
  }

  const larghezza = Math.min(stato.utilizzo, 10_000) / 100;
  const colore = stato.tipo === "superato" ? "bg-prugna" : stato.tipo === "attenzione" ? "bg-ocra" : "bg-bosco";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="cifre text-sm text-pietra-scura">
          <span className="font-medium text-grafite">{formatEuroArrotondato(stato.totale)}</span>
          {" di "}
          {formatEuroArrotondato(stato.budget)}
        </p>
        {stato.tipo === "superato" ? (
          compatta ? (
            <BadgeFuoriBudget />
          ) : (
            <span className="flex items-center gap-2">
              <span className="cifre text-sm font-medium text-prugna">+{formatEuroArrotondato(stato.eccedenza)}</span>
              <BadgeFuoriBudget />
            </span>
          )
        ) : (
          <p className={cn("cifre text-sm", stato.tipo === "attenzione" ? "font-medium text-ocra" : "text-pietra-scura")}>
            {compatta ? formatPercentuale(Math.round(stato.utilizzo / 100) * 100) : `restano ${formatEuroArrotondato(stato.residuo)}`}
          </p>
        )}
      </div>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-linea"
        role="meter"
        aria-label="Budget utilizzato"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(stato.utilizzo / 100)}
      >
        <div className={cn("h-full rounded-full", colore)} style={{ width: `${larghezza}%` }} />
      </div>
    </div>
  );
}
