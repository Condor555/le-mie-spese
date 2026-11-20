import assert from 'node:assert/strict';
import {readdir,readFile,stat} from 'node:fs/promises';
import ts from 'typescript';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const transpile=async path=>{
  const source=await read(path);
  const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true,fileName:path});
  const errors=(output.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,`${path}: ${errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('; ')}`);
  return {source,output:output.outputText};
};

const amountModule=await transpile('lib/amount-expression.ts');
assert(!/\beval\s*\(|new\s+Function\b/.test(amountModule.source),'Il parser non deve eseguire codice dinamico.');
const amount=await import(`data:text/javascript;base64,${Buffer.from(amountModule.output).toString('base64')}`);
for(const [expression,expected] of [
  ['4,50 * 3',13.5],['120 / 4',30],['12.50 + 8.30',20.8],['25 - 4,90',20.1],['(12 + 8) × 3',60],['18 ÷ (2 + 1)',6],['-2 + 8',6],
])assert.equal(amount.evaluateAmountExpression(expression).value,expected,expression);
assert.equal(amount.amountForSave('100/3'),33.33);
assert.equal(amount.amountForSave('0'),null);
assert.equal(amount.amountForSave('0',true),0);
assert.equal(amount.evaluateAmountExpression('8/0').ok,false);
assert.equal(amount.evaluateAmountExpression('(2+3').ok,false);
assert.equal(amount.evaluateAmountExpression('2+alert(1)').ok,false);
assert.equal(amount.sanitizeAmountExpression('12€ × 3abc'),'12 × 3');

const [newTx,movements,recurring,budget,amountInput,catalog,picker,style,assetResolver,readme,info,packageJson]=await Promise.all([
  'app/nuovo/page.tsx','app/movimenti/page.tsx','app/account/ricorrenze/page.tsx','app/budget/page.tsx','components/AmountExpressionInput.tsx','lib/category-icon-catalog.ts','components/IconCatalogPicker.tsx','lib/category-style.ts','lib/category-icon-assets.ts','README.md','app/account/informazioni/page.tsx','package.json',
].map(read));
for(const [name,source] of [['nuova transazione',newTx],['modifica movimento',movements],['ricorrenze',recurring],['budget',budget]]){
  assert(source.includes('AmountExpressionInput'),`Calcolatrice mancante: ${name}`);
  assert(source.includes('amountForSave'),`Salvataggio numerico mancante: ${name}`);
}
assert((recurring.match(/<AmountExpressionInput/g)||[]).length>=2,'Creazione e modifica ricorrenza devono usare lo stesso campo.');
assert((budget.match(/<AmountExpressionInput/g)||[]).length>=2,'Budget totale e categorie devono usare la calcolatrice.');
for(const token of ['amount-preview','sanitizeAmountExpression','placeholder="€ 0,00"','inputMode="text"'])assert(amountInput.includes(token));
for(const token of ['amount-calculator-toggle','amount-keypad','Mini-calcolatrice'])assert(!amountInput.includes(token));

const categoryIds=[...catalog.matchAll(/icon\('([^']+)'/g)].map(match=>match[1]);
const brandAssets=[...catalog.matchAll(/asset:'\/icons\/brands\/([^']+)'/g)].map(match=>match[1]);
assert.equal(categoryIds.length,63);assert.equal(brandAssets.length,12);
for(const id of categoryIds)assert((await stat(new URL(`public/icons/categories/${id}.svg`,root))).isFile());
for(const file of brandAssets)assert((await stat(new URL(`public/icons/brands/${file}`,root))).isFile());
for(const token of ['suggestIconsForCategory','legacyIconAliases','normalizeIconId','brandCatalog'])assert((await read('lib/category-icon-catalog.ts')).includes(token));
for(const token of ['IntersectionObserver','localStorage','suggestFor','favorites'])assert(picker.includes(token));
const colorIconComponent=await read('components/CategoryColorIcon.tsx');
assert(colorIconComponent.includes('loading="lazy"')&&colorIconComponent.includes('decoding="async"'));
assert(colorIconComponent.includes('onError')&&colorIconComponent.includes('category-color-fallback'));
assert(style.includes('normalizeIconId')&&style.includes('mare|spiaggia|lido'));
assert(assetResolver.includes('findIconEntry')&&!assetResolver.includes('/icons/color'));
assert(info.includes('Icons8')&&!info.includes('Font Awesome Free'));
assert(readme.includes('V3.9.1 Smart UX')&&readme.includes('non richiede migration Supabase'));
const pkg=JSON.parse(packageJson);assert(/^3\.9\.(?:[1-9]|\d{2,})$/.test(pkg.version));assert.equal(pkg.scripts.prebuild,'npm run check:phosphor');

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
console.log(`verify-v3.9.1: 45 controlli funzionali/statici superati; ${categoryIds.length} categorie Icons8 + ${brandAssets.length} brand; ${sourceFiles.length} file TS/TSX trascompilati`);
