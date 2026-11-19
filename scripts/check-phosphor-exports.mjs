import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';
import * as phosphor from '@phosphor-icons/react/ssr';

const root=process.cwd();
const sourceRoots=['app','components','lib'];
const files=[];
function walk(dir){
  for(const name of readdirSync(dir)){
    const full=join(dir,name),st=statSync(full);
    if(st.isDirectory())walk(full);else if(/\.(?:ts|tsx)$/.test(name))files.push(full);
  }
}
for(const folder of sourceRoots){try{walk(join(root,folder))}catch{}}
const required=new Map();
const pattern=/import\s*\{([\s\S]*?)\}\s*from\s*['"]@phosphor-icons\/react\/ssr['"]/g;
for(const file of files){
  const text=readFileSync(file,'utf8');let match;
  while((match=pattern.exec(text))){
    for(const token of match[1].split(',')){
      const cleaned=token.replace(/\/\*[\s\S]*?\*\//g,'').trim().replace(/^type\s+/,'');
      if(!cleaned)continue;
      const exported=cleaned.split(/\s+as\s+/)[0].trim();
      if(!required.has(exported))required.set(exported,[]);
      required.get(exported).push(relative(root,file));
    }
  }
}
const missing=[...required].filter(([name])=>!(name in phosphor));
if(missing.length){
  console.error('\nPhosphor 2.1.10: export mancanti rilevati:');
  for(const [name,where] of missing)console.error(`- ${name} (${[...new Set(where)].join(', ')})`);
  console.error('\nCorreggere tutti i nomi prima della compilazione Next.js.');
  process.exit(1);
}
if(required.has('Safe')){
  console.error('L’export non supportato Safe è ancora importato. Usare PiggyBankIcon per l’identificatore salvato "safe".');
  process.exit(1);
}
console.log(`Phosphor export check OK: ${required.size} import nominati verificati contro @phosphor-icons/react/ssr.`);
