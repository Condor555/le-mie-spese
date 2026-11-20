'use client';

import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import SpacePicker,{type SpacePickerOption} from './SpacePicker';
import {announceActiveSpace} from '../lib/active-space-client';
import {useI18n} from './LanguageProvider';

type Space=SpacePickerOption;

export default function SpaceSwitcher(){
  const {t}=useI18n();
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
        if(!ok){setError(result.error||t('space.loadError'));return;}
        const list:Space[]=result.data||[];
        setSpaces(list);
        setActive(result.activeSpaceId||list.find(space=>space.type==='personal')?.id||list[0]?.id||'');
        if(result.activeSpaceId)localStorage.setItem('active_space',result.activeSpaceId);
      })
      .catch(()=>{if(live)setError(t('space.loadError'))})
      .finally(()=>{if(live)setReady(true)});
    return()=>{live=false};
  },[pathname,t]);

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
      if(!response.ok){setActive(previous);setError(result.error||t('space.changeError'));return;}
      localStorage.setItem('active_space',id);
      announceActiveSpace(id);
    }catch{
      if(request===requestRef.current){setActive(previous);setError(t('common.connectionError'));}
    }finally{
      if(request===requestRef.current)setChanging(false);
    }
  }

  if(!ready)return <div className="app-space-bar"><span className="space-picker-loading" aria-live="polite">{t('space.loading')}</span></div>;
  if(!spaces.length)return null;

  return <div className="app-space-bar" title={error||undefined}>
    <SpacePicker spaces={spaces} value={active} onChange={choose} variant="compact" disabled={changing}/>
  </div>;
}
