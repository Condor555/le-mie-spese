'use client';

import {useEffect,useState} from 'react';
import {categoryIconAsset} from '../lib/category-icon-assets';

export default function CategoryColorIcon({icon,size=24,className}:{icon?:string|null;size?:number;className?:string}){
  const src=categoryIconAsset(icon);const [status,setStatus]=useState<'loading'|'loaded'|'error'>('loading');
  useEffect(()=>setStatus('loading'),[src]);
  return <span className={`category-color-icon category-color-asset${className?` ${className}`:''}`} style={{width:size,height:size}} aria-hidden="true">
    {status!=='loaded'&&<svg className="category-color-fallback" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13 13 20 4 11V4h7l9 9Z"/><circle cx="8" cy="8" r="1"/></svg>}
    <img src={src} width={size} height={size} alt="" loading="lazy" decoding="async" onLoad={()=>setStatus('loaded')} onError={event=>{event.currentTarget.removeAttribute('src');setStatus('error')}} style={{display:status==='error'?'none':'block'}}/>
  </span>;
}
