<div align="center">

# 💶 Le Mie Spese

**Expense tracker personale e familiare, mobile-first, con spazi privati e condivisi.**

[![Versione](https://img.shields.io/badge/versione-3.9.4-5b5ce2?style=flat-square)](#stato-del-progetto)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)

*Le Mie Spese* nasce per portare in un'unica interfaccia pulita lo storico finanziario personale, l'inserimento rapido dei movimenti e la gestione delle spese di coppia o famiglia — mantenendo un'infrastruttura utilizzabile sui piani gratuiti.

</div>

---

## Panoramica

La versione **V3.9.4 Lingua e Statistiche** parte dalla V3.9.3 stabile e aggiunge una base i18n centralizzata Italiano/English, preferenza lingua persistita per utente, formati locali coerenti, correzione della proiezione di fine mese e gestione robusta dei mesi senza Budget. Ogni spazio **Personale** o **Condiviso** mantiene struttura e piano budget indipendenti; soltanto owner/creatore può modificarli negli spazi condivisi.

### Novità V3.9.4

- dizionari IT/EN centralizzati in `lib/i18n.ts`, provider applicativo unico e Italiano come default/fallback;
- preferenza **Impostazioni → Account → Lingua** persistita in `profiles.language`, quindi disponibile anche dopo login da un altro dispositivo;
- etichette e tooltip dei grafici `income`/`expense` tradotti come **Entrate/Uscite** o **Income/Expenses**;
- **Proiezione fine mese** calcolata soltanto per il mese corrente: `uscite / giorni trascorsi × giorni del mese`, con media giornaliera esplicita;
- per i mesi conclusi la card mostra **Saldo del mese = Entrate − Uscite**; per i mesi futuri non mostra stime fuorvianti;
- Budget senza piano mensile gestito con empty state **Nessun budget configurato**: owner può avviare la configurazione, member vede uno stato informativo in sola lettura;
- Budget resta una sezione secondaria sotto Statistiche: la bottom navigation conserva quattro destinazioni più `+`, mentre `/budget` ha un pulsante Indietro accessibile e coerente con light/dark e mobile/desktop;
- nessun rebranding o nuovo nome applicato.

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
- input importo pulito senza pulsante calcolatrice: placeholder `€ 0,00`, operatori `+`, `-`, `×`, `÷`, `*`, `/`, parentesi, virgola e punto digitati direttamente, anteprima solo per espressioni e salvataggio del solo risultato numerico;
- gestione della singola occorrenza o della serie futura per i movimenti ricorrenti;
- importazione CSV con intestazioni italiane/inglesi e compatibilità con il formato Money Lover esistente;
- export CSV dei dati già presente nel progetto.

### Budget V3.7

- budget mensile complessivo per spazio e budget per categoria;
- Personale e spazi condivisi indipendenti;
- speso, disponibile, percentuale utilizzata e confronto col mese precedente;
- soglie visive: avviso all’80% e superamento al 100%;
- lettura per tutti i membri e modifica riservata all’owner tramite RLS.
- lo stesso input espressione senza pulsante è disponibile sul limite complessivo e sugli importi Macro Budget; le percentuali restano input numerici semplici.

### Macro Budget V3.9.3

- otto macro-categorie iniziali: Casa & Utenze, Alimentazione, Mobilità, Salute & Famiglia, Tempo libero, Shopping, Viaggi e Altro;
- budget totale meno impegni programmati uguale budget discrezionale distribuibile;
- allocazioni macro principalmente percentuali, con equivalente euro e inserimento diretto in euro;
- categorie esistenti come drill-down analitico, assegnabili alle macro;
- creazione, rinomina, colore, ordine e rollover opzionale del residuo;
- ricorrenze e abbonamenti conteggiati come impegni fissi del mese;
- RLS e funzioni atomiche riservano le modifiche a owner/creatore, lasciando la lettura ai membri;
- conversione iniziale non distruttiva dei budget categoria già salvati.

### Categorie di uscita e di entrata

- ogni categoria ha tipo strutturale `expense` o `income`;
- il form transazione e le ricorrenze mostrano soltanto categorie coerenti col tipo selezionato;
- suggerimenti e classificazione storica sono filtrati per segno/tipo;
- Impostazioni → Categorie separa Uscite ed Entrate e preserva il tipo in modifica/unione;
- set iniziale entrate: Stipendio, Pensione, Bonus e premi, Regali ricevuti, Rimborsi, Interessi e rendite, Vendite, Trasferimenti in entrata e Altra entrata;
- Macro Budget e rollover interrogano esclusivamente categorie `expense`;
- Analytics mantiene le macro per le spese e mostra separatamente le fonti di reddito;
- l'import CSV classifica dal segno e dai nomi inequivocabili, usando Altro/Altra entrata in caso di conflitto con una categoria esistente.

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
- input importo con espressioni dirette e senza pulsante in creazione/modifica ricorrenze e abbonamenti.

### Interfaccia

- design mobile-first e responsive;
- modalità chiara, scura o automatica;
- icone funzionali Phosphor e catalogo categorie curato composto esclusivamente dagli asset Icons8 Color legacy reali;
- ricerca icone in italiano/inglese, sinonimi, suggerimenti dal nome categoria, preferite/recenti in `localStorage`, rendering a batch e immagini lazy;
- compatibilità con gli identificatori icona V3.9, fallback locale sicuro e correzione semantica `Mare → Spiaggia`;
- audit fisico e decodifica dei 63 asset categoria e 12 brand effettivamente referenziati; fallback Phosphor Tag evita l’immagine rotta nativa;
- bottom navigation con stato attivo route-aware, `aria-current` e accento coerente light/dark; il pulsante `+` resta una sola azione;
- manifest web app e navigazione ottimizzata per smartphone;
- componenti coerenti per spazi, categorie, modali e navigazione inferiore.

## Regole di calcolo principali

- **Uscite:** somma del valore assoluto dei movimenti negativi.
- **Entrate:** somma dei movimenti positivi.
- **Saldo:** `entrate - uscite`.
- **Totale giornaliero Movimenti:** somma algebrica degli importi visibili nel gruppo; in una giornata mista entrate e uscite si compensano, coerentemente con il saldo.
- **Media giornaliera uscite:** `uscite del mese / giorni considerati`. Nel mese corrente il denominatore va dal giorno 1 a oggi e include i giorni senza movimenti; nei mesi conclusi usa tutti i giorni del mese.
- **Proiezione fine mese:** soltanto per il mese corrente, `uscite / giorni trascorsi × giorni totali del mese`. Nei mesi conclusi viene sostituita dal saldo consuntivo; nei mesi futuri non viene calcolata.
- **Mese senza Budget:** `hasBudgetPlan=false`; l'API restituisce comunque uno snapshot normalizzato. L'owner vede la configurazione iniziale su richiesta, il member un empty state in sola lettura; nessuna proprietà viene letta da valori `undefined`.
- **Variazione categoria principale:** `(mese corrente - mese precedente) / mese precedente × 100`. Se il mese precedente è zero o privo di dati viene mostrato un testo esplicito, mai `Infinity` o `NaN`.

## Stack tecnico

| Area | Tecnologia |
|---|---|
| Framework | Next.js 15, App Router, React 19 |
| Linguaggio | TypeScript 5 |
| Database e Auth | Supabase PostgreSQL + Supabase Auth |
| Sicurezza dati | PostgreSQL Row Level Security |
| Grafici | Recharts |
| Icone | UI: Phosphor; categorie: Icons8 Color reali; brand: asset dedicati locali |
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

### Aggiornamento da V3.9 REV1 a V3.9.1

1. Sostituire i file applicativi mantenendo `public/icons/categories/` e `public/icons/brands/`.
2. Non eseguire nuove query SQL: V3.9.1 non introduce tabelle, colonne, funzioni o policy.
3. Eseguire `npm test` e `npm run build`.
4. Collaudare un calcolo in nuova/modifica transazione, ricorrenza e budget; verificare poi ricerca e suggerimenti icone.

### Aggiornamento da V3.9.2 a V3.9.3

1. Eseguire un backup del database Supabase.
2. In **Supabase SQL Editor**, eseguire una sola volta `supabase/migrations/20261120_v3_9_3_macro_budgets.sql`.
3. Verificare le tabelle `budget_macro_categories` e `macro_budget_allocations` e la colonna `categories.macro_category_id`.
4. Distribuire tutti i file V3.9.3. Il runtime non usa `public/icons/color/`.
5. Eseguire `npm test`, `npm run audit:icons` e `npm run build`.

La migration crea le macro predefinite per ogni spazio, aggiunge il tipo categoria, assegna le sole categorie expense alle macro e converte i vecchi budget categoria in allocazioni macro. I nomi chiaramente reddituali e le categorie usate soltanto con importi positivi diventano income; categorie miste/ambigue restano expense. Le ricorrenze legacy incoerenti vengono spostate sui fallback corretti, senza riscrivere le transazioni storiche. I record `budgets` precedenti non vengono cancellati; se esistono budget categoria senza budget totale, la migration ricava un totale compatibile dalla loro somma.

### Aggiornamento da V3.9.3 a V3.9.4

1. Eseguire un backup del database Supabase.
2. In **Supabase SQL Editor**, eseguire una sola volta `supabase/migrations/20261120_v3_9_4_user_language.sql`.
3. Verificare che `profiles.language` abbia default `it` e vincolo `it|en`.
4. Distribuire i file V3.9.4 ed eseguire `npm test` e `npm run build`.
5. Collaudare Italiano/English con due dispositivi o sessioni, quindi Budget su mese con/senza piano per Personale e Famiglia, sia owner sia member.

La migration è incrementale e riutilizza le RLS `profiles` esistenti: ogni utente può aggiornare soltanto la propria preferenza.

## Deploy su Vercel

1. Importare la repository in Vercel.
2. Aggiungere `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` in **Project Settings → Environment Variables**.
3. Usare il preset Next.js e Node.js 20+.
4. Eseguire il deploy.
5. Aggiungere il dominio Vercel tra gli URL consentiti da Supabase Auth.

Ogni push sul branch collegato genera un nuovo deployment. `next build` esegue il controllo TypeScript degli import effettivamente usati.

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

**Versione corrente: V3.9.4 Lingua e Statistiche.**

Questa repository è un progetto in evoluzione. Le funzioni elencate in “Funzionalità disponibili” appartengono alla versione implementata; quelle riportate qui sotto sono pianificate e **non devono essere considerate già disponibili**.

## Roadmap verso V4

| Versione | Stato | Obiettivo |
|---|---|---|
| V3.6 | ✅ Implementata | Multiutente, onboarding, autori, filtri, totali giornalieri, Home metrics |
| V3.7 | ✅ Implementata | Budget mensili e per categoria, Personale/Famiglia |
| V3.8 | ✅ Implementata | Analytics 2.0, trend e breakdown per autore/spazio |
| V3.9 | ✅ Implementata | Ricorrenze 2.0, abbonamenti, scadenze e movimenti futuri |
| V3.9.1 | ✅ Implementata | Calcolatrice importi e catalogo icone Color locale smart |
| V3.9.2 | ✅ Implementata | Selettore mese custom e filtri Movimenti accessibili |
| V3.9.3 | ✅ Implementata | Macro Budget, impegni, rollover, analytics macro e nav attiva |
| V3.9.4 | ✅ Implementata | IT/EN persistente, proiezione corretta, Budget empty state e back navigation |
| V3.10 | 🧭 Prossima | Obiettivi di risparmio visibili e completi |
| V3.11 | 🧭 Pianificata | Backup & Portabilità |
| V4.0 | 🧭 Pianificata | Branding: nome, dominio, repository, logo e manifest |

**In stand-by, senza implementazione in V3.9.4:** Conti/Portafogli multipli e Debiti/Crediti.

## Verifica prima di una release

```bash
npm test
npm run audit:icons
npm run build
```

`npm test` verifica parità dei dizionari IT/EN, persistenza profilo, proiezione mensile, stati passato/corrente/futuro, normalizzazione difensiva della risposta Budget, empty state owner/member, navigazione secondaria e trascompilazione dei sorgenti TypeScript/TSX. `npm run audit:icons` esegue inoltre parsing XML, rendering CairoSVG e decodifica PNG/Pillow di ogni icona locale.

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

## V3.9.1 Smart UX — note tecniche

### Importi ed espressioni

`lib/amount-expression.ts` implementa un parser ricorsivo limitato, senza `eval`, `Function` o esecuzione di codice. Accetta numeri, `+`, `-`, `*`, `/`, `×`, `÷`, parentesi, virgola e punto decimale. Lunghezza, numero di operazioni, divisione per zero e ampiezza del risultato sono controllati; prima dell'invio il valore viene arrotondato a due decimali. Il backend riceve soltanto il numero calcolato.

`components/AmountExpressionInput.tsx` è condiviso da:

- nuova transazione;
- modifica movimento;
- nuova e modifica ricorrenza/abbonamento;
- budget complessivo e Macro Budget.

### Catalogo icone

- 63 asset categoria Icons8 Color reali in `public/icons/categories/`;
- 12 brand separati in `public/icons/brands/`;
- catalogo curato per i casi finanziari realmente necessari;
- ricerca normalizzata italiano/inglese e sinonimi finanziari/quotidiani;
- suggerimenti automatici dal nome della categoria;
- preferite e recenti solo in `localStorage`, senza database;
- prime 48 voci renderizzate, batch successivi con `IntersectionObserver`;
- `loading="lazy"` e `decoding="async"` sulle immagini;
- resolver statico allow-list: un identificatore salvato non viene mai interpolato come URL;
- gli identificatori legacy e `color:*` vengono ricondotti a un asset reale compatibile o al fallback;
- fallback esclusivo Phosphor Tag per icone sconosciute o non disponibili.

La cartella artificiale `public/icons/color/`, il relativo manifest generato e lo script colorizer non sono più referenziati dal runtime. Restano fisicamente nella repository solo per una successiva rimozione controllata dopo la verifica dei dati salvati.

Prima di eliminare asset legacy eseguire su Supabase:

```sql
select count(*)
from public.categories
where icon like 'color:%';
```

Eliminare `public/icons/color/`, `lib/category-icon-catalog-data.ts` o script di generazione soltanto se il conteggio è `0` e dopo un audit separato. La V3.9.4 non cancella automaticamente nessun asset potenzialmente referenziato.

### Licenze e attribuzioni

L'attribuzione Icons8 rimane visibile in **Impostazioni → Informazioni**. Nessuna API di icone viene chiamata a runtime e nessun glifo viene generato, ricolorato o sovrapposto.

### Database

V3.9.1 non richiede migration Supabase. I nuovi comportamenti sono frontend e mantengono lo schema V3.9 REV1.

## V3.9.3 Macro Budget — note tecniche

- `lib/macro-budget.ts` calcola impegni fissi, spesa discrezionale, allocazioni, rollover e proiezioni;
- `save_macro_budget_plan` salva atomicamente totale e percentuali macro;
- `can_manage_space_budget` e le RLS consentono la lettura ai membri e le modifiche soltanto a owner/creatore;
- un trigger protegge `categories.macro_category_id` anche da aggiornamenti diretti;
- rollover: `max(0, allocazione precedente + rollover precedente - spesa discrezionale precedente)`;
- budget effettivo macro: allocazione discrezionale + impegni della macro + rollover;
- la proiezione usa il ritmo della spesa discrezionale e aggiunge gli impegni programmati del mese;
- la bottom navigation deriva la voce attiva da `usePathname`, incluse le sottopagine, senza trattare `+` come tab;
- la tab Movimenti usa l’icona Phosphor con frecce verticali opposte per entrate/uscite;
- il runtime non usa più il catalogo artificiale/colorizer e quindi non introduce pallini o sovrapposizioni decorative;
- `categories.kind` separa strutturalmente expense/income; trigger e API impediscono nuovi movimenti o ricorrenze con categoria del tipo errato, mentre le ambiguità legacy rimangono documentate e non distruttive.

## Icon source of truth

- **UI funzionale = Phosphor Icons**;
- **categorie = veri asset Icons8 Color** da `public/icons/categories/`;
- **brand = asset reali dedicati** da `public/icons/brands/`;
- **fallback = Phosphor Tag**;
- vietati mixing di famiglie, glifi generati, colorizer locale e sovrapposizioni decorative.

## Obiettivi di risparmio — stand-by fino alla V3.10

La V3.9.4 non espone Obiettivi in Home, Statistiche o Impostazioni e l'URL preparatorio reindirizza ad Account. Lo schema e le route preparatorie già presenti nella baseline cumulativa restano dormienti per compatibilità, ma non costituiscono una funzionalità utente della V3.9.4. L'esperienza visibile e completa sarà sviluppata e collaudata separatamente nella V3.10.
