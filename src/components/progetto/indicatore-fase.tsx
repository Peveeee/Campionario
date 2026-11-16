import { cn } from "@/lib/cn";
import { ETICHETTA_FASE } from "@/dominio/etichette";
import { FASI, type Fase } from "@/dominio/tipi";

/** Le fasi sono una sequenza vera: le mostriamo come un percorso, con quella attuale in evidenza. */
export function IndicatoreFase({ fase, className }: { fase: Fase; className?: string }) {
  const attuale = FASI.indexOf(fase);
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <ol className="flex gap-1" aria-label={`Fase ${attuale + 1} di ${FASI.length}: ${ETICHETTA_FASE[fase]}`}>
        {FASI.map((f, i) => (
          <li
            key={f}
            aria-hidden="true"
            className={cn("h-1 flex-1 rounded-full", i < attuale ? "bg-grafite/70" : i === attuale ? "bg-avio" : "bg-linea")}
          />
        ))}
      </ol>
      <p className="text-sm text-pietra-scura" aria-hidden="true">
        <span className="font-medium text-grafite">{ETICHETTA_FASE[fase]}</span>
        <span className="ml-1.5 cifre">
          {attuale + 1}/{FASI.length}
        </span>
      </p>
    </div>
  );
}
