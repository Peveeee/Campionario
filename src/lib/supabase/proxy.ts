import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

/** Percorsi raggiungibili senza accesso. */
const PUBBLICI = ["/accedi", "/auth", "/cliente"];

function ePubblico(percorso: string) {
  return PUBBLICI.some((p) => percorso === p || percorso.startsWith(`${p}/`));
}

/**
 * Rinnova la sessione a ogni richiesta e manda a /accedi chi non ha fatto
 * l'accesso. Non inserire codice tra createServerClient e getClaims().
 */
export async function aggiornaSessione(request: NextRequest) {
  const { url, chiave } = supabaseEnv();
  let risposta = NextResponse.next({ request });

  const supabase = createServerClient(url, chiave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(daImpostare, intestazioni) {
        for (const { name, value } of daImpostare) request.cookies.set(name, value);
        risposta = NextResponse.next({ request });
        for (const { name, value, options } of daImpostare) {
          risposta.cookies.set(name, value, options);
        }
        for (const [nome, valore] of Object.entries(intestazioni ?? {})) {
          risposta.headers.set(nome, valore);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const percorso = request.nextUrl.pathname;

  if (!data?.claims && !ePubblico(percorso) && percorso !== "/") {
    const destinazione = request.nextUrl.clone();
    destinazione.pathname = "/accedi";
    destinazione.search = "";
    destinazione.searchParams.set("poi", percorso);
    return NextResponse.redirect(destinazione);
  }

  return risposta;
}
