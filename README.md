# Le Mie Spese

PWA personale e mobile-first per gestire entrate, uscite e statistiche finanziarie. Il progetto nasce dalla migrazione dello storico Money Lover e usa una categorizzazione automatica basata sulle descrizioni e sullo storico personale.

## V2.5 - Design release

La V2.5 introduce un'interfaccia Fintech Clean ottimizzata per iPhone:

- dashboard mensile con saldo, entrate e uscite;
- andamento degli ultimi 6 mesi;
- categorie principali con identità visiva e barre proporzionali;
- insight mensili;
- navigazione mobile con pulsante centrale per l'inserimento rapido;
- dark mode automatica tramite `prefers-color-scheme`;
- layout responsive;
- schermate Movimenti, Nuovo movimento e Statistiche integrate con lo stesso design system.

## Funzionalità

- autenticazione gratuita con email e password tramite Supabase Auth;
- sessione persistente;
- import CSV Money Lover con deduplicazione;
- ricerca e filtri sui movimenti;
- modifica ed eliminazione dei movimenti;
- entrate, uscite e trasferimenti;
- categorie suggerite automaticamente;
- feedback sulle correzioni di categoria;
- statistiche mensili e trend;
- installazione come PWA su iPhone.

## Stack

- Next.js 15 + TypeScript
- Supabase PostgreSQL + Auth + Row Level Security
- Vercel
- CSS responsive mobile-first

## Privacy e sicurezza

I dati finanziari non sono inclusi nel repository. Le transazioni sono conservate nel database Supabase e protette da Row Level Security. Nel frontend viene usata esclusivamente la chiave pubblica/publishable del progetto; la `service_role` non deve mai essere esposta nel browser.

## Sviluppo locale

Richiede Node.js 20+.

```bash
npm install
npm run dev
```

Aprire `http://localhost:3000`.

Variabili necessarie:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Deploy

Il repository è collegato a Vercel. Ogni commit su `main` genera automaticamente un nuovo deployment. Configurare le variabili Supabase in Vercel > Project Settings > Environment Variables.

## Roadmap V3

La V3 introdurrà spazi finanziari personali e condivisi:

- account separati;
- spazio personale automatico;
- spazi condivisi per coppie/famiglie;
- invito tramite codice senza dipendenza da email a pagamento;
- ruoli Owner/Member;
- autore di ogni movimento;
- dashboard e budget condivisi;
- policy RLS basate sull'appartenenza allo spazio.

L'obiettivo resta mantenere l'app utilizzabile con uno stack gratuito per l'uso personale e familiare.
