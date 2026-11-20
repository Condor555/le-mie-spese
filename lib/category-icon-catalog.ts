export type IconCatalogEntry={
  id:string;label:string;englishLabel:string;asset:string;group:string;keywords:string[];brand?:boolean;
};

const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it').trim();
const words=(value:string)=>normalize(value).split(/[^a-z0-9]+/).filter(Boolean);
const icon=(id:string,label:string,englishLabel:string,group:string,keywords:string):IconCatalogEntry=>({id,label,englishLabel,asset:`/icons/categories/${id}.svg`,group,keywords:words(`${label} ${englishLabel} ${id} ${keywords}`)});

/**
 * Source of truth categorie: esclusivamente gli asset legacy Icons8 Color
 * fisicamente presenti in public/icons/categories. Nessun glifo viene generato,
 * ricolorato o composto a runtime.
 */
export const categoryIconCatalog:IconCatalogEntry[]=[
  icon('tag','Generica','Tag','Essenziali','altro varie categoria'),icon('dots-three','Altro','More','Essenziali','generico more'),icon('receipt','Ricevuta','Receipt','Essenziali','scontrino fattura spesa'),icon('repeat','Ricorrenza','Repeat','Essenziali','abbonamento periodico'),icon('star','Preferita','Star','Essenziali','preferiti'),icon('warning-circle','Imprevisto','Warning','Essenziali','emergenza attenzione'),icon('arrow-counter-clockwise','Rimborso','Refund','Essenziali','reso refund entrata'),icon('arrow-circle-up','Altra entrata','Other income','Essenziali','reddito income accredito'),
  icon('fork-knife','Ristorante','Restaurant','Cibo','cibo pranzo cena pizza alimentari'),icon('coffee','Caffè','Coffee','Cibo','bar colazione caffe'),icon('shopping-cart','Supermercato','Shopping cart','Cibo','spesa alimentari groceries'),
  icon('car','Auto','Car','Trasporti','macchina mobilita'),icon('car-simple','Parcheggio','Parking','Trasporti','sosta auto'),icon('motorcycle','Moto e scooter','Motorcycle','Trasporti','motorino scooter'),icon('bus','Autobus','Bus','Trasporti','pullman'),icon('train','Treno','Train','Trasporti','ferrovia'),icon('taxi','Taxi','Taxi','Trasporti','noleggio'),icon('bicycle','Bicicletta','Bicycle','Trasporti','bici ciclismo'),icon('truck','Trasporto merci','Truck','Trasporti','furgone spedizione'),icon('gas-pump','Carburante','Fuel','Trasporti','benzina diesel gpl'),
  icon('house','Casa','Home','Casa','abitazione affitto mutuo utenze'),icon('wrench','Manutenzione','Repair','Casa','riparazione attrezzi'),icon('bed','Alloggio','Bed','Casa','camera hotel'),
  icon('handbag','Shopping','Shopping','Shopping','acquisti borsa vestiti'),icon('shopping-bag','Acquisti online','Online shopping','Shopping','ecommerce negozio'),icon('storefront','Negozio','Store','Shopping','vendita commercio'),icon('package','Pacchi','Package','Shopping','ordini spedizione amazon'),icon('scissors','Cura personale','Personal care','Shopping','barbiere parrucchiere'),icon('gift','Regali','Gift','Shopping','regalo premio bonus'),icon('device-mobile','Telefono','Mobile phone','Shopping','smartphone elettronica'),
  icon('film-slate','Cinema','Cinema','Intrattenimento','film movie'),icon('film','Film','Film','Intrattenimento','streaming video'),icon('play','Streaming','Play','Intrattenimento','tv serie'),icon('tv','Televisione','TV','Intrattenimento','serie video'),icon('music-notes','Musica','Music','Intrattenimento','concerto'),icon('game-controller','Videogiochi','Gaming','Intrattenimento','console game'),icon('ticket','Biglietti','Ticket','Intrattenimento','evento spettacolo'),icon('camera','Fotografia','Camera','Intrattenimento','foto hobby'),
  icon('wallet','Portafoglio','Wallet','Finanza','conto stipendio denaro'),icon('bank','Banca','Bank','Finanza','pensione istituto'),icon('credit-card','Carta','Credit card','Finanza','credito debito pagamento'),icon('coins','Monete','Coins','Finanza','denaro interessi rendite'),icon('money','Contanti','Cash','Finanza','banconote reddito'),icon('currency-eur','Tasse','Tax','Finanza','imposte f24 euro'),icon('piggy-bank','Risparmio','Savings','Finanza','salvadanaio investimento'),icon('calculator','Calcoli','Calculator','Finanza','budget contabilita'),
  icon('first-aid-kit','Salute','Health','Salute','cura benessere'),icon('stethoscope','Medico','Doctor','Salute','visita dottore specialista'),icon('pill','Farmacia','Pharmacy','Salute','medicine medicinali'),icon('hospital','Ospedale','Hospital','Salute','clinica'),icon('ambulance','Emergenza','Ambulance','Salute','soccorso'),icon('heartbeat','Benessere','Wellness','Salute','cuore salute'),
  icon('airplane','Viaggi','Travel','Viaggi','aereo volo vacanza mare'),
  icon('soccer-ball','Calcio','Football','Sport','pallone sport'),icon('barbell','Palestra','Gym','Sport','fitness allenamento'),
  icon('laptop','Computer','Laptop','Tecnologia','pc software internet'),
  icon('users-three','Famiglia','Family','Famiglia','parenti gruppo'),icon('baby','Figli','Child','Famiglia','bambini infanzia'),icon('heart','Affetti','Love','Famiglia','moglie marito amore'),icon('paw-print','Animali','Pets','Famiglia','cane gatto veterinario'),
  icon('graduation-cap','Istruzione','Education','Lavoro','scuola universita formazione'),icon('book-open','Libri','Books','Lavoro','cultura lettura'),icon('briefcase','Lavoro','Work','Lavoro','ufficio azienda'),
];

