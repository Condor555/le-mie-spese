export type CategoryStyle = { icon: string; color: string };

const rules: [RegExp, CategoryStyle][] = [
  [/netflix/i, { icon: 'brand:netflix', color: '#E50914' }],
  [/spotify/i, { icon: 'brand:spotify', color: '#1DB954' }],
  [/disney\s*\+?|disney plus/i, { icon: 'brand:disneyplus', color: '#113CCF' }],
  [/youtube/i, { icon: 'brand:youtube', color: '#FF0000' }],
  [/playstation|\bps[345]\b/i, { icon: 'brand:playstation', color: '#003791' }],
  [/xbox|game pass/i, { icon: 'brand:xbox', color: '#107C10' }],
  [/paypal/i, { icon: 'brand:paypal', color: '#003087' }],
  [/airbnb/i, { icon: 'brand:airbnb', color: '#FF5A5F' }],
  [/\buber\b/i, { icon: 'brand:uber', color: '#68738C' }],
  [/google|youtube premium/i, { icon: 'brand:google', color: '#4285F4' }],
  [/apple|icloud|app store/i, { icon: 'brand:apple', color: '#68738C' }],
  [/amazon/i, { icon: 'brand:amazon', color: '#FF9900' }],
  [/scooter|motorino|moto/i, { icon: 'scooter', color: '#4F77D8' }],
  [/affitto|locazione|canone casa/i, { icon: 'rent', color: '#2F9E75' }],
  [/tasse|imposte|tributi|f24/i, { icon: 'tax', color: '#D97706' }],
  [/matrimonio|nozze/i, { icon: 'wedding', color: '#DB4B8B' }],
  [/abbonament|streaming/i, { icon: 'play', color: '#D84D4F' }],
  [/supermercato|spesa/i, { icon: 'cart', color: '#5477F5' }],
  [/benzina|carburante|gpl|diesel/i, { icon: 'fuel', color: '#8A5CF6' }],
  [/parcheggio/i, { icon: 'parking', color: '#655CE8' }],
  [/\bauto\b|macchina/i, { icon: 'car', color: '#536DE2' }],
  [/trasport|treni|ferrovia/i, { icon: 'train', color: '#655CE8' }],
  [/barbiere|parrucchiere/i, { icon: 'scissors', color: '#E39C34' }],
  [/cibo|bevande|ristor|pizza/i, { icon: 'food', color: '#E99B35' }],
  [/\bbar\b|caff[eè]/i, { icon: 'coffee', color: '#B97B4B' }],
  [/visite specialistiche|medico/i, { icon: 'doctor', color: '#D55E80' }],
  [/salute|farmacia|benessere/i, { icon: 'health', color: '#D55E80' }],
  [/ricarica telefonica|cellulare/i, { icon: 'phone', color: '#5B8DEF' }],
  [/bollette|utenze/i, { icon: 'receipt', color: '#5BA88D' }],
  [/domestica|casa/i, { icon: 'house', color: '#5BA88D' }],
  [/calcio/i, { icon: 'football', color: '#35A96B' }],
  [/cinema|film/i, { icon: 'movie', color: '#E45858' }],
  [/cultura|libri/i, { icon: 'book', color: '#8B6BC9' }],
  [/divertimento|eventi/i, { icon: 'ticket', color: '#F17D45' }],
  [/educazione|scuola|universit/i, { icon: 'education', color: '#438FDF' }],
  [/famiglia|family/i, { icon: 'family', color: '#EF6C91' }],
  [/figli|bambin/i, { icon: 'child', color: '#ED7896' }],
  [/moglie|marito|partner/i, { icon: 'heart', color: '#E85F86' }],
  [/hotel|albergo|b&b/i, { icon: 'bed', color: '#3E9AA8' }],
  [/regali/i, { icon: 'gift', color: '#E3AD16' }],
  [/viaggi|vacanze|mare|voli/i, { icon: 'plane', color: '#62AABC' }],
  [/ordini online|consegne/i, { icon: 'package', color: '#9655F0' }],
  [/acquisti online|acquisti|shopping/i, { icon: 'bag', color: '#9655F0' }],
  [/investiment|borsa/i, { icon: 'ph:chart-up', color: '#35A96B' }],
  [/altra spesa|altro/i, { icon: 'tag', color: '#68738C' }],
];

export function inferredCategoryStyle(name: string): CategoryStyle {
  return (
    rules.find(([rule]) => rule.test(name))?.[1] || {
      icon: 'tag',
      color: '#68738C',
    }
  );
}

export function categoryStyle(
  name: string,
  custom?: Partial<CategoryStyle> | null
): CategoryStyle {
  const inferred = inferredCategoryStyle(name);
  return {
    icon: custom?.icon || inferred.icon,
    color: custom?.color || inferred.color,
  };
}

/** Kept for compatibility with any code importing the V3.5 list. */
export const iconChoices = [
  'tag',
  'food',
  'coffee',
  'cart',
  'fuel',
  'train',
  'car',
  'scooter',
  'parking',
  'rent',
  'tax',
  'wedding',
  'health',
  'doctor',
  'house',
  'receipt',
  'gift',
  'plane',
  'play',
  'bag',
  'amazon',
  'scissors',
  'football',
  'movie',
  'book',
  'ticket',
  'education',
  'family',
  'child',
  'bed',
  'heart',
  'gamepad',
  'phone',
  'package',
  'paw',
  'dumbbell',
  'music',
  'laptop',
  'camera',
] as const;

export const colorChoices = [
  '#5477F5',
  '#4F77D8',
  '#655CE8',
  '#8A5CF6',
  '#9655F0',
  '#D55E80',
  '#DB4B8B',
  '#E85F86',
  '#E45858',
  '#F17D45',
  '#E99B35',
  '#D97706',
  '#E3AD16',
  '#35A96B',
  '#2F9E75',
  '#5BA88D',
  '#3E9AA8',
  '#68738C',
  '#111827',
];
