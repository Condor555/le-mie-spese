'use client';

import {useEffect,useRef,useState} from 'react';
import BackToAccount from '../../../components/BackToAccount';
import Icon from '../../../components/Icon';

type Space={id:string;name:string;type:string;role:string};

export default function Conto(){
  const [spaces,setSpaces]=useState<Space[]>([]);
  const [spaceId,setSpaceId]=useState('');
  const [name,setName]=useState('');
  const [savedName,setSavedName]=useState('');
  const [canEdit,setCanEdit]=useState(false);
  const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const requestRef=useRef(0);

  useEffect(()=>{
    fetch('/api/spaces',{cache:'no-store'})
      .then(async response=>({ok:response.ok,result:await response.json()}))
      .then(({ok,result})=>{
        if(!ok){setMessage(result.error||'Impossibile caricare gli spazi.');setLoading(false);return;}
        const list:Space[]=result.data||[];
        const selected=result.activeSpaceId||list[0]?.id||'';
        setSpaces(list);
        setSpaceId(selected);
        if(selected)loadAccount(selected);else setLoading(false);
      })
      .catch(()=>{setMessage('Errore di connessione.');setLoading(false)});
  },[]);

  useEffect(()=>{
    if(!spaceId)return;
    const refresh=()=>loadAccount(spaceId);
    window.addEventListener('focus',refresh);
    return()=>window.removeEventListener('focus',refresh);
  },[spaceId]);

  async function loadAccount(targetSpaceId:string){
    const request=++requestRef.current;
    setLoading(true);
    setMessage('');
    try{
      const response=await fetch(`/api/settings/account?spaceId=${encodeURIComponent(targetSpaceId)}`,{cache:'no-store'});
      const result=await response.json();
      if(request!==requestRef.current)return;
      if(!response.ok){setMessage(result.error||'Impossibile caricare il conto.');return;}
      setName(result.data.name);
      setSavedName(result.data.name);
      setCanEdit(Boolean(result.data.canEdit));
    }catch{
      if(request===requestRef.current)setMessage('Errore di connessione.');
    }finally{
      if(request===requestRef.current)setLoading(false);
    }
  }

  function chooseSpace(nextSpaceId:string){
    setSpaceId(nextSpaceId);
    loadAccount(nextSpaceId);
  }

  async function save(event:React.FormEvent){
    event.preventDefault();
    if(!canEdit)return;
    setSaving(true);
    setMessage('');
    try{
      const response=await fetch('/api/settings/account',{
        method:'PATCH',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({name,spaceId}),
      });
      const result=await response.json();
      if(!response.ok){setMessage(result.error||'Impossibile rinominare il conto.');return;}
      setName(result.data.name);
      setSavedName(result.data.name);
      setMessage(result.warning?`Conto rinominato. ${result.warning}`:'Conto rinominato nei movimenti e nelle ricorrenze dello spazio.');
    }catch{
      setMessage('Errore di connessione.');
    }finally{
      setSaving(false);
    }
  }

  const selected=spaces.find(space=>space.id===spaceId);
  return <>
    <BackToAccount/>
    <header className="page-head"><div><h1>Conto</h1><p>Un nome distinto per ogni spazio</p></div></header>
    <form className="settings-card surface" onSubmit={save}>
      <h2>Spazio da configurare</h2>
      <div className="account-space-picker"><span><Icon name={selected?.type==='personal'?'user':'family'} size={21}/></span><select value={spaceId} disabled={loading&&!spaces.length} onChange={event=>chooseSpace(event.target.value)}>{spaces.map(space=><option key={space.id} value={space.id}>{space.name}</option>)}</select><Icon name="arrowDown" size={17}/></div>
      <p className="settings-help">Il Conto è separato dallo Spazio. Il nome scelto viene applicato ai movimenti e alle ricorrenze appartenenti allo spazio selezionato.</p>
      <label className="picker-label">Nome del conto</label>
      <input value={name} onChange={event=>setName(event.target.value)} minLength={2} maxLength={40} disabled={loading||!canEdit} required placeholder="Es. Spese personali"/>
      {selected&&!canEdit&&<div className="account-permission-note"><Icon name="settings" size={18}/><span><b>Solo visualizzazione</b>Solo il creatore/owner di “{selected.name}” può rinominare il Conto. I membri vedono automaticamente il nome aggiornato.</span></div>}
      {canEdit&&<button className="save-btn" disabled={loading||saving||name.trim()===savedName}>{saving?'Salvataggio…':'Salva nome conto'}</button>}
      {message&&<div className="notice" role="status">{message}</div>}
    </form>
  </>;
}
