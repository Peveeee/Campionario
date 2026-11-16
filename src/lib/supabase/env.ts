// Variabili pubbliche di Supabase (URL e chiave publishable).
// La chiave publishable può stare nel browser: i dati li protegge RLS.
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chiave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chiave) {
    throw new Error(
      "Mancano NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: copia .env.example in .env.local",
    );
  }
  return { url, chiave };
}
