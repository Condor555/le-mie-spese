'use client';
import {useEffect,useState} from 'react';
import CategoryIcon from '../../components/CategoryIcon';

type Category={name:string;icon?:string|null;color?:string|null;count?:number};
type Kind='expense'|'income'|'transfer';

export default function Nuovo(){
  const [amount,setAmount]=useState('');
  const [note,setNote]=useState('');
  const [cat,setCat]=useState('');
  const [cats,setCats]=useState<Category[]>([]);
  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const [kind,setKind]=useState<Kind>('expense');
  const [account,setAccount]=useState('Spese');
  const [rec,setRec]=useState(false);
  const [frequency,setFrequency]=useState('monthly');
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    fetch('/api/categories',{cache:'no-store'})
      .then(r=>r.json())
      .then(j=>setCats(Array.isArray(j.data)?j.data:[]))
      .catch(()=>setCats([]));
  },[]);

  async function suggest(value:string){
    setNote(value);
    if(value.trim().length<3) return;
    try{
      const j=await fetch('/api/classify',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({note:value})
      }).then(r=>r.json());
      if(typeof j.category==='string' && j.category) setCat(j.category);
    }catch{}
  }

  function nextDate(value:string,f:string){
    const d=new Date(value+'T12:00:00');
    if(f==='weekly') d.setDate(d.getDate()+7);
    else if(f==='yearly') d.setFullYear(d.getFullYear()+1);
    else d.setMonth(d.getMonth()+1);
    return d.toISOString().slice(0,10);
  }

  async function save(){
    const number=Number(amount.replace(',','.'));
    if(!Number.isFinite(number)||number<=0){setMsg('Inserisci un importo valido.');return}
    if(!cat){setMsg('Seleziona una categoria.');return}
    setBusy(true);setMsg('');
    try{
      const response=await fetch('/api/transactions',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({date,category_name:cat,amount:Math.abs(number),currency:'EUR',note,account_name:account,kind})
      });
      const result=await response.json();
      if(!response.ok){setMsg(result.error||'Errore nel salvataggio.');setBusy(false);return}
      if(rec){
        const recurring=await fetch('/api/recurring',{
          method:'POST',headers:{'content-type':'application/json'},
          body:JSON.stringify({note,category_name:cat,amount:kind==='expense'?-Math.abs(number):Math.abs(number),account_name:account,frequency,interval_count:1,next_run:nextDate(date,frequency)})
        });
        if(!recurring.ok){setMsg('Movimento salvato, ma non è stato possibile creare la ricorrenza.');setBusy(false);return}
      }
      setMsg('Movimento salvato.');
      setAmount('');setNote('');setCat('');setRec(false);
    }catch{setMsg('Errore di connessione durante il salvataggio.')}finally{setBusy(false)}
  }

  const selected=cats.find(c=>c.name===cat);

  return <>
    <header className="page-head"><div><h1>Nuova transazione</h1><p>Registra un movimento in pochi secondi</p></div></header>
    <section className="entry-card surface">
      <div className="segmented">
        <button type="button" className={kind==='expense'?'active':''} onClick={()=>setKind('expense')}>Uscita</button>
        <button type="button" className={kind==='income'?'active':''} onClick={()=>setKind('income')}>Entrata</button>
        <button type="button" className={kind==='transfer'?'active':''} onClick={()=>setKind('transfer')}>Trasferimento</button>
      </div>
      <input className="amount-input" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="€ 0,00"/>
      <div className="field"><label>Descrizione</label><input value={note} onChange={e=>suggest(e.target.value)} placeholder="Es. Spesa Conad"/></div>
      <div className="field"><label>Categoria</label><div className="category-picker"><CategoryIcon name={cat||'Categoria'} icon={selected?.icon} color={selected?.color}/><select value={cat} onChange={e=>setCat(e.target.value)}><option value="">Seleziona categoria</option>{cats.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select></div></div>
      <div className="two-col"><div className="field"><label>Data</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div><div className="field"><label>Conto</label><input value={account} onChange={e=>setAccount(e.target.value)}/></div></div>
      <label className="toggle-card"><span><b>Transazione ricorrente</b><small>Generala automaticamente</small></span><input type="checkbox" checked={rec} onChange={e=>setRec(e.target.checked)}/></label>
      {rec&&<select value={frequency} onChange={e=>setFrequency(e.target.value)}><option value="weekly">Ogni settimana</option><option value="monthly">Ogni mese</option><option value="yearly">Ogni anno</option></select>}
      <button className="save-btn" disabled={busy} onClick={save}>{busy?'Salvataggio...':`Salva${amount?' € '+amount:''}`}</button>
      {msg&&<div className="notice">{msg}</div>}
    </section>
  </>
}
