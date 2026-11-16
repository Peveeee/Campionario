/**
 * Dati di esempio: uno studio milanese con 2 progetti, 4 stanze, 20 articoli,
 * 5 fornitori e 10 prodotti in libreria. Nomi, aziende e codici sono inventati.
 */
import type { Dimensioni } from "@/lib/formato";
import { prezzoDaRicarico } from "@/lib/prezzi";
import type {
  Archivio,
  Articolo,
  Categoria,
  CostiArticolo,
  CostiProdotto,
  Prodotto,
  StatoApprovazione,
} from "@/dominio/tipi";

const S = "studio-varesi";

const dim = (larghezza: number | null, profondita: number | null, altezza: number | null): Dimensioni => ({
  larghezza,
  profondita,
  altezza,
});
const nessunaDimensione = dim(null, null, null);

/* ——— Prodotti di libreria ——— */

interface DatiProdotto extends Omit<Prodotto, "studioId" | "fotoUrl" | "link"> {
  costo: number;
  ricarico: number;
}

const datiProdotti: DatiProdotto[] = [
  { id: "p-arno", nome: "Divano Arno, tre posti", categoria: "arredo", fornitoreId: "f-lanzi", codice: "LMB-AR3", dimensioni: dim(2600, 1000, 780), finitura: "Bouclé avena", coloreCampione: "#D9D1C3", unita: "pz", costo: 385000, ricarico: 3500 },
  { id: "p-lario", nome: "Poltrona Lario", categoria: "arredo", fornitoreId: "f-lanzi", codice: "LMB-LR1", dimensioni: dim(780, 820, 740), finitura: "Velluto salvia", coloreCampione: "#8E9B82", unita: "pz", costo: 134000, ricarico: 3500 },
  { id: "p-pieve", nome: "Tavolino Pieve", categoria: "arredo", fornitoreId: "f-lanzi", codice: "LMB-PV12", dimensioni: dim(1200, 600, 350), finitura: "Rovere termotrattato", coloreCampione: "#6B4A33", unita: "pz", costo: 112000, ricarico: 3500 },
  { id: "p-ombra", nome: "Letto Ombra 180", categoria: "arredo", fornitoreId: "f-lanzi", codice: "LMB-OM180", dimensioni: dim(1960, 2200, 1050), finitura: "Lino grezzo", coloreCampione: "#CFC6B5", unita: "pz", costo: 268000, ricarico: 3500 },
  { id: "p-trespolo", nome: "Sgabello Trespolo", categoria: "arredo", fornitoreId: "f-lanzi", codice: "LMB-TR65", dimensioni: dim(420, 420, 650), finitura: "Frassino nero", coloreCampione: "#2B2724", unita: "pz", costo: 28500, ricarico: 3500 },
  { id: "p-murano", nome: "Sospensione Murano Fil", categoria: "illuminazione", fornitoreId: "f-luce", codice: "OLV-MF60", dimensioni: dim(600, 600, 420), finitura: "Vetro fumé", coloreCampione: "#7C7468", unita: "pz", costo: 98000, ricarico: 4000 },
  { id: "p-bricola", nome: "Lampada da terra Bricola", categoria: "illuminazione", fornitoreId: "f-luce", codice: "OLV-BR18", dimensioni: dim(350, 350, 1650), finitura: "Ottone satinato", coloreCampione: "#B49561", unita: "pz", costo: 64000, ricarico: 4000 },
  { id: "p-garzato", nome: "Tessuto Lino garzato", categoria: "tessili", fornitoreId: "f-arnaldi", codice: "TA-LG280", dimensioni: dim(null, null, 2800), finitura: "Lino naturale", coloreCampione: "#E4DDCF", unita: "ml", costo: 4800, ricarico: 4500 },
  { id: "p-vals", nome: "Gres Pietra di Vals 60×120", categoria: "rivestimenti", fornitoreId: "f-valsecchia", codice: "CV-PV612", dimensioni: dim(1200, 600, 10), finitura: "Grigio cenere", coloreCampione: "#9A968D", unita: "mq", costo: 6200, ricarico: 3000 },
  { id: "p-conca", nome: "Lavabo Conca", categoria: "sanitari", fornitoreId: "f-orsenigo", codice: "SO-CN55", dimensioni: dim(550, 420, 160), finitura: "Ceramica bianco opaco", coloreCampione: "#F2F1EE", unita: "pz", costo: 69000, ricarico: 3500 },
];

