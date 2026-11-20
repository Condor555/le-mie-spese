import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [layout,manifest,middleware,home,login,register,onboarding,about,readme,css,pkg]=await Promise.all([
  'app/layout.tsx','app/manifest.ts','middleware.ts','app/page.tsx','app/login/page.tsx','app/registrati/page.tsx','app/onboarding/page.tsx','app/account/informazioni/page.tsx','README.md','app/globals.css','package.json',
].map(read));

for(const token of ['Qoomia','Dai senso alle tue spese, in privato o in famiglia.','qoomia.vercel.app'])assert(layout.includes(token),`Metadata: manca ${token}`);
for(const token of ["name:'Qoomia — Spese, Budget e Famiglia'","short_name:'Qoomia'","theme_color:'#0F766E'","background_color:'#090D16'","/icons/qoomia-192.png","/icons/qoomia-512-maskable.png"])assert(manifest.includes(token),`Manifest: manca ${token}`);
for(const source of [home,login,register,onboarding,about])assert(source.includes('Qoomia'), 'Una schermata di brand non contiene Qoomia.');
for(const source of [login,register,onboarding])assert(source.includes('QoomiaLogo'), 'Una schermata di accesso/onboarding non usa il logo Qoomia.');
assert(middleware.includes("if(!user&&!isPublic)")&&middleware.includes("url.pathname='/login'")&&middleware.includes("path==='/login'"),'Il middleware deve proteggere la root e lasciare entrare gli utenti autenticati.');
for(const token of ['manifest.webmanifest','svg|png|jpg|jpeg|gif|webp'])assert(middleware.includes(token),`Il middleware non esclude correttamente gli asset statici: manca ${token}`);
assert(readme.includes('# 🟢 Qoomia')&&readme.includes('Quota')&&readme.includes('Spazi Privati e Condivisi')&&readme.includes('Macro Budget e Rollover')&&readme.includes('Chiarezza Immediata'),'Header README Qoomia incompleto.');
assert(readme.includes('github.com/Condor555/qoomia')&&!readme.includes('github.com/Condor555/le-mie-spese'),'Riferimenti repository non aggiornati.');
for(const token of ['--bg:#F8FAFC','--primary:#0F766E','html[data-theme="dark"]{--bg:#090D16'])assert(css.includes(token),`Palette: manca ${token}`);
const packageJson=JSON.parse(pkg);assert.equal(packageJson.name,'qoomia');assert.equal(packageJson.version,'4.0.0');
for(const asset of ['public/icons/qoomia.svg','public/icons/qoomia-192.png','public/icons/qoomia-512.png','public/icons/qoomia-512-maskable.png','app/apple-icon.png','app/favicon.ico'])assert((await stat(new URL(asset,root))).isFile(),`Asset PWA mancante: ${asset}`);
console.log('verify-qoomia-brand: branding, PWA, metadata e protezione root verificati');
