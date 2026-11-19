'use client';

import {useEffect,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import Icon from './Icon';

type Space={id:string;name:string;type:string};

export default function SpaceSwitcher(){
  const [spaces,setSpaces]=useState<Space[]>([]);
  const [active,setActive]=useState('');
  const [ready,setReady]=useState(false);
  const router=useRouter();
  const pathname=usePathname();

  async function load(){
    setReady(false);
    try{
      const result=await fetch('/api/spaces',{cache:'no-store'}).then(response=>response.json());
      const list:Space[]=result.data||[];
      setSpaces(list);
      const saved=localStorage.getItem('active_space');
      const wanted=list.some(space=>space.id===saved)
        ? saved||''
        : list.find(space=>space.type==='personal')?.id||list[0]?.id||'';
      if(wanted){
        setActive(wanted);
        localStorage.setItem('active_space',wanted);
        await fetch('/api/spaces/select',{
          method:'POST',
          headers:{'content-type':'application/json'},
          body:JSON.stringify({spaceId:wanted}),
        });
      }
    }finally{
      setReady(true);
    }
  }

  useEffect(()=>{load()},[pathname]);

  async function choose(id:string){
    setActive(id);
    localStorage.setItem('active_space',id);
    await fetch('/api/spaces/select',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({spaceId:id}),
    });
    router.refresh();
  }

  if(!ready)return <div className="space-selector space-selector-loading" aria-live="polite"><span className="space-selector-skeleton"/><span>Caricamento spazio…</span></div>;
  if(!spaces.length)return null;

  const selected=spaces.find(space=>space.id===active)||spaces[0];
  const personal=selected?.type==='personal';

  return <label className="space-selector">
    <select aria-label="Spazio visualizzato" value={active} onChange={event=>choose(event.target.value)}>
      {spaces.map(space=><option key={space.id} value={space.id}>{space.name}</option>)}
    </select>
    <span className={`space-selector-icon ${personal?'personal':'shared'}`} aria-hidden="true"><Icon name={personal?'user':'family'} size={22}/></span>
    <span className="space-selector-copy"><small>Spazio visualizzato</small><strong>{selected?.name}</strong></span>
    <span className="space-selector-chevron" aria-hidden="true"><Icon name="arrowDown" size={18}/></span>
  </label>;
}