const prodotti: Prodotto[] = datiProdotti.map(({ costo: _c, ricarico: _r, ...p }) => ({
  ...p,
  studioId: S,
  fotoUrl: null,
  link: null,
}));

const costiProdotti: CostiProdotto[] = datiProdotti.map((p) => ({
  prodottoId: p.id,
  studioId: S,
  costoNetto: p.costo,
  ricaricoPredefinito: p.ricarico,
}));

/* ——— Articoli ——— */

interface DatiArticolo {
  id: string;
  stanzaId: string;
  prodottoId?: string;
  nome: string;
  categoria: Categoria;
  fornitoreId: string;
  codice: string;
  dimensioni?: Dimensioni;
  finitura: string;
  colore: string;
  quantita: number;
  unita?: "pz" | "mq" | "ml";
  costo: number;
  ricarico: number;
  stato: StatoApprovazione;
  nota?: string;
  /** Costo al momento dell'approvazione, se diverso da quello attuale. */
  costoApprovato?: number;
  versione?: number;
  versioneApprovata?: number | null;
}

const datiArticoli: DatiArticolo[] = [
  // Casa Ferraris — Soggiorno
  { id: "a01", stanzaId: "s-sog", prodottoId: "p-arno", nome: "Divano Arno, tre posti", categoria: "arredo", fornitoreId: "f-lanzi", codice: "LMB-AR3", dimensioni: dim(2600, 1000, 780), finitura: "Bouclé avena", colore: "#D9D1C3", quantita: 100, costo: 385000, ricarico: 3500, stato: "approvato" },
  { id: "a02", stanzaId: "s-sog", prodottoId: "p-pieve", nome: "Tavolino Pieve", categoria: "arredo", fornitoreId: "f-lanzi", codice: "LMB-PV12", dimensioni: dim(1200, 600, 350), finitura: "Rovere termotrattato", colore: "#6B4A33", quantita: 100, costo: 112000, ricarico: 3500, stato: "approvato" },
  { id: "a03", stanzaId: "s-sog", prodottoId: "p-lario", nome: "Poltrona Lario", categoria: "arredo", fornitoreId: "f-lanzi", codice: "LMB-LR1", dimensioni: dim(780, 820, 740), finitura: "Velluto salvia", colore: "#8E9B82", quantita: 200, costo: 134000, ricarico: 3500, stato: "proposto" },
  { id: "a04", stanzaId: "s-sog", prodottoId: "p-murano", nome: "Sospensione Murano Fil", categoria: "illuminazione", fornitoreId: "f-luce", codice: "OLV-MF60", dimensioni: dim(600, 600, 420), finitura: "Vetro fumé", colore: "#7C7468", quantita: 100, costo: 106000, ricarico: 4000, stato: "approvato", costoApprovato: 98000 },
  { id: "a05", stanzaId: "s-sog", prodottoId: "p-bricola", nome: "Lampada da terra Bricola", categoria: "illuminazione", fornitoreId: "f-luce", codice: "OLV-BR18", dimensioni: dim(350, 350, 1650), finitura: "Ottone brunito", colore: "#8C6A3F", quantita: 100, costo: 64000, ricarico: 4000, stato: "da_rivedere", versione: 2, versioneApprovata: 1 },
  { id: "a06", stanzaId: "s-sog", prodottoId: "p-garzato", nome: "Tende in lino garzato", categoria: "tessili", fornitoreId: "f-arnaldi", codice: "TA-LG280", dimensioni: dim(null, null, 2800), finitura: "Lino naturale", colore: "#E4DDCF", quantita: 1450, unita: "ml", costo: 4800, ricarico: 4500, stato: "proposto" },
  { id: "a07", stanzaId: "s-sog", nome: "Tappeto Trama", categoria: "tessili", fornitoreId: "f-arnaldi", codice: "TA-TR2030", dimensioni: dim(3000, 2000, null), finitura: "Lana grigio perla", colore: "#B9B6AE", quantita: 100, costo: 195000, ricarico: 3500, stato: "rifiutato", nota: "Lo vorremmo più caldo, magari sui toni della sabbia." },

  // Casa Ferraris — Camera padronale
  { id: "a08", stanzaId: "s-cam1", prodottoId: "p-ombra", nome: "Letto Ombra 180", categoria: "arredo", fornitoreId: "f-lanzi", codice: "LMB-OM180", dimensioni: dim(1960, 2200, 1050), finitura: "Lino grezzo", colore: "#CFC6B5", quantita: 100, costo: 268000, ricarico: 3500, stato: "approvato" },
  { id: "a09", stanzaId: "s-cam1", nome: "Comodino Sasso", categoria: "arredo", fornitoreId: "f-lanzi", codice: "LMB-SS45", dimensioni: dim(450, 400, 500), finitura: "Noce canaletto", colore: "#5A3D2B", quantita: 200, costo: 52000, ricarico: 3500, stato: "approvato" },
  { id: "a10", stanzaId: "s-cam1", nome: "Applique Lume", categoria: "illuminazione", fornitoreId: "f-luce", codice: "OLV-LU02", dimensioni: dim(120, 150, 260), finitura: "Gesso", colore: "#EDEAE4", quantita: 200, costo: 21000, ricarico: 4000, stato: "proposto" },
  { id: "a11", stanzaId: "s-cam1", nome: "Boiserie a doghe", categoria: "rivestimenti", fornitoreId: "f-lanzi", codice: "LMB-BS", finitura: "Rovere naturale", colore: "#B08A62", quantita: 840, unita: "mq", costo: 16500, ricarico: 3000, stato: "proposto" },

  // Casa Ferraris — Bagno padronale
  { id: "a12", stanzaId: "s-bag1", prodottoId: "p-vals", nome: "Gres Pietra di Vals 60×120", categoria: "rivestimenti", fornitoreId: "f-valsecchia", codice: "CV-PV612", dimensioni: dim(1200, 600, 10), finitura: "Grigio cenere", colore: "#9A968D", quantita: 1860, unita: "mq", costo: 6200, ricarico: 3000, stato: "approvato" },
  { id: "a13", stanzaId: "s-bag1", nome: "Mosaico Rigato", categoria: "rivestimenti", fornitoreId: "f-valsecchia", codice: "CV-RG30", dimensioni: dim(300, 300, 8), finitura: "Verde bottiglia", colore: "#2F4A3C", quantita: 620, unita: "mq", costo: 14800, ricarico: 3000, stato: "proposto" },
  { id: "a14", stanzaId: "s-bag1", prodottoId: "p-conca", nome: "Lavabo Conca", categoria: "sanitari", fornitoreId: "f-orsenigo", codice: "SO-CN55", dimensioni: dim(550, 420, 160), finitura: "Ceramica bianco opaco", colore: "#F2F1EE", quantita: 100, costo: 69000, ricarico: 3500, stato: "approvato" },
  { id: "a15", stanzaId: "s-bag1", nome: "Miscelatore Filo", categoria: "sanitari", fornitoreId: "f-orsenigo", codice: "SO-FL01", dimensioni: dim(50, 160, 280), finitura: "Nichel spazzolato", colore: "#A7A49C", quantita: 100, costo: 41000, ricarico: 3500, stato: "approvato" },

  // Attico Benassi — Cucina
  { id: "a16", stanzaId: "s-cuc", nome: "Isola Banco", categoria: "arredo", fornitoreId: "f-lanzi", codice: "LMB-BC28", dimensioni: dim(2800, 1100, 900), finitura: "Laccato grigio fumo", colore: "#6E6A64", quantita: 100, costo: 940000, ricarico: 3000, stato: "proposto" },
  { id: "a17", stanzaId: "s-cuc", nome: "Piano in marmo Arabescato", categoria: "rivestimenti", fornitoreId: "f-valsecchia", codice: "CV-MA30", dimensioni: dim(null, null, 30), finitura: "Arabescato levigato", colore: "#E7E4DE", quantita: 420, unita: "mq", costo: 69000, ricarico: 3000, stato: "proposto" },
  { id: "a18", stanzaId: "s-cuc", nome: "Sospensione Goccia", categoria: "illuminazione", fornitoreId: "f-luce", codice: "OLV-GC20", dimensioni: dim(200, 200, 340), finitura: "Vetro ambra", colore: "#C08A3E", quantita: 300, costo: 32000, ricarico: 4000, stato: "proposto" },
  { id: "a19", stanzaId: "s-cuc", prodottoId: "p-trespolo", nome: "Sgabello Trespolo", categoria: "arredo", fornitoreId: "f-lanzi", codice: "LMB-TR65", dimensioni: dim(420, 420, 650), finitura: "Frassino nero", colore: "#2B2724", quantita: 400, costo: 28500, ricarico: 3500, stato: "proposto" },
  { id: "a20", stanzaId: "s-cuc", nome: "Lavello Vasca 80", categoria: "sanitari", fornitoreId: "f-orsenigo", codice: "SO-VS80", dimensioni: dim(800, 450, 220), finitura: "Acciaio satinato", colore: "#BDBCB8", quantita: 100, costo: 118000, ricarico: 3500, stato: "proposto" },
];

