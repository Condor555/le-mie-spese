# Le Mie Spese Cloud PWA
Web app personale Next.js + Supabase, pronta per Vercel. Nessun dato finanziario è incluso nel repository.

## Configurazione senza npm sul PC
1. Crea un progetto privato su GitHub e carica tutti i file via browser.
2. Crea un progetto Supabase.
3. In Supabase > SQL Editor esegui `supabase/schema.sql`.
4. Copia Project URL e anon public key da Supabase > Project Settings > API.
5. Importa il repository in Vercel.
6. In Vercel aggiungi `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
7. Distribuisci; poi in Supabase > Authentication > URL Configuration imposta Site URL all'indirizzo Vercel e aggiungi `https://TUO-DOMINIO/auth/callback` tra i redirect.
8. Apri il sito, accedi via magic link e importa il CSV Money Lover dalla pagina Importa.

## Sicurezza
- RLS su tutte le tabelle.
- Repository privo di CSV e seed finanziari.
- Chiave anon nel client; mai usare service_role nel browser.
- Disabilita nuove registrazioni dopo il primo accesso personale, se desiderato.
