'use client';
import {useEffect,useState} from 'react';
import BackToAccount from '../../../components/BackToAccount';

export default function Conto(){
  const [name,setName]=useState(''),[savedName,setSavedName]=useState(''),[msg,setMsg]=useState(''),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
  useEffect(()=>{fetch('/api/settings/account',{cache:'no-store'}).then(async r=>({ok:r.ok,j:await r.json()})).then(({ok,j})=>{if(ok){setName(j.data.name);setSavedName(j.data.name)}else setMsg(j.error||'Impossibile caricare il conto.')}).catch(()=>setMsg('Errore di connessione.')).finally(()=>setLoading(false))},[]);
  async function save(e:React.FormEvent){
    e.preventDefault();setSaving(true);setMsg('');
    try{const r=await fetch('/api/settings/account',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({name})});const j=await r.json();if(!r.ok){setMsg(j.error||'Impossibile rinominare il conto.');return}setName(j.data.name);setSavedName(j.data.name);setMsg(j.warning?`Conto rinominato. ${j.warning}`:'Conto rinominato in tutti i movimenti e nelle ricorrenze.')}
    catch{setMsg('Errore di connessione.')}finally{setSaving(false)}
  }
  return <>
    <BackToAccount/>
    <header className="page-head"><div><h1>Conto</h1><p>Scegli il nome mostrato nell'app</p></div></header>
    <form className="settings-card surface" onSubmit={save}>
      <h2>Nome del conto</h2>
      <p className="settings-help">Il nuovo nome sostituisce “{savedName||'Spese'}” nei movimenti esistenti, nelle ricorrenze e nelle nuove transazioni.</p>
      <label className="picker-label">Nome</label>
      <input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={40} disabled={loading} required placeholder="Es. Spese personali"/>
      <button className="save-btn" disabled={loading||saving||name.trim()===savedName}>{saving?'Salvataggio…':'Salva nome conto'}</button>
      {msg&&<div className="notice" role="status">{msg}</div>}
    </form>
  </>;
}
