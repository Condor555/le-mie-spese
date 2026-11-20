import assert from 'node:assert/strict';
import {readdir,readFile,stat} from 'node:fs/promises';
import ts from 'typescript';

const root=new URL('../',import.meta.url);const read=path=>readFile(new URL(path,root),'utf8');
const transpile=async path=>{const source=await read(path);const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true,fileName:path});const errors=(output.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(errors.length,0,`${path}: ${errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('; ')}`);return {source,output:output.outputText}};

const [migration,schema,budgetApi,macroApi,budgetPage,statsApi,statsPage,home,nav,css,iconCatalog,iconResolver,iconComponent,readme,packageJson]=await Promise.all([
  'supabase/migrations/20261120_v3_9_3_macro_budgets.sql','supabase/schema.sql','app/api/budgets/route.ts','app/api/budget-macros/route.ts','app/budget/page.tsx','app/api/stats/route.ts','app/statistiche/page.tsx','app/page.tsx','components/Nav.tsx','app/globals.css','lib/category-icon-catalog-data.ts','lib/category-icon-catalog.ts','components/CategoryColorIcon.tsx','README.md','package.json',
].map(read));
const [categoryApi,categoryPage,newTransaction,recurringApi,recurringPage,importCsv,macroBudgetLib]=await Promise.all(['app/api/categories/route.ts','app/account/categorie/page.tsx','app/nuovo/page.tsx','app/api/recurring/route.ts','app/account/ricorrenze/page.tsx','app/api/import-csv/route.ts','lib/macro-budget.ts'].map(read));

for(const token of ['budget_macro_categories','macro_budget_allocations','macro_category_id','rollover_enabled','allocation_percent','base_amount','rollover_amount','can_manage_space_budget','save_macro_budget_plan','assign_category_macro','reorder_budget_macros','delete_budget_macro','enable row level security'])assert(migration.includes(token),`Migration: manca ${token}`);
for(const name of ['Casa & Utenze','Alimentazione','Mobilità','Salute & Famiglia','Tempo libero','Shopping','Viaggi','Altro'])assert(migration.includes(`'${name}'`),`Macro iniziale mancante: ${name}`);
assert(migration.includes('Solo owner/creatore')&&migration.includes('is_space_member'));
for(const token of ["kind text not null default 'expense'","categories_kind_check","ensure_default_income_categories","transactions_category_kind_guard","recurring_category_kind_guard","'Altra entrata'","'Stipendio'","'Pensione'"])assert(migration.includes(token),`Categorie income/expense: manca ${token}`);
assert(migration.includes('where b.category_name is not null')&&migration.includes('on conflict(space_id,month,macro_category_id) do nothing'));
assert(!/delete\s+from\s+public\.budgets/i.test(migration),'La migration non deve cancellare i budget legacy.');
assert(schema.includes(migration.trim().slice(0,500))&&schema.includes('V3.9.3 Macro Budget'));
assert((migration.match(/\$\$/g)||[]).length%2===0,'Blocchi dollar-quoted SQL non bilanciati.');

for(const token of ['loadMacroBudgetSnapshot','save_macro_budget_plan','total_budget','allocation_percent','base_amount','rollover_amount'])assert(budgetApi.includes(token));
for(const token of ["action:z.literal('update')","action:z.literal('reorder')","action:z.literal('assign')",'delete_budget_macro'])assert(macroApi.includes(token));
for(const token of ['Distribuzione per macro-categoria','Impegni programmati','Disponibile da distribuire','Equivalente in euro','Analisi categorie','Struttura macro-categorie','rollover','assignCategory','moveMacro'])assert(budgetPage.includes(token),`Budget UI: manca ${token}`);
assert(statsApi.includes('macroCategories')&&statsApi.includes('projectedOverage')&&statsApi.includes('loadMacroBudgetSnapshot'));
for(const token of ['Macro-categorie','analytics-macro-detail','proiezione','projectedOverage'])assert(statsPage.includes(token));
assert(home.includes('budget-projection-insight')&&home.includes('projectedOverage')&&home.includes('AbortController'));
assert(categoryApi.includes("kind:row.kind==='income'?'income':'expense'")&&categoryPage.includes('category-kind-tabs'));
assert(newTransaction.includes("item.kind===kind")&&newTransaction.includes('chooseKind'));
assert(recurringApi.includes('transaction_type')&&recurringPage.includes('recurring-transaction-kind'));
assert(importCsv.includes('clearIncomeName')&&importCsv.includes("'Altra entrata':'Altro'"));
assert(macroBudgetLib.includes(".eq('kind','expense')"),'Macro Budget deve interrogare solo categorie expense.');
assert(statsApi.includes('incomeSources')&&statsPage.includes('Fonti di reddito'));

