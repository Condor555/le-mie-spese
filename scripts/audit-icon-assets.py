#!/usr/bin/env python3
"""Audit the real Icons8 category/brand source of truth used by the app."""
from __future__ import annotations
from io import BytesIO
from pathlib import Path
import re,sys,xml.etree.ElementTree as ET
import cairosvg
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
CATALOG=(ROOT/'lib/category-icon-catalog.ts').read_text()
category_ids=re.findall(r"icon\('([^']+)'",CATALOG)
paths=sorted(set([f'/icons/categories/{item}.svg' for item in category_ids]+re.findall(r"asset:'(/icons/brands/[^']+\.(?:svg|png))'",CATALOG)))
failures:list[str]=[];rendered=0
if not paths:failures.append('Catalogo reale vuoto')
for source in paths:
    relative=source.removeprefix('/');path=ROOT/'public'/relative
    if not path.is_file():failures.append(f'Asset mancante/case errato: {source}');continue
    try:
        data=path.read_bytes()
        if path.suffix.lower()=='.svg':
            root=ET.fromstring(data)
            if not root.tag.endswith('svg') or 'viewBox' not in root.attrib:raise ValueError('root/viewBox SVG non valido')
            if re.search(rb'(?:href|src)=["\'](?:https?:|//|data:)',data,re.I):raise ValueError('riferimento esterno incorporato')
            decoded=cairosvg.svg2png(bytestring=data,output_width=64,output_height=64)
        else:decoded=data
        with Image.open(BytesIO(decoded)) as image:
            image.load()
            if image.width<1 or image.height<1:raise ValueError('dimensioni non valide')
            if image.convert('RGBA').getchannel('A').getbbox() is None:raise ValueError('render trasparente')
        rendered+=1
    except Exception as error:failures.append(f'{source}: {error}')

runtime_files=['lib/category-icon-catalog.ts','lib/category-icon-assets.ts','lib/category-style.ts','components/CategoryColorIcon.tsx','components/IconCatalogPicker.tsx','components/CategoryIcon.tsx']
for name in runtime_files:
    text=(ROOT/name).read_text()
    if '/icons/color/' in text or 'category-icon-catalog-data' in text:failures.append(f'Runtime ancora collegato al catalogo artificiale: {name}')
fallback=(ROOT/'components/CategoryColorIcon.tsx').read_text()
for token in ['TagIcon','onError',"removeAttribute('src')"]:
    if token not in fallback:failures.append(f'Fallback Phosphor incompleto: {token}')
if "@phosphor-icons/react/ssr" not in fallback:failures.append('Fallback non importato da Phosphor')

if failures:
    print('ICON SOURCE AUDIT FAILED');print('\n'.join(f'- {item}' for item in failures));sys.exit(1)
category=sum('/categories/' in path for path in paths);brands=sum('/brands/' in path for path in paths)
print(f'ICON SOURCE AUDIT PASS: {rendered}/{len(paths)} asset reali risolti e decodificati ({category} categorie, {brands} brand); runtime senza public/icons/color; fallback Phosphor Tag presente')
