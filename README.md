# Campionario

Gestionale per studi di interior design: schedario di arredi e finiture stanza per stanza, approvazioni del cliente da un link, ordini ai fornitori e margini per il titolare.

Questo è il **prototipo dimostrativo (MVP per i soci)**: cruscotto, progetti, schedario per stanza con pannello di modifica e libreria, link cliente con approvazioni e varianti, ordini con acconti e anteprima PDF, riepilogo dei margini. Funziona senza backend: i dati sono nel browser. Il backend Supabase arriverà in seguito senza cambiare le schermate.

## Avvio locale

Serve Node.js 20.9 o successivo.

```bash
npm install
npm run dev
```

Apri http://localhost:3000. Scegli se entrare come **titolare** (Giulia Varesi) o come **designer** (Tommaso Rinaldi). Il ruolo si cambia in qualsiasi momento dal menu.

### Variabili d'ambiente

Il prototipo non ne usa. Con il backend serviranno:

| Variabile | A cosa serve |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Indirizzo del progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chiave pubblica |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo lato server: link cliente e invio inviti |

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Server di sviluppo |
| `npm run build` / `npm start` | Build e avvio di produzione |
| `npm test` | Test unitari (Vitest): prezzi, margini, budget, acconti, formattazione, accesso per ruolo |
| `npm run test:e2e` | Test end-to-end (Playwright), su desktop e telefono |
| `npm run typecheck` | Controllo dei tipi |

La prima volta, prima di `npm run test:e2e`, esegui `npx playwright install chromium`.

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
