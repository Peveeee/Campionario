# ai-cad-studio.

## Campionario · Supabase (Fase 1, in corso)

### Avvio locale

Serve Docker in esecuzione.

```bash
npx supabase@3.1.0 start      # Postgres, Auth, Storage, Mailpit
npx supabase@3.1.0 db reset   # applica supabase/migrations
npx supabase@3.1.0 test db    # test delle policy (pgTAP)
npx supabase@3.1.0 gen types typescript --local > src/lib/supabase/tipi-database.ts
```

Se il registro predefinito delle immagini (public.ecr.aws) non è raggiungibile,
anteponi `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io` ai comandi.

Copia `.env.example` in `.env.local` con i valori di `npx supabase status`.
In locale le email del magic link arrivano su Mailpit: http://127.0.0.1:54324

### Struttura

- `supabase/migrations/` — tabelle, RLS, trigger del primo accesso
- `supabase/tests/database/` — test delle policy
- `src/lib/supabase/` — client browser/server (`@supabase/ssr`), proxy di sessione, azione del magic link
- `src/proxy.ts` — rinnovo della sessione e redirect ad `/accedi` (Next 16: ex `middleware.ts`)
- `src/app/auth/confirm/route.ts` — arrivo dal magic link

### Dipendenze e script da aggiungere al package.json del prototipo

```bash
npm i @supabase/ssr@0.12.7 @supabase/supabase-js@2.119.0 server-only
```

```json
"test:db": "supabase test db"
```
