'use client';

import {useEffect,useState} from 'react';
import BackToAccount from '../../../components/BackToAccount';
import {useI18n} from '../../../components/LanguageProvider';
import {createClient} from '../../../lib/supabase/client';
import type {Locale} from '../../../lib/i18n';

export default function Profilo(){
  const {locale,setLocale,t}=useI18n();
  const [displayName,setDisplayName]=useState(''),[email,setEmail]=useState(''),[profileMsg,setProfileMsg]=useState('');
  const [languageMsg,setLanguageMsg]=useState(''),[languageBusy,setLanguageBusy]=useState(false);
  const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[passwordMsg,setPasswordMsg]=useState('');
  const [showPassword,setShowPassword]=useState(false),[showConfirm,setShowConfirm]=useState(false);
  const [loading,setLoading]=useState(true),[savingProfile,setSavingProfile]=useState(false),[savingPassword,setSavingPassword]=useState(false);

  useEffect(()=>{
    fetch('/api/settings/profile',{cache:'no-store'})
      .then(async response=>({ok:response.ok,result:await response.json()}))
      .then(({ok,result})=>{if(ok){setDisplayName(result.data.displayName);setEmail(result.data.email)}else setProfileMsg(result.error||t('profile.loadError'))})
      .catch(()=>setProfileMsg(t('common.connectionError')))
      .finally(()=>setLoading(false));
  },[t]);

  async function saveProfile(event:React.FormEvent){
    event.preventDefault();setSavingProfile(true);setProfileMsg('');
    try{
      const response=await fetch('/api/settings/profile',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({displayName})});
      const result=await response.json();setProfileMsg(response.ok?(result.warning||t('profile.nameSaved')):result.error||t('profile.saveError'));if(response.ok)setDisplayName(result.data.displayName);
    }catch{setProfileMsg(t('common.connectionError'))}finally{setSavingProfile(false)}
  }

  async function chooseLanguage(next:Locale){
    if(next===locale||languageBusy)return;
    setLanguageBusy(true);setLanguageMsg('');
    const saved=await setLocale(next);
    setLanguageMsg(saved?t('profile.languageSaved'):t('profile.languageError'));
    setLanguageBusy(false);
  }

  async function savePassword(event:React.FormEvent){
    event.preventDefault();setPasswordMsg('');
    if(password.length<8){setPasswordMsg(t('profile.passwordLength'));return}
    if(password!==confirm){setPasswordMsg(t('profile.passwordMismatch'));return}
    setSavingPassword(true);
    const {error}=await createClient().auth.updateUser({password});
    setSavingPassword(false);
    if(error){setPasswordMsg(error.message);return}
    setPassword('');setConfirm('');setPasswordMsg(t('profile.passwordSaved'));
  }

  return <>
    <BackToAccount/>
    <header className="page-head"><div><h1>{t('profile.title')}</h1><p>{t('profile.subtitle')}</p></div></header>
    <form className="settings-card surface" onSubmit={saveProfile}>
      <h2>{t('profile.displayName')}</h2>
      <p className="settings-help">{t('profile.displayHelp')}</p>
      <label className="picker-label">{t('profile.name')}</label>
      <input value={displayName} onChange={event=>setDisplayName(event.target.value)} minLength={2} maxLength={60} disabled={loading} required autoComplete="name"/>
      <label className="picker-label">{t('common.email')}</label>
      <input value={email} readOnly aria-readonly="true" className="readonly-input"/>
      <button className="save-btn" disabled={loading||savingProfile}>{savingProfile?t('common.saving'):t('profile.saveName')}</button>
      {profileMsg&&<div className="notice" role="status">{profileMsg}</div>}
    </form>
    <section className="settings-card surface language-settings">
      <h2>{t('profile.languageTitle')}</h2>
      <p className="settings-help">{t('profile.languageHelp')}</p>
      <div className="language-options" role="radiogroup" aria-label={t('profile.languageTitle')}>
        <button type="button" role="radio" aria-checked={locale==='it'} className={locale==='it'?'selected':''} disabled={languageBusy} onClick={()=>void chooseLanguage('it')}><span aria-hidden="true">IT</span><b>{t('profile.italian')}</b><i aria-hidden="true">{locale==='it'?'✓':''}</i></button>
        <button type="button" role="radio" aria-checked={locale==='en'} className={locale==='en'?'selected':''} disabled={languageBusy} onClick={()=>void chooseLanguage('en')}><span aria-hidden="true">EN</span><b>{t('profile.english')}</b><i aria-hidden="true">{locale==='en'?'✓':''}</i></button>
      </div>
      {languageMsg&&<div className="notice" role="status">{languageMsg}</div>}
    </section>
    <form className="settings-card surface" onSubmit={savePassword}>
      <h2>{t('profile.passwordTitle')}</h2>
      <p className="settings-help">{t('profile.passwordHelp')}</p>
      <label className="picker-label">{t('profile.newPassword')}</label>
      <div className="password-field"><input type={showPassword?'text':'password'} autoComplete="new-password" minLength={8} required value={password} onChange={event=>setPassword(event.target.value)}/><button type="button" onClick={()=>setShowPassword(value=>!value)}>{showPassword?t('profile.hide'):t('profile.show')}</button></div>
      <label className="picker-label">{t('profile.repeatPassword')}</label>
      <div className="password-field"><input type={showConfirm?'text':'password'} autoComplete="new-password" minLength={8} required value={confirm} onChange={event=>setConfirm(event.target.value)}/><button type="button" onClick={()=>setShowConfirm(value=>!value)}>{showConfirm?t('profile.hide'):t('profile.show')}</button></div>
      <button className="save-btn" disabled={savingPassword}>{savingPassword?t('profile.updating'):t('profile.updatePassword')}</button>
      {passwordMsg&&<div className="notice" role="status">{passwordMsg}</div>}
    </form>
  </>;
}
