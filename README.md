# Campionario

Gestionale per studi di interior design: schedario di arredi e finiture stanza per stanza, approvazioni del cliente da un link, ordini ai fornitori e margini per il titolare.

Questo è il **prototipo dimostrativo (MVP per i soci)**: cruscotto, progetti, schedario per stanza con pannello di modifica e libreria, link cliente con approvazioni e varianti, ordini con acconti e anteprima PDF, riepilogo dei margini. Funziona senza backend: i dati sono nel browser. Il backend Supabase arriverà in seguito senza cambiare le schermate.

## Avvio locale

Servono Node.js 20.9 o successivo e Docker in esecuzione.

```bash
npm install
npm run db:start          # Supabase locale: Postgres, Auth, Storage, Mailpit
npm run db:reset          # applica supabase/migrations e carica supabase/seed.sql
cp .env.example .env.local
npm run dev
```

In `.env.local` metti i valori stampati da `npx supabase status` (`API_URL` e `PUBLISHABLE_KEY`).
Se Docker non riesce a scaricare le immagini da public.ecr.aws, anteponi
`SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io` a `npm run db:start`.

Apri http://localhost:3000 ed entra con la tua email: il magic link arriva su Mailpit,
http://127.0.0.1:54324. Al primo accesso con un'email nuova nasce uno studio e tu ne sei titolare.
Lo studio di esempio entra con `giulia@studiovaresi.example` (titolare) o
`tommaso@studiovaresi.example` (designer).

### Variabili d'ambiente

| Variabile | A cosa serve |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Indirizzo del progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chiave pubblica (publishable); i dati li protegge RLS |
| `NEXT_PUBLIC_SITE_URL` | URL pubblico del sito, usato nel magic link (in locale si può omettere) |

Nessuna chiave segreta serve all'app: il cliente passerà da funzioni Postgres `security definer`.

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Server di sviluppo |
| `npm run build` / `npm start` | Build e avvio di produzione |
| `npm test` | Test unitari (Vitest): prezzi, margini, budget, acconti, formattazione, accesso per ruolo |
| `npm run test:e2e` | Test end-to-end (Playwright), su desktop e telefono; serve Supabase locale avviato |
| `npm run typecheck` | Controllo dei tipi |
| `npm run test:db` | Test delle policy RLS (pgTAP), con Supabase locale avviato |
| `npm run db:tipi` | Rigenera i tipi TypeScript dal database locale |
| `npx tsx scripts/genera-seed.ts` | Rigenera `supabase/seed.sql` da `src/dati/seed.ts` |

La prima volta, prima di `npm run test:e2e`, esegui `npx playwright install chromium`.

## Super mini MVP (in corso)

Obiettivo: uno studio vero lo usa su un progetto vero, dall'accesso con email alle risposte del cliente.
Ordini, margini, varianti e cruscotto restano nel codice ma fuori dalla navigazione.

- **Fase 1, fatta:** schema Supabase con RLS (`supabase/migrations/`), test delle policy
  (`supabase/tests/database/`), seed dallo studio di esempio, accesso con magic link
  (`src/lib/supabase/`, `src/proxy.ts`, `src/app/auth/confirm/`).
- **Fase 2:** progetti, stanze e articoli su Supabase, foto su Storage. Fino ad allora le schermate
  dei progetti leggono ancora l'archivio di esempio nel browser.
- **Fase 3:** link e risposte del cliente.
- **Fase 4:** online su Supabase cloud e Vercel.

## Struttura

```
src/
  app/                  Rotte (App Router)
    accedi/             Scelta del ruolo
    (studio)/           Area dello studio, con menu e controllo della sessione
      progetti/         Elenco progetti
      stile/            Sistema visivo: colori, tipografia, componenti
  components/
    ui/                 Componenti di base (pulsanti, badge, campi, icone)
    campionario/        Scheda campione, palette del progetto, disegni per categoria
    progetto/           Indicatore di fase, barra del budget
    shell/              Menu laterale e barra in basso da telefono
  dati/
    seed.ts             Studio di esempio
    accesso.ts          Letture e scritture filtrate per studio e per ruolo
    store.ts            Archivio nel browser e hook React
  dominio/              Tipi ed etichette in italiano
  lib/                  Calcoli e formattazione, senza dipendenze dall'interfaccia
e2e/                    Test Playwright
```

## Regole sui numeri

- **Importi** in centesimi interi (`519750` = 5.197,50 €), sempre IVA esclusa. L'IVA al 22% compare solo nei totali per il cliente.
- **Percentuali** in punti base (`3500` = 35%).
- **Quantità** in centesimi di unità (`1450` = 14,5 mq). **Dimensioni** in millimetri, mostrate in cm.
- Ogni divisione arrotonda al centesimo: 0,5 si arrotonda per eccesso, cioè in direzione opposta allo zero. Il calcolo passa da `dividiArrotondando` in `lib/denaro.ts`, e nessun float entra mai in un calcolo monetario.
- In tutta l'interfaccia i numeri si scrivono e si leggono all'italiana: `1.234,56 €`, date `gg/mm/aaaa`.

## Ruoli

| | Titolare | Designer | Cliente (fase 3) |
|---|---|---|---|
| Progetti, stanze, articoli | sì | sì | solo il suo progetto, dal link |
| Prezzo cliente | sì | sì | sì |
| Costo netto e ricarico | legge e scrive | scrive, non rilegge | mai |
| Margini, riepilogo, dashboard economica | sì | no | mai |

Nel prototipo queste regole vivono in `src/dati/accesso.ts` e sono coperte dai test. Con Supabase diventano policy RLS:

- i costi stanno in tabelle separate (`costi_articoli`, `costi_prodotti`), così il database può negarli riga per riga;
- il cliente non accede alle tabelle: passa da funzioni dedicate, che restituiscono solo i campi pubblici.

## Dati di esempio

Lo studio di esempio è Studio Varesi Interni, a Milano. Contiene:

- 2 progetti: Casa Ferraris e Attico Benassi;
- 4 stanze;
- 20 articoli in tutti gli stati;
- 5 fornitori e 10 prodotti in libreria, tutti inventati.

Nei dati ci sono anche alcuni casi da verificare nelle fasi successive:

- il bagno di Casa Ferraris è fuori budget;
- la lampada Bricola è da rivedere, perché la finitura è cambiata dopo l'approvazione;
- il costo della sospensione Murano Fil è aumentato dopo l'approvazione.

Le modifiche si salvano nel browser. Dal menu, **Ripristina i dati** torna allo stato iniziale.

## Fasi

Fatto nel prototipo: fondamenta, schedario e libreria, link cliente con approvazioni e varianti, ordini e acconti, avvisi sui costi, cruscotto e riepilogo.

Mancano per il prodotto vero: backend Supabase con RLS e relativi test, anagrafiche clienti e fornitori modificabili, caricamento foto, creazione di progetti e stanze, PDF scaricabile, esportazione CSV come file, fattura elettronica tramite un fornitore SdI.
