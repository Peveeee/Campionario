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

export type EsitoCodice = { messaggio: string } | null;

/** Entra con il codice numerico dell'email (6 cifre in locale, fino a 8 nel cloud): funziona anche da un altro dispositivo. */
export async function entraConCodice(_precedente: EsitoCodice, dati: FormData): Promise<EsitoCodice> {
  const email = String(dati.get("email") ?? "").trim().toLowerCase();
  const codice = String(dati.get("codice") ?? "").replace(/\s/g, "");
  if (!/^\d{6,8}$/.test(codice)) return { messaggio: "Scrivi tutte le cifre del codice che trovi nell'email." };

  const supabase = await creaClientServer();
  const { error } = await supabase.auth.verifyOtp({ email, token: codice, type: "email" });
  if (error) return { messaggio: "Codice sbagliato o scaduto. Controlla l'ultima email o chiedine uno nuovo." };

  redirect(percorsoSicuro(dati.get("poi")));
}

export async function esci() {
  const supabase = await creaClientServer();
  await supabase.auth.signOut();
  redirect("/accedi");
}
