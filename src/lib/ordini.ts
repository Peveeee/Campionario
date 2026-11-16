import type { Ordine } from "@/dominio/tipi";

/** Un ordine è in ritardo se la consegna prevista è passata e non risulta consegnato. */
export function inRitardo(o: Pick<Ordine, "stato" | "consegnaPrevista">, oggi: string = new Date().toISOString().slice(0, 10)): boolean {
  return o.stato !== "consegnato" && o.stato !== "bozza" && !!o.consegnaPrevista && o.consegnaPrevista < oggi;
}
