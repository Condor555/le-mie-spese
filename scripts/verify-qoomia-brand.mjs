import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [layout,manifest,middleware,home,login,register,onboarding,about,readme,css,pkg,spaceSwitcher,categoriesPage,categoriesApi,categoryApi,mergeApi,activeSpace,spacesApi,transactionsApi,statsApi,trendsApi,movementsPage,statsPage]=await Promise.all([
  'app/layout.tsx','app/manifest.ts','middleware.ts','app/page.tsx','app/login/page.tsx','app/registrati/page.tsx','app/onboarding/page.tsx','app/account/informazioni/page.tsx','README.md','app/globals.css','package.json','components/SpaceSwitcher.tsx','app/account/categorie/page.tsx','app/api/categories/route.ts','app/api/categories/[name]/route.ts','app/api/categories/merge/route.ts','lib/active-space.ts','app/api/spaces/route.ts','app/api/transactions/route.ts','app/api/stats/route.ts','app/api/trends/route.ts','app/movimenti/page.tsx','app/statistiche/page.tsx',
].map(read));

for(const token of ['Qoomia','Dai senso alle tue spese, in privato o in famiglia.','qoomia.vercel.app'])assert(layout.includes(token),`Metadata: manca ${token}`);
for(const token of ["name:'Qoomia — Spese, Budget e Famiglia'","short_name:'Qoomia'","theme_color:'#0F766E'","background_color:'#090D16'","/icons/qoomia-v4-1-192.png","/icons/qoomia-v4-1-512.png","/icons/qoomia-v4-1-512-maskable.png"])assert(manifest.includes(token),`Manifest: manca ${token}`);
for(const source of [home,login,register,onboarding,about])assert(source.includes('Qoomia'), 'Una schermata di brand non contiene Qoomia.');
for(const source of [login,register,onboarding])assert(source.includes('QoomiaLogo'), 'Una schermata di accesso/onboarding non usa il logo Qoomia.');
assert(middleware.includes("if(!user&&!isPublic)")&&middleware.includes("url.pathname='/login'")&&middleware.includes("path==='/login'"),'Il middleware deve proteggere la root e lasciare entrare gli utenti autenticati.');
for(const token of ['manifest.webmanifest','svg|png|jpg|jpeg|gif|webp'])assert(middleware.includes(token),`Il middleware non esclude correttamente gli asset statici: manca ${token}`);
assert(readme.includes('# 🟢 Qoomia')&&readme.includes('Quota')&&readme.includes('Spazi Privati e Condivisi')&&readme.includes('Macro Budget e Rollover')&&readme.includes('Chiarezza Immediata'),'Header README Qoomia incompleto.');
assert(readme.includes('github.com/Condor555/qoomia')&&!readme.includes('github.com/Condor555/le-mie-spese'),'Riferimenti repository non aggiornati.');
for(const token of ['--bg:#F8FAFC','--primary:#0F766E','html[data-theme="dark"]{--bg:#090D16'])assert(css.includes(token),`Palette: manca ${token}`);
assert(!spaceSwitcher.includes('QoomiaLogo')&&!spaceSwitcher.includes('app-brand'),'Lo switcher globale non deve duplicare il branding Qoomia.');
for(const token of ['initialSpaceId','requestAnimationFrame','announceActiveSpace(initialSpaceId)'])assert(spaceSwitcher.includes(token),`Sincronizzazione iniziale SpacePicker: manca ${token}`);
for(const token of ['resolveDefaultSpaceId','transactions',"store.set('active_space'"])assert(activeSpace.includes(token),`Fallback spazio attivo: manca ${token}`);
assert(spacesApi.includes('resolveDefaultSpaceId')&&spacesApi.includes('activeSpaceId'),'L’API spazi deve usare lo stesso fallback della risoluzione server.');
for(const source of [transactionsApi,statsApi,trendsApi])assert(source.includes(".eq('space_id',spaceId)"),'Home/Movimenti/Statistiche devono filtrare lo spazio risolto.');
for(const source of [home,movementsPage,statsPage])assert(source.includes('onActiveSpaceChanged'),'Home, Movimenti e Statistiche devono reagire allo SpacePicker globale.');
for(const token of ['SpacePicker','variant="compact"','spaceId','chooseSpace','/api/spaces','/api/categories?spaceId='])assert(categoriesPage.includes(token),`Categorie per spazio: manca ${token}`);
for(const source of [categoriesApi,categoryApi,mergeApi])assert(source.includes('activeSpace(')&&source.includes('spaceId'), 'Ogni API categorie deve validare e filtrare lo spazio richiesto.');
assert(categoriesApi.includes(".eq('space_id',spaceId)")&&categoryApi.includes(".eq('space_id',spaceId)")&&mergeApi.includes(".eq('space_id',spaceId)"),'Le operazioni categorie devono restare confinate allo spazio selezionato.');
const packageJson=JSON.parse(pkg);assert.equal(packageJson.name,'qoomia');assert.equal(packageJson.version,'4.0.1');
for(const asset of ['public/icons/qoomia.svg','public/icons/qoomia-v4-1.svg','public/icons/qoomia-v4-1-192.png','public/icons/qoomia-v4-1-512.png','public/icons/qoomia-v4-1-512-maskable.png','public/icons/qoomia-v4-1-apple-touch.png','public/icons/qoomia-v4-1-favicon.png','app/apple-icon.png','app/favicon.ico'])assert((await stat(new URL(asset,root))).isFile(),`Asset PWA mancante: ${asset}`);
console.log('verify-qoomia-brand: header unico, PWA cache-busted, metadata, root e categorie per spazio verificati');
