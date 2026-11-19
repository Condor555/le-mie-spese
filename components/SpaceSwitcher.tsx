'use client';

import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import Icon from './Icon';
import {announceActiveSpace} from '../lib/active-space-client';

type Space={id:string;name:string;type:string};

export default function SpaceSwitcher(){
  const [spaces,setSpaces]=useState<Space[]>([]);
  const [active,setActive]=useState('');
  const [ready,setReady]=useState(false);
  const [changing,setChanging]=useState(false);
  const [error,setError]=useState('');
  const requestRef=useRef(0);
  const pathname=usePathname();

  useEffect(()=>{
    let live=true;
    setReady(false);
    fetch('/api/spaces',{cache:'no-store'})
      .then(async response=>({ok:response.ok,result:await response.json()}))
      .then(({ok,result})=>{
        if(!live)return;
        if(!ok){setError(result.error||'Impossibile caricare gli spazi.');return;}
        const list:Space[]=result.data||[];
        setSpaces(list);
        setActive(result.activeSpaceId||list.find(space=>space.type==='personal')?.id||list[0]?.id||'');
        if(result.activeSpaceId)localStorage.setItem('active_space',result.activeSpaceId);
      })
      .catch(()=>{if(live)setError('Impossibile caricare gli spazi.')})
      .finally(()=>{if(live)setReady(true)});
    return()=>{live=false};
  },[pathname]);

  async function choose(id:string){
    if(id===active||changing)return;
    const request=++requestRef.current;
    const previous=active;
    setActive(id);
    setChanging(true);
    setError('');
    try{
      const response=await fetch('/api/spaces/select',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({spaceId:id}),
      });
      const result=await response.json();
      if(request!==requestRef.current)return;
      if(!response.ok){setActive(previous);setError(result.error||'Impossibile cambiare spazio.');return;}
      localStorage.setItem('active_space',id);
      announceActiveSpace(id);
    }catch{
      if(request===requestRef.current){setActive(previous);setError('Errore di connessione.');}
    }finally{
      if(request===requestRef.current)setChanging(false);
    }
  }

  if(!ready)return <div className="space-selector space-selector-loading" aria-live="polite"><span className="space-selector-skeleton"/><span>Caricamento spazio…</span></div>;
  if(!spaces.length)return null;

  const selected=spaces.find(space=>space.id===active)||spaces[0];
  const personal=selected?.type==='personal';

  return <label className={`space-selector${changing?' is-changing':''}`} title={error||undefined}>
    <select aria-label="Spazio visualizzato" value={active} disabled={changing} onChange={event=>choose(event.target.value)}>
      {spaces.map(space=><option key={space.id} value={space.id}>{space.name}</option>)}
    </select>
    <span className={`space-selector-icon ${personal?'personal':'shared'}`} aria-hidden="true"><Icon name={personal?'user':'family'} size={22}/></span>
    <span className="space-selector-copy"><small>Spazio visualizzato</small><strong>{selected?.name}</strong></span>
    <span className="space-selector-chevron" aria-hidden="true"><Icon name="arrowDown" size={18}/></span>
  </label>;
}
