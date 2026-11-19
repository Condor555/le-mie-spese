import {findIconEntry} from './category-icon-catalog';

const categoryAssets=new Set([
  'airplane','ambulance','arrow-circle-up','arrow-counter-clockwise','baby','bank','barbell','bed','bicycle','book-open','briefcase','bus','calculator','camera','car','car-simple','coffee','coins','credit-card','currency-eur','device-mobile','dots-three','film-slate','film','first-aid-kit','fork-knife','game-controller','gas-pump','gift','graduation-cap','handbag','heart','heartbeat','hospital','house','laptop','money','motorcycle','music-notes','package','paw-print','piggy-bank','pill','play','receipt','repeat','scissors','shopping-bag','shopping-cart','soccer-ball','star','stethoscope','storefront','tag','taxi','ticket','train','truck','tv','users-three','wallet','warning-circle','wrench',
]);

const brandAssets:Record<string,string>={
  'brand:netflix':'netflix','brand:apple':'apple','brand:spotify':'spotify','brand:amazon':'amazon',
  'brand:disney':'disney','brand:youtube':'youtube','brand:playstation':'playstation','brand:xbox':'xbox',
  'brand:google':'google','brand:uber':'uber','brand:airbnb':'airbnb','brand:paypal':'paypal',
};

function componentSlug(component:string){
  return component.replace(/Icon$/,'').replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLocaleLowerCase('en');
}

export function categoryIconAsset(icon?:string|null){
  if(icon==='amazon')return '/icons/brands/amazon.svg';
  if(icon?.startsWith('brand:')){
    const brand=brandAssets[icon];
    return brand?`/icons/brands/${brand}.svg`:'/icons/categories/tag.svg';
  }
  const entry=findIconEntry(icon)||findIconEntry('tag');
  const slug=componentSlug(entry?.component||'TagIcon');
  return categoryAssets.has(slug)?`/icons/categories/${slug}.svg`:'/icons/categories/tag.svg';
}
