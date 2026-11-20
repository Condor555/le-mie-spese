export type IconCatalogEntry={
  id:string;label:string;englishLabel:string;asset:string;group:string;keywords:string[];brand?:boolean;
};

const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it').trim();
const words=(value:string)=>normalize(value).split(/[^a-z0-9]+/).filter(Boolean);
const icon=(id:string,label:string,englishLabel:string,group:string,keywords:string):IconCatalogEntry=>({id,label,englishLabel,asset:`/icons/categories/${id}.svg`,group,keywords:words(`${label} ${englishLabel} ${id} ${keywords}`)});

/**
 * Catalogo categorie runtime verificato dopo l'audit V4.1.1.
 * Sono esposti soltanto i tre asset confermati dall'utente. Tutti gli altri
 * identificatori categoria ricadono sul fallback Phosphor Tag, senza URL
 * dinamici, generatori o cataloghi colorizzati legacy.
 */
export const categoryIconCatalog:IconCatalogEntry[]=[
  icon('beach-umbrella','Mare e spiaggia','Beach umbrella','Viaggi','mare spiaggia lido ombrellone balneare'),
  icon('wedding-rings','Matrimonio','Wedding rings','Famiglia','matrimonio nozze fedi wedding'),
  icon('woman','Moglie','Woman','Famiglia','moglie compagna donna persona'),
];

export const iconGroups=[...new Set(categoryIconCatalog.map(entry=>entry.group))];

/** I brand restano separati dalle categorie come asset dedicati. */
export const brandCatalog:IconCatalogEntry[]=[
  {id:'brand:netflix',label:'Netflix',englishLabel:'Netflix',asset:'/icons/brands/netflix.svg',group:'Brand',brand:true,keywords:['streaming','serie','film']},
  {id:'brand:apple',label:'Apple',englishLabel:'Apple',asset:'/icons/brands/apple.svg',group:'Brand',brand:true,keywords:['iphone','icloud','tv','music']},
  {id:'brand:spotify',label:'Spotify',englishLabel:'Spotify',asset:'/icons/brands/spotify.svg',group:'Brand',brand:true,keywords:['musica','streaming']},
  {id:'brand:amazon',label:'Amazon',englishLabel:'Amazon',asset:'/icons/brands/amazon.svg',group:'Brand',brand:true,keywords:['prime','shopping']},
  {id:'brand:disney',label:'Disney+',englishLabel:'Disney Plus',asset:'/icons/brands/disney.svg',group:'Brand',brand:true,keywords:['streaming','film']},
  {id:'brand:youtube',label:'YouTube',englishLabel:'YouTube',asset:'/icons/brands/youtube.svg',group:'Brand',brand:true,keywords:['video','premium']},
  {id:'brand:playstation',label:'PlayStation',englishLabel:'PlayStation',asset:'/icons/brands/playstation.svg',group:'Brand',brand:true,keywords:['gaming','console']},
  {id:'brand:xbox',label:'Xbox',englishLabel:'Xbox',asset:'/icons/brands/xbox.svg',group:'Brand',brand:true,keywords:['gaming','console']},
  {id:'brand:google',label:'Google',englishLabel:'Google',asset:'/icons/brands/google.svg',group:'Brand',brand:true,keywords:['servizi','cloud']},
  {id:'brand:uber',label:'Uber',englishLabel:'Uber',asset:'/icons/brands/uber.svg',group:'Brand',brand:true,keywords:['taxi','trasporti']},
  {id:'brand:airbnb',label:'Airbnb',englishLabel:'Airbnb',asset:'/icons/brands/airbnb.svg',group:'Brand',brand:true,keywords:['viaggi','alloggio']},
  {id:'brand:paypal',label:'PayPal',englishLabel:'PayPal',asset:'/icons/brands/paypal.svg',group:'Brand',brand:true,keywords:['pagamenti','finanza']},
];

const categoryIds=new Set(categoryIconCatalog.map(entry=>entry.id));

/** Alias ammessi verso asset verificati; ogni altro id usa Phosphor Tag. */
export const legacyIconAliases:Record<string,string>={
  'beach':'beach-umbrella','umbrella-beach':'beach-umbrella',
  'wedding':'wedding-rings','ring':'wedding-rings',
  'wife':'woman','female':'woman',
};

export function normalizeIconId(id?:string|null){
  if(!id)return 'tag';
  if(id.startsWith('brand:'))return brandCatalog.some(entry=>entry.id===id)?id:'tag';
  const raw=id.startsWith('color:')?id.slice(6):id;
  const mapped=legacyIconAliases[raw]||raw;
  return categoryIds.has(mapped)?mapped:'tag';
}

export const allIconCatalog=[...categoryIconCatalog,...brandCatalog];
export function findIconEntry(id?:string|null){const normalized=normalizeIconId(id);return allIconCatalog.find(entry=>entry.id===normalized)}

const preferredSuggestions:[RegExp,string[]][]=[
  [/mare|spiaggia|lido|ombrellone|balneare/i,['beach-umbrella']],
  [/matrimonio|nozze|fedi|wedding/i,['wedding-rings']],
  [/moglie|compagna|donna/i,['woman']],
];

export function suggestIconsForCategory(name:string,limit=8){
  const clean=normalize(name);if(!clean)return [];
  const preferred=preferredSuggestions.find(([rule])=>rule.test(clean))?.[1]||[];
  const tokens=words(clean);
  const scored=categoryIconCatalog.map(entry=>{
    const haystack=normalize(`${entry.label} ${entry.englishLabel} ${entry.id} ${entry.keywords.join(' ')}`);
    const score=tokens.reduce((total,token)=>total+(haystack.includes(token)?2:0)+(normalize(entry.label).startsWith(token)?4:0)+(entry.id.includes(token)?5:0),0);
    const index=preferred.indexOf(entry.id);
    return {entry,score:score+(index>=0?30-index:0)};
  }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.entry.label.localeCompare(b.entry.label,'it'));
  return scored.slice(0,limit).map(item=>item.entry);
}
