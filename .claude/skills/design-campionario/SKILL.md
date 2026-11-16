---
name: design-campionario
description: La direzione visiva e le regole di UX di Campionario. Usala prima di creare o modificare qualsiasi schermata, componente o testo dell'interfaccia, insieme a frontend-design.
---

# Design di Campionario

Campionario è usato da interior designer: persone che giudicano un software anche da come è fatto. L'interfaccia deve sembrare una cartella materiali curata, non un gestionale. Ogni scelta qui sotto è già presa: applicala, non reinventarla.

## L'idea

Uno studio ragiona per campioni: tessuti, legni, piastrelle. L'elemento riconoscibile dell'app è la **scheda campione** (`src/components/campionario/scheda-campione.tsx`):

- la foto è protagonista;
- sopra la foto è appoggiata un'etichetta bianca con il colore della finitura, come un campione fisico.

Tutta l'audacia è lì e nella palette del progetto (`palette-progetto.tsx`). Il resto è sobrio: tanto bianco, righe sottili, niente decorazioni.

## Valori

Sono tutti in `src/app/globals.css`, da usare tramite le classi Tailwind, mai come colori scritti a mano.

**Colori**

- **Base:**
  - carta `#ffffff`: fondo;
  - nebbia `#f5f6f3`: superfici secondarie;
  - linea `#e4e5e1`: separatori;
  - grafite `#1f2328`: testo;
  - pietra scura `#5e645c`: testo secondario;
  - pietra `#8a8f87`: solo icone e dettagli, mai per testo da leggere.
- **Azione:** blu avio `#2d4a6b`, solo per le azioni principali e l'elemento attivo. Mai decorativo.
- **Stati:**
  - bosco: approvato;
  - mattone: rifiutato;
  - ocra: da rivedere o in esaurimento;
  - prugna: in ritardo o fuori budget.

  Ogni stato ha la sua versione "velo" per i fondi.

**Caratteri**

- Bodoni Moda (`titolo-display`) solo per nomi di progetti, stanze e titoli di pagina, da 23 px in su.
- Instrument Sans per tutto il resto.
- Le cifre usano sempre la classe `cifre` (cifre allineate in colonna).

**Forme**

- raggio 3 px su badge e campioni, 6 px su pulsanti e campi;
- nessun raggio sulle foto delle schede;
- ombre solo sulle etichette appoggiate sulle foto (`shadow-etichetta`) e sui pannelli (`shadow-pannello`).

**Scala dei testi**

xs 12, sm 13, base 15, lg 18, xl 23, 2xl 29, 3xl 37, 4xl 56, 5xl 72 px. Non aggiungere altre misure.

## Da evitare (fanno sembrare l'app generata)

- Fondo crema con accento terracotta, fondo nero con accento verde acido.
- Tutto diviso in schede arrotondate identiche con la stessa ombra grigia.
- Sfumature decorative, emoji, illustrazioni stock.
- Etichette in maiuscolo spaziato sopra ogni titolo.
- Un titolo con una sola parola in corsivo o colorata.
- Freccette "→" in fondo ai pulsanti; metadati uniti da " · ".
- Numeri 01 / 02 / 03 su cose che non sono una sequenza (le fasi del progetto lo sono, le stanze no).
- Animazioni di entrata su ogni sezione. È ammesso un solo momento animato per schermata, e solo in risposta a un'azione: apertura del pannello, conferma, "Annulla".

## Regole di UX

1. **Lo stato si capisce a colpo d'occhio:** colore, icona e parola insieme (`BadgeStato`), mai il colore da solo.
2. **Si modifica senza perdere il contesto:** pannello laterale da desktop, foglio dal basso da telefono (`Pannello`).
3. **"Annulla" invece della conferma:** ogni azione reversibile mostra un `Avviso` con "Annulla". La finestra di conferma è solo per le azioni irreversibili, come la revoca di un link.
4. **Budget sempre in vista** sull'intestazione della stanza (`BarraBudget`): avviso dal 90%, badge "Fuori budget" oltre il 100%.
5. **La vista cliente si usa con una mano:**
   - un articolo per volta;
   - pulsanti di almeno 44 px, Approva a tutta larghezza;
   - Chiedi modifiche e Rifiuta sotto, affiancati;
   - totali fissi in basso.
6. **Le schermate vuote dicono cosa fare,** con un pulsante: "Nessuna stanza. Aggiungi la prima stanza."
7. **Gli errori dicono cosa è successo e come rimediare,** senza scuse: "Questo link è scaduto. Chiedi allo studio di rinnovarlo."
8. **Numeri all'italiana ovunque:** `1.234,56 €`, `gg/mm/aaaa`. I campi accettano "1.234,56" e lo riformattano quando li lasci (`CampoNumero`).
9. **Accessibilità:**
   - contrasto almeno AA;
   - focus da tastiera visibile;
   - etichette collegate ai campi (`Campo`);
   - `aria-live` per gli avvisi;
   - animazioni ridotte se il sistema lo chiede.

## Testi

- Italiano semplice, frasi brevi, forma attiva.
- I pulsanti dicono cosa succede: "Crea il link", "Approva", "Salva modifiche", non "OK" o "Invia".
- La stessa azione ha lo stesso nome in tutto il flusso: il pulsante "Revoca" produce l'avviso "Link revocato".
- Al cliente si dà del voi (spesso sono coppie); allo studio del tu.
- Mai termini tecnici come token, RLS, database o record.

## Prima di dire che una schermata è finita

Usa la skill `revisione-design`.
