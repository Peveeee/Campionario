import { cn } from "@/lib/cn";
import type { Articolo } from "@/dominio/tipi";

/**
 * La palette di un progetto: una striscia con i colori delle finiture scelte,
 * nell'ordine dello schedario. Gli articoli rifiutati restano fuori.
 */
export function PaletteProgetto({ articoli, className }: { articoli: readonly Articolo[]; className?: string }) {
  const campioni = articoli.filter((a) => a.stato !== "rifiutato");
  if (campioni.length === 0) return null;
  return (
    <div className={cn("flex h-2 w-full overflow-hidden", className)} role="img" aria-label={`Palette del progetto: ${campioni.map((a) => a.finitura).join(", ")}`}>
      {campioni.map((a) => (
        <span
          key={a.id}
          className={cn("h-full flex-1", a.stato !== "approvato" && "opacity-55")}
          style={{ backgroundColor: a.coloreCampione }}
          title={`${a.nome}: ${a.finitura}`}
        />
      ))}
    </div>
  );
}
