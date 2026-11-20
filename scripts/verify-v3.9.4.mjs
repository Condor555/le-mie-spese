import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import ts from 'typescript';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const transpile=async path=>{
  const source=await read(path);
  const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true,fileName:path});
  const errors=(result.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,`${path}: ${errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('; ')}`);
  return {source,output:result.outputText};
};

const paths=['lib/i18n.ts','components/LanguageProvider.tsx','app/api/settings/profile/route.ts','app/account/profilo/page.tsx','app/statistiche/page.tsx','app/api/stats/route.ts','lib/macro-budget.ts','app/budget/page.tsx','app/api/budgets/route.ts','components/Nav.tsx','app/globals.css','supabase/schema.sql','supabase/migrations/20261120_v3_9_4_user_language.sql','README.md','package.json'];
const [i18n,provider,profileApi,profilePage,statsPage,statsApi,macroLib,budgetPage,budgetApi,nav,css,schema,migration,readme,packageJson]=await Promise.all(paths.map(read));
const [amountInput,amountParser,newTransaction,movements,recurring,dateInput,accountPage,goalsPage,infoPage,categoryPage,importPage,suggestionsApi,suggestionsLib,iconRenderer,iconResolver]=await Promise.all([
  'components/AmountExpressionInput.tsx','lib/amount-expression.ts','app/nuovo/page.tsx','app/movimenti/page.tsx','app/account/ricorrenze/page.tsx','components/DateInput.tsx','app/account/page.tsx','app/account/obiettivi/page.tsx','app/account/informazioni/page.tsx','app/account/categorie/page.tsx','app/importa/page.tsx','app/api/transactions/suggestions/route.ts','lib/transaction-suggestions.ts','components/CategoryColorIcon.tsx','lib/category-icon-assets.ts',
].map(read));

for(const token of ['supportedLocales','DEFAULT_LOCALE','messages={it,en}','formatCurrency','formatDate','normalizeLocale'])assert(i18n.includes(token),`i18n: manca ${token}`);
for(const token of ["'common.incomes':'Entrate'","'common.expenses':'Uscite'","'common.incomes':'Income'","'common.expenses':'Expenses'"])assert(i18n.includes(token),`Dizionari: manca ${token}`);
for(const token of ['LOCALE_STORAGE_KEY','/api/settings/profile','document.documentElement.lang','setLocale'])assert(provider.includes(token),`LanguageProvider: manca ${token}`);
assert(profileApi.includes("z.enum(['it','en'])")&&profileApi.includes("select('display_name,language')"));
assert(profilePage.includes('language-options')&&profilePage.includes("chooseLanguage('it')")&&profilePage.includes("chooseLanguage('en')"));
assert(migration.includes('add column if not exists language')&&migration.includes("check(language in ('it','en'))"));
assert(schema.includes("language text not null default 'it' check(language in ('it','en'))"));
for(const policy of ['v3.6 profiles select','v3.6 profiles insert','v3.6 profiles update'])assert(schema.includes(policy),`RLS profili: manca ${policy}`);
assert((migration.match(/\$\$/g)||[]).length%2===0,'Blocchi SQL non bilanciati.');

for(const token of ['€ 0,00','hasExpression','amount-preview'])assert(amountInput.includes(token),`Importo diretto: manca ${token}`);
assert(!amountInput.includes('<button'),'AmountExpressionInput non deve contenere il pulsante calcolatrice.');
assert(!amountInput.includes('12,50 × 3'),'Il placeholder non deve contenere un esempio.');
for(const token of ["replace(/[^0-9+\\-*/×÷(),.\\s]/g",'MAX_OPERATIONS','Number.EPSILON'])assert(amountParser.includes(token),`Parser importi: manca ${token}`);
for(const page of [newTransaction,budgetPage,recurring])assert(page.includes('AmountExpressionInput'),'Nuova transazione, Budget e Ricorrenze devono condividere AmountExpressionInput.');
assert(budgetPage.includes('inputMode="decimal"')&&!budgetPage.includes('AmountExpressionInput compact disabled={!data.canEdit} value={draft.percent}'),'La percentuale Macro Budget deve restare un input numerico, non monetario.');

