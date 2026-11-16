import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { percorsoSicuro } from "@/lib/supabase/percorso";
import { creaClientServer } from "@/lib/supabase/server";
import { ModuloAccesso } from "./modulo-accesso";

export const metadata: Metadata = { title: "Accedi" };

/** Finiture della tavola materiali, dallo studio di esempio. */
const TAVOLA = [
  { finitura: "Bouclé avena", colore: "#D9D1C3" },
  { finitura: "Rovere termotrattato", colore: "#6B4A33" },
  { finitura: "Velluto salvia", colore: "#8E9B82" },
  { finitura: "Ottone brunito", colore: "#8C6A3F" },
  { finitura: "Grigio cenere", colore: "#9A968D" },
  { finitura: "Verde bottiglia", colore: "#2F4A3C" },
  { finitura: "Noce canaletto", colore: "#5A3D2B" },
  { finitura: "Lino naturale", colore: "#E4DDCF" },
  { finitura: "Vetro ambra", colore: "#C08A3E" },
];

const ERRORI: Record<string, string> = {
  link: "Questo link non vale più: è scaduto o è già stato usato. Chiedine uno nuovo qui sotto.",
  profilo: "Non troviamo lo studio collegato a questa email. Chiedi un nuovo link; se succede ancora, scrivi al supporto.",
};

export default async function Accedi({
  searchParams,
}: {
  searchParams: Promise<{ poi?: string; errore?: string }>;
}) {
  const { poi, errore } = await searchParams;
  const destinazione = percorsoSicuro(poi);

  const supabase = await creaClientServer();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims && errore !== "profilo") redirect(destinazione);

  return (
    <main className="grid min-h-dvh grid-rows-[auto_1fr] lg:grid-cols-[1.1fr_1fr] lg:grid-rows-none">
      <section className="flex flex-col gap-5 bg-nebbia px-6 pt-6 pb-0 sm:px-12 lg:justify-between lg:gap-12 lg:px-16 lg:py-14">
        <p className="titolo-display text-xl">Campionario</p>

        {/* Da desktop: la tavola dei materiali. */}
        <div className="hidden w-full max-w-[26rem] grid-cols-3 gap-3 lg:grid" aria-hidden="true">
          {TAVOLA.map((c, i) => (
            <figure key={c.finitura} className={i % 3 === 1 ? "translate-y-6" : undefined}>
              <div className="aspect-square shadow-etichetta" style={{ backgroundColor: c.colore }} />
              <figcaption className="mt-2 truncate text-xs text-pietra-scura">{c.finitura}</figcaption>
            </figure>
          ))}
        </div>

        <p className="hidden max-w-md text-lg text-grafite lg:block">
          Lo schedario di ogni progetto, stanza per stanza, con le approvazioni del cliente dal telefono.
        </p>

        {/* Da telefono: la stessa tavola, ridotta a una striscia di campioni. */}
        <div className="-mx-6 flex h-3 sm:-mx-12 lg:hidden" aria-hidden="true">
          {TAVOLA.map((c) => (
            <span key={c.finitura} className="h-full flex-1" style={{ backgroundColor: c.colore }} />
          ))}
        </div>
      </section>

      <section className="flex flex-col px-6 pt-10 pb-12 sm:px-12 lg:justify-center lg:px-20 lg:py-12">
        <div className="mx-auto w-full max-w-md">
          <ModuloAccesso poi={destinazione} errore={errore ? (ERRORI[errore] ?? ERRORI.link!) : null} />
        </div>
      </section>
    </main>
  );
}
