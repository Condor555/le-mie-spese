import {colorIconCatalogData} from './category-icon-catalog-data';

export type IconCatalogEntry={
  id:string;
  label:string;
  englishLabel:string;
  asset:string;
  group:string;
  keywords:string[];
  brand?:boolean;
};

export const iconGroups=[...new Set(colorIconCatalogData.map(([, , ,group])=>group))];

const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it').trim();
const words=(value:string)=>normalize(value).split(/[^a-z0-9]+/).filter(Boolean);

export const colorIconCatalog:IconCatalogEntry[]=colorIconCatalogData.map(([slug,label,englishLabel,group,keywords])=>({
  id:`color:${slug}`,
  label,
  englishLabel,
  asset:`/icons/color/${slug}.svg`,
  group,
  keywords:words(`${label} ${englishLabel} ${slug} ${keywords}`),
}));

export const brandCatalog:IconCatalogEntry[]=[
  {id:'brand:netflix',label:'Netflix',englishLabel:'Netflix',asset:'/icons/brands/netflix.svg',group:'Brand',brand:true,keywords:['streaming','serie','film']},
  {id:'brand:apple',label:'Apple',englishLabel:'Apple',asset:'/icons/brands/apple.svg',group:'Brand',brand:true,keywords:['iphone','icloud','tv','music']},
  {id:'brand:spotify',label:'Spotify',englishLabel:'Spotify',asset:'/icons/brands/spotify.svg',group:'Brand',brand:true,keywords:['musica','music','streaming']},
  {id:'brand:amazon',label:'Amazon',englishLabel:'Amazon',asset:'/icons/brands/amazon.svg',group:'Brand',brand:true,keywords:['prime','shopping','acquisti']},
  {id:'brand:disney',label:'Disney+',englishLabel:'Disney Plus',asset:'/icons/brands/disney.svg',group:'Brand',brand:true,keywords:['streaming','film']},
  {id:'brand:youtube',label:'YouTube',englishLabel:'YouTube',asset:'/icons/brands/youtube.svg',group:'Brand',brand:true,keywords:['video','premium']},
  {id:'brand:playstation',label:'PlayStation',englishLabel:'PlayStation',asset:'/icons/brands/playstation.svg',group:'Brand',brand:true,keywords:['gaming','console','videogiochi']},
  {id:'brand:xbox',label:'Xbox',englishLabel:'Xbox',asset:'/icons/brands/xbox.svg',group:'Brand',brand:true,keywords:['gaming','console','videogiochi']},
  {id:'brand:google',label:'Google',englishLabel:'Google',asset:'/icons/brands/google.svg',group:'Brand',brand:true,keywords:['servizi','cloud']},
  {id:'brand:uber',label:'Uber',englishLabel:'Uber',asset:'/icons/brands/uber.svg',group:'Brand',brand:true,keywords:['taxi','trasporti','ride']},
  {id:'brand:airbnb',label:'Airbnb',englishLabel:'Airbnb',asset:'/icons/brands/airbnb.svg',group:'Brand',brand:true,keywords:['viaggi','alloggio','travel']},
  {id:'brand:paypal',label:'PayPal',englishLabel:'PayPal',asset:'/icons/brands/paypal.svg',group:'Brand',brand:true,keywords:['pagamenti','finanza','payments']},
];

/** Old identifiers remain valid so existing categories never lose their icon. */
export const legacyIconAliases:Record<string,string>={
  'tag':'tag','more':'ellipsis','generic-expense':'receipt','subscription':'repeat','service':'wrench','unexpected':'triangle-exclamation','refund':'arrow-rotate-left','cash':'money-bill','favorite':'star','other-income':'arrow-trend-up',
  'food':'utensils','coffee':'mug-hot','cart':'cart-shopping','supermarket':'basket-shopping','restaurant':'utensils','pizza':'pizza-slice','groceries':'carrot','bakery':'bread-slice','drinks':'martini-glass-citrus','delivery':'motorcycle',
  'fuel':'gas-pump','train':'train','car':'car','parking':'square-parking','scooter':'motorcycle','bus':'bus','taxi':'taxi','bicycle':'bicycle','truck':'truck','commute':'route',
  'house':'house','rent':'house-chimney','utilities':'plug','repair':'screwdriver-wrench','tools-home':'toolbox','furniture':'couch','garden':'seedling','cleaning':'broom','light':'lightbulb','moving':'truck-moving',
  'bag':'bag-shopping','online-shopping':'cart-plus','clothing':'shirt','scissors':'scissors','gift':'gift','electronics':'mobile-screen-button','book':'book','amazon':'box-open','store':'store','package':'box',
  'play':'circle-play','movie':'clapperboard','music':'music','gamepad':'gamepad','ticket':'ticket','theater':'masks-theater','events':'calendar','streaming':'tv','hobby':'palette','camera':'camera',
  'wallet':'wallet','bank':'building-columns','card':'credit-card','coins':'coins','tax':'file-invoice-dollar','safe':'piggy-bank','investment':'chart-line','insurance':'shield-halved','receipt':'receipt','calculator':'calculator',
  'health':'heart-pulse','doctor':'stethoscope','pharmacy':'pills','hospital':'hospital','ambulance':'truck-medical','dumbbell':'dumbbell','wellness':'spa','dental':'tooth','pet-care':'paw','medical-bill':'file-invoice-dollar',
  'plane':'plane','bed':'hotel','map':'map-location-dot','luggage':'suitcase-rolling','holiday':'suitcase','beach':'umbrella-beach','camping':'tent','fuel-trip':'gas-pump','travel-ticket':'ticket','travel-food':'utensils',
  'football':'futbol','gym':'dumbbell','bicycle-sport':'person-biking','running':'person-running','swimming':'person-swimming','racket':'table-tennis-paddle-ball','trophy':'trophy','hiking':'person-hiking','motorcycle-sport':'motorcycle','sport-ticket':'ticket',
  'phone':'mobile','laptop':'laptop','desktop':'desktop','camera-tech':'camera','gaming-tech':'gamepad','internet':'wifi','software':'code','repair-tech':'screwdriver-wrench','device':'microchip','gadget':'mobile-screen-button',
  'family':'users','child':'children','baby':'baby','wedding':'ring','heart':'heart','education':'graduation-cap','paw':'paw','home-family':'house-user','gift-family':'gift','care':'hand-holding-heart',
  'work':'briefcase','office':'building-user','tools-work':'toolbox','education-work':'chalkboard-user','travel-work':'plane','lunch-work':'utensils','phone-work':'phone','software-work':'laptop','invoice-work':'file-invoice','bonus':'award',
};