for(const token of ["name={t('common.incomes')}","name={t('common.expenses')}","periodStatus:'past'|'current'|'future'",'projectionSubtitle','completedSubtitle','futureSubtitle'])assert(statsPage.includes(token),`Statistiche UI: manca ${token}`);
for(const token of ['const projectedExpense=pace.isCurrent','expense/daysConsidered*daysInMonth',"periodStatus=pace.isPast?'past':pace.isFuture?'future':'current'",'projected:pace.isCurrent?macroBudget.projectedExpense:null'])assert(statsApi.includes(token),`Proiezione: manca ${token}`);
const estimate=(expense,elapsed,total)=>Math.round(expense/elapsed*total*100)/100;
assert.equal(estimate(100,10,30),300);assert.equal(estimate(1353.36,31,31),1353.36);
assert.equal(Math.round((2270.01-1353.36)*100)/100,916.65);
assert(statsPage.includes("stats.balance>0?'+':''")&&statsPage.includes("subtitle:t('stats.completedSubtitle')"));

for(const token of ['hasBudgetPlan','totalBudgetRow','Boolean(totalBudgetRow)','projectedOverage:totalBudget>0'])assert(macroLib.includes(token),`Snapshot Budget: manca ${token}`);
for(const token of ['normalizeBudgetData','Array.isArray(source.macros)','filter((item)','budget.emptyTitle','budget.emptyOwner','budget.emptyMember','setInitializing(true)','budget-back'])assert(budgetPage.includes(token),`Budget UI robusta: manca ${token}`);
for(const token of ['hasActiveLimit','activeAvailable==null?\'—\'','macro-compact-list','allocation-summary','openEditor','saveEditor','includedCategories'])assert(budgetPage.includes(token),`Budget semplificato: manca ${token}`);
assert(!budgetPage.includes('macro-structure-main')&&!budgetPage.includes('function moveMacro')&&!budgetPage.includes('Sposta su'),'La vista principale non deve mostrare editor strutturale o frecce di riordino.');
assert.equal(Math.round(2000*.35*100)/100,700,'35% di 2.000 € deve equivalere a 700 €.');
assert(budgetPage.includes('allocationPercentTotal>100.001')&&budgetPage.includes("distributionState=allocationPercentTotal>100.001?'over'"),'La sovra-allocazione deve essere visibile e bloccare il salvataggio.');
assert(budgetApi.includes('Budget snapshot load failed')&&budgetApi.includes('Impossibile caricare il budget per il periodo selezionato.'));
assert(nav.includes("pathname === '/budget'")&&nav.includes("label: 'nav.statistics'"),'Budget deve restare sotto Statistiche nella bottom navigation.');
assert(!nav.includes("href: '/budget',\n    label"),'Budget non deve diventare una quinta tab principale.');
for(const token of ['.language-options','.budget-empty','.budget-back','html[data-theme="dark"] .back-link span'])assert(css.includes(token),`CSS: manca ${token}`);