export const iconGroups=[...new Set(categoryIconCatalog.map(entry=>entry.group))];

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

const canonicalIds=new Set(categoryIconCatalog.map(entry=>entry.id));

/** Identificatori V3.5-V3.9 e vecchi color:* vengono ricondotti solo ad asset reali. */
export const legacyIconAliases:Record<string,string>={
  'more':'dots-three','generic-expense':'receipt','subscription':'repeat','service':'wrench','unexpected':'warning-circle','refund':'arrow-counter-clockwise','cash':'money','favorite':'star','other-income':'arrow-circle-up',
  'food':'fork-knife','restaurant':'fork-knife','pizza':'fork-knife','groceries':'shopping-cart','bakery':'fork-knife','drinks':'coffee','delivery':'motorcycle','cart':'shopping-cart','supermarket':'shopping-cart',
  'fuel':'gas-pump','parking':'car-simple','scooter':'motorcycle','commute':'train','rent':'house','utilities':'house','repair':'wrench','tools-home':'wrench','furniture':'house','garden':'house','cleaning':'house','light':'house','moving':'truck',
  'bag':'handbag','online-shopping':'shopping-bag','clothing':'handbag','electronics':'device-mobile','amazon':'package','store':'storefront',
  'movie':'film-slate','streaming':'play','theater':'ticket','events':'ticket','hobby':'camera','gamepad':'game-controller','music':'music-notes',
  'card':'credit-card','tax':'currency-eur','safe':'piggy-bank','investment':'coins','insurance':'bank','receipt':'receipt','calculator':'calculator',
  'health':'first-aid-kit','doctor':'stethoscope','pharmacy':'pill','dumbbell':'barbell','wellness':'heartbeat','dental':'first-aid-kit','pet-care':'paw-print','medical-bill':'receipt',
  'plane':'airplane','map':'airplane','luggage':'airplane','holiday':'airplane','beach':'tag','camping':'tag','fuel-trip':'gas-pump','travel-ticket':'ticket','travel-food':'fork-knife',
  'football':'soccer-ball','gym':'barbell','bicycle-sport':'bicycle','running':'barbell','swimming':'barbell','racket':'barbell','trophy':'star','hiking':'tag','motorcycle-sport':'motorcycle','sport-ticket':'ticket',
  'phone':'device-mobile','desktop':'laptop','camera-tech':'camera','gaming-tech':'game-controller','internet':'laptop','software':'laptop','repair-tech':'wrench','device':'device-mobile','gadget':'device-mobile',
  'family':'users-three','child':'baby','wedding':'heart','education':'graduation-cap','paw':'paw-print','home-family':'house','gift-family':'gift','care':'users-three',
  'work':'briefcase','office':'briefcase','tools-work':'wrench','education-work':'graduation-cap','travel-work':'airplane','lunch-work':'fork-knife','phone-work':'device-mobile','software-work':'laptop','invoice-work':'receipt','bonus':'gift',
  // slug artificiali più probabili già salvati
  'tags':'tag','bookmark':'tag','circle-question':'tag','circle-info':'tag','triangle-exclamation':'warning-circle','bell':'tag','calendar':'tag','clock':'tag','magnifying-glass':'tag','ellipsis':'dots-three','circle-play':'play','arrow-rotate-left':'arrow-counter-clockwise',
  'apple-whole':'fork-knife','bacon':'fork-knife','bread-slice':'fork-knife','bowl-food':'fork-knife','bowl-rice':'fork-knife','burger':'fork-knife','carrot':'shopping-cart','cheese':'fork-knife','cookie':'fork-knife','egg':'fork-knife','fish':'fork-knife','hotdog':'fork-knife','ice-cream':'fork-knife','lemon':'fork-knife','martini-glass-citrus':'coffee','martini-glass':'coffee','mug-hot':'coffee','mug-saucer':'coffee','pizza-slice':'fork-knife','shrimp':'fork-knife','utensils':'fork-knife','wine-bottle':'coffee','wine-glass':'coffee','beer-mug-empty':'coffee',
  'car-side':'car','car-rear':'car','bus-simple':'bus','train-subway':'train','train-tram':'train','van-shuttle':'bus','truck-fast':'truck','truck-pickup':'truck','ferry':'airplane','ship':'airplane','sailboat':'airplane','plane':'airplane','plane-departure':'airplane','plane-arrival':'airplane','helicopter':'airplane','charging-station':'car','square-parking':'car-simple',
  'house-chimney':'house','building':'house','city':'house','bath':'house','couch':'house','chair':'house','kitchen-set':'house','faucet':'house','shower':'house','toilet':'house','sink':'house','broom':'house','brush':'house','bucket':'house','door-closed':'house','door-open':'house','lightbulb':'house','plug':'house','bolt':'house','fire-burner':'house','temperature-half':'house','fan':'house',
  'bag-shopping':'handbag','basket-shopping':'shopping-cart','cart-shopping':'shopping-cart','cart-plus':'shopping-bag','shirt':'handbag','shoe-prints':'handbag','socks':'handbag','gem':'gift','palette':'camera','spray-can-sparkles':'scissors','box':'package','box-open':'package','boxes-stacked':'package','truck-ramp-box':'package','barcode':'package','qrcode':'package','mobile-screen-button':'device-mobile',
  'clapperboard':'film-slate','photo-film':'film','headphones':'music-notes','microphone':'music-notes','podcast':'music-notes','radio':'music-notes','dice':'game-controller','chess':'game-controller','bowling-ball':'soccer-ball','masks-theater':'ticket','ticket-simple':'ticket','guitar':'music-notes','drum':'music-notes','compact-disc':'music-notes','record-vinyl':'music-notes','champagne-glasses':'coffee',
  'money-bill':'money','money-bill-wave':'money','money-bills':'money','money-check-dollar':'money','sack-dollar':'money','vault':'bank','building-columns':'bank','euro-sign':'currency-eur','dollar-sign':'currency-eur','sterling-sign':'currency-eur','yen-sign':'currency-eur','bitcoin-sign':'coins','chart-line':'coins','chart-pie':'calculator','chart-bar':'calculator','arrow-trend-up':'arrow-circle-up','arrow-trend-down':'receipt','scale-balanced':'bank','file-invoice-dollar':'receipt','award':'gift',
  'heart-pulse':'heartbeat','user-doctor':'stethoscope','user-nurse':'stethoscope','hospital-user':'hospital','kit-medical':'first-aid-kit','briefcase-medical':'first-aid-kit','pills':'pill','capsules':'pill','syringe':'first-aid-kit','prescription-bottle-medical':'pill','tooth':'first-aid-kit','lungs':'first-aid-kit','brain':'first-aid-kit','dna':'first-aid-kit','microscope':'first-aid-kit','flask-vial':'first-aid-kit','bandage':'first-aid-kit','crutch':'first-aid-kit','wheelchair':'first-aid-kit','eye':'first-aid-kit','ear-listen':'first-aid-kit','weight-scale':'barbell','spa':'heartbeat','truck-medical':'ambulance',
  'umbrella-beach':'tag','suitcase':'airplane','suitcase-rolling':'airplane','passport':'airplane','hotel':'bed','bell-concierge':'bed','map-location-dot':'airplane','globe':'airplane','earth-europe':'airplane','earth-americas':'airplane','earth-asia':'airplane','mountain-sun':'tag','campground':'tag','tent':'tag','person-hiking':'tag','route':'airplane','road':'car','signs-post':'airplane','binoculars':'camera','monument':'airplane',
};

