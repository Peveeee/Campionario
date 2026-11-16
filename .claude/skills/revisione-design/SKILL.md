---
name: revisione-design
description: Revisione visiva di una schermata di Campionario con screenshot reali da desktop e da telefono. Usala ogni volta che finisci o modifichi una schermata, prima di dire che è pronta.
---

# Revisione del design

Il codice di una schermata si scrive senza vederla. Questa skill serve a guardarla davvero e a correggerla prima di consegnarla.

## 1. Fai gli screenshot

Con il server di sviluppo avviato, fai gli screenshot con Playwright (è già tra le dipendenze). Lo script va in una cartella temporanea fuori dal progetto. Per ogni schermata toccata servono quattro immagini:

- **desktop:** 1440 × 900, pagina intera;
- **telefono:** 390 × 844, pagina intera;
- **stato vuoto:** per esempio un progetto senza stanze;
- **stato con dati lunghi:** nome di articolo di 60 caratteri, prezzo di 7 cifre, 20 articoli in una stanza.

Se la schermata ha un pannello o una vista cliente, fotografa anche quelli aperti.

## 2. Guardale con occhio critico

Apri ogni immagine e rispondi a queste domande, una per una:

**Gerarchia**
- In due secondi si capisce cosa è più importante?
- C'è un solo elemento in blu avio per area?

**Ritmo**
- Spaziature coerenti, allineamenti a sinistra puliti, nessun elemento che "salta" tra schermate dello stesso tipo?

**Tipografia**
- Il Bodoni compare solo dove deve?
- Le cifre sono allineate (`cifre`)?
- Le righe di testo restano sotto gli 80 caratteri?

**Stati**
- Approvato, rifiutato, da rivedere, in ritardo e fuori budget si distinguono anche in bianco e nero?

**Telefono**
- Niente scorrimento orizzontale, pulsanti di almeno 44 px, nessun testo tagliato?
- Le azioni principali sono a portata di pollice?

**Dati veri**
- Nomi lunghi e prezzi grandi non rompono il layout?

**Testi**
- Tutto in italiano, chiaro, senza termini tecnici?
- I pulsanti dicono cosa fanno?

**Generico**
- Somiglia a un modello qualsiasi? Controlla l'elenco "Da evitare" della skill `design-campionario`.
- Se sì, cosa toglieresti?

Poi un ultimo test: un art director di uno studio di interni la metterebbe nel suo portfolio? Se la risposta è no, la schermata non è finita.

## 3. Correggi e riguarda

Correggi i problemi trovati, rifai gli screenshot e riguarda. Ripeti finché la risposta all'ultimo test è sì. Prima di aggiungere qualcosa, chiediti cosa puoi togliere.

## 4. Controlli automatici

- Contrasto: controlla i colori del testo sui loro fondi, almeno 4,5:1 per il testo normale.
- Tastiera: con Tab si raggiungono tutti i comandi, nell'ordine giusto, con il focus visibile.
- Nessun errore nella console del browser.

## 5. Riferisci

Quando consegni la schermata, mostra gli screenshot finali da desktop e da telefono. Elenca in due righe cosa hai corretto durante la revisione.
