#!/usr/bin/env python3
"""Build the local, curated color category icon catalog from bundled open SVG glyphs.

This release script is not used at runtime. It creates optimized local SVG files and the
static TypeScript catalog consumed by the PWA. The source glyphs are Font Awesome Free
(CC BY 4.0); the visual treatment is local and intentionally keeps runtime network-free.
"""
from __future__ import annotations

from pathlib import Path
import os
import re

ROOT = Path(__file__).resolve().parents[1]
FA_CANDIDATES = [
    Path(os.environ['FONT_AWESOME_SVG_DIR']) if os.environ.get('FONT_AWESOME_SVG_DIR') else None,
    ROOT / 'node_modules/@fortawesome/fontawesome-free/svgs/solid',
    Path('/opt/oai-docgen/node_modules/@fortawesome/fontawesome-free/svgs/solid'),
]
FA = next((path for path in FA_CANDIDATES if path and path.is_dir()), Path('__font_awesome_not_found__'))
OUT = ROOT / 'public/icons/color'
CATALOG = ROOT / 'lib/category-icon-catalog-data.ts'

GROUPS: dict[str, list[str]] = {
    'Essenziali': ['tag','tags','star','bookmark','circle-question','circle-info','triangle-exclamation','bell','calendar','clock','location-dot','map-pin','receipt','repeat','gift','heart','circle-check','circle-xmark','plus','minus','percent','list','sliders','magnifying-glass','ellipsis','circle-play','arrow-rotate-left'],
    'Cibo': ['apple-whole','bacon','bread-slice','bowl-food','bowl-rice','burger','carrot','cheese','cookie','egg','fish','hotdog','ice-cream','lemon','martini-glass-citrus','martini-glass','mug-hot','mug-saucer','pizza-slice','shrimp','utensils','wine-bottle','wine-glass','beer-mug-empty'],
    'Trasporti': ['car','car-side','car-rear','taxi','bus','bus-simple','train','train-subway','train-tram','bicycle','motorcycle','van-shuttle','truck','truck-fast','truck-pickup','ferry','ship','sailboat','plane','plane-departure','plane-arrival','helicopter','gas-pump','charging-station','square-parking'],
    'Casa': ['house','house-chimney','building','city','bed','bath','couch','chair','kitchen-set','faucet','shower','toilet','sink','broom','brush','bucket','couch','door-closed','door-open','lightbulb','plug','bolt','fire-burner','temperature-half','fan'],
    'Shopping': ['bag-shopping','basket-shopping','cart-shopping','cart-plus','store','shop','cash-register','shirt','shoe-prints','socks','gem','palette','spray-can-sparkles','box','box-open','boxes-stacked','truck-ramp-box','barcode','qrcode','credit-card','mobile-screen-button','gift','gifts','scissors'],
    'Intrattenimento': ['film','clapperboard','photo-film','camera','camera-retro','images','music','headphones','microphone','podcast','radio','tv','gamepad','dice','chess','bowling-ball','masks-theater','ticket','ticket-simple','guitar','drum','compact-disc','record-vinyl','champagne-glasses'],
    'Finanza': ['wallet','coins','money-bill','money-bill-wave','money-bills','money-check-dollar','sack-dollar','piggy-bank','vault','building-columns','landmark','euro-sign','dollar-sign','sterling-sign','yen-sign','bitcoin-sign','chart-line','chart-pie','chart-bar','arrow-trend-up','arrow-trend-down','scale-balanced','calculator','file-invoice-dollar'],
    'Salute': ['heart-pulse','stethoscope','user-doctor','user-nurse','hospital','hospital-user','kit-medical','briefcase-medical','truck-medical','spa','pills','capsules','syringe','prescription-bottle-medical','tooth','lungs','brain','dna','microscope','flask-vial','bandage','crutch','wheelchair','eye','ear-listen','weight-scale'],
    'Viaggi': ['umbrella-beach','suitcase','suitcase-rolling','passport','hotel','bell-concierge','map','map-location-dot','globe','earth-europe','earth-americas','earth-asia','mountain-sun','campground','tent','person-hiking','route','road','signs-post','binoculars','camera','monument','landmark-dome','island-tropical'],
    'Sport': ['futbol','football','basketball','baseball','baseball-bat-ball','volleyball','table-tennis-paddle-ball','golf-ball-tee','hockey-puck','person-running','person-biking','person-swimming','person-skiing','person-snowboarding','person-skating','person-hiking','dumbbell','weight-hanging','medal','trophy','flag-checkered','stopwatch','water-ladder','bicycle'],
    'Tecnologia': ['mobile','mobile-screen','laptop','desktop','computer','tablet-screen-button','keyboard','computer-mouse','microchip','memory','hard-drive','server','database','wifi','router','satellite-dish','cloud','cloud-arrow-up','cloud-arrow-down','code','terminal','robot','vr-cardboard','headset'],
    'Famiglia': ['users','user-group','people-group','children','child','baby','baby-carriage','person-breastfeeding','person-pregnant','house-user','house-chimney-user','heart','heart-circle-check','hands-holding-child','hands-holding-heart','hand-holding-heart','person-cane','wheelchair-move','paw','dog','cat','cake-candles','ring','church'],
    'Lavoro': ['briefcase','business-time','building','building-user','user-tie','user-gear','chalkboard-user','presentation-screen','clipboard','clipboard-check','file-lines','file-contract','file-signature','file-invoice','folder','folder-open','envelopes-bulk','pen-to-square','stamp','print','phone','fax','headset','sitemap'],
    'Istruzione': ['graduation-cap','school','book','book-open','book-open-reader','book-atlas','library','pencil','pen','highlighter','chalkboard','language','spell-check','glasses','microscope','flask','atom','award','certificate','diploma','calculator','ruler','shapes','palette'],
    'Natura e animali': ['dog','cat','paw','horse','cow','fish','frog','dove','crow','otter','hippo','dragon','kiwi-bird','spider','leaf','seedling','tree','mountain','water','sun','moon','cloud-sun','snowflake','rainbow'],
    'Servizi': ['wrench','screwdriver-wrench','hammer','toolbox','gears','gear','paint-roller','paintbrush','broom','truck-moving','truck-fast','box-archive','recycle','trash-can','key','lock','shield-halved','handshake','customer-support','phone-volume','envelope','paper-plane','wifi','plug'],
}

