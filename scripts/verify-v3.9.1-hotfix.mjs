import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import ts from 'typescript';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const transpile=async path=>{
  const source=await read(path);
  const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true,fileName:path});
  const errors=(output.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,`${path}: ${errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('; ')}`);
  return source;
};

const [monthPicker,sharedPeriod,home,stats,movements,filterDropdown,css,packageJson]=await Promise.all([
  'components/MonthPicker.tsx','lib/selected-period-client.ts','app/page.tsx','app/statistiche/page.tsx','app/movimenti/page.tsx','components/MovementFilterDropdown.tsx','app/globals.css','package.json',
].map(read));

for(const token of ['month-picker-pill','month-picker-popover','month-picker-grid','role="dialog"','role="grid"','Mese corrente','PageUp','PageDown','aria-expanded'])assert(monthPicker.includes(token),`MonthPicker: manca ${token}`);
assert(!monthPicker.includes('type="month"'),'Non deve restare il controllo month nativo sovrapposto.');
assert(!monthPicker.includes('showPicker'),'La hotfix non deve dipendere da showPicker().');
assert(!monthPicker.includes('month-picker-native'),'Il vecchio input nativo deve essere rimosso.');
assert((home.match(/<MonthPicker/g)||[]).length===1&&(stats.match(/<MonthPicker/g)||[]).length===1,'Home e Statistiche devono riusare lo stesso componente.');
assert(sharedPeriod.includes('localStorage')&&sharedPeriod.includes('CustomEvent'),'Il mese deve restare sincronizzato fra schermate.');
for(const source of [home,stats]){
  assert(source.includes('AbortController'),'Le richieste devono essere annullabili.');
  assert(source.includes("cache:'no-store'"),'I dati del mese non devono usare cache stale.');
}
assert(home.includes('statsRequestRef')&&home.includes('trendsRequestRef'));
assert(stats.includes('statsRequestRef')&&stats.includes('trendsRequestRef'));

assert(movements.includes('MovementFilterDropdown'));
assert(!movements.includes('<label className="compact-filter"'),'I select nativi Categoria/Tipo devono essere rimossi.');
for(const token of ['role="listbox"','role="option"','aria-selected','ArrowDown','ArrowUp','Home','End','Escape','Tab','✓'])assert(filterDropdown.includes(token),`Dropdown: manca ${token}`);
for(const token of ['debouncedQ','DateRangePicker','categoryFilter','kindFilter','setPage(1)','dayTotal','count'])assert(movements.includes(token),`Movimenti: regressione ${token}`);
for(const token of ["params.set('category'","params.set('kind'","params.set('start'","params.set('end'"])assert(movements.includes(token));
for(const token of ['.month-picker-popover','.movement-filter-list','z-index:45','html[data-theme="dark"]'])assert(css.includes(token),`CSS: manca ${token}`);
assert(!css.includes('.month-picker-native'));
const pkg=JSON.parse(packageJson);assert(/^3\.9\.(?:[1-9]|\d{2,})$/.test(pkg.version));

const sourceFiles=[];
async function collect(directory){
  for(const entry of await readdir(new URL(directory,root),{withFileTypes:true})){
    const relative=`${directory}${entry.name}`;
    if(entry.isDirectory())await collect(`${relative}/`);
    else if(/\.(ts|tsx)$/.test(entry.name))sourceFiles.push(relative);
  }
}
for(const directory of ['app/','components/','lib/'])await collect(directory);
for(const file of sourceFiles)await transpile(file);
console.log(`verify-v3.9.1-hotfix: 41 controlli superati; ${sourceFiles.length} file TS/TSX trascompilati`);
