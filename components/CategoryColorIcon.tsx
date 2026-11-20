'use client';

import {useEffect,useState} from 'react';
import {TagIcon} from '@phosphor-icons/react/ssr';
import {categoryIconAsset} from '../lib/category-icon-assets';

/** Categorie = asset Icons8 reali; fallback esplicito = Phosphor Tag. */
export default function CategoryColorIcon({icon,size=24,className}:{icon?:string|null;size?:number;className?:string}){
  const src=categoryIconAsset(icon);const [failed,setFailed]=useState(false);const [loaded,setLoaded]=useState(false);
  useEffect(()=>{setFailed(false);setLoaded(false)},[src]);
  const fallback=!src||failed;
  return <span className={`category-color-icon category-color-asset${className?` ${className}`:''}`} style={{width:size,height:size}} aria-hidden="true">
    {(fallback||!loaded)&&<TagIcon className="category-color-fallback" size={size} weight="duotone"/>}
    {src&&!failed&&<img src={src} width={size} height={size} alt="" loading="lazy" decoding="async" onLoad={()=>setLoaded(true)} onError={event=>{event.currentTarget.removeAttribute('src');setFailed(true)}} style={{display:failed?'none':'block',opacity:loaded?1:0}}/>}
  </span>;
}
