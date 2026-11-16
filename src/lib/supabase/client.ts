import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./tipi-database";
import { supabaseEnv } from "./env";

/** Client Supabase per i componenti client. */
export function creaClientBrowser() {
  const { url, chiave } = supabaseEnv();
  return createBrowserClient<Database>(url, chiave);
}
