'use client';

import {useEffect,useRef,useState} from 'react';
import CategoryIcon from '../../components/CategoryIcon';
import Icon from '../../components/Icon';

type Category={name:string;icon?:string|null;color?:string|null};
type Space={id:string;name:string;type:string};
type Kind='expense'|'income';

export default function Nuovo(){
  const [amount,setAmount]=useState('');
  const [note,setNote]=useState('');
  const [category,setCategory]=useState('');
  const [categories,setCategories]=useState<Category[]>([]);
  const [spaces,setSpaces]=useState<Space[]>([]);
  const [spaceId,setSpaceId]=useState('');
  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const [kind,setKind]=useState<Kind>('expense');
  const [account,setAccount]=useState('Spese');
  const [recurring,setRecurring]=useState(false);
  const [frequency,setFrequency]=useState('monthly');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [loadingSpace,setLoadingSpace]=useState(true);
  const destinationRequestRef=useRef(0);

  useEffect(()=>{
    fetch('/api/spaces',{cache:'no-store'})
      .then(async response=>({ok:response.ok,result:await response.json()}))
      .then(({ok,result})=>{
        if(!ok){setMessage(result.error||'Impossibile caricare gli spazi.');return;}
        const list:Space[]=result.data||[];
        const selected=result.activeSpaceId||list.find(item=>item.type==='personal')?.id||list[0]?.id||'';
        setSpaces(list);
        setSpaceId(selected);
        if(selected)loadDestination(selected);
      })
      .catch(()=>setMessage('Errore di connessione.'));
  },[]);

  async function loadDestination(targetSpaceId:string){
    const request=++destinationRequestRef.current;
    setLoadingSpace(true);
    setCategory('');
    setCategories([]);
    setMessage('');
    try{
      const [categoryResponse,accountResponse]=await Promise.all([
        fetch(`/api/categories?spaceId=${encodeURIComponent(targetSpaceId)}`,{cache:'no-store'}),
        fetch(`/api/settings/account?spaceId=${encodeURIComponent(targetSpaceId)}`,{cache:'no-store'}),
      ]);
      const [categoryResult,accountResult]=await Promise.all([categoryResponse.json(),accountResponse.json()]);
      if(request!==destinationRequestRef.current)return;
      if(!categoryResponse.ok||!accountResponse.ok){
        setMessage(categoryResult.error||accountResult.error||'Impossibile caricare lo spazio.');
        return;
      }
      setCategories(Array.isArray(categoryResult.data)?categoryResult.data:[]);
      setAccount(accountResult.data?.name||'Spese');
    }catch{
      if(request===destinationRequestRef.current)setMessage('Errore di connessione.');
    }finally{
      if(request===destinationRequestRef.current)setLoadingSpace(false);
    }
  }

  function chooseSpace(nextSpaceId:string){
    setSpaceId(nextSpaceId);
    loadDestination(nextSpaceId);
  }

  async function suggest(value:string){
    setNote(value);
    if(value.trim().length<3)return;
    try{
      const result=await fetch('/api/classify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({note:value})}).then(response=>response.json());
      if(typeof result.category==='string'&&categories.some(item=>item.name===result.category))setCategory(result.category);
    }catch{}
  }

  function nextDate(value:string,selectedFrequency:string){
    const next=new Date(`${value}T12:00:00`);
    if(selectedFrequency==='weekly')next.setDate(next.getDate()+7);
    else if(selectedFrequency==='yearly')next.setFullYear(next.getFullYear()+1);
    else next.setMonth(next.getMonth()+1);
    return next.toISOString().slice(0,10);
  }

  async function save(){
    const numeric=Number(amount.replace(',','.'));
    if(!spaceId){setMessage('Seleziona lo spazio di destinazione.');return;}
    if(!Number.isFinite(numeric)||numeric<=0){setMessage('Inserisci un importo valido.');return;}
    if(!category||!categories.some(item=>item.name===category)){setMessage('Seleziona una categoria valida per lo spazio scelto.');return;}
    setBusy(true);
    setMessage('');
    try{
      const response=await fetch('/api/transactions',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({space_id:spaceId,date,category_name:category,amount:Math.abs(numeric),currency:'EUR',note,account_name:account,kind}),
      });
      const result=await response.json();
      if(!response.ok){setMessage(result.error||'Errore nel salvataggio.');return;}
      if(recurring){
        const recurringResponse=await fetch('/api/recurring',{
          method:'POST',
          headers:{'content-type':'application/json'},
          body:JSON.stringify({space_id:spaceId,note,category_name:category,amount:kind==='expense'?-Math.abs(numeric):Math.abs(numeric),account_name:account,frequency,interval_count:1,next_run:nextDate(date,frequency)}),
        });
        if(!recurringResponse.ok){
          const recurringResult=await recurringResponse.json();
          setMessage(`Movimento salvato, ma ricorrenza non creata: ${recurringResult.error||'errore sconosciuto'}`);
          return;
        }
      }
      setMessage('Movimento salvato nello spazio selezionato.');
      setAmount('');
      setNote('');
      setCategory('');
      setRecurring(false);
    }catch{
      setMessage('Errore di connessione.');
    }finally{
      setBusy(false);
    }
  }

  const selectedCategory=categories.find(item=>item.name===category);
  const selectedSpace=spaces.find(item=>item.id===spaceId);

  return <>
    <header className="page-head"><div><h1>Nuova transazione</h1><p>Registra un movimento in pochi secondi</p></div></header>
    <section className="entry-card surface">
      <div className="transaction-destination">
        <label htmlFor="destination-space">Spazio di destinazione</label>
        <div className="transaction-destination-control"><span><Icon name={selectedSpace?.type==='personal'?'user':'family'} size={21}/></span><select id="destination-space" value={spaceId} disabled={busy||!spaces.length} onChange={event=>chooseSpace(event.target.value)}>{spaces.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><Icon name="arrowDown" size={17}/></div>
        <small>Il movimento e l’eventuale ricorrenza saranno salvati qui. Il Conto rimane una proprietà distinta dello spazio.</small>
      </div>
      <div className="segmented"><button type="button" className={kind==='expense'?'active':''} onClick={()=>setKind('expense')}>Uscita</button><button type="button" className={kind==='income'?'active':''} onClick={()=>setKind('income')}>Entrata</button></div>
      <input className="amount-input" inputMode="decimal" value={amount} onChange={event=>setAmount(event.target.value)} placeholder="€ 0,00"/>
      <div className="field"><label>Descrizione</label><input value={note} onChange={event=>suggest(event.target.value)} placeholder="Es. Spesa Conad"/></div>
      <div className="field"><label>Categoria</label><div className="category-picker"><CategoryIcon name={category||'Categoria'} icon={selectedCategory?.icon} color={selectedCategory?.color}/><select value={category} disabled={loadingSpace} onChange={event=>setCategory(event.target.value)}><option value="">{loadingSpace?'Caricamento categorie…':categories.length?'Seleziona categoria':'Nessuna categoria nello spazio'}</option>{categories.map(item=><option key={item.name} value={item.name}>{item.name}</option>)}</select></div></div>
      <div className="two-col"><div className="field"><label>Data</label><input type="date" value={date} onChange={event=>setDate(event.target.value)}/></div><div className="field"><label>Conto</label><input value={account} readOnly aria-readonly="true" title="Modificabile da Impostazioni > Conto per lo spazio selezionato"/></div></div>
      <label className="toggle-card"><span><b>Transazione ricorrente</b><small>Generala nello stesso spazio</small></span><input type="checkbox" checked={recurring} onChange={event=>setRecurring(event.target.checked)}/></label>
      {recurring&&<select value={frequency} onChange={event=>setFrequency(event.target.value)}><option value="weekly">Ogni settimana</option><option value="monthly">Ogni mese</option><option value="yearly">Ogni anno</option></select>}
      <button className="save-btn" disabled={busy||loadingSpace||!spaceId} onClick={save}>{busy?'Salvataggio...':`Salva${amount?' € '+amount:''}`}</button>
      {message&&<div className="notice" role="status">{message}</div>}
    </section>
  </>;
}
