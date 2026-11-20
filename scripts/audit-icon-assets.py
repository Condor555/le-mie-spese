#!/usr/bin/env python3
"""Physical and decode audit for every local Color catalog entry."""
from __future__ import annotations

from io import BytesIO
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

import cairosvg
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
CATALOG=ROOT/'lib/category-icon-catalog-data.ts'
ASSETS=ROOT/'public/icons/color'
slugs=re.findall(r"^  \['([^']+)'",CATALOG.read_text(),re.M)
failures:list[str]=[]
if len(slugs)!=len(set(slugs)):failures.append('Identificatori duplicati nel catalogo')
actual={path.name:path for path in ASSETS.iterdir() if path.is_file()}
expected={f'{slug}.svg' for slug in slugs}
for extra in sorted(set(actual)-expected):failures.append(f'Asset non referenziato: {extra}')
for missing in sorted(expected-set(actual)):failures.append(f'Asset mancante: {missing}')

rendered=0
for slug in slugs:
    expected_name=f'{slug}.svg';path=ASSETS/expected_name
    if not path.is_file():continue
    if path.name!=expected_name:failures.append(f'Case/filename errato: {path.name} != {expected_name}');continue
    try:
        data=path.read_bytes()
        if not data.startswith(b'<svg'):raise ValueError('header SVG assente')
        root=ET.fromstring(data)
        if not root.tag.endswith('svg') or 'viewBox' not in root.attrib:raise ValueError('root/viewBox non valido')
        text=data.decode('utf-8')
        if re.search(r'(?:href|src)=["\'](?:https?:|//|data:)',text,re.I):raise ValueError('riferimento esterno incorporato')
        if '<circle' in text:raise ValueError('cerchio decorativo secondario ancora presente')
        png=cairosvg.svg2png(bytestring=data,output_width=64,output_height=64)
        with Image.open(BytesIO(png)) as image:
            image.load()
            if image.format!='PNG' or image.size!=(64,64):raise ValueError('decode PNG inatteso')
            alpha=image.convert('RGBA').getchannel('A')
            if alpha.getbbox() is None:raise ValueError('render completamente trasparente')
        rendered+=1
    except Exception as error:
        failures.append(f'{slug}: {error}')

resolver=(ROOT/'lib/category-icon-catalog.ts').read_text()
if "asset:`/icons/color/${slug}.svg`" not in resolver:failures.append('Resolver catalogo non usa il path canonico /icons/color/<slug>.svg')
fallback=(ROOT/'components/CategoryColorIcon.tsx').read_text()
for token in ['onError','category-color-fallback','removeAttribute(\'src\')']:
    if token not in fallback:failures.append(f'Fallback runtime incompleto: {token}')

if failures:
    print('ICON AUDIT FAILED')
    print('\n'.join(f'- {item}' for item in failures))
    sys.exit(1)
print(f'ICON AUDIT PASS: {rendered}/{len(slugs)} asset risolti, XML validi, renderizzati con CairoSVG e decodificati PNG/Pillow; fallback runtime presente')
