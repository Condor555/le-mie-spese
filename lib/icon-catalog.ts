export const ICON_GROUPS = [
  'Generali',
  'Cibo e bevande',
  'Trasporti',
  'Casa',
  'Shopping',
  'Finanza',
  'Intrattenimento',
  'Salute e benessere',
  'Viaggi',
  'Sport',
  'Lavoro e tecnologia',
  'Famiglia e natura',
  'Brand',
] as const;

export type IconGroup = (typeof ICON_GROUPS)[number];

export type IconCatalogEntry = {
  id: string;
  label: string;
  group: IconGroup;
  keywords: string[];
  brand?: boolean;
  suggestedColor?: string;
};

const entry = (
  id: string,
  label: string,
  group: IconGroup,
  keywords: string[] = []
): IconCatalogEntry => ({ id, label, group, keywords });

const brand = (
  id: string,
  label: string,
  suggestedColor: string,
  keywords: string[] = []
): IconCatalogEntry => ({
  id: `brand:${id}`,
  label,
  group: 'Brand',
  keywords,
  brand: true,
  suggestedColor,
});

/**
 * Curated, searchable subset of Phosphor plus neutral brand markers.
 * Existing V3.5.4 identifiers stay unchanged; new Phosphor identifiers use
 * the `ph:` namespace and brand markers use `brand:`.
 */