export function normalizeIconId(id?:string|null){
  if(!id)return 'color:tag';
  if(id.startsWith('color:')||id.startsWith('brand:'))return id;
  return `color:${legacyIconAliases[id]||'tag'}`;
}

export const allIconCatalog=[...colorIconCatalog,...brandCatalog];

export function findIconEntry(id?:string|null){
  const normalized=normalizeIconId(id);
  return allIconCatalog.find(entry=>entry.id===normalized)||colorIconCatalog[0];
}

const preferredSuggestions:[RegExp,string[]][]=[
  [/mare|spiaggia|lido|ombrellone|balneare/i,['umbrella-beach','water','sailboat','sun','fish']],
  [/vacanz|ferie|holiday/i,['suitcase','umbrella-beach','hotel','camera','map-location-dot']],
  [/viagg|volo|aereo|aeroporto/i,['plane','suitcase-rolling','passport','map-location-dot','hotel']],
  [/benzina|diesel|gpl|carburante/i,['gas-pump','car','route','truck-fast']],
  [/medic|dottor|visita|specialist/i,['stethoscope','user-doctor','hospital','kit-medical']],
  [/farmac|medicine|medicinali/i,['pills','capsules','prescription-bottle-medical','kit-medical']],
  [/supermercato|alimentari|spesa/i,['cart-shopping','basket-shopping','carrot','apple-whole']],
  [/ristor|pranzo|cena|pizzeria/i,['utensils','pizza-slice','bowl-food','wine-glass']],
  [/caff[eè]|colazione|bar\b/i,['mug-hot','mug-saucer','bread-slice','cookie']],
  [/casa|affitto|mutuo/i,['house','house-chimney','key','building']],
  [/bollett|utenze|luce|corrente/i,['plug','bolt','lightbulb','faucet']],
  [/figli|bambin|neonat|infanzia/i,['children','baby','baby-carriage','hands-holding-child']],
  [/animali|veterin|cane|gatto/i,['paw','dog','cat','shield-dog']],
  [/palestra|fitness|allenamento/i,['dumbbell','weight-scale','person-running','stopwatch']],
  [/scuola|universit|formazione|corso/i,['graduation-cap','school','book-open','chalkboard-user']],
  [/cinema|film|streaming/i,['clapperboard','film','tv','ticket']],
  [/videogio|gaming|console/i,['gamepad','vr-cardboard','trophy','headset']],
  [/risparm|salvadanaio/i,['piggy-bank','vault','coins','chart-line']],
  [/tasse|imposte|f24/i,['file-invoice-dollar','calculator','building-columns','receipt']],
];

export function suggestIconsForCategory(name:string,limit=8){
  const clean=normalize(name);
  if(!clean)return [];
  const preferred=preferredSuggestions.find(([rule])=>rule.test(clean))?.[1]||[];
  const tokens=words(clean);
  const scored=colorIconCatalog.map(entry=>{
    const haystack=normalize(`${entry.label} ${entry.englishLabel} ${entry.id} ${entry.keywords.join(' ')}`);
    const score=tokens.reduce((total,token)=>total+(haystack.includes(token)?2:0)+(normalize(entry.label).startsWith(token)?4:0)+(entry.id.includes(token)?5:0),0);
    const preferredIndex=preferred.indexOf(entry.id.slice(6));
    return {entry,score:score+(preferredIndex>=0?30-preferredIndex:0)};
  }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.entry.label.localeCompare(b.entry.label,'it'));
  return scored.slice(0,limit).map(item=>item.entry);
}