const articoli: Articolo[] = datiArticoli.map((a, i) => {
  // Il prezzo cliente approvato segue il costo approvato: se il costo è cambiato dopo,
  // il prezzo resta quello che il cliente ha visto (lo segnaleremo nella fase 4).
  const costoBase = a.costoApprovato ?? a.costo;
  return {
    id: a.id,
    studioId: S,
    stanzaId: a.stanzaId,
    prodottoId: a.prodottoId ?? null,
    nome: a.nome,
    categoria: a.categoria,
    fornitoreId: a.fornitoreId,
    codice: a.codice,
    dimensioni: a.dimensioni ?? nessunaDimensione,
    finitura: a.finitura,
    coloreCampione: a.colore,
    fotoUrl: null,
    link: null,
    unita: a.unita ?? "pz",
    quantita: a.quantita,
    prezzoClienteUnitario: prezzoDaRicarico(costoBase, a.ricarico),
    prezzoManuale: false,
    stato: a.stato,
    notaCliente: a.nota ?? null,
    versione: a.versione ?? 1,
    versioneApprovata: a.versioneApprovata !== undefined ? a.versioneApprovata : a.stato === "approvato" ? 1 : null,
    posizione: i,
  };
});

const costiArticoli: CostiArticolo[] = datiArticoli.map((a) => ({
  articoloId: a.id,
  studioId: S,
  costoNettoUnitario: a.costo,
  ricarico: a.ricarico,
  costoAllApprovazione: a.stato === "approvato" ? (a.costoApprovato ?? a.costo) : a.stato === "da_rivedere" ? a.costo : null,
}));