export const ICON_CATALOG: IconCatalogEntry[] = [
  entry('tag', 'Etichetta', 'Generali', ['categoria', 'altro']),
  entry('ph:bookmark', 'Segnalibro', 'Generali', ['salva', 'preferito']),
  entry('ph:star', 'Stella', 'Generali', ['preferito', 'importante']),
  entry('ph:bell', 'Campanella', 'Generali', ['avviso', 'notifica']),
  entry('ph:calendar', 'Calendario', 'Generali', ['data', 'scadenza']),
  entry('ph:clock', 'Orologio', 'Generali', ['tempo', 'ora']),
  entry('ph:map-pin', 'Posizione', 'Generali', ['luogo', 'mappa']),
  entry('ph:check', 'Confermato', 'Generali', ['ok', 'completato']),
  entry('ph:warning', 'Attenzione', 'Generali', ['avviso', 'emergenza']),
  entry('ph:info', 'Informazione', 'Generali', ['dettagli', 'nota']),

  entry('food', 'Posate', 'Cibo e bevande', ['cibo', 'ristorante', 'pranzo', 'cena']),
  entry('coffee', 'Caffè', 'Cibo e bevande', ['bar', 'colazione']),
  entry('ph:pizza', 'Pizza', 'Cibo e bevande', ['pizzeria', 'asporto']),
  entry('ph:hamburger', 'Hamburger', 'Cibo e bevande', ['fast food', 'panino']),
  entry('ph:cake', 'Torta', 'Cibo e bevande', ['dolce', 'compleanno']),
  entry('ph:ice-cream', 'Gelato', 'Cibo e bevande', ['dessert']),
  entry('ph:wine', 'Vino', 'Cibo e bevande', ['bevande', 'aperitivo']),
  entry('ph:beer', 'Birra', 'Cibo e bevande', ['bevande', 'pub']),
  entry('ph:cooking', 'Cucina', 'Cibo e bevande', ['pentola', 'alimentari']),
  entry('ph:bread', 'Pane', 'Cibo e bevande', ['forno', 'panetteria']),
  entry('ph:fish', 'Pesce', 'Cibo e bevande', ['ristorante', 'mercato']),
  entry('ph:cookie', 'Biscotto', 'Cibo e bevande', ['snack', 'dolci']),

  entry('car', 'Auto', 'Trasporti', ['macchina', 'veicolo']),
  entry('parking', 'Parcheggio', 'Trasporti', ['sosta', 'garage']),
  entry('fuel', 'Carburante', 'Trasporti', ['benzina', 'diesel', 'gpl']),
  entry('train', 'Treno', 'Trasporti', ['ferrovia', 'biglietto']),
  entry('scooter', 'Scooter', 'Trasporti', ['motorino', 'moto']),
  entry('ph:bus', 'Autobus', 'Trasporti', ['bus', 'pullman']),
  entry('ph:taxi', 'Taxi', 'Trasporti', ['ncc', 'corsa']),
  entry('ph:bicycle', 'Bicicletta', 'Trasporti', ['bici', 'ciclismo']),
  entry('ph:motorcycle', 'Moto', 'Trasporti', ['motocicletta']),
  entry('ph:boat', 'Barca', 'Trasporti', ['nave', 'traghetto']),
  entry('ph:charging', 'Ricarica elettrica', 'Trasporti', ['colonnina', 'elettrico']),
  entry('ph:steering-wheel', 'Guida', 'Trasporti', ['volante', 'noleggio']),

  entry('house', 'Casa', 'Casa', ['abitazione', 'immobile']),
  entry('rent', 'Affitto', 'Casa', ['canone', 'locazione']),
  entry('receipt', 'Bolletta', 'Casa', ['utenze', 'fattura']),
  entry('ph:couch', 'Arredamento', 'Casa', ['divano', 'mobili']),
  entry('ph:lamp', 'Lampada', 'Casa', ['luce', 'arredo']),
  entry('ph:lightbulb', 'Elettricità', 'Casa', ['energia', 'luce']),
  entry('ph:key', 'Chiavi', 'Casa', ['serratura', 'condominio']),
  entry('ph:wrench', 'Manutenzione', 'Casa', ['riparazione', 'idraulico']),
  entry('ph:hammer', 'Lavori', 'Casa', ['fai da te', 'ristrutturazione']),
  entry('ph:paint', 'Pittura', 'Casa', ['vernice', 'decorazione']),
  entry('ph:shower', 'Acqua', 'Casa', ['bagno', 'idraulica']),
  entry('ph:washing-machine', 'Lavanderia', 'Casa', ['lavatrice', 'bucato']),

  entry('cart', 'Carrello', 'Shopping', ['supermercato', 'spesa']),
  entry('bag', 'Borsa acquisti', 'Shopping', ['negozio', 'shopping']),
  entry('package', 'Pacco', 'Shopping', ['ordine', 'consegna']),
  entry('gift', 'Regalo', 'Shopping', ['dono', 'festa']),
  entry('scissors', 'Cura personale', 'Shopping', ['barbiere', 'parrucchiere']),
  entry('ph:store', 'Negozio', 'Shopping', ['acquisti', 'retail']),
  entry('ph:basket', 'Cestino', 'Shopping', ['mercato', 'spesa']),
  entry('ph:tshirt', 'Abbigliamento', 'Shopping', ['vestiti', 'moda']),
  entry('ph:sneaker', 'Scarpe', 'Shopping', ['calzature', 'sport']),
  entry('ph:handbag', 'Borsa', 'Shopping', ['accessori', 'moda']),
  entry('ph:watch', 'Orologio da polso', 'Shopping', ['accessori', 'gioielli']),
  entry('ph:eyeglasses', 'Occhiali', 'Shopping', ['ottica', 'vista']),

  entry('tax', 'Tasse', 'Finanza', ['f24', 'tributi', 'imposte']),
  entry('ph:wallet', 'Portafoglio', 'Finanza', ['soldi', 'contanti']),
  entry('ph:credit-card', 'Carta', 'Finanza', ['pagamento', 'bancomat']),
  entry('ph:bank', 'Banca', 'Finanza', ['conto', 'istituto']),
  entry('ph:coins', 'Monete', 'Finanza', ['risparmio', 'contanti']),
  entry('ph:piggy-bank', 'Risparmio', 'Finanza', ['salvadanaio', 'budget']),
  entry('ph:euro', 'Euro', 'Finanza', ['valuta', 'denaro']),
  entry('ph:calculator', 'Calcolatrice', 'Finanza', ['contabilità', 'calcolo']),
  entry('ph:chart-up', 'Investimenti', 'Finanza', ['borsa', 'crescita']),
  entry('ph:safe', 'Cassaforte', 'Finanza', ['deposito', 'sicurezza']),
  entry('ph:money', 'Denaro', 'Finanza', ['banconota', 'pagamento']),

  entry('play', 'Riproduzione', 'Intrattenimento', ['streaming', 'video']),
  entry('movie', 'Cinema', 'Intrattenimento', ['film', 'spettacolo']),
  entry('music', 'Musica', 'Intrattenimento', ['concerto', 'audio']),
  entry('gamepad', 'Videogiochi', 'Intrattenimento', ['gaming', 'console']),
  entry('ticket', 'Biglietto', 'Intrattenimento', ['evento', 'teatro']),
  entry('book', 'Libro', 'Intrattenimento', ['lettura', 'cultura']),
  entry('camera', 'Fotografia', 'Intrattenimento', ['foto', 'obiettivo']),
  entry('ph:tv', 'Televisione', 'Intrattenimento', ['serie', 'streaming']),
  entry('ph:headphones', 'Cuffie', 'Intrattenimento', ['audio', 'podcast']),
  entry('ph:microphone', 'Microfono', 'Intrattenimento', ['karaoke', 'podcast']),
  entry('ph:video-camera', 'Video', 'Intrattenimento', ['riprese', 'streaming']),
  entry('ph:confetti', 'Festa', 'Intrattenimento', ['party', 'evento']),
  entry('ph:dice', 'Giochi', 'Intrattenimento', ['dadi', 'tavolo']),

  entry('health', 'Primo soccorso', 'Salute e benessere', ['salute', 'farmacia']),
  entry('doctor', 'Medico', 'Salute e benessere', ['visita', 'specialista']),
  entry('heart', 'Cuore', 'Salute e benessere', ['benessere', 'amore']),
  entry('ph:pill', 'Farmaci', 'Salute e benessere', ['pillola', 'medicina']),
  entry('ph:tooth', 'Dentista', 'Salute e benessere', ['dente', 'odontoiatra']),
  entry('ph:hospital', 'Ospedale', 'Salute e benessere', ['clinica', 'ricovero']),
  entry('ph:ambulance', 'Ambulanza', 'Salute e benessere', ['emergenza', 'soccorso']),
  entry('ph:bandaids', 'Medicazione', 'Salute e benessere', ['cerotto', 'cura']),
  entry('ph:run', 'Corsa', 'Salute e benessere', ['fitness', 'allenamento']),

  entry('plane', 'Aereo', 'Viaggi', ['volo', 'vacanza']),
  entry('bed', 'Hotel', 'Viaggi', ['albergo', 'b&b']),
  entry('ph:suitcase', 'Valigia', 'Viaggi', ['bagaglio', 'vacanza']),
  entry('ph:map', 'Mappa', 'Viaggi', ['itinerario', 'strada']),
  entry('ph:compass', 'Bussola', 'Viaggi', ['orientamento', 'avventura']),
  entry('ph:mountains', 'Montagna', 'Viaggi', ['trekking', 'neve']),
  entry('ph:umbrella', 'Mare', 'Viaggi', ['spiaggia', 'vacanza']),
  entry('ph:binoculars', 'Escursione', 'Viaggi', ['natura', 'visita']),
  entry('ph:globe', 'Mondo', 'Viaggi', ['estero', 'internazionale']),

  entry('football', 'Calcio', 'Sport', ['pallone', 'partita']),
  entry('dumbbell', 'Palestra', 'Sport', ['pesi', 'fitness']),
  entry('ph:basketball', 'Basket', 'Sport', ['pallacanestro']),
  entry('ph:tennis', 'Tennis', 'Sport', ['racchetta']),
  entry('ph:trophy', 'Trofeo', 'Sport', ['gara', 'vittoria']),
  entry('ph:medal', 'Medaglia', 'Sport', ['premio', 'competizione']),
  entry('ph:bike', 'Ciclismo', 'Sport', ['bicicletta', 'allenamento']),

  entry('laptop', 'Computer portatile', 'Lavoro e tecnologia', ['pc', 'informatica']),
  entry('phone', 'Telefono', 'Lavoro e tecnologia', ['smartphone', 'ricarica']),
  entry('education', 'Formazione', 'Lavoro e tecnologia', ['scuola', 'università']),
  entry('ph:briefcase', 'Lavoro', 'Lavoro e tecnologia', ['ufficio', 'business']),
  entry('ph:buildings', 'Azienda', 'Lavoro e tecnologia', ['ufficio', 'società']),
  entry('ph:desktop', 'Desktop', 'Lavoro e tecnologia', ['monitor', 'computer']),
  entry('ph:tablet', 'Tablet', 'Lavoro e tecnologia', ['dispositivo', 'tecnologia']),
  entry('ph:wifi', 'Internet', 'Lavoro e tecnologia', ['rete', 'connessione']),
  entry('ph:robot', 'Robot', 'Lavoro e tecnologia', ['automazione', 'ai']),
  entry('ph:code', 'Software', 'Lavoro e tecnologia', ['sviluppo', 'programmazione']),
  entry('ph:printer', 'Stampante', 'Lavoro e tecnologia', ['stampa', 'ufficio']),
  entry('ph:cloud', 'Cloud', 'Lavoro e tecnologia', ['online', 'storage']),
  entry('ph:cpu', 'Hardware', 'Lavoro e tecnologia', ['processore', 'computer']),

  entry('family', 'Famiglia', 'Famiglia e natura', ['persone', 'casa']),
  entry('child', 'Bambino', 'Famiglia e natura', ['figli', 'neonato']),
  entry('wedding', 'Matrimonio', 'Famiglia e natura', ['nozze', 'anelli']),
  entry('paw', 'Animali', 'Famiglia e natura', ['zampa', 'pet']),
  entry('ph:user', 'Persona', 'Famiglia e natura', ['utente', 'profilo']),
  entry('ph:users', 'Gruppo', 'Famiglia e natura', ['amici', 'persone']),
  entry('ph:dog', 'Cane', 'Famiglia e natura', ['animale', 'pet']),
  entry('ph:cat', 'Gatto', 'Famiglia e natura', ['animale', 'pet']),
  entry('ph:flower', 'Fiori', 'Famiglia e natura', ['giardino', 'natura']),
  entry('ph:tree', 'Albero', 'Famiglia e natura', ['verde', 'natura']),

  brand('netflix', 'Netflix', '#E50914', ['streaming', 'serie', 'film']),
  brand('apple', 'Apple', '#68738C', ['icloud', 'apple tv', 'app store']),
  brand('spotify', 'Spotify', '#1DB954', ['musica', 'podcast']),
  brand('amazon', 'Amazon', '#FF9900', ['prime', 'shopping', 'ordini']),
  brand('disneyplus', 'Disney+', '#113CCF', ['disney plus', 'streaming']),
  brand('youtube', 'YouTube', '#FF0000', ['video', 'premium']),
  brand('playstation', 'PlayStation', '#003791', ['ps5', 'ps4', 'gaming']),
  brand('xbox', 'Xbox', '#107C10', ['game pass', 'gaming']),
  brand('google', 'Google', '#4285F4', ['one', 'drive', 'play']),
  brand('uber', 'Uber', '#68738C', ['taxi', 'mobilità']),
  brand('airbnb', 'Airbnb', '#FF5A5F', ['casa', 'viaggio', 'alloggio']),
  brand('paypal', 'PayPal', '#003087', ['pagamento', 'wallet']),
];

export const ICON_CATALOG_BY_ID = new Map(
  ICON_CATALOG.map((item) => [item.id, item])
);

export function getIconCatalogEntry(id?: string | null) {
  return id ? ICON_CATALOG_BY_ID.get(id) : undefined;
}

export function normalizeIconSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('it')
    .trim();
}

export function matchesIconSearch(item: IconCatalogEntry, query: string) {
  const normalized = normalizeIconSearch(query);
  if (!normalized) return true;

  const haystack = normalizeIconSearch(
    [item.label, item.group, item.id, ...item.keywords].join(' ')
  );

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}
