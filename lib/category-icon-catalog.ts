export type IconGroup =
  | 'Essenziali'
  | 'Cibo'
  | 'Trasporti'
  | 'Casa'
  | 'Shopping'
  | 'Intrattenimento'
  | 'Finanza'
  | 'Salute'
  | 'Viaggi'
  | 'Sport'
  | 'Tecnologia'
  | 'Famiglia'
  | 'Lavoro';

export type IconCatalogEntry = {
  id: string;
  label: string;
  component: string;
  group: IconGroup;
  keywords: string[];
};

const entries = (group: IconGroup, rows: [string, string, string, string?][]): IconCatalogEntry[] =>
  rows.map(([id, label, component, keywords = '']) => ({
    id,
    label,
    component,
    group,
    keywords: [label, id, keywords].join(' ').toLocaleLowerCase('it').split(/\s+/).filter(Boolean),
  }));

export const iconGroups: IconGroup[] = [
  'Essenziali', 'Cibo', 'Trasporti', 'Casa', 'Shopping', 'Intrattenimento',
  'Finanza', 'Salute', 'Viaggi', 'Sport', 'Tecnologia', 'Famiglia', 'Lavoro',
];

export const phosphorIconCatalog: IconCatalogEntry[] = [
  ...entries('Essenziali', [
    ['tag','Generica','TagIcon','altro categoria'],['more','Altro','DotsThreeIcon','varie'],
    ['generic-expense','Spesa generica','ReceiptIcon','uscita costo'],['subscription','Abbonamento','RepeatIcon','ricorrente mensile'],
    ['service','Servizio','WrenchIcon','assistenza'],['unexpected','Imprevisto','WarningCircleIcon','emergenza'],
    ['refund','Rimborso','ArrowCounterClockwiseIcon','reso entrata'],['cash','Contanti','MoneyIcon','banconote'],
    ['favorite','Preferita','StarIcon','frequente'],['other-income','Altra entrata','ArrowCircleUpIcon','ricavo accredito'],
  ]),
  ...entries('Cibo', [
    ['food','Ristorante','ForkKnifeIcon','cibo pranzo cena'],['coffee','Bar e caffè','CoffeeIcon','colazione'],
    ['cart','Spesa','ShoppingCartIcon','supermercato alimentari'],['supermarket','Supermercato','ForkKnifeIcon','spesa alimentari'],
    ['restaurant','Cena fuori','ForkKnifeIcon','ristorante'],['pizza','Pizza','ForkKnifeIcon','pizzeria'],
    ['groceries','Alimentari','ForkKnifeIcon','verdura spesa'],['bakery','Panetteria','ForkKnifeIcon','pane'],
    ['drinks','Bevande','ForkKnifeIcon','aperitivo bibite'],['delivery','Consegna cibo','MotorcycleIcon','delivery asporto'],
  ]),
  ...entries('Trasporti', [
    ['fuel','Carburante','GasPumpIcon','benzina diesel gpl'],['train','Treno','TrainIcon','ferrovia trasporto'],
    ['car','Auto','CarIcon','macchina'],['parking','Parcheggio','CarSimpleIcon','sosta'],
    ['scooter','Moto e scooter','MotorcycleIcon','motorino'],['bus','Autobus','BusIcon','pullman'],
    ['taxi','Taxi','TaxiIcon','noleggio'],['bicycle','Bicicletta','BicycleIcon','bici'],
    ['truck','Trasporto merci','TruckIcon','furgone spedizione'],['commute','Pendolarismo','CarIcon','viaggio lavoro'],
  ]),
  ...entries('Casa', [
    ['house','Casa','HouseIcon','abitazione'],['rent','Affitto','HouseIcon','canone locazione'],
    ['utilities','Utenze','HouseIcon','luce gas acqua'],['repair','Riparazioni','WrenchIcon','manutenzione'],
    ['tools-home','Attrezzi','HouseIcon','fai da te'],['furniture','Arredamento','HouseIcon','mobili'],
    ['garden','Giardino','HouseIcon','piante'],['cleaning','Pulizie','HouseIcon','detergenti'],
    ['light','Illuminazione','HouseIcon','lampade energia'],['moving','Trasloco','TruckIcon','cambio casa'],
  ]),
  ...entries('Shopping', [
    ['bag','Shopping','HandbagIcon','acquisti'],['online-shopping','Acquisti online','ShoppingBagIcon','ecommerce'],
    ['clothing','Abbigliamento','HandbagIcon','vestiti'],['scissors','Cura personale','ScissorsIcon','barbiere parrucchiere'],
    ['gift','Regali','GiftIcon','regalo'],['electronics','Elettronica','DeviceMobileIcon','dispositivi'],
    ['book','Libri','BookOpenIcon','libreria cultura'],['amazon','Amazon','PackageIcon','marketplace ordini'],
    ['store','Negozio','StorefrontIcon','commercio'],['package','Pacchi','PackageIcon','ordini spedizioni'],
  ]),
  ...entries('Intrattenimento', [
    ['play','Streaming','PlayIcon','video abbonamento'],['movie','Cinema','FilmSlateIcon','film'],
    ['music','Musica','MusicNotesIcon','concerto'],['gamepad','Videogiochi','GameControllerIcon','gaming console'],
    ['ticket','Biglietti','TicketIcon','evento ingresso'],['theater','Teatro','PlayIcon','spettacolo'],
    ['events','Eventi','PlayIcon','manifestazione'],['streaming','TV e serie','PlayIcon','netflix video'],
    ['hobby','Hobby','PlayIcon','tempo libero'],['camera','Fotografia','CameraIcon','foto'],
  ]),
  ...entries('Finanza', [
    ['wallet','Portafoglio','WalletIcon','conto denaro'],['bank','Banca','BankIcon','istituto conto'],
    ['card','Carta','CreditCardIcon','credito debito'],['coins','Monete','CoinsIcon','denaro'],
    ['tax','Tasse','CurrencyEurIcon','imposte f24'],['safe','Risparmio','PiggyBankIcon','cassaforte salvadanaio'],
    ['investment','Investimenti','WalletIcon','azioni fondi'],['insurance','Assicurazione','WalletIcon','polizza'],
    ['receipt','Ricevute','ReceiptIcon','scontrino fattura'],['calculator','Calcoli','CalculatorIcon','budget contabilità'],
  ]),
  ...entries('Salute', [
    ['health','Salute','FirstAidKitIcon','cura benessere'],['doctor','Medico','StethoscopeIcon','visita'],
    ['pharmacy','Farmacia','PillIcon','medicinali'],['hospital','Ospedale','HospitalIcon','clinica'],
    ['ambulance','Emergenza','AmbulanceIcon','soccorso'],['dumbbell','Palestra','BarbellIcon','fitness allenamento'],
    ['wellness','Benessere','HeartbeatIcon','spa'],['dental','Dentista','FirstAidKitIcon','denti'],
    ['pet-care','Veterinario','PawPrintIcon','animali'],['medical-bill','Spese mediche','ReceiptIcon','ticket sanitario'],
  ]),
  ...entries('Viaggi', [
    ['plane','Volo','AirplaneIcon','aereo viaggio'],['bed','Hotel','BedIcon','alloggio pernottamento'],
    ['map','Itinerario','AirplaneIcon','mappa destinazione'],['luggage','Bagaglio','AirplaneIcon','valigia'],
    ['holiday','Vacanza','AirplaneIcon','ferie'],['beach','Mare','AirplaneIcon','spiaggia'],
    ['camping','Campeggio','AirplaneIcon','natura'],['fuel-trip','Carburante viaggio','GasPumpIcon','benzina'],
    ['travel-ticket','Biglietto viaggio','TicketIcon','prenotazione'],['travel-food','Pasti in viaggio','ForkKnifeIcon','ristorante'],
  ]),
  ...entries('Sport', [
    ['football','Calcio','SoccerBallIcon','pallone'],['gym','Allenamento','BarbellIcon','palestra'],
    ['bicycle-sport','Ciclismo','BicycleIcon','bici'],['running','Corsa','BarbellIcon','jogging'],
    ['swimming','Nuoto','BarbellIcon','piscina'],['racket','Sport con racchetta','BarbellIcon','tennis padel'],
    ['trophy','Gare','BarbellIcon','premio'],['hiking','Escursioni','BarbellIcon','trekking'],
    ['motorcycle-sport','Motorsport','MotorcycleIcon','moto'],['sport-ticket','Evento sportivo','TicketIcon','stadio'],
  ]),
  ...entries('Tecnologia', [
    ['phone','Telefono','DeviceMobileIcon','smartphone ricarica'],['laptop','Computer portatile','LaptopIcon','pc'],
    ['desktop','Computer fisso','DeviceMobileIcon','monitor'],['camera-tech','Fotocamera','CameraIcon','foto'],
    ['gaming-tech','Console','GameControllerIcon','videogiochi'],['internet','Internet','DeviceMobileIcon','fibra rete'],
    ['software','Software','DeviceMobileIcon','app licenza'],['repair-tech','Assistenza tecnica','WrenchIcon','riparazione'],
    ['device','Dispositivo','DeviceMobileIcon','elettronica'],['gadget','Gadget','DeviceMobileIcon','accessorio tecnologia'],
  ]),
  ...entries('Famiglia', [
    ['family','Famiglia','UsersThreeIcon','parenti'],['child','Figli','BabyIcon','bambini'],
    ['baby','Prima infanzia','UsersThreeIcon','neonato'],['wedding','Matrimonio','HeartIcon','nozze'],
    ['heart','Affetti','HeartIcon','amore'],['education','Scuola','GraduationCapIcon','istruzione'],
    ['paw','Animali','PawPrintIcon','cane gatto'],['home-family','Casa famiglia','HouseIcon','abitazione'],
    ['gift-family','Regali famiglia','GiftIcon','compleanno'],['care','Assistenza','UsersThreeIcon','cura aiuto'],
  ]),
  ...entries('Lavoro', [
    ['work','Lavoro','BriefcaseIcon','ufficio'],['office','Ufficio','BriefcaseIcon','azienda'],
    ['tools-work','Strumenti','WrenchIcon','attrezzi'],['education-work','Formazione','GraduationCapIcon','corso'],
    ['travel-work','Trasferta','AirplaneIcon','viaggio lavoro'],['lunch-work','Pasto di lavoro','ForkKnifeIcon','pranzo'],
    ['phone-work','Telefono lavoro','BriefcaseIcon','chiamata'],['software-work','Software lavoro','LaptopIcon','licenza'],
    ['invoice-work','Fatture','ReceiptIcon','rimborso'],['bonus','Premio','BriefcaseIcon','incentivo'],
  ]),
];

