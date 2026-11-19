'use client';

import {useEffect,useMemo,useState} from 'react';
import BackToAccount from '../../../components/BackToAccount';
import CategoryIcon from '../../../components/CategoryIcon';
import Icon from '../../../components/Icon';

type Space={id:string;name:string;type:'personal'|'shared'};
type Category={name:string};
type Recurrence={
  id:string;
  space_id:string;
  space_name:string;
  space_type:'personal'|'shared';
  note:string;
  category_name:string;
  amount:number;
  frequency:'weekly'|'monthly'|'yearly';
  interval_count:number;
  next_run:string;
  account_name:string;
  active:boolean;
};
type EditForm={note:string;category_name:string;amount:string;frequency:Recurrence['frequency'];next_run:string};

const frequencyLabel:Record<Recurrence['frequency'],string>={weekly:'Settimanale',monthly:'Mensile',yearly:'Annuale'};
const eur=(value:number)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(value);
const dateLabel=(value:string)=>new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'short',year:'numeric'}).format(new Date(`${value}T12:00:00`));

export default function Ricorrenze(){
  const [rows,setRows]=useState<Recurrence[]>([]);
  const [spaces,setSpaces]=useState<Space[]>([]);
  const [activeSpaceId,setActiveSpaceId]=useState('');
  const [cats,setCats]=useState<Category[]>([]);
  const [form,setForm]=useState({note:'',category_name:'',amount:'',frequency:'monthly' as Recurrence['frequency'],next_run:new Date().toISOString().slice(0,10),account_name:'Spese'});
  const [msg,setMsg]=useState('');
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState<Recurrence|null>(null);
  const [editCats,setEditCats]=useState<Category[]>([]);
  const [editForm,setEditForm]=useState<EditForm>({note:'',category_name:'',amount:'',frequency:'monthly',next_run:''});
  const [saving,setSaving]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const [recurringResult,categoryResult,accountResult]=await Promise.all([
        fetch('/api/recurring',{cache:'no-store'}).then(async response=>({ok:response.ok,result:await response.json()})),
        fetch('/api/categories',{cache:'no-store'}).then(response=>response.json()),
        fetch('/api/settings/account',{cache:'no-store'}).then(response=>response.json()),
      ]);
      if(!recurringResult.ok){setMsg(recurringResult.result.error||'Impossibile caricare le ricorrenze.');return;}
      setRows(recurringResult.result.data||[]);
      setSpaces(recurringResult.result.spaces||[]);
      setActiveSpaceId(recurringResult.result.activeSpaceId||'');
      setCats(categoryResult.data||[]);
      setForm(current=>({...current,account_name:accountResult.data?.name||'Spese'}));
    }catch{
      setMsg('Errore di connessione.');
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{load()},[]);

  const grouped=useMemo(()=>spaces.map(space=>({space,rows:rows.filter(row=>row.space_id===space.id)})),[rows,spaces]);
  const activeSpace=spaces.find(space=>space.id===activeSpaceId);

  async function add(){
    const amount=Number(form.amount.replace(',','.'));
    if(!amount||!form.category_name){setMsg('Inserisci importo e categoria.');return;}
    const response=await fetch('/api/recurring',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...form,amount:-Math.abs(amount),interval_count:1})});
    const result=await response.json();
    setMsg(response.ok?'Ricorrenza creata.':result.error||'Impossibile creare la ricorrenza.');
    if(response.ok){setForm(current=>({...current,note:'',category_name:'',amount:''}));await load();}
  }

  async function beginEdit(row:Recurrence){
    setEditing(row);
    setEditForm({note:row.note||'',category_name:row.category_name,amount:String(Math.abs(Number(row.amount))).replace('.',','),frequency:row.frequency,next_run:row.next_run});
    setEditCats([]);
    try{
      const result=await fetch(`/api/categories?spaceId=${encodeURIComponent(row.space_id)}`,{cache:'no-store'}).then(response=>response.json());
      setEditCats(result.data||[]);
    }catch{setMsg('Impossibile caricare le categorie dello spazio.');}
  }

  async function saveEdit(event:React.FormEvent){
    event.preventDefault();
    if(!editing)return;
    const amount=Number(editForm.amount.replace(',','.'));
    if(!amount||!editForm.category_name){setMsg('Inserisci importo e categoria.');return;}
    setSaving(true);
    try{
      const response=await fetch(`/api/recurring?id=${encodeURIComponent(editing.id)}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({...editForm,amount:-Math.abs(amount),interval_count:editing.interval_count||1})});
      const result=await response.json();
      if(!response.ok){setMsg(result.error||'Impossibile modificare la ricorrenza.');return;}
      setEditing(null);
      setMsg('Ricorrenza aggiornata.');
      await load();
    }catch{setMsg('Errore di connessione.');}
    finally{setSaving(false);}
  }

  async function remove(row:Recurrence){
    if(!confirm(`Eliminare la ricorrenza “${row.note||row.category_name}” da ${row.space_name}?`))return;
    const response=await fetch(`/api/recurring?id=${encodeURIComponent(row.id)}`,{method:'DELETE'});
    const result=await response.json();
    setMsg(response.ok?'Ricorrenza eliminata.':result.error||'Impossibile eliminare la ricorrenza.');
    if(response.ok)await load();
  }

  return <>
    <BackToAccount/>
    <header className="page-head"><div><h1>Transazioni ricorrenti</h1><p>Tutte le serie, organizzate per spazio</p></div></header>

    <section className="settings-card surface recurring-create-card">
      <div className="recurring-section-head"><div><h2>Nuova ricorrenza</h2><small>Verrà salvata nello spazio visualizzato</small></div>{activeSpace&&<span className="recurring-space-badge"><Icon name={activeSpace.type==='personal'?'user':'family'} size={16}/>{activeSpace.name}</span>}</div>
      <div className="field"><label>Descrizione</label><input value={form.note} onChange={event=>setForm({...form,note:event.target.value})} placeholder="Es. Netflix"/></div>
      <div className="field"><label>Categoria</label><select value={form.category_name} onChange={event=>setForm({...form,category_name:event.target.value})}><option value="">Seleziona…</option>{cats.map(category=><option key={category.name}>{category.name}</option>)}</select></div>
      <div className="two-col"><div className="field"><label>Importo</label><input inputMode="decimal" value={form.amount} onChange={event=>setForm({...form,amount:event.target.value})}/></div><div className="field"><label>Frequenza</label><select value={form.frequency} onChange={event=>setForm({...form,frequency:event.target.value as Recurrence['frequency']})}><option value="weekly">Settimanale</option><option value="monthly">Mensile</option><option value="yearly">Annuale</option></select></div></div>
      <div className="two-col"><div className="field"><label>Prossima data</label><input type="date" value={form.next_run} onChange={event=>setForm({...form,next_run:event.target.value})}/></div><div className="field"><label>Conto</label><input value={form.account_name} readOnly aria-readonly="true" title="Modificabile da Impostazioni > Conto"/></div></div>
      <button className="save-btn" onClick={add}>Crea ricorrenza</button>
    </section>

    {msg&&<div className="notice" role="status">{msg}</div>}
    <section className="recurring-overview" aria-busy={loading}>
      <div className="recurring-overview-title"><div><h2>Ricorrenze per spazio</h2><p>{rows.length} {rows.length===1?'serie accessibile':'serie accessibili'}</p></div></div>
      {!loading&&grouped.map(({space,rows:spaceRows})=><section className="recurring-space-group surface" key={space.id}>
        <header><span><Icon name={space.type==='personal'?'user':'family'} size={20}/></span><div><small>{space.type==='personal'?'Spazio personale':'Spazio condiviso'}</small><h3>{space.name}</h3></div><b>{spaceRows.length}</b></header>
        {spaceRows.length===0?<p className="recurring-empty">Nessuna ricorrenza in questo spazio.</p>:<div className="recurring-list">{spaceRows.map(row=><article className="recurrence-card" key={row.id}>
          <CategoryIcon name={row.category_name}/><div><b>{row.note||row.category_name}</b><small>{row.category_name} · {frequencyLabel[row.frequency]} · prossima {dateLabel(row.next_run)}</small><em>{row.account_name||'Spese'} · {space.name}</em></div><strong>{eur(Number(row.amount))}</strong><div className="recurrence-actions"><button type="button" className="recurrence-edit" onClick={()=>beginEdit(row)} aria-label={`Modifica ${row.note||row.category_name}`}>Modifica</button><button type="button" className="recurrence-delete" onClick={()=>remove(row)} aria-label={`Elimina ${row.note||row.category_name}`}>×</button></div>
        </article>)}</div>}
      </section>)}
      {!loading&&!spaces.length&&<div className="empty-state surface"><b>Nessuno spazio disponibile</b></div>}
    </section>

    {editing&&<div className="modal" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget&&!saving)setEditing(null)}}><form className="modal-card surface recurring-edit-modal" role="dialog" aria-modal="true" aria-labelledby="recurring-edit-title" onSubmit={saveEdit}>
      <header><div><small>{editing.space_name}</small><h2 id="recurring-edit-title">Modifica ricorrenza</h2></div><button type="button" className="transaction-close" disabled={saving} onClick={()=>setEditing(null)}>×</button></header>
      <div className="field"><label>Descrizione</label><input value={editForm.note} onChange={event=>setEditForm({...editForm,note:event.target.value})}/></div>
      <div className="field"><label>Categoria</label><select value={editForm.category_name} onChange={event=>setEditForm({...editForm,category_name:event.target.value})}>{editCats.map(category=><option key={category.name}>{category.name}</option>)}</select></div>
      <div className="two-col"><div className="field"><label>Importo</label><input inputMode="decimal" value={editForm.amount} onChange={event=>setEditForm({...editForm,amount:event.target.value})}/></div><div className="field"><label>Frequenza</label><select value={editForm.frequency} onChange={event=>setEditForm({...editForm,frequency:event.target.value as Recurrence['frequency']})}><option value="weekly">Settimanale</option><option value="monthly">Mensile</option><option value="yearly">Annuale</option></select></div></div>
      <div className="field"><label>Prossima data</label><input type="date" value={editForm.next_run} onChange={event=>setEditForm({...editForm,next_run:event.target.value})}/></div>
      <button className="save-btn" disabled={saving}>{saving?'Salvataggio…':'Salva modifiche'}</button><button type="button" className="secondary" disabled={saving} onClick={()=>setEditing(null)}>Annulla</button>
    </form></div>}
  </>;
}
