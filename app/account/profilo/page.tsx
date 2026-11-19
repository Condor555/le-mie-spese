'use client';
import {useEffect,useState} from 'react';
import BackToAccount from '../../../components/BackToAccount';
import {createClient} from '../../../lib/supabase/client';

export default function Profilo(){
  const [displayName,setDisplayName]=useState(''),[email,setEmail]=useState(''),[profileMsg,setProfileMsg]=useState('');
  const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[passwordMsg,setPasswordMsg]=useState('');
  const [showPassword,setShowPassword]=useState(false),[showConfirm,setShowConfirm]=useState(false);
  const [loading,setLoading]=useState(true),[savingProfile,setSavingProfile]=useState(false),[savingPassword,setSavingPassword]=useState(false);
  useEffect(()=>{fetch('/api/settings/profile',{cache:'no-store'}).then(async r=>({ok:r.ok,j:await r.json()})).then(({ok,j})=>{if(ok){setDisplayName(j.data.displayName);setEmail(j.data.email)}else setProfileMsg(j.error||'Impossibile caricare il profilo.')}).catch(()=>setProfileMsg('Errore di connessione.')).finally(()=>setLoading(false))},[]);
  async function saveProfile(e:React.FormEvent){
    e.preventDefault();setSavingProfile(true);setProfileMsg('');
    try{const r=await fetch('/api/settings/profile',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({displayName})});const j=await r.json();setProfileMsg(r.ok?(j.warning||'Nome aggiornato.'):j.error||'Impossibile aggiornare il nome.');if(r.ok)setDisplayName(j.data.displayName)}
    catch{setProfileMsg('Errore di connessione.')}finally{setSavingProfile(false)}
  }
  async function savePassword(e:React.FormEvent){
    e.preventDefault();setPasswordMsg('');
    if(password.length<8){setPasswordMsg('La password deve contenere almeno 8 caratteri.');return}
    if(password!==confirm){setPasswordMsg('Le password non coincidono.');return}
    setSavingPassword(true);
    const {error}=await createClient().auth.updateUser({password});
    setSavingPassword(false);
    if(error){setPasswordMsg(error.message);return}
    setPassword('');setConfirm('');setPasswordMsg('Password aggiornata. Usala dal prossimo accesso.');
  }
  return <>
    <BackToAccount/>
    <header className="page-head"><div><h1>Profilo</h1><p>Nome utente e sicurezza</p></div></header>
    <form className="settings-card surface" onSubmit={saveProfile}>
      <h2>Nome visualizzato</h2>
      <p className="settings-help">Appare nei movimenti e negli spazi condivisi.</p>
      <label className="picker-label">Nome</label>
      <input value={displayName} onChange={e=>setDisplayName(e.target.value)} minLength={2} maxLength={60} disabled={loading} required autoComplete="name"/>
      <label className="picker-label">Email</label>
      <input value={email} readOnly aria-readonly="true" className="readonly-input"/>
      <button className="save-btn" disabled={loading||savingProfile}>{savingProfile?'Salvataggio…':'Salva nome'}</button>
      {profileMsg&&<div className="notice" role="status">{profileMsg}</div>}
    </form>
    <form className="settings-card surface" onSubmit={savePassword}>
      <h2>Cambia password</h2>
      <p className="settings-help">Usa almeno 8 caratteri e conferma la nuova password.</p>
      <label className="picker-label">Nuova password</label>
      <div className="password-field"><input type={showPassword?'text':'password'} autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Nascondi':'Mostra'}</button></div>
      <label className="picker-label">Ripeti password</label>
      <div className="password-field"><input type={showConfirm?'text':'password'} autoComplete="new-password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)}/><button type="button" onClick={()=>setShowConfirm(v=>!v)}>{showConfirm?'Nascondi':'Mostra'}</button></div>
      <button className="save-btn" disabled={savingPassword}>{savingPassword?'Aggiornamento…':'Aggiorna password'}</button>
      {passwordMsg&&<div className="notice" role="status">{passwordMsg}</div>}
    </form>
  </>;
}
