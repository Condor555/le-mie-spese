#!/usr/bin/env python3
"""Qoomia V4.1.1: enforce the audited category/brand icon source of truth."""
from __future__ import annotations
from io import BytesIO
from pathlib import Path
import json,re,sys,xml.etree.ElementTree as ET
import cairosvg
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
CATALOG=(ROOT/'lib/category-icon-catalog.ts').read_text()
PROVENANCE=json.loads((ROOT/'public/icons/icon-provenance.json').read_text())
approved=sorted(PROVENANCE['categories']['retainedApprovedIcons8'])
category_ids=re.findall(r"icon\('([^']+)'",CATALOG)
category_files=sorted(path.name for path in (ROOT/'public/icons/categories').glob('*.svg'))
brand_files=sorted(PROVENANCE['brands']['retainedDedicated'])
catalog_brand_files=sorted(re.findall(r"asset:'/icons/brands/([^']+\.(?:svg|png))'",CATALOG))
failures:list[str]=[]

expected_ids=sorted(Path(name).stem for name in approved)
if sorted(category_ids)!=expected_ids:failures.append(f'Catalogo categorie non conforme: {sorted(category_ids)} != {expected_ids}')
if category_files!=approved:failures.append(f'File categorie non conformi/orfani: {category_files} != {approved}')
if catalog_brand_files!=brand_files:failures.append('Catalogo brand e manifest provenienza non coincidono')
for forbidden in ['public/icons/color','category-icon-catalog-data','build-color-icon-catalog']:
    if forbidden in CATALOG:failures.append(f'Catalogo collegato a sorgente legacy: {forbidden}')
if (ROOT/'public/icons/color').exists():failures.append('public/icons/color deve essere assente')
if (ROOT/'lib/category-icon-catalog-data.ts').exists():failures.append('Manifest artificiale legacy ancora presente')
if (ROOT/'scripts/build-color-icon-catalog.py').exists():failures.append('Generatore colorizer legacy ancora presente')

paths=[ROOT/'public/icons/categories'/name for name in approved]+[ROOT/'public/icons/brands'/name for name in brand_files]
rendered=0
for path in paths:
    if not path.is_file():failures.append(f'Asset mancante/case errato: {path.relative_to(ROOT)}');continue
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
    except Exception as error:failures.append(f'{path.relative_to(ROOT)}: {error}')

runtime_files=['lib/category-icon-catalog.ts','lib/category-icon-assets.ts','lib/category-style.ts','components/CategoryColorIcon.tsx','components/IconCatalogPicker.tsx','components/CategoryIcon.tsx']
for name in runtime_files:
    text=(ROOT/name).read_text()
    if '/icons/color/' in text or 'category-icon-catalog-data' in text:failures.append(f'Runtime collegato al catalogo artificiale: {name}')
fallback=(ROOT/'components/CategoryColorIcon.tsx').read_text()
for token in ['TagIcon','onError',"removeAttribute('src')",'@phosphor-icons/react/ssr']:
    if token not in fallback:failures.append(f'Fallback Phosphor incompleto: {token}')
if 'if(!ready||!src)return <TagIcon' not in fallback:failures.append('Render esclusivo asset oppure fallback non verificato')

if failures:
    print('ICON PROVENANCE AUDIT FAILED');print('\n'.join(f'- {item}' for item in failures));sys.exit(1)
print(f'ICON PROVENANCE AUDIT PASS: {len(approved)} categorie approvate + {len(brand_files)} brand dedicati; {rendered}/{len(paths)} asset decodificati; catalogo artificiale e public/icons/color assenti; fallback Phosphor Tag esclusivo')