# Remove names that are not present in the bundled Font Awesome release and keep the
# curated catalog between 300 and 500 distinct icons.
for group, slugs in list(GROUPS.items()):
    GROUPS[group] = [slug for slug in slugs if (FA / f'{slug}.svg').exists()]

ITALIAN = {
    'tag':'Generica','tags':'Etichette','star':'Preferita','bookmark':'Segnalibro','calendar':'Calendario','clock':'Orologio','location-dot':'Posizione','receipt':'Ricevuta','repeat':'Ricorrenza','gift':'Regalo','heart':'Cuore',
    'apple-whole':'Mela','bread-slice':'Pane','bowl-food':'Piatto','burger':'Hamburger','carrot':'Verdura','cheese':'Formaggio','cookie':'Dolci','egg':'Uova','fish':'Pesce','ice-cream':'Gelato','mug-hot':'Caffè','pizza-slice':'Pizza','utensils':'Ristorante','wine-bottle':'Vino','beer-mug-empty':'Birra',
    'car':'Auto','taxi':'Taxi','bus':'Autobus','train':'Treno','bicycle':'Bicicletta','motorcycle':'Moto','truck':'Camion','ferry':'Traghetto','ship':'Nave','sailboat':'Barca a vela','plane':'Aereo','helicopter':'Elicottero','gas-pump':'Carburante','charging-station':'Ricarica elettrica',
    'house':'Casa','bed':'Camera da letto','bath':'Bagno','couch':'Divano','chair':'Sedia','kitchen-set':'Cucina','faucet':'Acqua','shower':'Doccia','toilet':'Servizi igienici','broom':'Pulizie','lightbulb':'Luce','plug':'Utenze','fire-burner':'Gas','fan':'Ventilazione',
    'bag-shopping':'Shopping','basket-shopping':'Spesa','cart-shopping':'Carrello','store':'Negozio','cash-register':'Cassa','shirt':'Abbigliamento','shoe-prints':'Scarpe','gem':'Gioielli','box':'Pacco','barcode':'Codice a barre','credit-card':'Carta',
    'film':'Film','clapperboard':'Cinema','camera':'Fotografia','music':'Musica','headphones':'Cuffie','microphone':'Microfono','radio':'Radio','tv':'Televisione','gamepad':'Videogiochi','dice':'Giochi','masks-theater':'Teatro','ticket':'Biglietto','guitar':'Chitarra',
    'wallet':'Portafoglio','coins':'Monete','money-bill':'Contanti','piggy-bank':'Risparmio','vault':'Cassaforte','building-columns':'Banca','euro-sign':'Euro','chart-line':'Investimenti','calculator':'Calcolatrice','file-invoice-dollar':'Fattura',
    'heart-pulse':'Salute','stethoscope':'Visita medica','user-doctor':'Medico','user-nurse':'Infermiere','hospital':'Ospedale','kit-medical':'Pronto soccorso','pills':'Farmacia','tooth':'Dentista','brain':'Psicologia','microscope':'Analisi','bandage':'Medicazione','weight-scale':'Bilancia',
    'umbrella-beach':'Spiaggia','suitcase':'Valigia','suitcase-rolling':'Bagaglio','passport':'Passaporto','hotel':'Hotel','map':'Mappa','globe':'Mondo','mountain-sun':'Montagna','campground':'Campeggio','tent':'Tenda','person-hiking':'Escursione','route':'Itinerario','binoculars':'Esplorazione','monument':'Monumento',
    'futbol':'Calcio','football':'Football','basketball':'Basket','volleyball':'Pallavolo','person-running':'Corsa','person-biking':'Ciclismo','person-swimming':'Nuoto','dumbbell':'Palestra','medal':'Medaglia','trophy':'Trofeo','stopwatch':'Cronometro',
    'mobile':'Telefono','laptop':'Portatile','desktop':'Computer','keyboard':'Tastiera','microchip':'Processore','hard-drive':'Disco','server':'Server','database':'Database','wifi':'Internet','cloud':'Cloud','code':'Software','robot':'Robot','vr-cardboard':'Realtà virtuale',
    'users':'Famiglia','children':'Figli','baby':'Bambino','baby-carriage':'Prima infanzia','person-pregnant':'Gravidanza','hands-holding-child':'Assistenza figli','paw':'Animali','dog':'Cane','cat':'Gatto','cake-candles':'Compleanno','ring':'Matrimonio',
    'briefcase':'Lavoro','business-time':'Orario di lavoro','user-tie':'Professionista','chalkboard-user':'Formazione','clipboard':'Appunti','file-contract':'Contratto','file-signature':'Firma','folder':'Archivio','stamp':'Timbro','print':'Stampa','phone':'Telefono','headset':'Assistenza clienti',
    'graduation-cap':'Istruzione','school':'Scuola','book':'Libro','library':'Biblioteca','pencil':'Matita','language':'Lingue','glasses':'Studio','award':'Premio','certificate':'Certificato','ruler':'Righello','shapes':'Creatività',
    'leaf':'Natura','seedling':'Piante','tree':'Albero','mountain':'Montagna','water':'Acqua','sun':'Sole','moon':'Luna','snowflake':'Neve','rainbow':'Arcobaleno',
    'wrench':'Riparazioni','screwdriver-wrench':'Manutenzione','hammer':'Lavori','toolbox':'Attrezzi','paint-roller':'Imbianchino','truck-moving':'Trasloco','recycle':'Riciclo','trash-can':'Rifiuti','key':'Chiavi','lock':'Sicurezza','handshake':'Consulenza','envelope':'Posta','paper-plane':'Spedizione',
}