for(const token of ['usePathname','aria-current','pathname.startsWith(\'/account/\')','pathname.startsWith(\'/movimenti/\')','pathname.startsWith(\'/statistiche/\')'])assert(nav.includes(token),`Nav: manca ${token}`);
assert(!nav.includes('nav-plus" aria-current'),'Il pulsante + non deve essere una tab attiva.');
for(const token of ['.bottom-nav>a:not(.nav-plus).active','.nav-tab-icon','var(--primary)','html[data-theme="dark"]'])assert(css.includes(token));

const declared=Number(iconCatalog.match(/COLOR_ICON_COUNT=(\d+)/)?.[1]);const slugs=[...iconCatalog.matchAll(/^  \['([^']+)'/gm)].map(match=>match[1]);assert.equal(slugs.length,declared);assert.equal(new Set(slugs).size,declared);
for(const slug of slugs){const url=new URL(`public/icons/color/${slug}.svg`,root);const info=await stat(url);assert(info.isFile()&&info.size>100,`Asset mancante/vuoto: ${slug}`);const svg=await read(`public/icons/color/${slug}.svg`);assert(svg.startsWith('<svg')&&svg.includes('viewBox=')&&svg.includes('<path'),`SVG invalido: ${slug}`);assert(!svg.includes('url(#')&&!svg.includes('<defs>')&&!svg.includes('<circle'),`SVG non browser-safe o con pallino decorativo: ${slug}`)}
assert(iconResolver.includes('asset:`/icons/color/${slug}.svg`'));
for(const token of ['onError','category-color-fallback',"removeAttribute('src')"])assert(iconComponent.includes(token),`Fallback icone: manca ${token}`);

const macroModule=await transpile('lib/macro-budget.ts');const pureJs=macroModule.output.replace(/^import .*?;\n/m,"const addRecurringDate=()=>'';\n");const macro=await import(`data:text/javascript;base64,${Buffer.from(pureJs).toString('base64')}`);
assert.equal(macro.previousMonth('2026-01'),'2025-12');assert.equal(macro.nextMonth('2026-12'),'2027-01');assert.equal(macro.monthStart('2026-11'),'2026-11-01');assert.equal(macro.roundMoney(100/3),33.33);

const pkg=JSON.parse(packageJson);assert.equal(pkg.version,'3.9.3');assert.equal(pkg.scripts.prebuild,'npm run check:phosphor');assert(pkg.scripts['audit:icons'].includes('audit-icon-assets.py'));
assert(readme.includes('V3.9.3')&&readme.includes('Macro Budget'));

const sourceFiles=[];async function collect(directory){for(const entry of await readdir(new URL(directory,root),{withFileTypes:true})){const relative=`${directory}${entry.name}`;if(entry.isDirectory())await collect(`${relative}/`);else if(/\.(ts|tsx)$/.test(entry.name))sourceFiles.push(relative)}}for(const directory of ['app/','components/','lib/'])await collect(directory);for(const file of sourceFiles)await transpile(file);
console.log(`verify-v3.9.3: 68 controlli superati; ${declared}/${declared} path icone risolti; ${sourceFiles.length} file TS/TSX trascompilati`);