/* ——— Archivio completo ——— */

export function creaArchivioDiEsempio(): Archivio {
  const a05 = articoli.find((a) => a.id === "a05")!;
  return structuredClone({
    studi: [{ id: S, nome: "Studio Varesi Interni", citta: "Milano", partitaIva: "IT09876540961" }],
    utenti: [
      { id: "u-giulia", studioId: S, nome: "Giulia Varesi", email: "giulia@studiovaresi.example", ruolo: "titolare" },
      { id: "u-tommaso", studioId: S, nome: "Tommaso Rinaldi", email: "tommaso@studiovaresi.example", ruolo: "designer" },
    ],
    clienti: [
      { id: "c-ferraris", studioId: S, nome: "Elena e Marco Ferraris", email: "ferraris.casa@example.it", telefono: "+39 347 210 4481", indirizzo: "Via Solferino 14, 20121 Milano", codiceFiscaleOPartitaIva: "FRRMRC79C12F205K" },
      { id: "c-benassi", studioId: S, nome: "Chiara Benassi", email: "c.benassi@example.it", telefono: "+39 335 778 0912", indirizzo: "Lungarno Torrigiani 9, 50125 Firenze", codiceFiscaleOPartitaIva: "BNSCHR84M41D612Z" },
    ],
    fornitori: [
      { id: "f-lanzi", studioId: S, ragioneSociale: "Lanzi Mobili Brianza S.r.l.", referente: "Paolo Lanzi", email: "ordini@lanzimobili.example", telefono: "+39 0362 340 118", settimaneConsegna: 8, condizioniPagamento: "30% all'ordine, saldo a 60 giorni" },
      { id: "f-luce", studioId: S, ragioneSociale: "Officine Luce Veneta S.n.c.", referente: "Sara Dal Molin", email: "commerciale@officineluce.example", telefono: "+39 0424 501 772", settimaneConsegna: 5, condizioniPagamento: "Bonifico anticipato" },
      { id: "f-valsecchia", studioId: S, ragioneSociale: "Ceramiche Valsecchia S.p.A.", referente: "Andrea Bertoni", email: "showroom@valsecchia.example", telefono: "+39 0536 830 204", settimaneConsegna: 4, condizioniPagamento: "30 giorni data fattura" },
      { id: "f-arnaldi", studioId: S, ragioneSociale: "Tessiture Arnaldi S.r.l.", referente: "Marta Arnaldi", email: "campionature@tessiturearnaldi.example", telefono: "+39 031 266 9031", settimaneConsegna: 6, condizioniPagamento: "50% all'ordine, saldo alla consegna" },
      { id: "f-orsenigo", studioId: S, ragioneSociale: "Sanitari Orsenigo S.r.l.", referente: "Davide Orsenigo", email: "vendite@orsenigo.example", telefono: "+39 030 912 4470", settimaneConsegna: 3, condizioniPagamento: "60 giorni fine mese" },
    ],
    progetti: [
      { id: "pr-ferraris", studioId: S, clienteId: "c-ferraris", nome: "Casa Ferraris", indirizzoCantiere: "Via Solferino 14, Milano", fase: "forniture", parcella: 1850000, budget: 9500000, nascondiFornitori: true, dataInizio: "2026-03-02", dataFinePrevista: "2027-02-26" },
      { id: "pr-benassi", studioId: S, clienteId: "c-benassi", nome: "Attico Benassi", indirizzoCantiere: "Lungarno Torrigiani 9, Firenze", fase: "progetto", parcella: 980000, budget: null, nascondiFornitori: false, dataInizio: "2026-09-14", dataFinePrevista: null },
    ],
    stanze: [
      { id: "s-sog", studioId: S, progettoId: "pr-ferraris", nome: "Soggiorno", codice: "SOG", budget: 1500000, posizione: 0 },
      { id: "s-cam1", studioId: S, progettoId: "pr-ferraris", nome: "Camera padronale", codice: "CAM1", budget: 1400000, posizione: 1 },
      { id: "s-bag1", studioId: S, progettoId: "pr-ferraris", nome: "Bagno padronale", codice: "BAG1", budget: 400000, posizione: 2 },
      { id: "s-cuc", studioId: S, progettoId: "pr-benassi", nome: "Cucina", codice: "CUC", budget: 2600000, posizione: 0 },
    ],
    prodotti,
    costiProdotti,
    articoli,
    costiArticoli,
    versioniArticoli: [
      {
        id: "v-a05-1",
        studioId: S,
        articoloId: "a05",
        versione: 1,
        campi: { ...pickCampi(a05), finitura: "Ottone satinato", coloreCampione: "#B49561" },
        campiCambiati: [],
        autore: { tipo: "utente", utenteId: "u-tommaso" },
        creatoIl: "2026-10-06T10:12:00+02:00",
      },
      {
        id: "v-a05-2",
        studioId: S,
        articoloId: "a05",
        versione: 2,
        campi: pickCampi(a05),
        campiCambiati: ["finitura", "coloreCampione"],
        autore: { tipo: "utente", utenteId: "u-tommaso" },
        creatoIl: "2026-11-09T16:40:00+01:00",
      },
    ],
    ordini: [
      // In produzione con consegna prevista già passata: compare tra gli ordini in ritardo.
      { id: "o-lanzi", studioId: S, progettoId: "pr-ferraris", fornitoreId: "f-lanzi", numero: "2026-001", stato: "in_produzione", dataInvio: "2026-09-08", consegnaPrevista: "2026-11-03", accontoFornitore: 260700 },
      { id: "o-orsenigo", studioId: S, progettoId: "pr-ferraris", fornitoreId: "f-orsenigo", numero: "2026-002", stato: "consegnato", dataInvio: "2026-10-01", consegnaPrevista: "2026-10-22", accontoFornitore: 0 },
    ],
    righeOrdine: [
      ...[
        ["a01", 100, 385000],
        ["a02", 100, 112000],
        ["a08", 100, 268000],
        ["a09", 200, 52000],
      ].map(([articoloId, quantita, costoUnitario], i) => ({ id: `ro-l${i}`, studioId: S, ordineId: "o-lanzi", articoloId: String(articoloId), quantita: Number(quantita), costoUnitario: Number(costoUnitario) })),
      { id: "ro-o1", studioId: S, ordineId: "o-orsenigo", articoloId: "a14", quantita: 100, costoUnitario: 69000 },
      { id: "ro-o2", studioId: S, ordineId: "o-orsenigo", articoloId: "a15", quantita: 100, costoUnitario: 41000 },
    ],
    accontiClienti: [
      { id: "ac-1", studioId: S, progettoId: "pr-ferraris", ordineId: "o-lanzi", regola: { tipo: "percentuale", percentuale: 3000 }, importo: 351945, stato: "incassato", dataRichiesta: "2026-09-05", dataIncasso: "2026-09-07" },
      { id: "ac-2", studioId: S, progettoId: "pr-ferraris", ordineId: "o-orsenigo", regola: { tipo: "percentuale", percentuale: 5000 }, importo: 74250, stato: "richiesto", dataRichiesta: "2026-10-01", dataIncasso: null },
    ],
    linkClienti: [
      { id: "link-ferraris", studioId: S, progettoId: "pr-ferraris", token: "fx7k2m9qv4rt8wz3", scadeIl: "2027-01-31", revocatoIl: null, creatoDa: "u-tommaso", creatoIl: "2026-10-06T10:00:00+02:00" },
      { id: "link-benassi", studioId: S, progettoId: "pr-benassi", token: "bn4p8s2xk6md9cq1", scadeIl: "2027-01-31", revocatoIl: null, creatoDa: "u-tommaso", creatoIl: "2026-11-02T09:30:00+01:00" },
    ],
    registro: [
      { id: "r1", studioId: S, progettoId: "pr-ferraris", autore: { tipo: "utente", utenteId: "u-tommaso" }, azione: "variante", dettaglio: "Lampada da terra Bricola: finitura da Ottone satinato a Ottone brunito", creatoIl: "2026-11-09T16:40:00+01:00" },
      { id: "r2", studioId: S, progettoId: "pr-ferraris", autore: { tipo: "cliente", linkId: "link-ferraris" }, azione: "rifiuto", dettaglio: "Tappeto Trama rifiutato", creatoIl: "2026-11-11T21:05:00+01:00" },
    ],
  } satisfies Archivio);
}

function pickCampi(a: Articolo) {
  const { nome, categoria, fornitoreId, codice, dimensioni, finitura, coloreCampione, fotoUrl, quantita, unita, prezzoClienteUnitario } = a;
  return { nome, categoria, fornitoreId, codice, dimensioni, finitura, coloreCampione, fotoUrl, quantita, unita, prezzoClienteUnitario };
}