export const brandCatalog = [
  {id:'brand:netflix',label:'Netflix',keywords:['streaming','serie','film']},
  {id:'brand:apple',label:'Apple',keywords:['iphone','icloud','tv']},
  {id:'brand:spotify',label:'Spotify',keywords:['musica','streaming']},
  {id:'brand:amazon',label:'Amazon',keywords:['prime','shopping']},
  {id:'brand:disney',label:'Disney+',keywords:['streaming','film']},
  {id:'brand:youtube',label:'YouTube',keywords:['video','premium']},
  {id:'brand:playstation',label:'PlayStation',keywords:['gaming','console']},
  {id:'brand:xbox',label:'Xbox',keywords:['gaming','console']},
  {id:'brand:google',label:'Google',keywords:['servizi','cloud']},
  {id:'brand:uber',label:'Uber',keywords:['taxi','trasporti']},
  {id:'brand:airbnb',label:'Airbnb',keywords:['viaggi','alloggio']},
  {id:'brand:paypal',label:'PayPal',keywords:['pagamenti','finanza']},
] as const;

export const allIconCatalog = [
  ...phosphorIconCatalog,
  ...brandCatalog.map((brand) => ({...brand, component:'BrandMark', group:'Brand' as const})),
];

export function findIconEntry(id?: string | null) {
  return phosphorIconCatalog.find((entry) => entry.id === id);
}
