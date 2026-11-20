'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import CategoryColorIcon from './CategoryColorIcon';
import {allIconCatalog,brandCatalog,iconGroups,normalizeIconId,suggestIconsForCategory} from '../lib/category-icon-catalog';

type Tab='all'|'recent'|'favorites'|'brand';
const RECENT='lms_icon_recent_v3',FAVORITES='lms_icon_favorites_v3';
const categoryCatalog=allIconCatalog.filter(item=>!item.brand);
const read=(key:string)=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?[...new Set(value.filter((item:unknown):item is string=>typeof item==='string').map(normalizeIconId))]:[]}catch{return []}};
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it');

export default function IconCatalogPicker({value,onChange,suggestFor=''}:{value:string;onChange:(id:string)=>void;suggestFor?:string}){
  const [query,setQuery]=useState(''),[tab,setTab]=useState<Tab>('all'),[group,setGroup]=useState('Tutte');
  const [recent,setRecent]=useState<string[]>([]),[favorites,setFavorites]=useState<string[]>([]),[limit,setLimit]=useState(48);
  const sentinel=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{setRecent(read(RECENT));setFavorites(read(FAVORITES))},[]);
  const suggested=useMemo(()=>suggestIconsForCategory(suggestFor,8),[suggestFor]);
  const filtered=useMemo(()=>{
    const terms=normalize(query).split(/[^a-z0-9]+/).filter(Boolean);
    const base=tab==='brand'?brandCatalog:tab==='all'?categoryCatalog:allIconCatalog;
    const result=base.filter(item=>{
      if(tab==='recent'&&!recent.includes(item.id))return false;
      if(tab==='favorites'&&!favorites.includes(item.id))return false;
      if(tab==='all'&&group!=='Tutte'&&item.group!==group)return false;
      const search=normalize([item.label,item.englishLabel,item.id,...item.keywords].join(' '));
      return terms.every(term=>search.includes(term));
    });
    if(tab==='all'&&!terms.length&&group==='Tutte'&&suggested.length){
      const suggestedIds=new Set(suggested.map(item=>item.id));
      return [...suggested,...result.filter(item=>!suggestedIds.has(item.id))];
    }
    return result;
  },[query,tab,group,recent,favorites,suggested]);
  function choose(id:string){
    onChange(id);const next=[id,...recent.filter(item=>item!==id)].slice(0,16);setRecent(next);
    try{localStorage.setItem(RECENT,JSON.stringify(next))}catch{}
  }
  function favorite(id:string,event:React.MouseEvent|React.KeyboardEvent){
    event.stopPropagation();const next=favorites.includes(id)?favorites.filter(item=>item!==id):[id,...favorites];setFavorites(next);
    try{localStorage.setItem(FAVORITES,JSON.stringify(next))}catch{}
  }
  useEffect(()=>setLimit(48),[query,tab,group,suggestFor]);
  useEffect(()=>{
    const node=sentinel.current;if(!node||limit>=filtered.length||typeof IntersectionObserver==='undefined')return;
    const observer=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting)setLimit(value=>Math.min(value+48,filtered.length))},{rootMargin:'160px'});
    observer.observe(node);return()=>observer.disconnect();
  },[limit,filtered.length]);
  const selected=normalizeIconId(value);
  return <div className="catalog-picker">
    <input type="search" value={query} onChange={(event:React.ChangeEvent<HTMLInputElement>)=>setQuery(event.target.value)} placeholder="Cerca in italiano o inglese…" aria-label="Cerca icona in italiano o inglese"/>
    {tab==='all'&&!query&&suggestFor.trim()&&suggested.length>0&&<p className="catalog-suggestion-label">Suggerite per <b>{suggestFor.trim()}</b></p>}
    <div className="catalog-tabs">
      {([['all','Tutte'],['recent','Recenti'],['favorites','Preferite'],['brand','Brand']] as const).map(([id,label])=><button type="button" key={id} className={tab===id?'selected':''} onClick={()=>setTab(id)}>{label}</button>)}
    </div>
    {tab==='all'&&<select value={group} onChange={(event:React.ChangeEvent<HTMLSelectElement>)=>setGroup(event.target.value)} aria-label="Gruppo icone"><option>Tutte</option>{iconGroups.map(item=><option key={item}>{item}</option>)}</select>}
    <div className="catalog-grid" aria-live="polite">
      {filtered.slice(0,limit).map((item,index)=><button type="button" key={item.id} className={`${selected===item.id?'selected':''}${index<suggested.length&&!query&&tab==='all'&&group==='Tutte'?' suggested':''}`} onClick={()=>choose(item.id)} title={`${item.label} · ${item.englishLabel}`} aria-label={`Icona ${item.label}`}>
        <CategoryColorIcon icon={item.id} size={30}/><span>{item.label}</span>
        <i role="button" tabIndex={0} onClick={(event:React.MouseEvent<HTMLElement>)=>favorite(item.id,event)} onKeyDown={(event:React.KeyboardEvent<HTMLElement>)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();favorite(item.id,event)}}} aria-label={favorites.includes(item.id)?'Rimuovi dai preferiti':'Aggiungi ai preferiti'}>{favorites.includes(item.id)?'★':'☆'}</i>
      </button>)}
    </div>
    {!filtered.length&&<p className="catalog-empty">Nessuna icona trovata. Prova un sinonimo italiano o il termine inglese.</p>}
    <div ref={sentinel} className="catalog-sentinel" aria-hidden="true"/>
    {limit<filtered.length&&<button type="button" className="catalog-more" onClick={()=>setLimit(value=>value+48)}>Mostra altre ({filtered.length-limit})</button>}
    <small className="catalog-count">{Math.min(limit,filtered.length)} di {filtered.length} icone locali</small>
  </div>;
}
