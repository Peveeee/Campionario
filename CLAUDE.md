# Campionario — istruzioni per Claude Code

Gestionale web per studi italiani di interior design. Interfaccia interamente in italiano.

## Comandi

- `npm run dev`: server di sviluppo su http://localhost:3000
- `npm test`: test unitari (Vitest)
- `npm run test:e2e`: test end-to-end (Playwright)
- `npm run typecheck`: controllo dei tipi
- `npx supabase start` / `npx supabase db reset`: database locale con migrazioni e seed

Prima di dire che un passo è finito: `npm run typecheck`, `npm test` e, se hai toccato il flusso cliente, `npm run test:e2e`. Tutti verdi.

## Regole che non si discutono

- **Importi in centesimi interi** (`integer` in Postgres, `number` intero in TypeScript), mai float. Percentuali in punti base (3500 = 35%). Quantità in centesimi di unità (1450 = 14,5 mq). Usa le funzioni di `src/lib/` (`denaro.ts`, `prezzi.ts`, `formato.ts`): non riscriverle.
- **Prezzi IVA esclusa.** L'IVA al 22% compare solo nei totali mostrati al cliente.
- **Formato italiano ovunque:** `1.234,56 €`, date `gg/mm/aaaa`, misure in cm. Campi numerici con `CampoNumero` (`src/components/ui/input.tsx`).
- **Multi-tenant:** ogni tabella ha `studio_id` e una policy RLS che isola lo studio. Nessuna tabella senza RLS attiva.
- **Il cliente non legge mai le tabelle.** Accede solo tramite funzioni Postgres `security definer` che ricevono il token del link e restituiscono solo campi pubblici. Il ruolo `anon` non ha `select` su nessuna tabella.
- **Token dei link:** casuali (almeno 32 byte), salvati solo come hash SHA-256, con scadenza e revoca.
- **Segreti:** mai nel codice né nei commit. `SUPABASE_SERVICE_ROLE_KEY` solo lato server, mai con prefisso `NEXT_PUBLIC_`.
- **Dipendenze a versione esatta** (niente `^` o `~`). Prima di aggiungerne una, chiedi.
- **Migrazioni SQL** solo in `supabase/migrations/`, una per modifica, mai modificare una migrazione già applicata.

## Design

Il design è una priorità quanto il funzionamento: gli utenti sono interior designer.

Skill di design del progetto, in `.claude/skills/`:

- **`frontend-design`:** principi per un design distintivo e non generico. Usala prima di creare o ripensare una schermata.
- **`design-campionario`:** la direzione visiva, le regole di UX e i testi di Campionario. Usala sempre, insieme alla precedente.
- **`revisione-design`:** screenshot reali da desktop e da telefono, controllo critico e correzione. Usala prima di dire che una schermata è finita.

Se nella sessione sono disponibili altre skill di design o di revisione dell'interfaccia, usale in aggiunta a queste. Se una di esse contraddice `design-campionario`, vince `design-campionario`.

Il sistema visivo esiste già: usalo, non inventarne un altro.

- Valori di stile in `src/app/globals.css` (colori carta, nebbia, grafite, pietra, blu avio, stati bosco/mattone/ocra/prugna).
- Componenti in `src/components/`: `Button`, `Badge`/`BadgeStato`, `Campo`, `CampoNumero`, `Segmented`, `Pannello`, `Avviso`, `SchedaCampione`, `BarraBudget`.
- Bodoni Moda solo per nomi di progetti e stanze; Instrument Sans per il resto.
- Gli stati sono sempre colore + icona + parola.
- Da telefono la vista cliente deve funzionare con una mano: pulsanti grandi in basso.
- Testi in italiano semplice, frasi brevi, verbi d'azione sui pulsanti ("Approva", "Crea il link"). Niente maiuscolo per le etichette.

## Struttura

- `src/lib/`: calcoli e formattazione, puri e testati.
- `src/dominio/`: tipi ed etichette.
- `src/dati/`: oggi è l'archivio nel browser del prototipo (`store.ts`, `accesso.ts`, `azioni.ts`, `cliente.ts`). Le schermate del super mini MVP devono leggere da Supabase. Le funzioni in `azioni.ts` e `cliente.ts` sono il riferimento del comportamento atteso.
- `supabase/`: migrazioni, seed, test delle policy.

## Come lavorare

- Procedi per fasi e fermati alla fine di ognuna, mostrando cosa hai fatto e come verificarlo.
- Se un requisito è ambiguo, fai una domanda invece di indovinare.
- Controlla la documentazione attuale di Next.js e Supabase prima di scegliere un'API: non fidarti della memoria.