GROUP_KEYWORDS = {
    'Essenziali':'generico altro varie basic common', 'Cibo':'cibo alimentari pranzo cena ristorante spesa food drink grocery',
    'Trasporti':'trasporti viaggio mobilità commute transport vehicle', 'Casa':'casa abitazione affitto utenze home household',
    'Shopping':'acquisti negozio ecommerce shopping clothes', 'Intrattenimento':'svago hobby cinema musica entertainment',
    'Finanza':'denaro banca pagamento tasse investimento finance money', 'Salute':'salute medico farmacia benessere health medical',
    'Viaggi':'viaggio vacanza ferie mare spiaggia lido turismo travel holiday beach', 'Sport':'sport palestra allenamento fitness',
    'Tecnologia':'tecnologia elettronica internet software tech', 'Famiglia':'famiglia figli bambini parenti family',
    'Lavoro':'lavoro ufficio azienda professione work office', 'Istruzione':'scuola studio università formazione education',
    'Natura e animali':'natura animali ambiente pet nature animals', 'Servizi':'servizi manutenzione riparazione assistenza service repair',
}

ALIASES = {
    'umbrella-beach':'mare spiaggia lido ombrellone stabilimento balneare beach seaside umbrella',
    'suitcase':'vacanza vacanze ferie valigia bagaglio holiday luggage',
    'plane':'viaggio viaggi volo voli aereo aeroporto flight airplane',
    'gas-pump':'benzina diesel gpl carburante distributore fuel gas',
    'cart-shopping':'supermercato spesa alimentari market groceries',
    'stethoscope':'medico dottore visita specialista doctor physician',
    'pills':'farmacia medicine medicinali pharmacy drug',
    'house':'casa abitazione affitto mutuo home rent mortgage',
    'plug':'bollette luce gas corrente utenze utilities electricity',
    'mug-hot':'bar caffè caffe colazione coffee cafe',
    'utensils':'ristorante cena pranzo pizzeria food restaurant',
    'dumbbell':'palestra fitness allenamento gym workout',
    'paw':'animali cane gatto veterinario pets veterinary',
    'film':'cinema film streaming movie',
    'gamepad':'videogiochi gaming console videogame',
    'shirt':'vestiti abbigliamento moda clothing fashion',
    'mobile':'telefono cellulare smartphone ricarica phone',
    'graduation-cap':'scuola università corso formazione education university',
    'heart':'moglie marito amore coppia affetti love',
    'baby':'figli bambino neonati infanzia child',
    'wallet':'conto portafoglio finanza soldi account money',
    'piggy-bank':'risparmio salvadanaio savings',
    'file-invoice-dollar':'fattura ricevuta rimborso invoice bill',
    'wrench':'riparazione manutenzione meccanico repair maintenance',
}

