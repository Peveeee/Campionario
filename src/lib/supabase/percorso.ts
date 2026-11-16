/** Solo percorsi interni, per non trasformare ?poi= in un redirect aperto. */
export function percorsoSicuro(poi: unknown): string {
  return typeof poi === "string" && poi.startsWith("/") && !poi.startsWith("//") && !poi.startsWith("/\\")
    ? poi
    : "/progetti";
}
