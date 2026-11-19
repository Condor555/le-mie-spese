'use client';
import {useEffect,useMemo,useState} from 'react';
import CategoryPhosphorIcon from './CategoryPhosphorIcon';
import {brandCatalog,iconGroups,phosphorIconCatalog} from '../lib/category-icon-catalog';

type Tab='all'|'recent'|'favorites'|'brand';
const RECENT='lms_icon_recent_v2',FAVORITES='lms_icon_favorites_v2';
const read=(key:string)=>{try{return JSON.parse(localStorage.getItem(key)||'[]') as string[]}catch{return []}};

export default function IconCatalogPicker({value,onChange}:{value:string;onChange:(id:string)=>void}){
  const [query,setQuery]=useState(''),[tab,setTab]=useState<Tab>('all'),[group,setGroup]=useState('Tutte');
  const [recent,setRecent]=useState<string[]>([]),[favorites,setFavorites]=useState<string[]>([]),[limit,setLimit]=useState(48);
  useEffect(()=>{setRecent(read(RECENT));setFavorites(read(FAVORITES))},[]);
  const all=useMemo(()=>[
    ...phosphorIconCatalog.map(x=>({...x,brand:false,search:[x.label,x.id,...x.keywords].join(' ').toLocaleLowerCase('it')})),
    ...brandCatalog.map(x=>({...x,component:'BrandMark',group:'Brand',brand:true,search:[x.label,x.id,...x.keywords].join(' ').toLocaleLowerCase('it')})),
  ],[]);
  const filtered=useMemo(()=>all.filter(item=>{
    if(tab==='brand'&&!item.brand)return false;
    if(tab==='recent'&&!recent.includes(item.id))return false;
    if(tab==='favorites'&&!favorites.includes(item.id))return false;
    if(group!=='Tutte'&&item.group!==group)return false;
    const terms=query.trim().toLocaleLowerCase('it').split(/\s+/).filter(Boolean);
    return terms.every(term=>item.search.includes(term));
  }),[all,tab,recent,favorites,group,query]);
  function choose(id:string){
    onChange(id);const next=[id,...recent.filter(x=>x!==id)].slice(0,16);setRecent(next);
    try{localStorage.setItem(RECENT,JSON.stringify(next))}catch{}
  }
  function favorite(id:string,e:React.MouseEvent){
    e.stopPropagation();const next=favorites.includes(id)?favorites.filter(x=>x!==id):[id,...favorites];setFavorites(next);
    try{localStorage.setItem(FAVORITES,JSON.stringify(next))}catch{}
  }
  useEffect(()=>setLimit(48),[query,tab,group]);
  return <div className="catalog-picker">
    <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cerca icona o servizio…" aria-label="Cerca icona"/>
    <div className="catalog-tabs">
      {([['all','Tutte'],['recent','Recenti'],['favorites','Preferite'],['brand','Brand']] as const).map(([id,label])=><button type="button" key={id} className={tab===id?'selected':''} onClick={()=>setTab(id)}>{label}</button>)}
    </div>
    {tab==='all'&&<select value={group} onChange={e=>setGroup(e.target.value)} aria-label="Gruppo icone"><option>Tutte</option>{iconGroups.map(x=><option key={x}>{x}</option>)}</select>}
    <div className="catalog-grid">
      {filtered.slice(0,limit).map(item=><button type="button" key={item.id} className={value===item.id?'selected':''} onClick={()=>choose(item.id)} title={item.label} aria-label={`Icona ${item.label}`}>
        <CategoryPhosphorIcon icon={item.id} size={24}/><span>{item.label}</span>
        <i onClick={e=>favorite(item.id,e)} aria-label={favorites.includes(item.id)?'Rimuovi dai preferiti':'Aggiungi ai preferiti'}>{favorites.includes(item.id)?'★':'☆'}</i>
      </button>)}
    </div>
    {!filtered.length&&<p className="catalog-empty">Nessuna icona trovata.</p>}
    {limit<filtered.length&&<button type="button" className="catalog-more" onClick={()=>setLimit(v=>v+48)}>Mostra altre ({filtered.length-limit})</button>}
  </div>;
}
