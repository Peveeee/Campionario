import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./tipi-database";
import { supabaseEnv } from "./env";

/**
 * Client Supabase per Server Component, Server Action e Route Handler.
 * Va creato a ogni richiesta, mai condiviso.
 */
export async function creaClientServer() {
  const { url, chiave } = supabaseEnv();
  const archivioCookie = await cookies();

  return createServerClient<Database>(url, chiave, {
    cookies: {
      getAll() {
        return archivioCookie.getAll();
      },
      setAll(daImpostare) {
        try {
          for (const { name, value, options } of daImpostare) {
            archivioCookie.set(name, value, options);
          }
        } catch {
          // Chiamato da un Server Component: i cookie li aggiorna il proxy.
        }
      },
    },
  });
}

/** Utente corrente verificato (firma del JWT controllata), o null. */
export async function utenteCorrente() {
  const supabase = await creaClientServer();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
}
