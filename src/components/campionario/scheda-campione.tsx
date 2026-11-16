import { BadgeStato } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatDimensioni, formatEuro, formatQuantita } from "@/lib/formato";
import { totaleRiga } from "@/lib/prezzi";
import type { Articolo, Fornitore } from "@/dominio/tipi";
import { Illustrazione } from "./illustrazione";

/**
 * La scheda campione: foto (o disegno) protagonista, con l'etichetta della finitura
 * appoggiata sopra come un campione fisico. È l'elemento riconoscibile dell'app.
 */
export function SchedaCampione({
  articolo,
  fornitore,
  nascondiFornitore = false,
  className,
}: {
  articolo: Articolo;
  fornitore?: Fornitore | null;
  nascondiFornitore?: boolean;
  className?: string;
}) {
  const totale = totaleRiga(articolo.prezzoClienteUnitario, articolo.quantita);
  const dimensioni = formatDimensioni(articolo.dimensioni);
  const rifiutato = articolo.stato === "rifiutato";

  return (
    <article className={cn("group flex flex-col", className)}>
      <div
        className="relative aspect-[4/5] overflow-hidden"
        style={{ backgroundColor: `color-mix(in oklab, ${articolo.coloreCampione} 14%, #f7f7f5)` }}
      >
        {articolo.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- in fase 2 diventa next/image con Storage
          <img
            src={articolo.fotoUrl}
            alt=""
            className={cn("absolute inset-0 size-full object-cover", rifiutato && "grayscale")}
          />
        ) : (
          <Illustrazione
            categoria={articolo.categoria}
            className={cn("absolute inset-x-[18%] top-[16%] w-[64%] text-grafite/55", rifiutato && "opacity-50")}
          />
        )}

        <BadgeStato stato={articolo.stato} className="absolute top-3 left-3 shadow-etichetta" />

        <div className="absolute right-3 bottom-3 left-3 flex items-center gap-2.5 rounded-sm bg-carta py-1.5 pr-3 pl-1.5 shadow-etichetta">
          <span
            className="size-8 shrink-0 rounded-[2px] ring-1 ring-grafite/10 ring-inset"
            style={{ backgroundColor: articolo.coloreCampione }}
          />
          <span className="min-w-0 truncate text-xs leading-tight text-grafite">{articolo.finitura}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-3">
        <h3 className={cn("text-base leading-snug font-medium text-grafite", rifiutato && "text-pietra-scura line-through decoration-pietra/60")}>
          {articolo.nome}
        </h3>
        {!nascondiFornitore && fornitore && (
          <p className="truncate text-sm text-pietra-scura">
            {fornitore.ragioneSociale.replace(/\s+S\.(r\.l|n\.c|p\.A)\.?$/i, "")}
            <span className="ml-2 text-pietra">{articolo.codice}</span>
          </p>
        )}
        {dimensioni && <p className="text-sm text-pietra-scura">{dimensioni}</p>}
        {articolo.notaCliente && (
          <p className="mt-1 border-l-2 border-mattone/40 pl-2.5 text-sm text-grafite italic">
            {articolo.notaCliente}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 pt-2">
          <span className="cifre text-sm whitespace-nowrap text-pietra-scura">
            {formatQuantita(articolo.quantita, articolo.unita)}
            {!(articolo.quantita === 100 && articolo.unita === "pz") && (
              <> × {formatEuro(articolo.prezzoClienteUnitario)}</>
            )}
          </span>
          <span className={cn("cifre ml-auto text-base font-medium whitespace-nowrap", rifiutato && "text-pietra-scura")}>
            {formatEuro(totale)}
          </span>
        </div>
      </div>
    </article>
  );
}
