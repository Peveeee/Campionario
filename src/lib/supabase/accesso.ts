"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { percorsoSicuro } from "./percorso";
import { creaClientServer } from "./server";

export type EsitoInvio =
  | { stato: "inviato"; email: string }
  | { stato: "errore"; messaggio: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Manda il magic link. Al primo accesso il database crea lo studio. */
export async function inviaMagicLink(
  _precedente: EsitoInvio | null,
  dati: FormData,
): Promise<EsitoInvio> {
  const email = String(dati.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) {
    return { stato: "errore", messaggio: "Controlla l'indirizzo email." };
  }

  const poi = percorsoSicuro(dati.get("poi"));
  const origine =
    process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "http://localhost:3000";

  const supabase = await creaClientServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origine}/auth/confirm?poi=${encodeURIComponent(poi)}`,
    },
  });

  if (error) {
    return {
      stato: "errore",
      messaggio:
        error.status === 429
          ? "Hai chiesto troppi link: riprova tra un minuto."
          : "Non siamo riusciti a mandare il link. Riprova.",
    };
  }
  return { stato: "inviato", email };
}

export async function esci() {
  const supabase = await creaClientServer();
  await supabase.auth.signOut();
  redirect("/accedi");
}