export function normalizeIconId(id?:string|null){
  if(!id)return 'tag';
  if(id.startsWith('brand:'))return brandCatalog.some(entry=>entry.id===id)?id:'tag';
  const raw=id.startsWith('color:')?id.slice(6):id;
  const mapped=legacyIconAliases[raw]||raw;
  return canonicalIds.has(mapped)?mapped:'tag';
}

export const allIconCatalog=[...categoryIconCatalog,...brandCatalog];
export function findIconEntry(id?:string|null){const normalized=normalizeIconId(id);return allIconCatalog.find(entry=>entry.id===normalized)}

const preferredSuggestions:[RegExp,string[]][]=[
  [/mare|spiaggia|lido|ombrellone|balneare/i,['tag','airplane','camera']],
  [/vacanz|ferie|viagg|volo|aereo|aeroporto/i,['airplane','bed','camera','ticket']],
  [/benzina|diesel|gpl|carburante/i,['gas-pump','car']],
  [/medic|dottor|visita|specialist/i,['stethoscope','hospital','first-aid-kit']],
  [/farmac|medicine|medicinali/i,['pill','first-aid-kit']],
  [/supermercato|alimentari|spesa/i,['shopping-cart','fork-knife']],
  [/ristor|pranzo|cena|pizzeria/i,['fork-knife','coffee']],
  [/caff[eè]|colazione|bar\b/i,['coffee','fork-knife']],
  [/casa|affitto|mutuo|bollett|utenze|luce/i,['house','wrench']],
  [/figli|bambin|neonat|infanzia/i,['baby','users-three']],
  [/animali|veterin|cane|gatto/i,['paw-print']],
  [/palestra|fitness|allenamento/i,['barbell','heartbeat']],
  [/scuola|universit|formazione|corso/i,['graduation-cap','book-open']],
  [/cinema|film|streaming/i,['film-slate','film','play','tv']],
  [/videogio|gaming|console/i,['game-controller']],
  [/risparm|salvadanaio/i,['piggy-bank','bank','coins']],
  [/tasse|imposte|f24/i,['currency-eur','calculator','receipt']],
];

export function suggestIconsForCategory(name:string,limit=8){
  const clean=normalize(name);if(!clean)return [];
  const preferred=preferredSuggestions.find(([rule])=>rule.test(clean))?.[1]||[];const tokens=words(clean);
  const scored=categoryIconCatalog.map(entry=>{const haystack=normalize(`${entry.label} ${entry.englishLabel} ${entry.id} ${entry.keywords.join(' ')}`);const score=tokens.reduce((total,token)=>total+(haystack.includes(token)?2:0)+(normalize(entry.label).startsWith(token)?4:0)+(entry.id.includes(token)?5:0),0);const index=preferred.indexOf(entry.id);return {entry,score:score+(index>=0?30-index:0)}}).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.entry.label.localeCompare(b.entry.label,'it'));
  return scored.slice(0,limit).map(item=>item.entry);
}