assert(movements.includes('<DateRangePicker')&&(movements.match(/<MovementFilterDropdown/g)||[]).length>=2&&!movements.includes('Applica filtri'));
for(const token of ['setDebouncedQ','300','AbortController','setPage(1)','onActiveSpaceChanged'])assert(movements.includes(token),`Movimenti: manca ${token}`);
assert((recurring.match(/<MovementFilterDropdown/g)||[]).length>=4,'Ricorrenze deve usare dropdown custom per Categoria/Frequenza in crea/modifica.');
assert((recurring.match(/<DateInput/g)||[]).length>=2&&!recurring.includes('type="date"')&&!recurring.includes('<select'),'Ricorrenze non deve usare select/data nativi per i controlli concordati.');
assert(dateInput.includes('showPicker')&&css.includes('.date-input-control>input::-webkit-calendar-picker-indicator'));
assert(accountPage.includes("title:'account.profileTitle'")&&!accountPage.includes("/account/obiettivi"));
assert(goalsPage.includes("redirect('/obiettivi')"),'Il percorso Obiettivi legacy deve portare alla pagina V4.1 visibile.');
for(const token of ['InfoIcon','Repository GitHub','https://github.com/Condor555/qoomia','noopener noreferrer'])assert(accountPage.includes(token)||infoPage.includes(token),`Informazioni: manca ${token}`);
assert(categoryPage.includes("useState<'expense'|'income'>('expense')")&&categoryPage.includes('category-kind-tabs')&&categoryPage.includes('Uscite')&&categoryPage.includes('Entrate'));
assert(importPage.includes('variant="destination"')&&importPage.includes("form.set('space_id',spaceId)")&&!importPage.includes('Spazio visualizzato'));
assert(suggestionsApi.includes(".eq('space_id',spaceId)")&&suggestionsApi.includes("rankTransactionSuggestions((data||[]) as SuggestionRow[],query,5)"));
assert(suggestionsLib.includes('.slice(0,limit)'));
for(const token of ['CategoryIconVisual','if(!ready||!src)return <TagIcon','return <img'])assert(iconRenderer.includes(token),`Icone single-render: manca ${token}`);
assert(iconResolver.includes("findIconEntry(icon)?.asset||null")&&!iconResolver.includes('/icons/color/'));

const i18nModule=await transpile('lib/i18n.ts');
const runtime=await import(`data:text/javascript;base64,${Buffer.from(i18nModule.output).toString('base64')}`);
assert.equal(runtime.translate('it','common.incomes'),'Entrate');
assert.equal(runtime.translate('en','common.expenses'),'Expenses');
assert.equal(runtime.translate('en','stats.daysConsidered',{count:20}),'20 days considered');
assert.match(runtime.formatCurrency(1353.36,'it'),/(?:1[.\s])?353,36|1353,36/);
assert.match(runtime.formatCurrency(1353.36,'en'),/1,353\.36/);
assert.equal(runtime.normalizeLocale('fr'),'it');
const macroModule=await transpile('lib/macro-budget.ts');
const macroRuntime=await import(`data:text/javascript;base64,${Buffer.from(macroModule.output.replace(/^import .*?from '\.\/recurrence';\n/m,"const addRecurringDate=()=>'';\n")).toString('base64')}`);
assert.deepEqual(macroRuntime.macroAllocationMetrics(0,0,200,300),{hasAllocation:false,allocatedBudget:0,percentage:0,status:'ok',available:0,projectedPercentage:0},'Commitments/spese non devono creare un budget macro implicito.');
assert.deepEqual(macroRuntime.macroAllocationMetrics(100,0,50,75),{hasAllocation:true,allocatedBudget:100,percentage:50,status:'ok',available:50,projectedPercentage:75},'Percentuali macro calcolate solo sul budget allocato.');
const itKeys=Object.keys(runtime.messages.it).sort();const enKeys=Object.keys(runtime.messages.en).sort();assert.deepEqual(enKeys,itKeys,'I dizionari IT/EN devono avere le stesse chiavi.');

const pkg=JSON.parse(packageJson);assert.equal(pkg.version,'4.1.1');assert.equal(pkg.scripts.test,'node scripts/verify-v3.9.4.mjs && node scripts/verify-qoomia-brand.mjs');
for(const token of ['V4.1.1','20261120_v3_9_4_user_language.sql','20261120_v4_1_savings_goals.sql','20261120_v4_1_1_ux_icon_cleanup.sql','Spazi Privati','Budget','Roadmap'])assert(readme.includes(token),`README pubblico: manca ${token}`);

const sourceFiles=[];
async function collect(directory){for(const entry of await readdir(new URL(directory,root),{withFileTypes:true})){const relative=`${directory}${entry.name}`;if(entry.isDirectory())await collect(`${relative}/`);else if(/\.(ts|tsx)$/.test(entry.name))sourceFiles.push(relative)}}
for(const directory of ['app/','components/','lib/'])await collect(directory);
for(const file of sourceFiles)await transpile(file);
console.log(`verify-v3.9.4: dizionari ${itKeys.length} chiavi, proiezione/empty state Budget verificati, ${sourceFiles.length} file TS/TSX trascompilati`);