PALETTES = [('#42A5F5','#7E57C2','#E8F2FF'),('#26A69A','#66BB6A','#E7F8F2'),('#FF8A65','#EF5350','#FFF0EA'),('#AB47BC','#5C6BC0','#F3EAFE'),('#FFA726','#FDD835','#FFF7DD'),('#EC407A','#7E57C2','#FDEBF4')]


def human(slug: str) -> str:
    return ' '.join(word.capitalize() for word in slug.replace('-', ' ').split())


def make_svg(slug: str, index: int) -> None:
    source = (FA / f'{slug}.svg').read_text()
    view = re.search(r'viewBox="([^"]+)"', source)
    path = re.search(r'(<path\b.*?</path>|<path\b[^>]*/>)', source, re.S)
    if not view or not path:
        raise RuntimeError(f'Unsupported SVG: {slug}')
    c1, c2, accent = PALETTES[index % len(PALETTES)]
    body = path.group(1).replace('<path ', '<path fill="url(#icon-gradient)" ')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view.group(1)}" role="img">
<!-- Local color treatment; source glyph: Font Awesome Free 6.7.2, CC BY 4.0. -->
<defs><linearGradient id="icon-gradient" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>
<circle cx="84%" cy="18%" r="9%" fill="{accent}" opacity=".72"/>
{body}
</svg>\n'''
    (OUT / f'{slug}.svg').write_text(svg)


def main() -> None:
    if not FA.is_dir():
        raise RuntimeError('Font Awesome Free SVG non trovato. Imposta FONT_AWESOME_SVG_DIR prima di rigenerare gli asset.')
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob('*.svg'):
        old.unlink()
    rows = []
    seen = set()
    for group, slugs in GROUPS.items():
        for slug in slugs:
            if slug in seen:
                continue
            seen.add(slug)
            english = human(slug)
            label = ITALIAN.get(slug, english)
            keywords = f"{GROUP_KEYWORDS[group]} {ALIASES.get(slug,'')} {slug.replace('-', ' ')} {english}".strip()
            rows.append((slug,label,english,group,keywords))
    if not (300 <= len(rows) <= 500):
        raise RuntimeError(f'Catalog size out of target: {len(rows)}')
    for index,(slug,*_) in enumerate(rows):
        make_svg(slug,index)
    lines = [
        "// Generated by scripts/build-color-icon-catalog.py. Do not edit by hand.",
        "export type ColorIconCatalogRow=readonly [slug:string,label:string,englishLabel:string,group:string,keywords:string];",
        "export const colorIconCatalogData:readonly ColorIconCatalogRow[]=[",
    ]
    for slug,label,english,group,keywords in rows:
        vals = [slug,label,english,group,keywords]
        encoded = ','.join("'" + v.replace('\\','\\\\').replace("'","\\'") + "'" for v in vals)
        lines.append(f"  [{encoded}],")
    lines += ["] as const;", f"export const COLOR_ICON_COUNT={len(rows)};", ""]
    CATALOG.write_text('\n'.join(lines))
    print(f'Generated {len(rows)} local color icons and {CATALOG.name}')

if __name__ == '__main__':
    main()
