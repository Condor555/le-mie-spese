<div align="center">

# 💶 Le Mie Spese

**Expense tracker personale e familiare, mobile-first, con spazi privati e condivisi.**

[![Versione](https://img.shields.io/badge/versione-3.9-5b5ce2?style=flat-square)](#stato-del-progetto)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)

*Le Mie Spese* nasce per portare in un'unica interfaccia pulita lo storico finanziario personale, l'inserimento rapido dei movimenti e la gestione delle spese di coppia o famiglia — mantenendo un'infrastruttura utilizzabile sui piani gratuiti.

</div>

---

## Panoramica

La versione **V3.9** unisce il modello multiutente stabile a budget mensili, Analytics 2.0 e gestione evoluta di ricorrenze/abbonamenti. Ogni spazio **Personale** o **Condiviso** mantiene dati, budget, categorie e permessi indipendenti; Movimenti usa ricerca e filtri reattivi, mentre Home e Statistiche condividono un selettore mese compatto e accessibile.

L'app è costruita con **Next.js**, **Supabase** e **Vercel**. Non richiede servizi a pagamento per il flusso base: autenticazione, database PostgreSQL, Row Level Security e deploy possono utilizzare i rispettivi free tier.

## Screenshot

Gli asset definitivi non sono ancora versionati. La repository è già predisposta per una futura cartella `docs/screenshots/`.

| Home | Movimenti | Multiutente |
|---|---|---|
| 📷 `docs/screenshots/home-dark.png` | 📷 `docs/screenshots/movimenti.png` | 📷 `docs/screenshots/onboarding.png` |
| Saldo, media giornaliera, andamento e insight | Ricerca, filtri, autori e totali giornalieri | Profilo, codice invito e scelta categorie |

> Prima di aggiungere le immagini, rimuovere eventuali dati finanziari reali, indirizzi email e codici invito.

## Funzionalità disponibili

### Account e spazi

- registrazione e accesso con email/password tramite Supabase Auth;
- onboarding con nome visualizzato;
- creazione automatica dello spazio personale e delle categorie iniziali;
- spazi condivisi con ruoli **Owner** e **Member**;
- ingresso tramite codice invito, senza servizio email aggiuntivo;
- scelta delle categorie personali da copiare nello spazio condiviso;
- `SpacePicker` compatto condiviso tra Home, Movimenti, Statistiche e Budget, con aggiornamento immediato nella schermata corrente;
- profilo, cambio password e tema chiaro/scuro/automatico;
- nome del Conto separato per ogni spazio: nello spazio condiviso è rinominabile solo dal creatore/owner e resta in sola lettura per i membri.

### Movimenti

- entrate e uscite manuali;
- descrizione, categoria, data e conto;
- selettore esplicito dello spazio di destinazione in Nuova transazione, indipendente dalla schermata visualizzata in precedenza;
- autore persistente (`created_by`) per movimenti manuali e ricorrenti;
- ricerca case-insensitive reattiva con debounce di 300 ms e protezione da risposte asincrone stale;
- filtri immediati per periodo, categoria, autore e tipo, senza pulsante “Applica filtri”;
- preset periodo **Oggi**, **Ieri**, **Questo mese**, **Mese scorso**, **Ultimi 30 giorni** e intervallo personalizzato, valido anche oltre mesi/anni;
- azzeramento completo dei criteri o cancellazione del solo periodo; paginazione riportata alla prima pagina a ogni variazione;
- raggruppamento per data con anno sempre visibile;
- count e totale giornaliero sincronizzati ai risultati filtrati;
- dettaglio, modifica ed eliminazione con conferma;
- gestione della singola occorrenza o della serie futura per i movimenti ricorrenti;
- importazione CSV con intestazioni italiane/inglesi e compatibilità con il formato Money Lover esistente;
- export CSV dei dati già presente nel progetto.

### Budget V3.7

- budget mensile complessivo per spazio e budget per categoria;
- Personale e spazi condivisi indipendenti;
- speso, disponibile, percentuale utilizzata e confronto col mese precedente;
- soglie visive: avviso all’80% e superamento al 100%;
- lettura per tutti i membri e modifica riservata all’owner tramite RLS.

### Home e Analytics 2.0 V3.8

- selettore mese compatto condiviso tra Home e Statistiche, interamente cliccabile/toccabile e utilizzabile da tastiera;
- aggiornamento senza refresh con protezione dallo stato stale;
- saldo mensile, entrate, uscite e confronto col mese precedente;
- media giornaliera e proiezione di fine mese;
- trend selezionabile a 6 o 12 mesi, entrate vs uscite e top categorie;
- breakdown delle spese dello spazio condiviso per autore;
- avanzamento rispetto al budget e categorie principali.

### Ricorrenze e abbonamenti V3.9

- regole separate per ricorrenza o abbonamento e associate allo spazio scelto;
- prossima scadenza, movimenti futuri e importi programmati nei successivi 30 giorni;
- calendario finanziario mensile;
- conferma pagamento atomica, che crea una sola transazione per scadenza;
- registrazione automatica opzionale e conferma manuale;
- permessi multiutente e RLS basati sull’appartenenza allo spazio.

### Interfaccia

- design mobile-first e responsive;
- modalità chiara, scura o automatica;
- icone funzionali Phosphor e catalogo categorie/brand colorato locale, con fallback sicuro e attribuzione in Informazioni;
- manifest web app e navigazione ottimizzata per smartphone;
- componenti coerenti per spazi, categorie, modali e navigazione inferiore.

## Regole di calcolo principali

- **Uscite:** somma del valore assoluto dei movimenti negativi.
- **Entrate:** somma dei movimenti positivi.
- **Saldo:** `entrate - uscite`.
- **Totale giornaliero Movimenti:** somma algebrica degli importi visibili nel gruppo; in una giornata mista entrate e uscite si compensano, coerentemente con il saldo.
- **Media giornaliera uscite:** `uscite del mese / giorni considerati`. Nel mese corrente il denominatore va dal giorno 1 a oggi e include i giorni senza movimenti; nei mesi conclusi usa tutti i giorni del mese.
- **Variazione categoria principale:** `(mese corrente - mese precedente) / mese precedente × 100`. Se il mese precedente è zero o privo di dati viene mostrato un testo esplicito, mai `Infinity` o `NaN`.

## Stack tecnico

| Area | Tecnologia |
|---|---|
| Framework | Next.js 15, App Router, React 19 |
| Linguaggio | TypeScript 5 |
| Database e Auth | Supabase PostgreSQL + Supabase Auth |
| Sicurezza dati | PostgreSQL Row Level Security |
| Grafici | Recharts |
| Icone | Phosphor Icons |
| Validazione | Zod |
| Deploy | Vercel |
| Import CSV | Papa Parse |
| Stili | CSS responsive senza framework UI obbligatorio |

## Avvio locale

### Requisiti

- Node.js 20 o superiore;
- npm;
- un progetto Supabase;
- Git.

### Installazione

```bash
git clone https://github.com/Condor555/le-mie-spese.git
cd le-mie-spese
npm install
cp .env.local.example .env.local # se il file di esempio viene aggiunto
npm run dev
```

In assenza di `.env.local.example`, creare manualmente `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

Aprire `http://localhost:3000`.

> Non inserire mai `service_role` nel browser, nei file `NEXT_PUBLIC_*` o nella repository.

## Configurazione Supabase

### Nuova installazione

1. Creare un progetto Supabase.
2. Aprire **SQL Editor**.
3. Eseguire `supabase/schema.sql`.
4. In **Authentication → URL Configuration**, aggiungere gli URL locali e di produzione, inclusi i callback `/auth/callback`.
5. Configurare le due variabili pubbliche nell'ambiente locale e in Vercel.

### Aggiornamento da V3.5.7

1. Eseguire un backup del database.
2. Aprire **SQL Editor**.
3. Eseguire `supabase/migrations/20261119_v3_6_multiuser.sql`.
4. Verificare profilo, spazio Personale e accesso allo spazio Famiglia con due account distinti.
5. Distribuire il codice V3.6 solo dopo il completamento della migration.

La migration è additiva: introduce/normalizza profili, spazi, membri, autore e policy per spazio, e collega i dati legacy allo spazio personale del relativo proprietario.

### Aggiornamento dalla V3.6 REV2.3

1. Eseguire un backup del database.
2. In **Supabase SQL Editor**, eseguire `supabase/migrations/20261119_v3_7_v3_9.sql` una sola volta.
3. Verificare che siano presenti `budgets`, `recurring_payments` e la funzione `confirm_recurring_payment`.
4. Distribuire il codice V3.9.
5. Collaudare con Account A/B: lettura budget, modifica owner, analytics per autore e conferma della stessa scadenza una sola volta.

La migration V3.7-V3.9 è idempotente, mantiene i dati esistenti e assegna alle ricorrenze preesistenti la modalità automatica per non cambiare il comportamento già stabile. Le nuove regole create dalla UI usano invece la conferma manuale come impostazione iniziale.

## Deploy su Vercel

1. Importare la repository in Vercel.
2. Aggiungere `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` in **Project Settings → Environment Variables**.
3. Usare il preset Next.js e Node.js 20+.
4. Eseguire il deploy.
5. Aggiungere il dominio Vercel tra gli URL consentiti da Supabase Auth.

Ogni push sul branch collegato genera un nuovo deployment. Lo script `prebuild` verifica inoltre che gli import Phosphor utilizzati esistano nella versione installata.

## Struttura della repository

```text
app/
  api/                 Route Handler per dati, spazi, onboarding e statistiche
  account/             Profilo, conto, categorie, aspetto, ricorrenze e dati
  onboarding/          Configurazione del secondo utente e categorie condivise
  movimenti/           Elenco, filtri, dettaglio, modifica ed eliminazione
  nuovo/               Inserimento rapido
  statistiche/         Analisi mensile
components/             Componenti UI condivisi
lib/                    Client Supabase e logica di supporto
scripts/                Controlli eseguiti prima della build
supabase/
  schema.sql            Schema completo per nuove installazioni
  migrations/           Aggiornamenti incrementali del database
```

## Privacy e sicurezza

- i dati finanziari non sono inclusi nella repository;
- il frontend usa soltanto la chiave pubblica/publishable di Supabase;
- le policy RLS autorizzano l'accesso in base all'appartenenza allo spazio;
- gli spazi personali sono visibili solo al proprietario;
- i membri di uno spazio condiviso vedono i dati di quello spazio, non gli spazi personali altrui;
- il codice invito viene risolto da una funzione SQL controllata e non richiede una lista pubblica degli spazi;
- `created_by` preserva l'autore anche per le occorrenze ricorrenti;
- prima di un utilizzo pubblico sono comunque raccomandati backup, revisione delle policy e test con account separati.

## Stato del progetto

**Versione corrente: V3.9 Budget, Analytics 2.0 e Ricorrenze/Abbonamenti.**

Questa repository è un progetto in evoluzione. Le funzioni elencate in “Funzionalità disponibili” appartengono alla versione implementata; quelle riportate qui sotto sono pianificate e **non devono essere considerate già disponibili**.

## Roadmap verso V4

| Versione | Stato | Obiettivo |
|---|---|---|
| V3.6 | ✅ Implementata | Multiutente, onboarding, autori, filtri, totali giornalieri, Home metrics |
| V3.7 | ✅ Implementata | Budget mensili e per categoria, Personale/Famiglia |
| V3.8 | ✅ Implementata | Analytics 2.0, trend e breakdown per autore/spazio |
| V3.9 | ✅ Implementata | Ricorrenze 2.0, abbonamenti, scadenze e movimenti futuri |
| V3.10 | 🧭 Pianificata | Smart Add e suggerimenti di inserimento rapido |
| V3.11 | 🧭 Pianificata | Obiettivi di risparmio e avanzamento |
| V3.12 | 🧭 Pianificata | Import/export evoluto, backup e ripristino |
| V3.13 | 🧭 Pianificata | Più conti/portafogli, saldi e trasferimenti |
| V3.14 | 🧭 Pianificata | Debiti, crediti, anticipi e rimborsi |
| V4.0 | 🧭 Pianificata | Automazioni, notifiche, passkey e Home personalizzabile |

## Verifica prima di una release

```bash
npm test
npm run check:phosphor
npm run build
```

`npm test` verifica i casi di ricorrenza a fine mese/anno bisestile, la presenza dei preset periodo, l'assenza del pulsante “Applica filtri”, la protezione stale con `AbortController`, gli endpoint range e gli oggetti SQL/RLS V3.7-V3.9.

Per V3.6 eseguire anche un test con **Account A** e **Account B**:

1. verificare l'isolamento dei due spazi personali;
2. entrare nello stesso spazio condiviso tramite codice;
3. creare movimenti da entrambi gli account;
4. controllare autore, filtri e totale giornaliero;
5. modificare ed eliminare una transazione di prova;
6. confrontare Home e Statistiche in entrambi gli spazi;
7. ripetere in tema chiaro, scuro e su viewport mobile.

---

<div align="center">

Costruita per una gestione finanziaria semplice, privata e condivisibile — senza abbandonare lo stack gratuito.

</div>


## V3.6 REV2.2 — prova Color, SpacePicker e Smart Autocomplete

Questa variante mantiene invariati schema dati, Supabase, RLS, autenticazione, transazioni e modello multiutente della baseline V3.6 REV2.2, introducendo solo componenti applicativi e API che interrogano le tabelle esistenti.

### Icone categorie

- le icone funzionali dell’interfaccia restano Phosphor;
- categorie e marchi usano asset colorati locali in `public/icons/categories` e `public/icons/brands`;
- gli identificatori categoria già salvati restano validi e vengono risolti dal catalogo esistente;
- identificatori sconosciuti o asset non mappati usano il fallback locale `tag.svg`;
- l’app non effettua chiamate Icons8 a runtime;
- l’attribuzione richiesta è visibile in **Impostazioni → Informazioni**.

### SpacePicker accessibile

Un unico componente `components/SpacePicker.tsx` gestisce:

- variante compatta per lo spazio visualizzato in Home, Movimenti e Statistiche;
- variante compatta per la destinazione della nuova ricorrenza;
- variante destination per Nuova transazione e Importazione CSV.

Il controllo usa trigger e listbox custom, icona Personale/Condiviso, check sul valore selezionato, click esterno, Escape, Home/End, frecce, Invio, focus visibile e stili light/dark. Il cambio dello spazio visualizzato continua a usare `/api/spaces/select` e l’evento client già presente; i selettori di destinazione non alterano lo spazio globale.

### Importazione CSV

La pagina Importazione CSV non mostra il selettore globale. Lo spazio viene scelto esplicitamente nella pagina e inviato come `space_id`; la route verifica l’appartenenza tramite `activeSpace(requestedSpaceId)` prima di importare movimenti e categorie.

### Nuova ricorrenza

La destinazione è esplicita e indipendente dallo spazio globalmente visualizzato. Al cambio spazio vengono ricaricati categorie e nome Conto; `space_id` viene inviato alla route di creazione, che conserva le verifiche di membership e categoria. Le occorrenze future mantengono lo `space_id` della serie.

### Smart Autocomplete

Nella schermata Nuova transazione, dopo due caratteri, `/api/transactions/suggestions` cerca nello storico del solo spazio di destinazione accessibile. I risultati:

- sono deduplicati senza distinzione tra maiuscole/minuscole;
- privilegiano prefisso, posizione del match, frequenza e recenza;
- sono limitati a cinque;
- includono la categoria storicamente più frequente per la descrizione;
- non richiedono nuove tabelle.

La selezione compila la descrizione e applica la categoria solo se ancora presente nello spazio corrente. La classificazione automatica esistente riceve anch’essa `spaceId` ed è ora filtrata per `transactions.space_id`, evitando contaminazioni tra spazi. Il cambio destinazione annulla le richieste obsolete, azzera categoria/suggerimenti e ricarica i dati coerenti con il nuovo spazio.
