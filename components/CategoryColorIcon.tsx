'use client';

import {useEffect,useState} from 'react';
import {TagIcon} from '@phosphor-icons/react/ssr';
import {categoryIconAsset} from '../lib/category-icon-assets';

type AssetState='loading'|'ready'|'failed';
type VisualProps={src:string|null;ready:boolean;size:number;className?:string;onError:()=>void};

export function CategoryIconVisual({src,ready,size,className,onError}:VisualProps){
  const classNames=`category-color-icon${className?` ${className}`:''}`;
  if(!ready||!src)return <TagIcon className={`${classNames} category-color-fallback`} size={size} weight="duotone" aria-hidden="true"/>;
  return <img className={classNames} src={src} width={size} height={size} alt="" aria-hidden="true" loading="lazy" decoding="async" onError={onError}/>;
}

/**
 * Render esclusivo: un asset Icons8 oppure TagIcon. Il preload decide la
 * sorgente prima del render, così il DOM contiene sempre un solo svg/img.
 */
export default function CategoryColorIcon({icon,size=24,className}:{icon?:string|null;size?:number;className?:string}){
  const src=categoryIconAsset(icon);
  const [asset,setAsset]=useState<{src:string|null;state:AssetState}>(()=>({src,state:src?'loading':'failed'}));

  useEffect(()=>{
    if(!src){setAsset({src:null,state:'failed'});return}
    let current=true;
    setAsset({src,state:'loading'});
    const probe=new Image();
    probe.onload=()=>{if(current)setAsset({src,state:'ready'})};
    probe.onerror=()=>{if(current)setAsset({src,state:'failed'})};
    probe.src=src;
    return()=>{current=false;probe.onload=null;probe.onerror=null};
  },[src]);

  const ready=Boolean(src&&asset.src===src&&asset.state==='ready');
  return <CategoryIconVisual src={src} ready={ready} size={size} className={className} onError={event=>{event.currentTarget.removeAttribute('src');setAsset({src,state:'failed'})}}/>;
}
